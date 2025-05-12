const { TEST_URL } = require('../../utils/config');
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

  onIdentityChange: function (e) {
    this.setData({
      identity: e.detail.value // 更新 identity 字段
    });
  },
  
  // 处理登录
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
  wx.navigateTo({
    url: '/pages/index/index',
  });
  // Show loading indicator
  // wx.showLoading({
  //   title: '登录中...',
  // });

  // Determine the appropriate API endpoint based on identity
  const apiUrl = TEST_URL +  (identity == 'student' 
    ? '/api/v1.0/student/login' 
    : '/api/v1.0/admin/login');

  // Make the API request
  wx.request({
    url: apiUrl,
    method: 'POST',
    data: {
      username: username,
      password: password
    },
    success: (res) => {
      wx.hideLoading();
      console.log(res.statusCode);
      if (res.statusCode === 200) {
        // Successful login
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });
        
        // Store user information if needed
        if (res.statusCode == 200) {
          wx.setStorageSync('token', res.data.token || '');
        }
        // Redirect based on identity
        if (identity === 'student') {
          wx.navigateTo({
            url: `/pages/index/index?studentId=${username}`,
          });
        } else {
          wx.navigateTo({
            url: '/pages/admin/index',
          });
        }
      } else {
        // Handle other status codes
        wx.showToast({
          title: res.data.message || '登录失败',
          icon: 'none'
        });
      }
    },
    fail: (err) => {
      wx.hideLoading();
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      });
      console.error('Login error:', err);
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