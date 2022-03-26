const router = require('@koa/router')()
const https = require("https")

router.get('/', async ctx => {
  const {
    url: proxyUrl,
    headers = {}
  } = ctx.query
  
  let url = ''
  if (proxyUrl.indexOf('http') === -1) { // 自动补全https
    url = 'https://' + proxyUrl
  } else if (proxyUrl.indexOf('https') === -1 && proxyUrl.indexOf('http') > -1) { // 转换http为https
    url = proxyUrl.replace('http', 'https')
  } else {
    url = proxyUrl
  }
  
  console.log('proxy', url)
  
  function get() {
    return new Promise(resolve => {
      https.get(url, {
        headers: Object.assign(headers, {
          'Accept': ctx.header['accept'],
          'Accept-Encoding': ctx.header['accept-encoding']
        })
      }, response => {
        // response.setEncoding('utf-8')
        // response.setEncoding('hex')
        // response.setEncoding('binary')
        ctx.set(response.headers)
        let chunks = Buffer.alloc(0)
        response.on('data', data => {
          chunks = Buffer.concat([chunks, Buffer.from(data)])
        })
        response.on('end', () => resolve(chunks))
      })
    })
  }
  
  ctx.body = await get()
})

module.exports = router
