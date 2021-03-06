# Koa_trello 后端

***
## 项目介绍

技术栈
- 前端：Vue-cli
- 后端：TypeScript + Koa2
- 数据库：MySQL

效果阐述
- 模仿 trello 团队协作工具
首页是用户面板，用户可以新建自己喜爱的面板。
进入面板之后，用户可以创建面板列表。例如：美食面板列表、旅游面板列表，创建属于自己喜爱的面板列表。
创建面板列表之后，每个面板列表都有每个面板列表的专属卡片，每个卡片可以上传自己喜爱的封面、用户对自己卡片的标题不满意时可以修改卡片的标题并且可以对卡片做简单的描述，发表评论，用户评论，上传附件等功能。

***

## 工具准备
- 编辑器：vcode 
- 数据报表：navicat for mysql
- 接口测试工具：Postman

***

## 技术栈开发类
- koa：后端主框架 。
- koa-router：基于 koa 的路由。
- koa-body： koa 解析请求体中间件模块
- koa-static-cache：koa 静态文件代理。
- koa-ts-controllers：基于 koa 和 typescript 构建的路由控制系统，提供了各种装饰器来构建 RESTful 风格的 api 。
- mysql：nodejs 连接操作 mysql 的库。
- sequelize：功能丰富和强大的数据库操作库，提供了 ORM、事务以及 promise 等支持。
- sequelize-typescript：sequelize 的 typescript 版
- class-validator：类验证器，是基于 validator.js 和 typescript 的数据验证工具，对用户或者接口调用传入的数据进行验证。
- jsonwebtoken：jwt 鉴权库，是实现 token 技术的一种解决方案。
- moment：日期时间处理工具
- ts-node-dev：ts-node 的 dev 版，实现了热重载，即修改代码后自动重启服务
- sequelize-cli：提供了 cli 工具，通过它可以用来维护数据库

***

## 接口规范
- 遵循 RESTful 规范，合理利用请求方法、状态码等来设计 api。

- 资源路径：为了让接口数据和静态资源（如图片等）进行分开放置，所以进行分区。为了更方便的对接口进行管理以及后续的升级，路径后同时携带当前接口的版本：如 /api/v1/test
  - 接口数据以 /api 作为前缀。
  - 静态资源以 /public 作为前缀

- 其他规范
  - 获取
    - 请求方式：GET
    - 响应状态码：200
    - 响应主体：被请求的资源内容
  - 创建
    - 请求方法：POST
    - 响应状态码：201
    - 响应主体：被创建的资源内容
  - 更新
    - 请求方法：PUT
    - 响应状态码：204
    - 响应主体：无
  - 删除
    - 请求方法：DELETE
    - 响应状态码：204
    - 响应主体：无
  - 请求错误
    - 资源不存在：404
    - 请求参数异常：422
    - 服务器错误：500
  - 授权验证错误
    - 没有授权/登录：401
    - 禁止访问：403

***

## 文件目录
- src
  - controllers --- 控制器
  - config      --- 配置文件
  - database    --- 迁移种子和迁移脚本
  - middlewares --- 授权中间件
  - models      --- 模型
  - types       --- 类型声明文件
  - validators  --- 类验证器
  - app.js        --- 主入口文件

***

## 数据库表结构
- 用户：User
- 任务面板：Board
- 任务列表：BoardList
- 任务卡片：BoardListCard
- 附件：Attachment
- 卡片附件关联：CardAttachment
- 评论：Comment

***

## 连接数据库
目录：configs/database.json 根据数据配置文件来连接数据库

```
{
    "development": {
        "host": "127.0.0.1",                // 主机
        "dialect": "mysql",                 // 数据库
        "username": "root",                 // 用户名
        "password": "zf666225",             // 数据库密码
        "database": "trello_development",   // 数据库名称
        "timezone": "+08:00"                // 时区
    },
    "test": {},
    "production": {}
}
```

***

## 数据库的增删改查
命令：配置在 package.json 文件中的 script 字段。

```
"scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "dev": "ts-node-dev ./src/app.ts",
    "db:create": "sequelize db:create",
    "db:drop": "sequelize db:drop",
    "db:migrate": "sequelize db:migrate",
    "db:migrate:undo:all": "sequelize db:migrate:undo:all",
    "db:seed:all": "sequelize db:seed:all",
    "db:seed:undo:all": "sequelize db:seed:undo:all",
    "db:init": "npm run db:create && npm run db:migrate && npm run db:seed:all",
    "db:redo": "npm run db:drop && npm run db:init"
},
```

***

## 数据库的模型定义
模型存放目录在 app.ts 主入口文件可以看到

```javascript
const db = new Sequelize({
    // 融合数据库配置
    ...configs.database,
    // 模型存放目录
    models: [__dirname + '/models/**/*']
});
```

***

## Postman 调试文档
- trello.postman_collection.json 文件