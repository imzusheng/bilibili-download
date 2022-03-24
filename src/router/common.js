const path = require("path");
const fs = require("fs");
const axios = require("axios");
const https = require("https");
const {writeDownload} = require("../util");
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
  console.log(body)
  ctx.body = body
})

// router.get('/search', async ctx => {
//   const {id} = ctx.query
//   // BV1ka411C7vb
//   // 下载文件
//   function download(ID) {
//     return new Promise((resolve, reject) => {
//       axios.get(`https://www.bilibili.com/video/${ID}`)
//           .then(res => {
//             const patternPlayInfo = new RegExp(/<script>window.__playinfo__.*?<\/script>/g)
//             const patternInitialState = new RegExp(/<script>window.__INITIAL_STATE__.*?\(function/g)
//             const playInfoStr = patternPlayInfo.exec(res.data).toString().replace(/<script>window.__playinfo__=|<\/script>/g, '')
//             const patternInitialStateStr = patternInitialState.exec(res.data).toString().replace(/<script>window.__INITIAL_STATE__=|;\(function/g, '')
//             const playInfo = JSON.parse(playInfoStr)
//             const InitialState = JSON.parse(patternInitialStateStr)
//             resolve(InitialState)
//             const rangEnd = /deadline=.*?&/g.exec(playInfo.data.dash.video[0].baseUrl).toString().replace('deadline=', '').replace('&', '')
//             https.get(playInfo.data.dash.video[0].baseUrl, {
//               headers: {
//                 'Host': 'xy36x248x55x5xy.mcdn.bilivideo.cn:4483',
//                 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:98.0) Gecko/20100101 Firefox/98.0',
//                 'Accept': '*/*',
//                 'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
//                 'Accept-Encoding': 'gzip, deflate, br',
//                 'Referer': `https://www.bilibili.com/video/${ID}`,
//                 'Range': `bytes=0-${rangEnd}`,
//                 'Origin': 'https://www.bilibili.com',
//                 'Connection': 'keep-alive',
//                 'Sec-Fetch-Dest': 'empty',
//                 'Sec-Fetch-Mode': 'cors',
//                 'Sec-Fetch-Site': 'cross-site',
//                 'Cache-Control': 'max-age=0',
//                 'TE': 'trailers'
//               }
//             }, async response => {
//               const wd = await writeDownload(Date.now() + '.mp4')
//               // 收到数据块
//               // 开始写入  如果需要直接转发资源，使用Buffer.from(chunk).buffer转换为ArrayBuffer
//               response.on('data', chunk => wd.write(chunk))
//               // 下载结束标记
//               response.on('end', () => wd.end())
//             })
//           })
//           .catch(err => {
//             console.error(err)
//             resolve('获取视频信息失败')
//           })
//     })
//   }
//
//   const body = await download(id)
//   ctx.body = body.videoData
// })

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
    console.log(body, bodyPipe)
  })
  ctx.body = bodyPipe
  // TODO 浏览器取消保存仍在下载
  // ctx.body = fs.createReadStream(path.join(path.resolve(), 'download/1647947629838.mp4')).pipe(passThrough());
})

module.exports = router
