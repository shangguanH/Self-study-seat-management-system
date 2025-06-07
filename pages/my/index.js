const { requestWithToken } = require('../../utils/request');
Page({
  data: {
    userInfo: {
      student_id: '',
      username: '',
      email: '',
      phone: '',
      type: ''
    },
    typeMap: {
      1: '计算机科学与技术'
    }
  },

  onLoad: function (options) {
    this.getStudentDetail();
  },

  getStudentDetail: function () {
    requestWithToken({
      url: '/api/v1.0/student/detail',
      method: 'GET',
      success: (res) => {
        
        if (res.statusCode === 200 && res.data) {
          console.log(res.data);
          this.setData({
            userInfo: res.data
          });
        } else {
          wx.showToast({
            title: '获取信息失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      }
    });
  },

  logout: function () {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.redirectTo({
            url: '/pages/home/index'
          });
        }
      }
    });
  }
});
