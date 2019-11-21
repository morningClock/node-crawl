/**
 * puppeteer使用示例
 */

const fs = require('fs')
const puppeteer = require('puppeteer');
 
(async () => {
  // 加载浏览器(无头模式打开浏览器模拟操作)
  const browser = await puppeteer.launch({headless: false});
  // 打开页面
  const page = await browser.newPage();
  // 输入url，等待全部内容（图片）加载完成
  await page.goto('https://pvp.qq.com/web201605/herodetail/m/105.html', {waitUntil: 'load'});

  // 获取内容
  const html = await page.content()

  // 获得加载完成后的文件
  fs.writeFileSync('./test.html', html)
 
  await browser.close();
})();