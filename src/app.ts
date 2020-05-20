import Koa, { Context, Next } from 'koa';
import KoaRouter from 'koa-router';
import KoaBody from 'koa-body';
import KoaStaticCache from 'koa-static-cache';
import { bootstrapControllers } from 'koa-ts-controllers';
import configs from './configs';
import path from 'path';
import Boom from '@hapi/Boom';
import { Sequelize } from 'sequelize-typescript';
import jwt from 'jsonwebtoken';


(async () => {

    const app = new Koa();

    const router = new KoaRouter();

    // 静态资源代理
    app.use(KoaStaticCache({
        // 静态资源目录
        dir: configs.storage.dir,
        // url前缀
        prefix: configs.storage.prefix,
        // 压缩文件
        gzip: true,
        // 动态加载
        dynamic: true
    }));

    // 链接数据库
    const db = new Sequelize({
        // 融合数据库配置
        ...configs.database,
        // 模型存放目录
        models: [__dirname + '/models/**/*']
    });

    app.use(async (ctx: Context, next: Next) => {
        // 取出头部token
        let token = ctx.headers['authorization'];
        // 如果存在加密
        if (token) {
            ctx.userInfo = jwt.verify(token, configs.jwt.privateKey) as UserInfo;
        }
        await next();
    });

    // 注册路由
    await bootstrapControllers(app, {
        // 路由
        router,
        // 绝对路径 /api/v1
        basePath: '/api',
        // 版本号
        versions: [1],
        // 控制器存放目录
        controllers: [
            path.resolve(__dirname, 'controllers/**/*')
        ],
        // 错误处理
        errorHandler: async (err: any, ctx: Context) => {
            let status = 500;
            let body: any = {
                statusCode: status,
                error: "Internal Server error",
                message: "An internal server error occurred"
            }
            // 错误详情信息
            if (err.output) {
                status = err.output.statusCode;
                body = { ...err.output.payload };
                if (err.data) {
                    body.errorDetails = err.data;
                }
            }
            // 返回前端信息
            ctx.status = status;
            ctx.body = body;
        }
    });

    // 路由不存在统一入口
    router.all('*', async () => {
        throw Boom.notFound('没有该路由');
    });

    // 解析中间件
    app.use(KoaBody({
        // 允许二进制
        multipart: true,
        formidable: {
            uploadDir: configs.storage.dir,
            keepExtensions: true
        }
    }));
    
    // 路由
    app.use(router.routes());

    // 端口
    app.listen(configs.server.port, configs.server.host, () => {
        console.log(`服务启动成功：http://${configs.server.host}:${configs.server.port}`);
    });

})();