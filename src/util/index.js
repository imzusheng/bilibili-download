const path = require("path");
const fs = require("fs");

const writeDownload = async (filename) => {
  const fullPath = path.join(path.resolve(), 'download', filename) // 完整路径(包含文件名)
  return new Promise(resolve => {
    const writeStream = fs.createWriteStream(fullPath, {flags: 'a+'})
    writeStream.once('ready', () => resolve(writeStream))
  })
}

module.exports = {
  writeDownload
}
