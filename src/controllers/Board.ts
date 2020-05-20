import { Context } from 'koa';
// 控制器
import { Controller, Ctx, Post, Get, Put, Delete, Flow, Params, Body } from 'koa-ts-controllers';
// 授权中间件
import authorization from "../middlewares/authorization";
// 模型
import { Board as BoardModel } from '../models/Board';
// 类验证器
import { PostAddBoardBody, PutUpdateBoardBody, getAndValidateBoard } from '../validators/Board';

@Controller('/board')
@Flow([authorization])
export class BoardController {

    /**
     * 创建新面板
     */
    @Post('')
    public async addBoard(
        @Ctx() ctx: Context,
        @Body() body: PostAddBoardBody
    ) {
        // 解构前端发送的数据
        let { name } = body;
        // 数据库
        let board = new BoardModel();
        // 添加数据
        board.name = name;
        board.userId = ctx.userInfo.id;
        // 同步数据库
        await board.save();
        // 资源被创建响应状态码201
        ctx.status = 201;
        return board;
    }

    /**
     * 获取当前登录用户的所有看板
     */
    @Get('')
    public async getBoards(
        @Ctx() ctx: Context
    ) {
        // 根据用户查询所有面板
        let where = {
            userId: ctx.userInfo.id
        };
        // 查询
        let boards = await BoardModel.findAll({ where });
        return boards;
    }

    /**
     * 获取当前登录用户指定的一个看板的详情
     */
    @Get('/:id(\\d+)')
    public async getBoard(
        @Ctx() ctx: Context,
        @Params('id') id: number
    ) {
        // 验证用户的面板
        let board = await getAndValidateBoard(id, ctx.userInfo.id);
        return board;
    }

    /**
     * 更新指定的面板
     */
    @Put('/:id(\\d+)')
    public async updateBoard(
        @Ctx() ctx: Context,
        @Params('id') id: number,
        @Body() body: PutUpdateBoardBody
    ) {
        // 验证用户的面板
        let board = await getAndValidateBoard(id, ctx.userInfo.id);
        // 更新
        board.name = body.name || board.name;
        // 同步数据库
        await board.save();
        // 资源被修改响应状态码204
        ctx.status = 204;
    }

    /**
     * 删除指定的面板
     */
    @Delete('/:id(\\d+)')
    public async deleteBoard(
        @Ctx() ctx: Context,
        @Params('id') id: number
    ) {
        // 验证用户的面板
        let board = await getAndValidateBoard(id, ctx.userInfo.id);
        // 删除数据库
        await board.destroy();
        // 资源被修改响应状态码204
        ctx.status = 204;
    }
}


