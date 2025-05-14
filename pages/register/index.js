const { TEST_URL } = require('../../utils/config');

Page({
  data: {
    username: '',
    password: '',
    email: '',
    phone: '',
    type: 0,
    student_id: '',
    // 表单选项数据
    roomTypes: [
      { id: 1, name: '计算机学院' },
      { id: 2, name: '物理学院' }
    ],
  },

  // 身份选择
  onIdentityChange(event) {
    this.setData({ identity: event.detail.value });
  },

  // 输入统一绑定
  onInputUsername(event) {
    this.setData({ username: event.detail.value });
  },
  onInputPassword(event) {
    this.setData({ password: event.detail.value });
  },
  onInputEmail(event) {
    this.setData({ email: event.detail.value });
  },
  onInputPhone(event) {
    this.setData({ phone: event.detail.value });
  },
  onInputStudentID(event) {
    this.setData({ student_id: event.detail.value });
  },

  // 类型选择
  onTypeChange(event) {
    this.setData({ type: parseInt(event.detail.value) });
  },

  // 注册提交
  onRegister() {
    const { username, password, email, phone, student_id, type } = this.data;

    // 基础校验
    if (!username || !password || !email || !phone ||!student_id) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    // 构造注册地址
    const regUrl = TEST_URL + '/api/v1.0/student/register';

    // 构造请求数据
    const registerData = {
      username,
      password,
      email,
      phone,
      student_id,
      type
    };

    // 发起请求
    wx.request({
      url: regUrl,
      method: 'POST',
      data: registerData,
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        console.log('注册成功返回：', res);

        // 保存 token（如果存在）
        wx.setStorageSync('token', res.data.token || '');

        wx.showToast({
          title: '注册成功',
          icon: 'success'
        });

        setTimeout(() => {
          wx.navigateTo({
            url: `/pages/index/index?studentId=${username}`
          });
        }, 1500);
      },
      fail: (err) => {
        console.error('注册失败：', err);
        wx.showToast({
          title: '注册失败，请稍后再试',
          icon: 'none'
        });
      }
    });
  }
});
