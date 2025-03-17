// home.js
Page({
  // 立即预约按钮点击事件
  onBookNow: function() {
    // 使用 wx.navigateTo() 跳转到登录页
    wx.navigateTo({
      url: '/pages/login/index',  // 假设 login 页面路径是 /pages/login/index
    });
  }
});
