import { Context } from 'koa';
// 控制器
import { Controller, Get, Post, Put, Delete, Params, Query, Body, Flow, Ctx } from 'koa-ts-controllers';
// 授权中间件
import authorization from "../middlewares/authorization";
// 模型
import { BoardList as BoardListModel } from "../models/BoardList";
// 类验证器
import { PostAddListBody, GetListsQuery, PutUpdateListBody, getAndValidateBoardList } from '../validators/BoardList';
import { getAndValidateBoard } from '../validators/Board';

@Controller('/list')
@Flow([authorization])
export class BoardListController {

    /*
    * 创建列表
    * */
    @Post('')
    public async addList(
        @Ctx() ctx: Context,
        @Body() body: PostAddListBody
    ) {
        // 解构前端发送的数据
        let { boardId, name } = body;
        // 验证用户的面板
        await getAndValidateBoard(boardId, ctx.userInfo.id);
        // 最大值order面板列表
        let maxOrderBoardList = await BoardListModel.findOne({
            where: {
                boardId
            },
            // 降序
            order: [['order', 'desc']]
        });
        // 数据库
        let boardList = new BoardListModel();
        // 添加数据
        boardList.userId = ctx.userInfo.id;
        boardList.boardId = boardId;
        boardList.name = name;
        boardList.order = maxOrderBoardList ? maxOrderBoardList.order + 65535 : 65535;
        // 同步数据库
        await boardList.save();
        // 资源被创建响应状态码201
        ctx.status = 201;
        return boardList;
    }

    /**
     * 获取当前用户指定的面板下的所有列表集合
     */
    @Get('')
    public async getLists(
        @Ctx() ctx: Context,
        @Query() query: GetListsQuery
    ) {
        // 解构前端发送的数据
        let { boardId } = query;
        // 验证用户的面板
        await getAndValidateBoard(boardId, ctx.userInfo.id);
        // 根据面板id查询数据库的
        let boardList = await BoardListModel.findAll({
            where: {
                boardId
            },
            // 升序
            order: [['order', 'asc']]
        });
        return boardList;
    }

    /**
     * 获取指定列表详情
     */
    @Get('/:id(\\d+)')
    public async getList(
        @Ctx() ctx: Context,
        @Params('id') id: number
    ) {
        // 验证用户的面板列表
        let boardList = await getAndValidateBoardList(id, ctx.userInfo.id);
        return boardList;
    }

    /**
     * 更新
     */
    @Put('/:id(\\d+)')
    public async updateList(
        @Ctx() ctx: Context,
        @Params('id') id: number,
        @Body() body: PutUpdateListBody
    ) {
        // 解构前端发送的数据
        let { boardId, name, order } = body;
        // 验证用户的面板列表
        let boardList = await getAndValidateBoardList(id, ctx.userInfo.id);
        // 更新数据
        boardList.boardId = boardId || boardList.boardId;
        boardList.name = name || boardList.name;
        boardList.order = order || boardList.order;
        // 同步到数据库
        await boardList.save();
        // 状态码
        ctx.status = 204;
        return;
    }

    /**
     * 删除
     */
    @Delete('/:id(\\d+)')
    public async deleteList(
        @Ctx() ctx: Context,
        @Params('id') id: number
    ) {
        // 验证面板
        let boardList = await getAndValidateBoardList(id, ctx.userInfo.id);
        // 删除数据
        boardList.destroy();
        // 状态码
        ctx.status = 204;
        return;
    }
}