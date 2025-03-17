Page({
  data: {
    identity: 'student',  // 默认选择学生
    studentId: '',
    password: ''
  },

  // 处理学工号输入
  onInputStudentId: function (e) {
    this.setData({
      studentId: e.detail.value
    });
  },

  // 处理密码输入
  onInputPassword: function (e) {
    this.setData({
      password: e.detail.value
    });
  },

  // 处理登录
  onLogin: function () {
    const { studentId, password, identity } = this.data;

    if (!studentId || !password) {
      wx.showToast({
        title: '请填写学工号和密码',
        icon: 'none'
      });
      return;
    }

    // 登录逻辑，可以根据身份判断是否为管理员或学生
    if (identity === 'student') {
      // 学生登录的逻辑
      console.log('学生登录：', studentId, password);
    } else {
      // 管理员登录的逻辑
      console.log('管理员登录：', studentId, password);
    }

    // 这里可以调用后端接口进行验证
    wx.showToast({
      title: '登录成功',
      icon: 'success'
    });
    console.log('准备跳转到 application/index');
    // 登录成功后跳转到相应页面
    wx.switchTab({
      url: '/pages/application/index',
    });
  }
});
