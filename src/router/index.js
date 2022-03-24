const router = require('@koa/router')()// koa 路由中间件
const commonRouter = require('./common')
const proxyRouter = require('./proxy')

router.use('/proxy', proxyRouter.routes())
router.use('/api', commonRouter.routes())

module.exports = router