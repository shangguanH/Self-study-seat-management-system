Page({
  data: {
    hasReservation: false,  // 初始状态下没有预约
  },

  // 预约按钮点击事件
  onReserveClick: function() {
    wx.navigateTo({
      url: '/pages/application/index', // 假设预约页面路径
    });
  },

  // 签到按钮点击事件
  onSignInClick: function() {
    // 在这里你可以添加签到的逻辑
    wx.showToast({
      title: '签到成功！',
      icon: 'success',
      duration: 2000
    });
  },

  // 假设通过某种方法获取当前预约状态（例如从本地存储或服务器获取）
  onLoad: function() {
    // 这里模拟获取预约状态
    // 如果用户有预约，设置 `hasReservation` 为 `true`
    // 如果没有预约，保持为 `false`
    
    // 模拟从本地存储或者服务器中获取用户预约信息
    const reservationStatus = wx.getStorageSync('hasReservation');
    if (reservationStatus) {
      this.setData({
        hasReservation: true
      });
    }
  }
});
