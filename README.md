# node.js-blog
手把手教你用 node.js 打造个人blog

@[TOC]
# 项目
## 展示
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210303181010324.gif#pic_center)
## 链接
[https://download.csdn.net/download/weixin_45525272/15545983](https://download.csdn.net/download/weixin_45525272/15545983)

GitHub今天上不去，就没往上发，过几天补上
# 实现讲解
## 项目目录
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210304103316324.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3dlaXhpbl80NTUyNTI3Mg==,size_16,color_FFFFFF,t_70)

首先要npm所需要的包
## 1. npm
```shell
npm init -y

npm install art-template blueimp-md5 body-parser bootstrap express express-art-template express-session jquery mongoose
```
## 2.功能讲解
### app.js讲解
在app.js中我们导入必要的模块并进行必要配置，
express框架，path等系统模块，body-parser等中间件

```javascript
var express = require('express')
var path = require('path')
var bodyParser = require('body-parser')
var session = require('express-session')
var router = require('./router')

var app = express();

app.use('/public/',express.static(path.join(__dirname,'./public')));
app.use('/node_modules/',express.static(path.join(__dirname,'./node_modules')));

// 模板引擎 art-template
app.engine('html',require('express-art-template'))
app.set('views',path.join(__dirname,'./views/'));

// 配置解析表单 POST 请求体插件（注意：一定要在 app.use(router) 之前 ）
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

app.use(session({
  // 配置加密字符串，它会在原有加密基础之上和这个字符串拼起来去加密
  // 目的是为了增加安全性，防止客户端恶意伪造
  secret: 'itcast',
  resave: false,
  saveUninitialized: false // 无论你是否使用 Session ，我都默认直接给你分配一把钥匙
}))

```
将各种请求写到router.js中，在app.js中需要导入第三方模块

```javascript
var router = require('./router')

... 引入其他模块，进行配置 ....

// 把路由挂载到 app 中
app.use(router);
```
最后我们监听3000端口进行开启 node.js 服务

```javascript
app.listen(3000,function(){
    console.log('server is running.....');
})
```
当在浏览器中进行请求时，会进入到 router.js（路由器） 中进行各种请求的判断（这个项目请求与功能还是比较少的，就没有再将router进拆分，都放在了 router.js 中）
### router.js讲解
#### 请求说明

| 请求名            | 请求类型 | 请求参数                  | 请求页面                | 请求说明                                                     |
| ----------------- | -------- | ------------------------- | ----------------------- | ------------------------------------------------------------ |
| /                 | get      |                           | index.html              | 进入博客主页面                                               |
| /register         | get      |                           | register.html           | 进入注册页面                                                 |
| /register         | post     | email，nickname，password | 注册成功：index.html    | 注册请求：邮件，昵称（二者均唯一），密码，成功自动登录到index.html页面 |
| /login            | get      |                           | login.html              | 进入登陆页面                                                 |
| /login            | post     | email，password           | 注册成功：index.html    | 登陆请求：邮件，密码，成功自动登录到index.html页面           |
| /settings/profile | get      |                           | ./settings/profile.html | 进入个人信息编辑页面                                         |
| /settings/admin   | get      |                           | ./settings/admin.html   | 进入个人管理页面                                             |
| /logout           | get      |                           | login.html              | 退出登陆请求，请求成功退出当前账号，并进入登陆页面           |

### get
像各种`get`请求的处理是比较简单的，直接render(界面，{参数}) 就可以了（下面代码中 req.session.user 是请求中的 session，在 `/login` 请求中进行了 对 session 的设置，参考下面的 post 讲解）
```javascript
var express = require('express')
var User = require('./models/user')
var md5 = require('blueimp-md5')

var router = express.Router()

router.get('/', function (req, res) {
  // console.log(req.session.user)
  res.render('index.html', {
    user: req.session.user
  })
})

router.get('/login', function (req, res) {
  res.render('login.html')
})


router.get('/register', function (req, res) {
  res.render('register.html')
})



router.get('/settings/profile', function (req, res) {
  res.render('./settings/profile.html',{
    user: req.session.user
  })
})


router.get('/settings/admin',function(req,res){
  res.render('./settings/admin.html',{
    user: req.session.user
  })
})


router.get('/logout', function (req, res) {
  // 清除登陆状态
  req.session.user = null

  // 重定向到登录页
  res.redirect('/login')
})
```

### post
#### /login
登陆功能验证包括三个步骤
1. 获取表单数据
2. 查询数据库用户名密码是否正确
3. 发送响应数据


登陆请求中，首先我们要查找是否有这个用户

```javascript
 User.findOne({
    email: body.email,
    password: md5(md5(body.password))
  }, function (err, user) {
    if (err) {
      return res.status(500).json({
        err_code: 500,
        message: err.message
      })
    }
 });
```

如果邮箱和密码匹配，则 user 是查询到的用户对象，否则就是 null
```javascript
if (!user) {
  return res.status(200).json({
    err_code: 1,
    message: 'Email or password is invalid.'
  })
}
```
用户存在，登陆成功，通过 Session 记录登陆状态
```javascript
req.session.user = user

res.status(200).json({
  err_code: 0,
  message: 'OK'
})
```
#### /register
注册和登陆的基本流程（上文三步）还是差不多的

首先也是查找是否存在（这里我们用 mongodb 或 语句），避免重复注册
```javascript
  User.findOne({
    $or: [{
        email: body.email
      },
      {
        nickname: body.nickname
      }
    ]
  }, function (err, data) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '服务端错误'
      })
    }
 });
```
如果存在，就返回错误码

```javascript
    if (data) {
      // 邮箱或者昵称已存在
      return res.status(200).json({
        err_code: 1,
        message: 'Email or nickname aleady exists.'
      })
      return res.send(`邮箱或者密码已存在，请重试`)
    }
```
如果不存在，就进行保存，返回注册成功码，并重定向到主页面
<font  color=red>（注意：在服务端异步操作中是不能进行重定向的，具体解决方案可以参考我的另一篇文章[https://yangyongli.blog.csdn.net/article/details/114322377](https://yangyongli.blog.csdn.net/article/details/114322377)）
```javascript
    // 对密码进行 md5 重复加密
    body.password = md5(md5(body.password))

    new User(body).save(function (err, user) {
      if (err) {
        return res.status(500).json({
          err_code: 500,
          message: 'Internal error.'
        })
      }

      // 注册成功，使用 Session 记录用户的登陆状态
      req.session.user = user

      // Express 提供了一个响应方法：json
      // 该方法接收一个对象作为参数，它会自动帮你把对象转为字符串再发送给浏览器
      res.status(200).json({
        err_code: 0,
        message: 'OK'
      })
```

## 3. 完整代码
### app.js

```javascript
var express = require('express')
var path = require('path')
var bodyParser = require('body-parser')
var session = require('express-session')
var router = require('./router')

var app = express();

app.use('/public/',express.static(path.join(__dirname,'./public')));
app.use('/node_modules/',express.static(path.join(__dirname,'./node_modules')));

// 模板引擎 art-template
app.engine('html',require('express-art-template'))
app.set('views',path.join(__dirname,'./views/'));

// 配置解析表单 POST 请求体插件（注意：一定要在 app.use(router) 之前 ）
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

app.use(session({
  // 配置加密字符串，它会在原有加密基础之上和这个字符串拼起来去加密
  // 目的是为了增加安全性，防止客户端恶意伪造
  secret: 'itcast',
  resave: false,
  saveUninitialized: false // 无论你是否使用 Session ，我都默认直接给你分配一把钥匙
}))

// 把路由挂载到 app 中
app.use(router);

app.listen(3000,function(){
    console.log('server is running.....');
})

```
### router.js

```javascript
var express = require('express');
// 数据库模块
var User = require('./models/user');    
var md5 = require('blueimp-md5');

var router = express.Router();

router.get('/',function(req,res){
    res.render('index.html',{
        user : req.session.user
    })
});


router.get('/login',function(req,res){
    res.render('login.html')
})

router.post('/login',function(req,res){
  
