const { requestWithToken } = require('../../utils/request');

Page({
  data: {
    hasReservation: false,      // 当前是否有有效预约
    userReservationDetails: null, // 当前预约的详细信息
    reservationHistory: [],     // 预约历史记录数组
    isSignedIn: false,         // 当前预约是否已签到
    isTemporarilyAway: false, // 当前预约是否暂时离开
    remainingTime: 30,         // 暂离剩余时间（分钟）
    countdownTimer: null,       // 暂离计时器ID
    showHistoryModal: false,    // 控制历史记录弹窗的显示状态

    // --- 签到模态框相关 ---
    showSignInModal: false,     // 控制签到弹窗的显示状态
    signInCodeInput: '',        // 存储用户输入的签到码
    isReturningFromLeave: false, // 标记是否是从暂离返回（用于区分普通签到和恢复在座）
    
    // --- 加载状态 ---
    loading: false,             // 页面加载状态
    historyLoading: false,      // 历史记录加载状态
    historyError: null,         // 历史记录加载错误信息
  },

  // --- Core Actions ---

  // 预约按钮点击事件 (跳转到自习室列表或选择页面)
  onReserveClick: function() {
    wx.navigateTo({
      url: '/pages/application/index', // 假设这是自习室列表页
      fail: (err) => {
          console.error("Navigate to application index failed:", err);
          wx.showToast({title: '无法打开预约页面', icon: 'none'});
      }
    });
  },

  // 签到按钮点击事件 (打开弹窗)
  onSignInClick: function() {
    // 检查签到条件
    if (!this.data.hasReservation) {
      wx.showToast({ title: '当前无预约', icon: 'none' });
      return;
    }
    
    // 必须未签到状态
    if (this.data.isSignedIn && !this.data.isTemporarilyAway) {
      wx.showToast({ title: '您已签到', icon: 'none' });
      return;
    }

    console.log('打开签到码输入弹窗');

    // 打开签到模态框，并标记为普通签到
    this.setData({
      showSignInModal: true,
      signInCodeInput: '', // 清空之前的输入
      isReturningFromLeave: false // 标记为普通签到
    });
  },

  // --- Sign-In Modal Handlers ---

  // 更新用户输入的签到码
  onSignInCodeInput: function(e) {
    this.setData({
      signInCodeInput: e.detail.value
    });
  },

  // 取消签到
  cancelSignIn: function() {
    this.setData({
      showSignInModal: false,
      signInCodeInput: '' // 清空输入
    });
  },

  // 确认签到
  confirmSignIn: function() {
    const enteredCode = this.data.signInCodeInput.trim();
    
    // 验证输入
    if (!enteredCode) {
      wx.showToast({ title: '请输入签到码', icon: 'none' });
      return;
    }

    // 确保有预约详情和座位ID
    const userReservation = this.data.userReservationDetails;
    if (!userReservation || !userReservation.seat_id) {
      wx.showToast({ title: '预约信息不完整', icon: 'none' });
      this.setData({ showSignInModal: false });
      return;
    }

    // 关闭模态框
    this.setData({ 
      showSignInModal: false,
      loading: true 
    });

    // 调用签到API
    requestWithToken({
      url: `/api/v1.0/student/seats/${userReservation.seat_id}/checkin`,
      method: 'POST',
      data: {
        code: enteredCode
      },
      success: (res) => {
        this.setData({ loading: false });
        
        if (res.statusCode === 200) {
          // 签到成功
          const message = this.data.isReturningFromLeave ? '已恢复在座' : '签到成功！';
          
          wx.showToast({
            title: message,
            icon: 'success',
            duration: 2000
          });
          
          // 如果是从暂离返回，清除倒计时
          if (this.data.isReturningFromLeave && this.data.countdownTimer) {
            clearInterval(this.data.countdownTimer);
            this.setData({
              countdownTimer: null,
              remainingTime: 30, // 重置显示时间
              isReturningFromLeave: false // 重置标记
            });
          }
          
          // 重新获取最新预约状态
          this.fetchCurrentReservation();
        } else {
          // 签到失败
          let errorMsg = this.data.isReturningFromLeave ? '恢复在座失败' : '签到失败';
          if (res.data && res.data.message) {
            errorMsg = res.data.message;
          } else if (res.statusCode === 400) {
            errorMsg = '签到码错误';
          }
          
          wx.showToast({
            title: errorMsg,
            icon: 'error',
            duration: 2000
          });
          
          // 重置返回状态标记
          this.setData({
            isReturningFromLeave: false
          });
        }
      },
      fail: (err) => {
        console.error('签到请求失败:', err);
        this.setData({ 
          loading: false,
          isReturningFromLeave: false // 重置标记
        });
        
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 暂离/恢复在座按钮点击事件
  onTemporaryLeaveClick: function() {
    if (!this.data.hasReservation || !this.data.isSignedIn) {
      wx.showToast({ title: '请先完成签到', icon: 'none'});
      return;
    }

    // 确保有预约详情和座位ID
    const userReservation = this.data.userReservationDetails;
    if (!userReservation || !userReservation.seat_id) {
      wx.showToast({ title: '预约信息不完整', icon: 'none' });
      return;
    }

    // 根据当前状态决定操作
    if (!this.data.isTemporarilyAway) {
      // 执行暂离操作
      this.setData({ loading: true });
      
      requestWithToken({
        url: `/api/v1.0/student/seats/${userReservation.seat_id}/leave`,
        method: 'POST',
        success: (res) => {
          this.setData({ loading: false });
          
          if (res.statusCode === 200) {
            // 暂离成功
            wx.showToast({ 
              title: '已设置暂离 (30分钟)', 
              icon: 'success', 
              duration: 2000 
            });
            
            // 设置暂离倒计时
            this.startLeaveCountdown();
            
            // 重新获取预约状态以同步最新状态
            this.fetchCurrentReservation();
          } else {
            // 暂离失败
            let errorMsg = '暂离设置失败';
            if (res.data && res.data.message) {
              errorMsg = res.data.message;
            }
            
            wx.showToast({
              title: errorMsg,
              icon: 'none'
            });
          }
        },
        fail: (err) => {
          console.error('暂离请求失败:', err);
          this.setData({ loading: false });
          
          wx.showToast({
            title: '网络错误，请重试',
            icon: 'none'
          });
        }
      });
    } else {
      // 恢复在座 - 需要签到码，打开签到弹窗并标记为恢复在座操作
      this.setData({
        showSignInModal: true,
        signInCodeInput: '', // 清空之前的输入
        isReturningFromLeave: true // 标记为恢复在座操作
      });
    }
  },

  // 启动暂离倒计时
  startLeaveCountdown: function() {
    // 清除可能存在的旧计时器
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer);
    }
    
    // 设置初始状态
    this.setData({
      isTemporarilyAway: true,
      remainingTime: 30
    });
    
    // 记录开始时间
    const leaveStartTime = new Date().getTime();
    
    // 启动新计时器
    const countdownTimer = setInterval(() => {
      const now = new Date().getTime();
      const elapsedMinutes = Math.floor((now - leaveStartTime) / 60000);
      let time = 30 - elapsedMinutes;
      
      if (time <= 0) {
        // 暂离超时，座位将自动释放
        clearInterval(this.data.countdownTimer);
        
        wx.showToast({
          title: '暂离超时，座位已释放', 
          icon: 'none', 
          duration: 2500
        });
        
        // 重新获取状态，此时应该是无预约状态
        this.fetchCurrentReservation();
      } else {
        // 更新剩余时间
        this.setData({ remainingTime: time });
      }
    }, 60000); // 每分钟更新一次
    
    this.setData({ countdownTimer: countdownTimer });
  },

  // 释放座位按钮点击事件
  onReleaseSeatClick: function() {
    if (!this.data.hasReservation) return;

    wx.showModal({
      title: '确认释放座位',
      content: '确定要取消本次预约吗？此操作不可撤销。',
      confirmText: "确认释放",
      confirmColor: '#FF0000',
      cancelText: "取消",
      success: (res) => {
        if (res.confirm) {
          console.log('用户确认释放座位');
          this.releaseSeat();
        }
      }
    });
  },

  // 释放座位的API请求
  releaseSeat: function() {
    // 确保有预约详情和座位ID
    const userReservation = this.data.userReservationDetails;
    if (!userReservation || !userReservation.seat_id) {
      wx.showToast({ title: '预约信息不完整', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    
    // 调用释放座位API
    requestWithToken({
      url: `/api/v1.0/student/seats/${userReservation.seat_id}/release`,
      method: 'POST',
      success: (res) => {
        this.setData({ loading: false });
        
        if (res.statusCode === 200) {
          // 释放成功
          console.log(res);
          wx.showToast({
            title: '座位已释放',
            icon: 'success',
            duration: 2000
          });
          
          // 清除计时器
          if (this.data.countdownTimer) {
            clearInterval(this.data.countdownTimer);
          }
          
          // 更新状态为无预约
          this.setData({
            hasReservation: false,
            userReservationDetails: null,
            isSignedIn: false,
            isTemporarilyAway: false,
            countdownTimer: null,
            remainingTime: 30
          });
        } else {
          // 释放失败
          let errorMsg = '释放座位失败';
          if (res.data && res.data.message) {
            errorMsg = res.data.message;
          }
          
          wx.showToast({
            title: errorMsg,
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('释放座位请求失败:', err);
        this.setData({ loading: false });
        
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    });
  },

  // --- 历史记录相关 ---
  // ... 保持历史记录相关代码不变 ...
  
  // 查看历史预约按钮点击事件
  onViewHistoryClick: function() {
    this.fetchHistoryFromAPI();
  },

  // 从API获取历史记录
  fetchHistoryFromAPI: function() {
    this.setData({
      historyLoading: true,
      historyError: null
    });

    requestWithToken({
      url: '/api/v1.0/student/bookings/history',
      method: 'GET',
      success: (res) => {
        console.log('获取预约历史API响应:', res);
        
        if (res.statusCode === 200) {
          const apiHistory = res.data.history || [];
          
          if (apiHistory.length === 0) {
            this.setData({
              reservationHistory: [],
              historyLoading: false
            });
            
            wx.showToast({
              title: '暂无历史预约记录',
              icon: 'none'
            });
            return;
          }
          
          this.processHistoryData(apiHistory);
          
          this.setData({
            showHistoryModal: true,
            historyLoading: false
          });
        } else {
          console.error('获取预约历史API失败:', res.statusCode, res.data);
          this.setData({
            historyLoading: false,
            historyError: `获取历史记录失败 (${res.statusCode})`
          });
          
          wx.showToast({
            title: '获取历史记录失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('获取预约历史API请求失败:', err);
        this.setData({
          historyLoading: false,
          historyError: '网络错误，请重试'
        });
        
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 处理从API获取的历史记录数据
  processHistoryData: function(apiHistory) {
    const formattedHistory = apiHistory.map(item => {
      // 转换时间戳为可读格式
      const startTime = item.start_time ? this.formatTimestamp(item.start_time) : '未设置';
      const endTime = item.end_time ? this.formatTimestamp(item.end_time) : '未设置';
      
      // 提取日期和时间部分
      let dateDisplay = '日期未知';
      let timeDisplay = '时间未设置';
      
      if (startTime !== '未设置') {
        const startParts = startTime.split(' ');
        if (startParts.length === 2) {
          dateDisplay = startParts[0];
          timeDisplay = startParts[1];
          
          if (endTime !== '未设置') {
            const endParts = endTime.split(' ');
            if (endParts.length === 2) {
              timeDisplay += ` - ${endParts[1]}`;
            }
          }
        }
      }
      
      return {
        booking_id: item.booking_id,
        room_id: item.room_id,
        seat_id: item.seat_id,
        roomName: `自习室 ${item.room_id}`,
        seatIndex: item.seat_id,
        displayDate: dateDisplay,
        displayTime: timeDisplay,
        displayRoom: `自习室 ${item.room_id}`,
        displaySeat: `座位 ${item.seat_id}`,
        start_time: item.start_time,
        end_time: item.end_time,
        rawData: item
      };
    }).sort((a, b) => {
      return (b.start_time || 0) - (a.start_time || 0);
    });
    
    this.setData({
      reservationHistory: formattedHistory
    });
  },
  
  // 格式化时间戳为可读字符串
  formatTimestamp: function(timestamp) {
    if (!timestamp) return '未设置';
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '时间格式错误';
    
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  // 关闭历史记录弹窗
  closeHistoryModal: function() {
    this.setData({
      showHistoryModal: false
    });
  },

  // 处理"再次预约"按钮点击
  onRebookClick: function(e) {
    const historyItem = e.currentTarget.dataset.item;
  
    if (!historyItem || !historyItem.room_id) {
      wx.showToast({ title: '历史记录信息不完整', icon: 'none' });
      console.error('缺少room_id无法再次预约:', historyItem);
      return;
    }
  
    console.log('再次预约点击，目标自习室ID:', historyItem.room_id);
  
    // 关闭历史记录弹窗
    this.setData({
      showHistoryModal: false
    });
  
    // 构建目标 URL，添加seat_id和autoOpenSeat标志
    const targetUrl = `/pages/reserve/index?roomId=${historyItem.room_id}&roomName=${encodeURIComponent(historyItem.displayRoom)}&seatId=${historyItem.seat_id}&autoOpenSeat=true`;
  
    // 跳转到指定自习室的预约页面
    wx.navigateTo({
      url: targetUrl,
      fail: (err) => {
        console.error("跳转到 reserve/index 失败:", err);
        wx.showToast({ title: '无法打开预约页面', icon: 'none' });
      }
    });
  },

  // --- 页面生命周期 ---

  onLoad: function(options) {
    console.log('Page onLoad');
  },

  onShow: function() {
    console.log('Page onShow');
    // 每次页面显示时都重新获取当前预约状态
    this.fetchCurrentReservation();
  },

  // 获取当前用户预约状态
  fetchCurrentReservation: function() {
    this.setData({ loading: true });
    
    requestWithToken({
      url: '/api/v1.0/student/information',
      method: 'GET',
      
      success: (res) => {
        this.setData({ loading: false });
        console.log(res);
        if (res.statusCode === 200) {
          console.log('获取当前预约状态:', res.data);
          
          // 处理返回的状态数据
          const statusCode = res.data.status || 0;
          
          // 解析状态码:
          // 0 - 无预约
          // 1 - 有预约未签到
          // 2 - 已签到（在座）
          // 3 - 暂离
          
          if (statusCode === 0 || statusCode === 4) {
            // 无预约状态
            this.setData({
              hasReservation: false,
              userReservationDetails: null,
              isSignedIn: false,
              isTemporarilyAway: false
            });
            
            // 清除可能存在的计时器
            if (this.data.countdownTimer) {
              clearInterval(this.data.countdownTimer);
              this.setData({ countdownTimer: null });
            }
          } else {
            // 有预约状态 - 保存API返回的预约详情
            // 格式化时间戳字段为可读时间字符串
            const formattedData = { ...res.data };
            
            // 转换开始时间和结束时间为可读格式
            if (formattedData.start_time) {
              formattedData.start_time_original = formattedData.start_time; // 保留原始时间戳以备使用
              formattedData.start_time_formatted = this.formatTimestamp(formattedData.start_time);
              formattedData.start_time = formattedData.start_time_formatted; // 覆盖为格式化后的字符串
            }
            
            if (formattedData.end_time) {
              formattedData.end_time_original = formattedData.end_time; // 保留原始时间戳以备使用
              formattedData.end_time_formatted = this.formatTimestamp(formattedData.end_time);
              formattedData.end_time = formattedData.end_time_formatted; // 覆盖为格式化后的字符串
            }
            
            console.log('格式化后的预约数据:', formattedData);
            
            this.setData({
              hasReservation: true,
              userReservationDetails: formattedData,
              isSignedIn: statusCode >= 2, // 2或3表示已签到
              isTemporarilyAway: statusCode === 3 // 3表示暂离
            });
            
            // 如果处于暂离状态，启动倒计时
            if (statusCode === 3 && !this.data.countdownTimer) {
              this.startLeaveCountdown();
            } else if (statusCode !== 3 && this.data.countdownTimer) {
              // 如果不再暂离但仍有计时器，清除它
              clearInterval(this.data.countdownTimer);
              this.setData({ 
                countdownTimer: null,
                remainingTime: 30 // 重置显示时间
              });
            }
          }
        } else {
          console.error('获取预约状态失败:', res.statusCode, res.data);
          
          // 在API失败的情况下，保持当前UI状态不变
          wx.showToast({
            title: '获取预约状态失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('获取预约状态请求失败:', err);
        this.setData({ loading: false });
        
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 格式化时间戳为可读字符串
  formatTimestamp: function(timestamp) {
    if (!timestamp) return '未设置';
    
    // 确保timestamp是数字
    const numTimestamp = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
    
    if (isNaN(numTimestamp)) return '时间格式错误';
    
    // 如果时间戳是秒级的（10位），转换为毫秒级（13位）
    const milliseconds = numTimestamp < 10000000000 ? numTimestamp * 1000 : numTimestamp;
    
    const date = new Date(milliseconds);
    if (isNaN(date.getTime())) return '时间格式错误';
    
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  // 页面卸载时清理计时器
  onUnload: function() {
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer);
    }
  },

  // 阻止蒙层下的页面滚动
  preventTouchMove: function() {
    // 此函数为空，用于WXML中catchtouchmove绑定
  }
});
