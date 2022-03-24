const axios = require("axios");
const request = require("request")
const router = require('@koa/router')()
const passThrough = require('stream').PassThrough;

router.get('/search', async ctx => {
  const {url} = ctx.query
  
  function getInfo() {
    return new Promise((resolve, reject) => {
      axios.get(url)
          .then(res => {
            const patternPlayInfo = new RegExp(/<script>window.__playinfo__.*?<\/script>/g)
            const patternInitialState = new RegExp(/<script>window.__INITIAL_STATE__.*?\(function/g)
            const playInfoStr = patternPlayInfo.exec(res.data).toString().replace(/<script>window.__playinfo__=|<\/script>/g, '')
            const patternInitialStateStr = patternInitialState.exec(res.data).toString().replace(/<script>window.__INITIAL_STATE__=|;\(function/g, '')
            const playInfo = JSON.parse(playInfoStr)
            const InitialState = JSON.parse(patternInitialStateStr)
            resolve({
              playInfo: playInfo.data,
              InitialState
            })
          })
          .catch(err => {
            console.error(err)
            resolve('获取视频信息失败')
          })
    })
  }
  
  const body = await getInfo()
  ctx.body = body
})

router.get('/download', async ctx => {
  const {
    url,
    params,
    bvid
  } = ctx.query
  
  console.log('download', `${url}?${params}`)
  
  function download() {
    return new Promise(resolve => {
      axios.get(`${url}?${params}`).then(res => {
        resolve(res.data.data || res.data.result)
      })
    })
  }
  
  const resJson = await download()
  ctx.set({
    'Accept-Ranges': 'bytes',
    'Content-Type': 'application/octet-stream',
    'Content-Length': resJson.durl[0].size,
    'Content-disposition': `attachment; filename=${bvid}.${resJson.type.toLowerCase()}`
  })
  
  const body = request(resJson.durl[0].url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:98.0) Gecko/20100101 Firefox/98.0',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': `https://www.bilibili.com/video/${bvid}`,
      'Range': `bytes=0-${resJson.durl[0].size}`,
      'Origin': 'https://www.bilibili.com',
    }
  })
  const bodyPipe = body.pipe(passThrough())
  ctx.req.on('close', () => {
    body.response.destroy()
    console.log('中断下载')
  })
  ctx.body = bodyPipe
  // TODO 浏览器取消保存仍在下载
  // ctx.body = fs.createReadStream(path.join(path.resolve(), 'download/1647947629838.mp4')).pipe(passThrough());
})

module.exports = router
