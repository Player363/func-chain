# Func-Chain.js
早些年写的一个玩具项目

# 前言
本工具的作用是为回调形式的函数提供一种链式调用的方法

# 安装
使用 npm：
```markdown
npm install func-chain
```
```javascript
let Chain = require('func-chain')
// or
import Chain from 'func-chain'
```
使用 script：
```html
<!--下载后引用dist文件夹下的func-chain.umd.js-->
<script src="func-chaim.umd.js"></script>
```


### 基本使用
假设现在有3个异步任务，需要按一定的顺序执行
```javascript
// setTimeout模拟的3个异步函数
function ajax1(cb) {
    console.log('ajax1 start')
    setTimeout(function () {
        console.log('ajax1 end')
        cb && cb()
    }, 1000)
}
function ajax2(cb) {
    console.log('ajax2 start')
    setTimeout(function () {
        console.log('ajax2 end')
        cb && cb()
    }, 1000)
}
function ajax3(cb) {
    console.log('ajax3 start')
    setTimeout(function () {
        console.log('ajax3 end')
        cb && cb()
    }, 1000)
}

// 表达式语法
Chain() > ajax1 > ajax2 > ajax3 > ajax2 > ajax1 || Chain.go()

// 也可以使用如下标准语法
// new Chain(ajax1, ajax2, ajax3, ajax2, ajax1).go()
```

---
### 使用预期的参数
假设HTML结构如下
```html
<div class="div1"></div>
<div class="div2"></div>
<div class="div3"></div>
<div class="div4"></div>
<div class="div5"></div>
<div class="div6"></div>
```
jquery封装一个简单的函数
```javascript
/**
 * 在随机时间内隐藏目标元素
 * @param target 目标元素选择器
 * @param cb 回调函数
 */
function hideDiv(target, cb) {
    $(target).hide(Math.random() * 1000, cb)
}
```
我们让多个div按顺序隐藏
```javascript
// 表达式语法
Chain()
> hideDiv.args('.div1')
> hideDiv.args('.div2')
> hideDiv.args('.div3')
> hideDiv.args('.div4')
> hideDiv.args('.div5')
> hideDiv.args('.div6')
|| Chain.go()
```

```javascript
// 标准语法
var chain = new Chain()

for(var i = 1; i <= 6; i++) {
    chain.add(hideDiv.args('.div' + i))
}

chain.go()
```

> 函数原型上添加了一个args方法，当你执行的函数需要固定的参数的时候，用此方法来设置

一个Node的示例
```javascript
// node.js
let Chain = require('./dist/func-chain.cjs')
let fs = require('fs')

Chain()
> fs.mkdir.args('testDir')
> fs.writeFile.args('testDir/test.txt', 'hello world')
> fs.copyFile.args('testDir/test.txt', 'testDir/test2.txt')
|| Chain.go()
```

---
### 使用上一级函数传递的参数
```javascript
// 发送ajax请求数据 | 异步
function requestData(url, cb) {
    // 假数据
    var mockData = url + Math.random()
    setTimeout(function () {cb && cb(mockData)}, Math.random() * 1000 + 500)
}

// 渲染HTML页面 | 同步
function renderHTML(data, cb) {
    // 计数
    renderHTML.count = renderHTML.count + 1 || 1

    document.getElementsByTagName('body')[0].innerHTML += data + '<br/>'

    cb && cb(renderHTML.count)
}

// 做一些其它的异步或者同步的事情
// 函数链中最后一个函数可以不用callback
function other(count, cb) {
    console.log('渲染了' + count + '次')

    cb && cb()
}

var chain = Chain() > requestData > renderHTML > other || Chain.end()
// cgo()在结尾的时候会默认执行一次, cend()不会

chain.go('百度')
chain.go('网易')
chain.go('新浪')
// 任务链可复用，多次调用互不冲突
// go()方法中的参数会传递给函数链中第一个方法
```

# 函数链对象
创建一个函数链对象
```javascript
var c1 = new Chain(func1, func2, func3)
var c2 = Chain() > func1 > func2 > func3 || Chain.end()
var c3 = Chain() > func1 > func2 > func3 || Chain.go()  // 会立即执行一次
```
上面两条语句都是创建了一个函数链对象，并且包含了3个函数节点

函数链要求每一个函数节点都必须是一个带回调函数的方法，并且函数最后一个参数是回调函数，如下面这种
```javascript
function fun(x,y,cb) {
    // 做点什么
    console.log(x)
    console.log(y)
    cb && cb()
}
```

# 函数链对象方法
### go()

函数链执行go方法时，向go方法传递的参数到被转到函数链中第一个方法，并且会自动追加一个next函数对象，即回调函数
```javascript
Chain() 
> function(a,b,next){
    console.log(a)  //1
    console.log(b)  //2
    console.log(next) // function next(){/*...*/}
}
|| Chain.go(1,2)
```
调用传入的next方法后会自己进入到下一个函数节点，同时调用next时传递的参数也会被作为下一个函数的实参
```javascript
Chain()
> function(a,b,next){
    console.log(a)  //1
    console.log(b)  //2
    next('a')
}
> function(a,next) {
    console.log(a)  //a
    next()
}
|| Chain.go(1,2)
```

### add()
函数链对象的add方法可以添加函数节点
```javascript
var c = new Chain()
c.add(func1, func2, func3)
```

# 函数原型方法扩展
### args()

函数原型上添加了一个args方法，你可以用这个方法指定某个函数在执行时要使用的实参
```javascript
function tmp(a,next) {
    console.log(a)
    next(a)
}

new Chain(
    tmp,            //4
    tmp.args(1),    //1
    tmp             //1
).go(4)
```
使用args指定的实参会被优先使用

# next对象
自动在末尾传入的next是一个函数对象，上面附加了3个方法
### 1. stop() : 执行时立即停止当前函数链
```javascript
Chain()
> function(next){
    console.log(1)
    next()
}
> function(next){
    console.log(2) 
    next()
}
> function(next){
    console.log(3)  // 在这里停止了
    next.stop() 
}
> function(next){
    console.log(4)  
    next()
}
|| Chain.go()
```
### 2. skip(number) : 跳过number步
```javascript
Chain()
> function(next){
    console.log(1)  // 1
    next.skip(2)    // 跳过2步
}
> function(next){
    console.log(2)  // 被跳过
    next()
}
> function(next){
    console.log(3)  // 被跳过
    next() 
}
> function(next){
    console.log(4)  // 4
    next()
}
|| Chain.go()
```
### 3. switchTo(chain, index) : 切换到另一个函数链对象上的第index节点上运行，也可以切换到另一个函数上
```javascript
var c1 = new Chain(
    function(next){ 
        console.log('c1-1')
        next()
    },
    function(next){ 
        console.log('c1-2')
        next.switchTo(c2)
    }
)

var c2 = new Chain(
    function(next){ 
        console.log('c2-1')
        next()
    },
    function(next){ 
        console.log('c2-2')
        next()
    }
)

c1.go()
```
> switchTo也可以接收一个普通函数，表示切换到目标函数上执行，执行完后停止

## 关于this
函数在函数链中执行时，this指向当前所在的函数链对象，如果要改变指向，请使用bind
```javascript
new Chain(
    function(next){ 
        console.log(this)   // window
        next()
    }.bind(window),
    function(next){ 
        console.log(this)   // this Chain
        next()
    }
).go()
```
