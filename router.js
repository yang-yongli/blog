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
    var body= req.body;

    User.findOne({
        email: body.email,
        password: md5(md5(body.password))
    },function(err,user){
        if (err) {
             return res.status(500).json({
               err_code: 500,
               message: err.message
             })
         }
         // 如果邮箱和密码匹配，则 user 是查询到的用户对象，否则就是 null
        if(!user){
            return res.status(500).json({
                err_code : 1,
                message : '用户名或密码不正确 .'
            });
        }

        // 用户存在 登陆成功 通过 session 记录登陆状态
        req.session.user = user;

        res.status(200).json({
            err_code: 0,
            message: '登陆成功'
        });

    });
})



router.get('/register',function(req,res){
    res.render('register.html');
});

router.post('/register',function(req,res){
    // 1.获取表单数据
    var body = req.body;
    console.log("************************1************************* ");
    console.log(body);
    // 2.操作数据库
      //    判断改用户是否存在
      //    如果已存在，不允许注册
      //    如果不存在，注册新建用户
    User.findOne({
        $or: [
            {
                email:body.email
            },
            {
                nickname:body.nickname
            }
        ]
    },function(err,data){
        // 服务器错误
        console.log("************************2************************* ");
        if(err){
            return res.status(500).json({
                success: false,
                message: '服务端错误'
            });
        }

        // 判断改用户是否存在
        if (data) {
          // 邮箱或者昵称已存在
          return res.status(200).json({
            err_code: 1,
            message: 'Email or nickname aleady exists.'
          })
          return res.send(`邮箱或者昵称已存在，请重试`)
        }

        // 用户不存在 新建用户
        // 对密码进行 md5 加密
        body.password = md5(md5(body.password));

        new User(body).save(function(err,user){
            if(err){
                return res.status(500).json({
                  err_code: 500,
                  message: '注册失败.'
                })
            }
            // 注册成功，使用 Session 记录用户的登陆状态
            req.session.user = user;

            // 3.发送相应
            res.status(200).json({
              err_code: 0,
              message: 'OK'
            })

        });
    });  
    


});



// 个人信息 修改
router.get('/settings/profile', function (req, res) {
  res.render('./settings/profile.html',{
    user: req.session.user
  })
})

// 用户密码管理
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


module.exports = router;

