const axios = require("axios");
const request = require("request")
const https = require("https");
const router = require('@koa/router')()
const passThrough = require('stream').PassThrough
const {PromiseQueue} = require('../util')

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
  console.log(resJson)
  const ext = resJson.type || /[A-Za-z]*/g.exec(resJson.format).toString()
  ctx.set({
    'Accept-Ranges': 'bytes',
    'Content-Type': 'application/octet-stream',
    'Content-Length': resJson.durl[0].size,
    'Content-disposition': `attachment; filename=${bvid}.${ext.toLowerCase()}`
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

router.get('/dm', async ctx => {
  const {
    avid,
    cid
  } = ctx.query
  
  function getSegmentMax() { // 获取分段数， 六分钟分一段
    return new Promise(resolve => {
      axios(`https://api.bilibili.com/pgc/player/web/playurl?avid=${avid}&cid=${cid}`).then(res => {
        resolve(Math.ceil(res.data.result.timelength / 1000 / 60 / 6))
      })
    })
  }
  
  const segment_max = await getSegmentMax()
  const taskList = new Array(segment_max).fill('').map((v, i) => {
    return {
      cb: () => get(i + 1),
      index: i + 1
    }
  })
  const promiseQueue = new PromiseQueue(taskList, 100)
  
  
  function get(segment_index) {
    return new Promise(resolve => {
      https.get(`https://api.bilibili.com/x/v2/dm/web/seg.so?type=1&oid=${cid}&segment_index=${segment_index}`, response => {
        let chunks = Buffer.alloc(0)
        response.on('data', data => chunks = Buffer.concat([chunks, Buffer.from(data)]))
        response.on('end', () => {
          try {
            const message = lp.decode(chunks)
            const objects = lp.toObject(message, {
              bool: Boolean,
              longs: Number,
              enums: Number,
              bytes: String,
              Object: String
            })
            resolve(objects.elems)
          } catch (e) {
            resolve(null)
          }
        })
      })
    })
  }
  
  ctx.set({
    'Content-Type': 'application/octet-stream',
    'Content-disposition': `attachment; filename=dm_${Date.now()}.json`
  })
  
  ctx.body = await promiseQueue.getResult()
})

module.exports = router
