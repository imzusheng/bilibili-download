const axios = require("axios")
const router = require('@koa/router')()
const path = require("path")
const fs = require("fs")
const MIME = require('../assets/MIME')
const request = require('request')
const https = require("https")

router.get('/', async ctx => {
  const {
    url: proxyUrl,
    headers = {}
  } = ctx.query
  let url = ''
  if (proxyUrl.indexOf('http') === -1 && proxyUrl.indexOf('https') === -1) { // 自动补全https
    url = 'https://' + proxyUrl
  } else if (proxyUrl.indexOf('https') === -1 && proxyUrl.indexOf('http') > -1) { // 转换http为https
    url = proxyUrl.replace('http', 'https')
  } else {
    url = proxyUrl
  }
  
  console.log('proxy', url)
  
  const body = await get()
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
        let str = Buffer.alloc(0)
        response.on('data', data => {
          str = Buffer.concat([str, Buffer.from(data)])
        })
        response.on('end', () => {
          resolve({
            data: str,
            headers: response.headers
          })
        })
      })
    })
  }
  
  Object.keys(body.headers).forEach(key => ctx.set(key, body.headers[key]))
  ctx.body = body.data
})

module.exports = router
