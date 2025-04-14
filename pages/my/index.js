Page({
  data: {
    studentId: '',  // 学工号
    userInfo: {
      username: '',
      email: '',
      phone: ''
    }
  },

  onLoad: function (options) {
    const studentId = options.studentId;
    this.setData({
      studentId: studentId
    });
    this.getUserInfo(studentId);
  },

  getUserInfo: function (studentId) {
    const userInfo = {
      username: `用户${studentId}`,
      email: `${studentId}@example.com`,
      phone: `1380000${studentId}`
    };
    this.setData({
      userInfo: userInfo
    });
  },

  logout: function () {
    wx.redirectTo({
      url: '/pages/home/index'
    });
  }
});
