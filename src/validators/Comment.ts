import {IsNumber, IsNumberString, MaxLength, ValidateIf} from "class-validator";

// 添加评论
export class PostAddCommentBody {

    @IsNumber({}, {
        message: 'boardListCardId必须为数字'
    })
    boardListCardId: number;

    @MaxLength(2000, {
        message: '评论内容不能大于2000个字符'
    })
    content: string;

}

// 获取所有评论
export class GetCommentsQuery {

    @IsNumberString( {
        message: 'boardListCardId必须为数字'
    })
    boardListCardId: number;

    @ValidateIf(o=>o.page !== undefined)
    @IsNumberString({
        message: '分页必须是数字'
    })
    page?: number;

}