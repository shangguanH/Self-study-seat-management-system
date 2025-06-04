const { requestWithToken } = require('../../utils/request');
Page({
  data: {
    maxBookingHours: 0 // 初始值
  },

  onLoad() {
    this.loadSystemSettings();
  },

  // 加载系统参数
  loadSystemSettings() {
    const that = this;
    requestWithToken({
      url: '/api/v1.0/admin/system',
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) {
          // 假设返回数据格式: { max_booking_hours: 4 }
          that.setData({ 
            maxBookingHours: res.data.max_booking_time || 0
          });
        } else {
          wx.showToast({ title: '加载失败: ' + (res.data.msg || res.statusCode), icon: 'none' });
        }
      },
      fail: (err) => {
        wx.showToast({ title: '网络错误', icon: 'none' });
        console.error('加载系统参数失败:', err);
      }
    });
  },

  // 输入框变化处理
  onInputChange(e) {
    const value = parseInt(e.detail.value) || 0;
    this.setData({ maxBookingHours: value });
  },

  // 保存设置
  saveSettings() {
    const that = this;
    wx.showLoading({ title: '保存中...', mask: true });
    
    requestWithToken({
      url: '/api/v1.0/admin/system',
      method: 'POST',
      data: {
        max_booking_time: this.data.maxBookingHours
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          wx.showToast({ title: '保存成功', icon: 'success' });
        } else {
          wx.showToast({ 
            title: `保存失败: ${res.data.msg || res.statusCode}`,
            icon: 'none',
            duration: 3000
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误', icon: 'none' });
        console.error('保存失败:', err);
      }
    });
  }
});