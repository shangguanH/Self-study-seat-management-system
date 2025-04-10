Page({
  data: {
    studentId: '',  // 学工号
    userInfo: {
      username: '',
      email: '',
      phone: ''
    }
  },

  // 页面加载时获取学工号
  onLoad: function(options) {
    const studentId = options.studentId;  // 从 URL 中获取学工号
    this.setData({
      studentId: studentId
    });

    // 模拟从后端获取用户信息（可以根据实际需求替换为接口请求）
    this.getUserInfo(studentId);
  },

  // 获取用户信息（模拟）
  getUserInfo: function(studentId) {
    // 模拟的用户数据，可以根据学工号获取用户信息
    const userInfo = {
      username: `用户${studentId}`,
      email: `${studentId}@example.com`,
      phone: `1380000${studentId}`
    };
    this.setData({
      userInfo: userInfo
    });
  }
});
