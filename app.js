const KoaStatic = require('koa-static')
const cors = require('koa2-cors')
const Koa = require('koa')
const app = new Koa()

const serverPort = 3301
const serverUrl = `http://localhost:${3301}`
const path = require("path")


app
    .use(cors())
    .use(KoaStatic(path.join(path.resolve(), 'src')))
    .listen(serverPort, () => console.log(`server running at ${serverUrl}`))
