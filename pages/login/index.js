Page({
  data: {
    identity: 'student',  // 默认选择学生
    username: '',         // 学工号
    password: ''          // 密码
  },

  // 处理学工号输入
  onInputStudentId: function (e) {
    this.setData({
      username: e.detail.value // 更新 username 字段
    });
  },

  // 处理密码输入
  onInputPassword: function (e) {
    this.setData({
      password: e.detail.value // 更新 password 字段
    });
  },

  // 处理登录
  onLogin: function () {
    const { username, password, identity } = this.data;

    if (!username || !password) {
      wx.showToast({
        title: '请填写学工号和密码',
        icon: 'none'
      });
      return;
    }

    // 发起 POST 请求验证学号和密码
    wx.request({
      url: 'http://127.0.0.1:4523/m1/6047364-5737349-default/api/v1.0/student/login', // 替换为你的后端API地址
      method: 'POST',
      data: {
        username: username, // 使用 username 字段
        password: password
        // identity: identity
      },
      success: (res) => {
        if (res.statusCode === 200) {
          // 登录成功
          wx.showToast({
            title: '登录成功',
            icon: 'success'
          });
          console.log('准备跳转到 application/index');
          // 登录成功后跳转到相应页面
          wx.navigateTo({
            url: '/pages/application/index',
          });
        } else {
          // 登录失败
          wx.showToast({
            title: res.data.message || '学号或密码错误',
            icon: 'none'
          });
          console.log(res);
        }
      },
      fail: (err) => {
        // 请求失败
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
        console.error('登录请求失败:', err);
      }
    });
  },

  // 处理注册
  onRegister: function() {
    // 注册逻辑
    console.log("注册按钮被点击");
    // 可以跳转到注册页面
    wx.navigateTo({
      url: '/pages/register/index',
    });
  }
});