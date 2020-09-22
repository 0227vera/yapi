process.env.NODE_PATH = __dirname;
require('module').Module._initPaths();

const yapi = require('./yapi.js');
const commons = require('./utils/commons');
yapi.commons = commons;
const dbModule = require('./utils/db.js');
yapi.connect = dbModule.connect();
const mockServer = require('./middleware/mockServer.js');
const plugins = require('./plugin.js');
const websockify = require('koa-websocket');
const websocket = require('./websocket.js');

// 新建一个应用
const Koa = require('koa');
// 指定静态文件访问
const koaStatic = require('koa-static');
// const bodyParser = require('koa-bodyparser');
// 处理post请求数据
const koaBody = require('koa-body');
// 路由管理
const router = require('./router.js');

let indexFile = process.argv[2] === 'dev' ? 'dev.html' : 'index.html';

// 启动长连接
const app = websockify(new Koa());
app.proxy = true;
yapi.app = app;

// app.use(bodyParser({multipart: true}));
// 设置文件上传以及http数据传输大小
app.use(koaBody({ multipart: true, jsonLimit: '2mb', formLimit: '1mb', textLimit: '1mb' }));
// 使用mock数据模块
app.use(mockServer);
app.use(router.routes());
app.use(router.allowedMethods());

websocket(app);

app.use(async (ctx, next) => {
  if (/^\/(?!api)[a-zA-Z0-9\/\-_]*$/.test(ctx.path)) {
    ctx.path = '/';
    await next();
  } else {
    await next();
  }
});

app.use(async (ctx, next) => {
  if (ctx.path.indexOf('/prd') === 0) {
    ctx.set('Cache-Control', 'max-age=8640000000');
    if (yapi.commons.fileExist(yapi.path.join(yapi.WEBROOT, 'static', ctx.path + '.gz'))) {
      ctx.set('Content-Encoding', 'gzip');
      ctx.path = ctx.path + '.gz';
    }
  }
  await next();
});

app.use(koaStatic(yapi.path.join(yapi.WEBROOT, 'static'), { index: indexFile, gzip: true }));

app.listen(yapi.WEBCONFIG.port);
commons.log(
  `服务已启动，请打开下面链接访问: \nhttp://127.0.0.1${
    yapi.WEBCONFIG.port == '80' ? '' : ':' + yapi.WEBCONFIG.port
  }/`
);
