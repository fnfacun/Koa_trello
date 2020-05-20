import { Context } from 'koa';
// 控制器
import { Controller, Post, Body, Ctx } from 'koa-ts-controllers';
// 模型
import { User as UserModel } from '../models/User';
// 类验证器
import { RegisterBody, LoginBody } from '../validators/User';
// 模块
import Boom from '@hapi/Boom';
// 加密
import crypto from 'crypto';
// token
import jwt from 'jsonwebtoken';
// 配置
import configs from '../configs';

@Controller('/user')
export class UserController {

    /**
     * 用户注册
     */
    @Post('/register')
    async register(
        @Ctx() ctx: Context,
        @Body() body: RegisterBody
    ) {
        // 解构前端发送的数据
        let { name, password } = body;
        // 验证数据库中是否已经存在要注册的用户
        let user = await UserModel.findOne({
            where: { name }
        });
        // 如果存在
        if (user) {
            throw Boom.conflict('注册失败', '用户名已经被注册了');
        }
        // 数据库
        let newUser = new UserModel();
        // 添加数据
        newUser.name = name;
        newUser.password = password;
        // 同步数据
        await newUser.save();
        // 资源被创建响应状态码201
        ctx.status = 201;
        // 返回前端数据
        return {
            id: newUser.id,
            name: newUser.name,
            createdAt: newUser.createdAt
        }
    }

    /**
     * 登录
     */
    @Post('/login')
    async login(
        @Ctx() ctx: Context,
        @Body() body: LoginBody
    ) {
        // 解构前端发送的数据
        let { name, password } = body;
        // 查询一条用户数据存不存在
        let user = await UserModel.findOne({
            where: { name }
        });
        // 如果不存在
        if (!user) {
            throw Boom.notFound('登录失败', '用户不存在');
        }
        // 存在逻辑
        let md5 = crypto.createHash('md5');
        // 加密密码
        password = md5.update(password).digest('hex');
        // 密码不一致
        if (password !== user.password) {
            throw Boom.forbidden('登录失败', '密码错误');
        }
        // 用户信息
        let userInfo = {
            id: user.id,
            name: user.name
        };
        // token
        let token = jwt.sign(userInfo, configs.jwt.privateKey);
        // 设置头部
        ctx.set('authorization', token);
        return userInfo;
    }
}