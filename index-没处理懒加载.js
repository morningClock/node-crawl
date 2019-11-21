/**
 * 本版本没有处理懒加载图片，所以爬取图片数量是不完整的。
 * author: morningClock
 * github: https://github.com/morningClock
 */

const fs = require('fs')
const request = require('request')
const rp = require('request-promise')
const iconv = require('iconv-lite')
const path = require('path')
// 引入cheerio
const cheerio = require('cheerio')

// getHTML的默认配置
let options = {
  encode: 'GBK',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.65 Safari/537.36'
  }
}
/**
 * getHTML()                获取cheerio解析的HTML对象
 * @options  {url, encode}  对请求的配置（请求地址，请求的编码）
 * @return {[cheerio]}      返回cheerio对象
 */
const getHTML = (options) => {
  return {
    uri: options.url,
    // 1.默认不解码
    encoding: null,
    headers: options.headers,
    // 处理请求回来的数据
    transform: function (res) {
      // 2.到这里在手动解码
      html = iconv.decode(res, options.encode)
      // cheerio解析
      return cheerio.load(html);
    }
  }
}


/**
 * function checkDir() {}
 * 检测路径(多级自动创建)，并自动创建文件夹
 * @param  cPath 需要检测的完整路径
 * @return void 
 */
function checkDir(cPath) {
  const paths = cPath.split('/')
  let checkpath = ''
  // 相对路径去掉
  if (paths[0]==='' || paths[0]==='.') paths.shift()
    // 逐层检测路径
    for (let j = 0; j < paths.length; j++) {
      checksplit = '/'
      if(j === 0 ) checksplit = './'
      checkpath += (checksplit + paths[j])
      if(!fs.existsSync(checkpath)){
        fs.mkdirSync(checkpath)
      }
    }
}

/**
 * getImages(crawlURL, rootPath, [existDirPath])
 * [getImages 爬取网站所有<img>图片]
 * @crawlURL  {URL} crawlURL 需要爬取的网站链接
 * @rootPath  {String} rootPath 所有爬取图片的根路径
 * @existDirPath  {String} length   多级循环时使用，多级嵌套的图片根据此路径来存储
 * @return  void
 */
async function getImages(crawlURL, rootPath, existDirPath) {
  // 获取解析完成的html
  options.url = crawlURL
  const $ = await rp(getHTML(options))

  // 1.获取所有的图片
  const images = $('img')
  const length = images.length
  // 2.创建文件夹

  for (let i = 0; i < length; i++) {
    // 3.下载图片
    // 下载路径
    const downloadURL = 'https:' + $(images[i]).attr('src')
    // 文件后缀
    let fileExt = path.extname(downloadURL)
    // 子目录(如果上级传来了existDirPath，说明是子路径，不需要再创建i目录，直接存储到i目录)
    const dirPath = existDirPath ? existDirPath : `${rootPath}/${i}`
    if(!fs.existsSync(dirPath)){
      fs.mkdirSync(dirPath)
    }
    const filename = $(images[i]).attr('alt')? $(images[i]).attr('alt') + fileExt + '': i + fileExt
    let file = fs.createWriteStream(`${dirPath}/${filename}`, {autoClose:true})
    
    request(downloadURL).pipe(file).on('close', (err)=>{
      if(err) console.log(err)
    })
    file.on('finish',() => {
      console.log(`下载图片 ${dirPath}/${filename} 完成`)
    })

    // 获取子页面内容并且递归下载相关内容。
    const child = $(images[i]).parent().parent().attr('href')
    if (child) {
      let childURL = 'https:' + child
      // 传入dirPath,下一级目录将以此级的dirPath存储文件
      await getImages(childURL, rootPath, dirPath)
    }
  }
}

// 创建保存根路径
rootPath = 'download/hero'
checkDir(rootPath)
getImages('https://pvp.qq.com/m/m201706/heroList.shtml', rootPath)



