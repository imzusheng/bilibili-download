const path = require("path");
const fs = require("fs");

const writeDownload = async (filename) => {
  const fullPath = path.join(path.resolve(), 'download', filename) // 完整路径(包含文件名)
  return new Promise(resolve => {
    const writeStream = fs.createWriteStream(fullPath, {flags: 'a+'})
    writeStream.once('ready', () => resolve(writeStream))
  })
}
// 创建Promise队列
const PromiseQueue = class PromiseQueue {
  /**
   * 传入参数
   * @param taskList
   * @param time 请求间隔时间
   */
  constructor(taskList, time) {
    this.result = {}
    this.time = time
    this.promiseList = taskList.map(task => this.createPromise(task.cb, task.index))
    console.log(this.promiseList)
  }
  
  // 开始执行队列，获取结果
  /**
   * @return {Promise<Object>}
   */
  getResult = () => {
    // 开始执行任务
    this.promiseEnd = this.promiseList.reduce((prev, next) => {
      return prev.then(() => next())
    }, Promise.resolve())
    // 执行完成获取结果
    return new Promise(resolve => {
      this.promiseEnd.then(() => resolve(this.result))
    })
  }
  // 创建任务
  createPromise = (cb, index) => {
    return () => {
      return new Promise(resolve => {
        setTimeout(() => {
          cb()
              .then(res => {
                this.result[index] = res
                resolve()
              })
              .catch(res => {
                this.result[index] = res
                resolve()
              })
        }, this.time)
      })
    }
  }
}

module.exports = {
  writeDownload,
  PromiseQueue
}
