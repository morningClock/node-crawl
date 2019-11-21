# node-crawl
使用Nodejs爬取`王者荣耀官网`手机端所有图片。

使用Nodejs爬取`王者荣耀官网`手机端所有英雄头像与英雄详情相关图片。
可以拿来就用，最好自己研究一下写法，比较简单 100来行代码。
自己练习，根据思路找工具，写出来真的可以从中受益良多
我这里记录了些小坑，或许在你自己做的时候会有帮助，希望在我归纳经验同时帮助到大家~~

其中文件夹中的文件说明

- `index.js`

  最终完成版，使用puppeteer获取页面,可下载懒加载图片。

- `index-没处理懒加载.js`

  仅能用于爬取页面静态资源，无法下载懒加载图片

- `pup.js`

  清晰易懂的puppeteer使用案例。

## 执行

```cmd
node index.js
```

## 简介

跟随着老师的全栈之巅课程，把后台完成后，就需要官网上的所有相关图片数据了。老师又没有给到资源，所以就打算直接用node写一段程序，把所有图片爬取下载到本地把。

爬取的思路很简单：

1. 拿到网页源码
2. 解析网页源码，拿到指定的图片资源路径
3. 分配下载路径，使用node把图片下载到本地

实现的工具：

- Node.js

- `request`请求库

  用于发送请求，获取页面的源码，

- `request-promise`

  Promise库，让回调代码更简洁

- `iconv-lite`

  编码库，用于编码格式转换。

- `cheerio`

  用于解析页面代码，构建成JS DOM结构，拥有与`JQuery`的API。



## 遇到的坑

### 1.爬取的网页，中文字符出现乱码

#### 问题

在获取网页源码时，你会发现只获取到一些乱码字符。

#### 原因

查询官网的源代码，发现是正常的中文。我就寻思是不是node显示中文会乱码，打印一下中文，是正常的。那么很明显是拿到网页的时候出现了问题。

经过一番查询，发现是编码集和解析编码的格式不一致，导致乱码。

查看官网的头部编码，可以发现编码集是`gbk`。而`request`默认使用了`utf8`来解析网页，就会实现中文字符乱码的问题。

![image-20191121151758832](F:\Github\myrepositories\node-crawl\assets\image-20191121151758832.png)

#### 解决方案

编码集不一致，那么我们就要修改获取到页面时的解析方法。

由于没有API可以修改编码集为`GBK编码`，但是可以配置不解析请求回来的页面（请求返回二进制数据）。

详情见[request库中的encoding选项](https://www.npmjs.com/package/request#requestoptions-callback).

>  `encoding` - encoding to be used on `setEncoding` of response data. If `null`, the `body` is returned as a `Buffer`. Anything else **(including the default value of `undefined`)** will be passed as the [encoding](http://nodejs.org/api/buffer.html#buffer_buffer) parameter to `toString()` (meaning this is effectively `utf8` by default). (**Note:** if you expect binary data, you should set `encoding: null`.) 

```js
var options = {
    uri: 'https://pvp.qq.com/m/m201706/heroList.shtml',
    // 配置返回二进制数据，而不使用utf8解析
    encoding: null
};
```

其中官方`request-promise`中提供了[transform API](https://www.npmjs.com/package/request-promise#crawl-a-webpage-better)用于处理响应结果的处理。

>  `transform` which takes a function to transform the response into a custom value with which the promise is resolved 

官方用例:

```js
var cheerio = require('cheerio'); // Basically jQuery for node.js
 
var options = {
    uri: 'https://pvp.qq.com/m/m201706/heroList.shtml',
    transform: function (body) {
        return cheerio.load(body);
    }
};
 
rp(options)
    .then(function ($) {
        // Process html like you would with jQuery...
    })
    .catch(function (err) {
        // Crawling failed or Cheerio choked...
    });
```

最后使用`iconv-lite`编码库，进行请求结果的解码，就可以得到正确编码的页面。

#### 案例代码

```js
const rp = require('request-promise');
const cheerio = require('cheerio'); // Basically jQuery for node.js
const iconv = require('iconv-lite')

// response-promise配置
const options = {
    uri: 'https://pvp.qq.com/m/m201706/heroList.shtml',
    transform: function (res) {
        // 解码
        const html = iconv.decode(res.data, 'GBK')
        return cheerio.load(html);
    }
};
 
rp(options)
    .then(function ($) {
        // Process html like you would with jQuery...
    })
    .catch(function (err) {
        // Crawling failed or Cheerio choked...
    });
```



### 2.下载大量图片时，出现超时状况

#### 问题

在下载一个英雄列表页面时，非常正常，所有英雄图片都可以拉取下来。但是稍微扩展一下，我们除了需要英雄的图片，还需要英雄相关的图片，那么我们就要继续爬取这个英雄详情页面的所有图片了。此处我使用了递归进行第二层的图片下载。

下载的方法，我使用了request库。

```js
request(downloadURL).pipe(fs.createWriteStream(path))
```

写完程序，进行下载时，我们就可以看到

![image-20191121155426366](F:\Github\myrepositories\node-crawl\assets\image-20191121155426366.png)



#### 原因

根据错误提示的关键词查询。发现时node写入文件时，打开pipe Stream流进行文件处理后，没有正确关闭pipe管道，导致的报错。

#### 解决方案

查询百度，找到了一个非常好的解决方法

> [request的pipe方法的问题](https://segmentfault.com/q/1010000009323745)

根据问题回答，就可以解决了。

#### 代码

```js
const fs=require('fs');
const request=require('request');
// 写入完成后自动关闭管道
let fileStream=fs.createWriteStream('./1.jpg',{autoClose:true})
request(downloadURL).pipe(fileStream);
// 完成写入操作后，进行提示。
fileStream.on('finish',function(){
    console.log('文件写入成功')
})
```

### 3.无法获取到懒加载图片

#### 问题

我们发现图片爬取完成后，少了许多图片，如装备，召唤师技能都不见了。

#### 原因

通过观察 https://pvp.qq.com/web201605/herodetail/m/105.html 页面的源代码，其中有部分图片是以注释状态写在静态页面上的，当滑动到该区域，再放开注释，加载图片。

#### 解决方案

这时候我们就有两条路子了

1.在解析之前，放开注释，让cheerio可以解析到该结构

2.直接使用`puppeteer`仿真模拟器，真是模仿用户操作后再获取对应的页面源码。

当然我们这里使用第二种方法，因为这种方法适用于大部分场景，无论懒加载是否是js渲染还是注释放开的形式加载。都可以使用这种方案解决。

#### 代码

1.安装引入[puppeteer](https://www.npmjs.com/package/puppeteer)

```cmd
cnpm i puppeteer
```

```js
// puppeteer 使用示例可以看pup.js
const puppeteer = require('puppeteer');
```

2.使用puppeteer获取完全加载后的页面源码

```js
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
  return cheerio.load(html)
}
```

可以看见，我们使用了`puppeteer`之后，我们可以大量简化了之前乱码的操作。更加美观了，而且模拟仿真浏览行为，可以爬取有一定反爬机制的网站。



最好自己根据自己的思路实现一次，你会受益良多的~~

