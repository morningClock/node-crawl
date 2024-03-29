const fs = require('fs')
const request = require('request')
const rp = require('request-promise')
const iconv = require('iconv-lite')
const path = require('path')
// 引入cheerio
const cheerio = require('cheerio')
// puppeteer 使用示例可以看pup.js
const puppeteer = require('puppeteer');


/**
 * getHTML()                获取cheerio解析的HTML对象
 * @options  {url, encode}  对请求的配置（请求地址，请求的编码）
 * @return {[cheerio]}      返回cheerio对象
 */
const getHTML = async (url) => {
  // 加载浏览器(若有反爬机制，可以使用无头模式打开真实浏览器模拟操作)
  // 使用方法：const browser = await puppeteer.launch({headless: false});
  const browser = await puppeteer.launch();
  // 打开页面
  const page = await browser.newPage();
  // 输入url，等待全部内容（图片）加载完成
  await page.goto(url, {waitUntil: 'load'});
  // 获取内容
  const html = await page.content()
  // 关闭浏览器
  await browser.close();
  // 返回cheerio解析对象
  return await cheerio.load(html)
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
  const $ = await getHTML(crawlURL)

  // 1.获取所有的图片
  const images = $('img')
  const length = images.length
  // 2.创建文件夹

  for (let i = 0; i < length; i++) {
    // 3.下载图片
    // 下载路径
    const imageSrc = $(images[i]).attr('src')
    //  略过视频封面图片
    if(imageSrc.match('shp.qpic.cn')){
      console.log(imageSrc)
      continue
    } 
    // 如果没有协议头，加上协议头。
    const downloadURL =  imageSrc.match('http') ? imageSrc : 'https:' + imageSrc
    // 文件后缀
    let fileExt = path.extname(downloadURL) || '.jpg'
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
    const child = $(images[i]).parent('.hero-img').parent().attr('href')
    if (child) {
      let childURL = 'https:' + child
      // 传入dirPath,下一级目录将以此级的dirPath存储文件
      await getImages(childURL, rootPath, dirPath)
    }
  }

}

(async () => {
  // 创建保存根路径
  rootPath = 'download/hero'
  await checkDir(rootPath)
  await getImages('https://pvp.qq.com/m/m201706/heroList.shtml', rootPath)
})();



