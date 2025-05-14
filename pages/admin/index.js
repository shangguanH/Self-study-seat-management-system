Page({
  data: {
    // 管理员页面的数据
  },

  onLoad: function (options) {
    // 页面加载时的逻辑
  },

  onUserManagement: function () {
    // 跳转到用户管理页面
    wx.navigateTo({
      url: '/pages/student-management/index',
    });
  },

  onSeatManagement: function () {
    // 跳转到座位管理页面
    wx.navigateTo({
      url: '/pages/study-rooms/index',
    });
  },

  onSystemSettings: function () {
    // 跳转到系统设置页面
    wx.navigateTo({
      url: '/pages/admin/system-settings',
    });
  }
});