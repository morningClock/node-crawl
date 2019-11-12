var fs = require('fs');
var request = require('request');
var reqPromise = require('request-promise');
var iconv = require('iconv-lite');
// 引入cheerio
const cheerio = require('cheerio')
var headers = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.65 Safari/537.36'
}
// 
var options = {
    uri: 'https://pvp.qq.com/m/m201706/heroList.shtml',
    encoding: null,
    headers: headers,
    transform: function (body) {
      iconv.decode(body,"gb2312")
      return cheerio.load(body,{decodeEntities: false});
    }
};
 
reqPromise(options)
    .then(function ($) {
        // Process html like you would with jQuery...
        let imgsObj = $('.hero-img>img')
        for(let i = 0; i < imgsObj.length; i++) {
          const img = $(imgsObj[i])
          const filename = i
          const downloadURL = 'https:' + img.attr('src')
          // 下载路径
          const dirpath = './download/hero'
          const path = `${dirpath}/${filename}.jpg`
          console.log(path)
          if (!fs.existsSync(dirpath)) {
            fs.mkdirSync(dirpath)
            console.log('创建文件夹')
          }

          if(fs.existsSync(path)) return
          // 下载内容(创建子线程)
          request(downloadURL).pipe(fs.createWriteStream(path))
        }
       
    })
    .catch(function (err) {
        // Crawling failed or Cheerio choked...
        console.log('失败', err)
    });

