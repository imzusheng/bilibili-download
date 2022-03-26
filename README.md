<div align="center">
  <h1>Bilibili Download</h1>
  <blockquote>bilibili视频下载Web平台，免登录，支持下载720p、480p、360p</blockquote>
</div>

<p align="center">
    <a href="https://demo.zusheng.club/bili_download/">
        <img src="https://img.shields.io/badge/项目地址-demo.zusheng.club/bili_download-green.svg?style=flat-square" alt="项目地址">
    </a>
</p>

## 注意

* 不需要登录，理论上bilibili上不登陆能看的视频都能下载

* 支持个人视频(bv)、番剧(ep)、电视剧(ss)

* 音视频合并，无需合成

* 仅供学习使用

## 安装

```bash
git clone https://gitee.com/imzusheng/bilibili-download.git
cd ./bilibili-download
npm i
node app
```

浏览器中打开`http://localhost:3000`

## 演示

![1](./screenshots/02.png)
![2](./screenshots/03.png)
![3](./screenshots/01.png)

## 功能

* [x] 下载普通视频
* [x] 下载番剧视频
* [x] 下载剧集视频
* [x] 下载切换剧集
* [x] 下载电影(额外付费除外)
* [x] 基本视频信息
* [x] 热门评论
* [x] 下载封面
* [x] 下载字幕
* [ ] 离线下载

## 技术细节
1. 代理静态资源

在页面中直接调用B站API，浏览器自动往请求头加上`Referer`，B站服务器就拦截掉不符合要求的请求，
需要通过nodejs代理伪造请求头。假设我要获取一张图片，地址是`http://i0.hdslb.com/bfs/archive/4d1d7bde55218c1971dde8aee51864b5ccfc1f04.jpg`

前端请求

```javascript
const url = encodeURIComponent('http://i0.hdslb.com/bfs/archive/4d1d7bde55218c1971dde8aee51864b5ccfc1f04.jpg')
fetch(`http://localhost:3000/proxy?url=${url}`).then(res => {
    // ...
})
```

nodejs代理(koa2)

```javascript
router.get('/proxy', async ctx => {
  const {url, headers = {}} = ctx.query
  
  function get() {
    return new Promise(resolve => {
      https.get(url, {
        headers: Object.assign(headers, {
          'Referer': 'https://www.bilibili.com/'
        })
      }, response => {
        // response.setEncoding('utf-8')
        // 如果设置了编码为'utf-8'时请求JSON，html等文件时正常，图片异常
        // 不设置setEncoding时默认为Buffer，不编码直接转发到前端
        ctx.set(response.headers)
        let chunks = Buffer.alloc(0)
        response.on('data', data => {
          // 拼接buffer
          chunks = Buffer.concat([chunks, data])
        })
        response.on('end', () => {
          resolve(chunks)
        })
      })
    })
  }
  
  ctx.body = await get()
})
```

2. Nodejs上解码Bilibili Protobuf弹幕

[Nodejs上解码Bilibili Protobuf弹幕](https://blog.zusheng.club/Blog/Detail?_id=623d8f194c5813a16dccfe8f)

## 版本

v0.0.1 `2022-03-24`

## 演示地址

[https://demo.zusheng.club/bili_download/](https://demo.zusheng.club/bili_download/)

后续整理用到的API

