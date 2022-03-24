const koaBody = require('koa-body')
const KoaStatic = require('koa-static')
const cors = require('koa2-cors')
const Koa = require('koa')
const app = new Koa()
const router = require('./src/router')

const serverPort = 3000
const serverUrl = `http://localhost:${3000}`
const {exec} = require("child_process")
const path = require("path")


app
    .use(koaBody())
    .use(cors())
    .use(KoaStatic(path.join(path.resolve(), 'src')))
    .use(router.routes())
    .use(router.allowedMethods())
    .listen(serverPort, () => {
        console.log(`server running at ${serverUrl}`)
        return
        // 启动后打开浏览器
        switch (process.platform) {
            case "darwin": //mac系统使用 一下命令打开url在浏览器
                exec(`open ${serverUrl}`)
                break
            case "win32": //win系统使用 一下命令打开url在浏览器
                exec(`start ${serverUrl}`)
                break
            // 默认mac系统
            default:
                exec(`open ${serverUrl}`)
        }
    })