Page({
  data: {
    identity: 'student', // 默认选择学生身份
    username: '',
    password: '',
    email: '',
    phone: ''
  },

  // 用户身份选择变化
  onIdentityChange: function(event) {
    this.setData({
      identity: event.detail.value
    });
  },

  // 用户名输入
  onInputUsername: function(event) {
    this.setData({
      username: event.detail.value
    });
  },

  // 密码输入
  onInputPassword: function(event) {
    this.setData({
      password: event.detail.value
    });
  },

  // 邮箱输入
  onInputEmail: function(event) {
    this.setData({
      email: event.detail.value
    });
  },

  // 手机号输入
  onInputPhone: function(event) {
    this.setData({
      phone: event.detail.value
    });
  },

  // 注册按钮点击事件
  onRegister: function() {
    const { identity, username, password, email, phone } = this.data;
    if (!username || !password || !email || !phone) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }
    // 构造请求参数
    const registerData = {
      username,
      password,
      email,
      phone
    };

    // 发送 POST 请求到服务器
    wx.request({
      url: 'https://api-domain.com/api/student/register', // API 域名
      method: 'POST',
      data: registerData,
      header: {
        'content-type': 'application/json' // 设置请求头为 JSON 格式
      },
      success: (res) => {
        // 请求成功
        console.log('注册成功返回：', res);

        // 模拟注册成功
        wx.showToast({
          title: '注册成功',
          icon: 'success'
        });

        // 注册成功后跳转到登录页面
        setTimeout(() => {
          wx.navigateTo({
            url: '/pages/login/index' // 假设登录页面的路径是 /pages/login/index
          });
        }, 1500);
      },
      fail: (err) => {
        // 请求失败
        console.error('注册失败：', err);
        wx.showToast({
          title: '注册失败，请稍后再试',
          icon: 'none'
        });
      }
    });
  }
});