Page({
  data: {
    hasReservation: false,  // 初始状态下没有预约
    reservationHistory: [], // 添加预约历史记录数组
    isSignedIn: false,     // 是否已签到
    isTemporarilyAway: false, // 是否暂时离开
    remainingTime: 30,     // 暂离剩余时间（分钟）
    countdownTimer: null   // 计时器ID
  },

  // 预约按钮点击事件
  onReserveClick: function() {
    // ... existing code ...
    wx.navigateTo({
      url: '/pages/application/index', // 假设预约页面路径
    });
  },

  // 签到按钮点击事件
  onSignInClick: function() {
    wx.showToast({
      title: '签到成功！',
      icon: 'success',
      duration: 2000
    });
    
    // 更新签到状态
    this.setData({
      isSignedIn: true
    });
  },
  
  // 暂离按钮点击事件
  onTemporaryLeaveClick: function() {
    if (!this.data.isTemporarilyAway) {
      // 设置暂离状态
      this.setData({
        isTemporarilyAway: true,
        remainingTime: 30
      });
      
      // 启动计时器
      const countdownTimer = setInterval(() => {
        let time = this.data.remainingTime - 1;
        
        if (time <= 0) {
          // 超时，释放座位
          clearInterval(this.data.countdownTimer);
          this.setData({
            hasReservation: false,
            isSignedIn: false,
            isTemporarilyAway: false,
            countdownTimer: null
          });
          
          wx.showToast({
            title: '暂离超时，座位已释放',
            icon: 'none',
            duration: 2000
          });
          
          // 更新本地存储
          wx.setStorageSync('hasReservation', false);
        } else {
          // 更新剩余时间
          this.setData({
            remainingTime: time
          });
        }
      }, 60000); // 每分钟更新一次
      
      this.setData({
        countdownTimer: countdownTimer
      });
      
      wx.showToast({
        title: '已设置暂离状态，30分钟内请返回',
        icon: 'none',
        duration: 2000
      });
    } else {
      // 恢复在座状态
      clearInterval(this.data.countdownTimer);
      this.setData({
        isTemporarilyAway: false,
        countdownTimer: null
      });
      
      wx.showToast({
        title: '已恢复在座状态',
        icon: 'success',
        duration: 2000
      });
    }
  },
  
  // 释放座位按钮点击事件
  onReleaseSeatClick: function() {
    // 弹出确认框
    wx.showModal({
      title: '释放座位',
      content: '确定要释放当前座位吗？',
      success: (res) => {
        if (res.confirm) {
          // 停止可能正在运行的计时器
          if (this.data.countdownTimer) {
            clearInterval(this.data.countdownTimer);
          }
          
          // 更新状态
          this.setData({
            hasReservation: false,
            isSignedIn: false,
            isTemporarilyAway: false,
            countdownTimer: null
          });
          
          // 更新本地存储
          wx.setStorageSync('hasReservation', false);
          
          wx.showToast({
            title: '座位已释放',
            icon: 'success',
            duration: 2000
          });
        }
      }
    });
  },

// 查看历史预约按钮点击事件
onViewHistoryClick: function() {
  // 显示预约历史记录
  if (this.data.reservationHistory.length === 0) {
    wx.showToast({
      title: '暂无预约记录',
      icon: 'none',
      duration: 2000
    });
  } else {
    // 将历史记录格式化为多行字符串
    const historyText = this.data.reservationHistory.map((item, index) => {
      return `${index + 1}. 日期: ${item.date || '未指定'}\n` +
             `   时间: ${item.time || '未指定'}\n` +
             `   自习室: ${item.studyRoom || '未指定'}\n` +
             `   座位号: ${item.seatNumber || '未指定'}\n` +
             `   状态: ${item.status || '未知'}`;
    }).join('\n\n'); // 每条记录之间用两个换行分隔
    
    wx.showModal({
      title: '历史预约记录',
      content: historyText,
      showCancel: false,
      confirmText: '知道了'
    });
  }
}
,


  // 假设通过某种方法获取当前预约状态（例如从本地存储或服务器获取）
  onLoad: function() {
    // 这里模拟获取预约状态
    wx.removeStorageSync('reservationHistory');


    const reservationStatus = wx.getStorageSync('hasReservation');
    if (reservationStatus) {
      this.setData({
        hasReservation: true
      });
    }
    
    // 检查是否已有历史记录，如果没有则添加测试数据
    let history = wx.getStorageSync('reservationHistory') || [];
    
    // 如果历史记录为空，添加一些自习室预约的测试数据
    if (history.length === 0) {
      // history = [
      //   { date: '2023-11-01', time: '09:00-12:00', studyRoom: 'A栋101', seatNumber: 'A12', status: '已完成' },
      //   { date: '2023-11-15', time: '14:00-18:00', studyRoom: 'B栋203', seatNumber: 'B05', status: '已完成' },
      //   { date: '2023-12-05', time: '19:00-22:00', studyRoom: 'C栋305', seatNumber: 'C19', status: '已取消' },
      //   { date: '2024-01-10', time: '08:30-11:30', studyRoom: 'A栋102', seatNumber: 'A08', status: '已完成' }
      // ];
      // wx.setStorageSync('reservationHistory', history);
      // 保存到本地存储
    }
    
    this.setData({
      reservationHistory: history
    });
  }
  
});
