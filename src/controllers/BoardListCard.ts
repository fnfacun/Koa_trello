import { Context } from 'koa';
// 控制器
import { Controller, Ctx, Post, Get, Put, Delete, Flow, Params, Query, Body } from "koa-ts-controllers";
// 授权中间件
import authorization from "../middlewares/authorization";
// 模型
import { BoardListCard as BoardListCardModel } from '../models/BoardListCard';
import { Comment as CommentModel } from '../models/Comment';
import { CardAttachment as CardAttachmentModel } from '../models/CardAttachment';
import { Attachment as AttachmentModel } from '../models/Attachment';
// 类验证器
import { GetCardsQuery, PostAddCardBody, PutUpdateCardBody, PutSetCoverBody, getAndValidateBoardListCard, getAndValidateCardAttachment } from '../validators/BoardListCard';
import { getAndValidateBoardList } from '../validators/BoardList'
// 配置
import configs from '../configs';
// 模块
import Boom from '@hapi/boom';

@Controller('/card')
@Flow([authorization])
export class BoardListCardController {

    /**
     * 创建新卡片
     */
    @Post('')
    public async addCard(
        @Ctx() ctx: Context,
        @Body() body: PostAddCardBody
    ) {
        // 解构前端发送的数据
        let { boardListId, name, description } = body;
        // 验证用户的面板列表
        await getAndValidateBoardList(boardListId, ctx.userInfo.id);
        // 数据库
        let boarListCard = new BoardListCardModel();
        // 添加数据
        boarListCard.userId = ctx.userInfo.id;
        boarListCard.boardListId = boardListId;
        boarListCard.name = name;
        boarListCard.description = description || '';
        // 同步数据库
        await boarListCard.save();
        // 资源被创建响应状态码201
        ctx.status = 201;
        return boarListCard;
    }

    /**
     * 获取卡片列表
     */
    @Get('')
    public async getCards(
        @Ctx() ctx: Context,
        @Query() query: GetCardsQuery
    ) {
        // 解构前端发送的数据
        let { boardListId } = query;
        // 验证用户的面板列表
        await getAndValidateBoardList(boardListId, ctx.userInfo.id);
        /**
         * 根据面板列表 id 查询数据库所有卡片列表
         *  1. 关联卡片评论
         *  2. 关联卡片附件
         */
        let boardListCards = await BoardListCardModel.findAll({
            where: {
                boardListId
            },
            order: [['id', 'asc']],
            include: [
                {
                    model: CommentModel,
                    attributes: ['id']
                },
                {
                    model: CardAttachmentModel,
                    include: [
                        {
                            model: AttachmentModel
                        }
                    ]
                }
            ]
        });

        let boardListCardsData = boardListCards.map((card: BoardListCardModel) => {
            // 处理附件的路径和封面
            let coverPath = '';
            let attachments = card.attachments.map(attachment => {
                let data = attachment.toJSON() as CardAttachmentModel & { path: string };
                data.path = configs.storage.prefix + '/' + data.detail.name;

                if (data.isCover) {
                    coverPath = data.path;
                }

                return data;
            });

            return {
                id: card.id,
                userId: card.userId,
                boardListId: card.boardListId,
                name: card.name,
                description: card.description,
                order: card.order,
                createdAt: card.createdAt,
                updatedAt: card.updatedAt,
                attachments: attachments,
                coverPath: coverPath,
                commentCount: card.comments.length
            }
        });

        return boardListCardsData;
    }

    /**
     * 获取一个卡片信息
     */
    @Get('/:id(\\d+)')
    public async getCard(
        @Ctx() ctx: Context,
        @Params('id') id: number
    ) {
        // 验证用户面板卡片
        let boardListCard = await getAndValidateBoardListCard(id, ctx.userInfo.id);
        return boardListCard;
    }

    /**
     * 更新一个卡片信息
     */
    @Put('/:id(\\d+)')
    public async putCard(
        @Ctx() ctx: Context,
        @Params('id') id: number,
        @Body() body: PutUpdateCardBody
    ) {
        // 解构前端发送的数据
        let { boardListId, name, description, order } = body;
        // 验证用户面板卡片
        let boardListCard = await getAndValidateBoardListCard(id, ctx.userInfo.id);
        // 更新数据
        boardListCard.boardListId = boardListId || boardListCard.boardListId;
        boardListCard.name = name || boardListCard.name;
        boardListCard.description = description || boardListCard.description;
        boardListCard.order = order || boardListCard.order;
        // 同步数据库
        await boardListCard.save();
        // 资源被修改响应状态码204
        ctx.status = 204;
        return;
    }

    /**
     * 删除一个卡片信息
     */
    @Delete('/:id(\\d+)')
    public async deleteCard(
        @Ctx() ctx: Context,
        @Params('id') id: number
    ) {
        // 验证用户面板卡片
        let boardListCard = await getAndValidateBoardListCard(id, ctx.userInfo.id);
        // 删除数据库
        await boardListCard.destroy();
        // 资源被修改响应状态码204
        ctx.status = 204;
        return;
    }

    /**
     * 附件上传
     */
    @Post('/attachment')
    public async addAttachemnt(
        @Ctx() ctx: Context,
        @Body() body: any
    ) {
        // 解构前端发送的数据
        let { boardListCardId } = body;
        // 验证用户面板卡片
        await getAndValidateBoardListCard(boardListCardId, ctx.userInfo.id);
        // 验证是否存在附件
        if (!ctx.request.files || !ctx.request.files.attachment) {
            throw Boom.badData('缺少附件');
        }
        // 附件
        let file = ctx.request.files.attachment;
        // 附件数据库
        let attachment = new AttachmentModel();
        // 存储附件信息
        attachment.userId = ctx.userInfo.id;
        attachment.originName = file.name;
        attachment.name = file.path.split('\\').pop() as string;
        attachment.type = file.type;
        attachment.size = file.size;
        // 同步数据库
        await attachment.save();
        // 卡片附件数据库
        let cardAttachment = new CardAttachmentModel();
        // 卡片附件存储信息
        cardAttachment.userId = ctx.userInfo.id;
        cardAttachment.boardListCardId = boardListCardId;
        cardAttachment.attachmentId = attachment.id;
        // 同步数据库
        await cardAttachment.save();
        // 资源被创建响应状态码201
        ctx.status = 201;
        // 返回前端数据字段
        return {
            id: cardAttachment.id,
            userId: cardAttachment.userId,
            boardListCardId: cardAttachment.boardListCardId,
            attachmentId: attachment.id,
            path: configs.storage.prefix + '/' + attachment.name,
            isCover: false,
            detail: attachment
        };
    }

    /**
     * 删除附件
     */
    @Delete('/attachment/:id(\\d+)')
    public async deleteAttachment(
        @Ctx() ctx: Context,
        @Params('id') id: number
    ) {
        // 验证用户卡片附件
        let cardAttachment = await getAndValidateCardAttachment(id, ctx.userInfo.id);
        // 删除附件
        await cardAttachment.destroy();
        // 资源被修改响应状态码204
        ctx.status = 204;
        return;
    }

    /**
     * 设置封面
     */
    @Put('/attachment/cover/:id(\\d+)')
    public async setCover(
        @Ctx() ctx: Context,
        @Params('id') id: number
    ) {
        // 验证用户卡片附件
        let cardAttachment = await getAndValidateCardAttachment(id, ctx.userInfo.id);
        // 设置全部封面为false
        await CardAttachmentModel.update({
            isCover: false
        }, {
            where: {
                boardListCardId: cardAttachment.boardListCardId
            }
        });
        // 单一封面为true
        cardAttachment.isCover = true;
        // 同步数据库
        await cardAttachment.save();
        // 资源被修改响应状态码204
        ctx.status = 204;
        return;

    }

    /**
     * 取消封面
     */
    @Delete('/attachment/cover/:id(\\d+)')
    public async deleteCover(
        @Ctx() ctx: Context,
        @Params('id') id: number
    ) {
        // 验证用户卡片附件
        let cardAttachment = await getAndValidateCardAttachment(id, ctx.userInfo.id);
        // 取消封面
        cardAttachment.isCover = false;
        // 同步数据库
        await cardAttachment.save();
        // 资源被修改响应状态码204
        ctx.status = 204;
        return;
    }
}