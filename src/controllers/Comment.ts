import { Context } from "koa";
// 控制器
import { Body, Controller, Ctx, Flow, Get, Post, Query } from 'koa-ts-controllers';
// 授权中间件
import authorization from "../middlewares/authorization";
// 模型
import { Comment as CommentModel } from '../models/Comment';
import { User as UserModel } from '../models/User';
// 类验证器
import { GetCommentsQuery, PostAddCommentBody } from "../validators/Comment";
import { getAndValidateBoardListCard } from "../validators/BoardListCard";

@Controller('/comment')
@Flow([authorization])
export class CommentController {

    /**
     * 添加评论
     */
    @Post('')
    public async addComment(
        @Ctx() ctx: Context,
        @Body() body: PostAddCommentBody
    ) {
        // 解构前端发送的数据
        let { boardListCardId, content } = body;
        // 验证用户的列表卡片
        await getAndValidateBoardListCard(boardListCardId, ctx.userInfo.id);
        // 数据库
        let comment = new CommentModel();
        // 添加数据
        comment.userId = ctx.userInfo.id;
        comment.boardListCardId = boardListCardId;
        comment.content = content;
        // 同步数据库
        await comment.save();
        // 资源被创建响应状态码201
        ctx.status = 201;
        return comment;
    }

    /**
     * 获取评论
     */
    @Get('')
    public async getComments(
        @Ctx() ctx: Context,
        @Query() query: GetCommentsQuery
    ) {
        // 解构前端发送的数据
        let { boardListCardId, page } = query;
        // 验证用户的列表卡片
        await getAndValidateBoardListCard(boardListCardId, ctx.userInfo.id);
        // 根据列表卡片id查询评论总数
        let where = { boardListCardId };
        // 查询评论总数
        let commentCount = await CommentModel.count({ where });
        // 每页的条数
        let limit = 5;
        // 页码
        let pages = Math.ceil(commentCount / limit);
        page = Number(page);
        // 默认值
        if (!page) {
            page = 1;
        }
        // 页码范围设置
        page = Math.min(page, pages);
        page = Math.max(page, 1);
        // 查询数据库
        let comments = await CommentModel.findAndCountAll({
            where,
            limit,
            offset: (page - 1) * limit,
            order: [['id', 'desc']],
            include: [
                {
                    model: UserModel,
                    attributes: ['id', 'name']
                }
            ]
        });
        // 返回数据
        return {
            limit,
            page,
            pages,
            ...comments
        }
    }

}