
Page({
  data: {
    hasReservation: false,      // 当前是否有有效预约
    userReservationDetails: null, // 当前预约的详细信息 (应包含 signInCode)
    reservationHistory: [],     // 预约历史记录数组 (会被格式化)
    isSignedIn: false,         // 当前预约是否已签到
    isTemporarilyAway: false, // 当前预约是否暂时离开
    remainingTime: 30,         // 暂离剩余时间（分钟）
    countdownTimer: null,       // 暂离计时器ID
    showHistoryModal: false,    // 控制历史记录弹窗的显示状态

    // --- Added for Sign-In Modal ---
    showSignInModal: false,     // 控制签到弹窗的显示状态
    signInCodeInput: '',        // 存储用户输入的签到码
    // --- End Added ---
  },

  // --- Core Actions ---

  // 预约按钮点击事件 (跳转到自习室列表或选择页面)
  onReserveClick: function() {
    // *** 确保这个路径是你的自习室列表/预约入口页面 ***
    wx.navigateTo({
      url: '/pages/application/index', // 假设这是自习室列表页
      fail: (err) => {
          console.error("Navigate to application index failed:", err);
          wx.showToast({title: '无法打开预约页面', icon: 'none'});
      }
    });
  },

  // 签到按钮点击事件 (改为打开弹窗)
  onSignInClick: function() {
    // --- Check if sign-in is applicable ---
    const currentReservation = this.data.userReservationDetails;
    // 1. Must have a reservation
    if (!currentReservation) {
      wx.showToast({ title: '当前无预约', icon: 'none' });
      return;
    }
    // 2. Must NOT be already signed in
    if (this.data.isSignedIn) {
      wx.showToast({ title: '您已签到', icon: 'none' });
      return;
    }

    console.log('打开签到码输入弹窗 for:', currentReservation);

    // --- Open the modal ---
    this.setData({
      showSignInModal: true,
      signInCodeInput: '' // Clear previous input when opening
    });
  },

  // --- Sign-In Modal Handlers ---

  // Update input value as user types
  onSignInCodeInput: function(e) {
    this.setData({
      signInCodeInput: e.detail.value
    });
  },

  // Cancel button in sign-in modal
  cancelSignIn: function() {
    this.setData({
      showSignInModal: false,
      signInCodeInput: '' // Clear input on cancel
    });
  },

  // Confirm button in sign-in modal
  confirmSignIn: function() {
    const enteredCode = this.data.signInCodeInput.trim(); // Get trimmed input
    const currentReservation = this.data.userReservationDetails;

    // --- Validation ---
    if (!enteredCode) {
      wx.showToast({ title: '请输入签到码', icon: 'none' });
      return;
    }

    if (!currentReservation) {
      wx.showToast({ title: '内部错误：无预约信息', icon: 'error' });
      this.setData({ showSignInModal: false }); // Close modal on error
      console.error("Confirm sign in failed: No current reservation details found in data.");
      return;
    }

    // --- Determine the correct sign-in code ---
    // IMPORTANT: Get the correct code from the reservation details.
    
    //这里先预设一个签到码，实际上从后端获取一个签到码
    const correctCode = "1234"; 

    console.log(`Validating code: Entered='${enteredCode}', Correct='${correctCode}'`);

    if (correctCode === undefined || correctCode === null) {
        wx.showToast({ title: '错误：无法获取签到码', icon: 'error' });
        console.error("Sign in failed: signInCode is missing from userReservationDetails", currentReservation);
        this.setData({ showSignInModal: false });
        return;
    }


    // --- Check if the code is correct ---
    // Ensure comparison is done correctly (e.g., string vs string)
    if (enteredCode === String(correctCode)) {
      // Code is correct, proceed with actual sign-in logic
      console.log('签到码正确，执行签到...');
      this.setData({ showSignInModal: false }); // Close the modal first
      this.executeSignIn(); // Call the actual sign-in function

    } else {
      // Code is incorrect
      wx.showToast({ title: '签到码错误', icon: 'error', duration: 2000 });
      // Keep the modal open for user to retry
      this.setData({ signInCodeInput: '' }); // Clear the incorrect input
    }
  },

  // --- Extracted Sign-In Logic ---
  // This function contains the actual steps to perform after code validation
  executeSignIn: function() {
    const currentReservation = this.data.userReservationDetails; // Re-get reservation details
    if (!currentReservation || this.data.isSignedIn) {
      console.error("executeSignIn called inappropriately. Reservation:", currentReservation, "Is SignedIn:", this.data.isSignedIn);
      wx.showToast({ title: '签到状态异常', icon: 'none' }); // Give feedback if called wrong
      return; // Should not happen if UI logic is correct
    }

    console.log('正在执行签到核心逻辑 for:', currentReservation);
    // 1. TODO: (可选) 与后端交互确认签到 (if needed)
    //    - Example:
    //      wx.request({
    //         url: 'YOUR_BACKEND_API/signIn', method: 'POST',
    //         data: { reservationId: currentReservation.id, userId: 'CURRENT_USER_ID' },
    //         success: (res) => { if (res.data.success) { console.log("Backend sign-in OK."); } else { console.error("Backend sign-in failed:", res.data.message);}},
    //         fail: (err) => { console.error("Backend sign-in request failed:", err); }
    //      });


    // 2. Update local page state immediately for responsiveness
    this.setData({
      isSignedIn: true
    });

    // 3. (重要) Update local storage to persist the signed-in state
    currentReservation.isSignedIn = true; // Add or update the flag in the object
    wx.setStorageSync('userReservation', currentReservation);
    console.log("Updated userReservation in storage with isSignedIn=true:", wx.getStorageSync('userReservation'));


    // 4. Show success feedback to the user
    wx.showToast({
      title: '签到成功！',
      icon: 'success',
      duration: 2000
    });
  },

  // 暂离 / 恢复在座 按钮点击事件
  onTemporaryLeaveClick: function() {
    if (!this.data.hasReservation || !this.data.isSignedIn) {
        wx.showToast({ title: '请先完成签到', icon: 'none'});
        return; // Must have reservation and be signed in
    }

    if (!this.data.isTemporarilyAway) {
      // --- 开始暂离 ---
      console.log('开始暂离');
      const leaveStartTime = new Date().getTime(); // Record start time

      this.setData({
        isTemporarilyAway: true,
        remainingTime: 30 // 重置为30分钟
      });

      // 清除旧计时器（以防万一）
      if (this.data.countdownTimer) {
        clearInterval(this.data.countdownTimer);
      }

      // 启动新计时器 (基于开始时间计算剩余时间)
      const countdownTimer = setInterval(() => {
        const now = new Date().getTime();
        // 使用存储的 leaveStartTime 计算已经过的时间
        const elapsedMinutes = Math.floor((now - leaveStartTime) / 60000);
        let time = 30 - elapsedMinutes; // Calculate remaining based on elapsed time

        if (time <= 0) {
          // --- 暂离超时 ---
          console.log('暂离超时，自动释放座位');
          clearInterval(this.data.countdownTimer); // 停止计时器
          wx.showToast({
            title: '暂离超时，座位已释放', icon: 'none', duration: 2500
          });
          this.releaseSeatActions(true); // 调用释放操作(标记为自动释放)
        } else {
          // --- 更新剩余时间 ---
          this.setData({ remainingTime: time });
        }
      }, 60000); // 每分钟更新一次

      this.setData({ countdownTimer: countdownTimer }); // 保存计时器ID
      wx.showToast({ title: '已设置暂离 (30分钟)', icon: 'none', duration: 2000 });

      // (重要) Update storage to persist temporary leave state & start time
      const currentReservation = wx.getStorageSync('userReservation');
      if (currentReservation) {
         currentReservation.isTemporarilyAway = true;
         currentReservation.temporaryLeaveStartTime = leaveStartTime; // Store start time
         wx.setStorageSync('userReservation', currentReservation);
         console.log("Updated userReservation in storage with isTemporarilyAway=true and startTime");
      }
      // TODO: (可选) 通知后端进入暂离状态

    } else {
      // --- 恢复在座 ---
      console.log('恢复在座');
      if (this.data.countdownTimer) {
        clearInterval(this.data.countdownTimer);
      }
      this.setData({
        isTemporarilyAway: false,
        countdownTimer: null,
        remainingTime: 30 // Optionally reset display time
      });
      wx.showToast({ title: '已恢复在座', icon: 'success', duration: 2000 });

      // (重要) Update storage to reflect recovery
      const currentReservation = wx.getStorageSync('userReservation');
      if (currentReservation) {
         currentReservation.isTemporarilyAway = false;
         delete currentReservation.temporaryLeaveStartTime; // Remove start time
         wx.setStorageSync('userReservation', currentReservation);
         console.log("Updated userReservation in storage with isTemporarilyAway=false");
      }
      // TODO: (可选) 通知后端恢复在座
    }
  },

  // 释放座位按钮点击事件
  onReleaseSeatClick: function() {
     if (!this.data.hasReservation) return; // 没有预约无法释放

    wx.showModal({
      title: '确认释放座位',
      content: '确定要取消本次预约吗？此操作不可撤销。',
      confirmText: "确认释放",
      confirmColor: '#FF0000', // 红色警示
      cancelText: "取消",
      success: (res) => {
        if (res.confirm) {
          console.log('用户确认手动释放座位');
          this.releaseSeatActions(false); // 调用封装的释放操作 (标记为手动释放)
        } else {
          console.log('用户取消释放座位');
        }
      }
    });
  },

  // --- 封装的释放座位核心操作 ---
  // isAuto: boolean, 标记是超时自动释放还是用户手动释放
  releaseSeatActions: function(isAuto = false) {
    console.log(`执行释放座位操作 (自动: ${isAuto})`);
    const reservationToRelease = this.data.userReservationDetails; // 获取当前预约信息

    // 1. 停止可能正在运行的暂离计时器
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer);
    }

    // 2. 清除本地存储的当前预约信息
    wx.removeStorageSync('userReservation');
    console.log("Removed userReservation from storage.");

    // 3. TODO: 通知后端座位已释放 (非常重要)
    // if (reservationToRelease && reservationToRelease.id) {
    //   wx.request({
    //      url: 'YOUR_BACKEND_API/releaseSeat', method: 'POST',
    //      data: { reservationId: reservationToRelease.id, userId: 'YOUR_USER_ID', releasedBy: isAuto ? 'auto_timeout' : 'manual' },
    //      success: (res) => { console.log("Backend release OK:", res); },
    //      fail: (err) => { console.error("Backend release request failed:", err); }
    //   });
    // } else { console.warn("Could not notify backend: reservation details or ID missing."); }

    // 4. 更新页面状态，重置所有相关标记
    this.setData({
      hasReservation: false,
      userReservationDetails: null,
      isSignedIn: false,
      isTemporarilyAway: false,
      countdownTimer: null,
      remainingTime: 30 // Reset countdown display
    });

    // 5. 显示提示
    if (!isAuto) { // 仅在手动释放时显示成功提示，自动释放已有超时提示
        wx.showToast({ title: '座位已释放', icon: 'success', duration: 2000 });
    }
  },


  // --- 历史记录相关 ---

  // 查看历史预约按钮点击事件
  onViewHistoryClick: function() {
    // 重新加载最新历史记录以防万一
    this.loadHistoryData(true); // true表示即使为空也要提示，并重新加载

    // 如果加载后仍有数据，则显示弹窗
    if (this.data.reservationHistory && this.data.reservationHistory.length > 0) {
        this.setData({
          showHistoryModal: true
        });
    }
    // 如果为空，loadHistoryData(true) 已经处理了提示
  },

  // 关闭历史记录弹窗
  closeHistoryModal: function() {
    this.setData({
      showHistoryModal: false
    });
  },

  // 处理“再次预约”按钮点击
  onRebookClick: function(e) {
    // 使用 dataset.item 获取传递过来的完整原始历史记录项
    const historyItem = e.currentTarget.dataset.item;

    if (!historyItem || !historyItem.roomName) {
      wx.showToast({ title: '历史记录信息不完整', icon: 'none' });
      console.error('Missing roomName in history item for rebook:', historyItem);
      return;
    }

    console.log('再次预约点击，目标房间:', historyItem.roomName);

    // 关闭历史记录弹窗
    this.setData({
      showHistoryModal: false
    });

    // 构建目标 URL (只传递 roomName)
    // Use encodeURIComponent for room names with special characters
    const targetUrl = `/pages/reserve/index?roomName=${encodeURIComponent(historyItem.roomName)}`;
    console.log('Navigating to:', targetUrl);

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
    // 数据加载移至 onShow，确保每次进入都刷新
  },

  onShow: function() {
    console.log('Page onShow');
    // 每次页面显示时都重新加载当前状态和历史记录，确保数据最新
    this.loadInitialData();
  },

  // --- 数据加载与处理函数 ---
  loadInitialData: function() {
    console.log('加载页面初始数据...');
    this.loadCurrentReservation(); // 加载当前预约状态
    this.loadHistoryData();        // 加载历史记录 (不强制提示为空)
  },

  // 加载并处理当前预约信息
  loadCurrentReservation: function() {
      const currentReservation = wx.getStorageSync('userReservation');
      console.log('从缓存加载当前预约:', currentReservation);

      if (currentReservation && typeof currentReservation.seatIndex === 'number' && currentReservation.roomName) {
          // Basic validation passed

          // --- 可选: 检查预约是否已过期 ---
          // (需要根据你的业务逻辑精确实现)
          // const now = new Date();
          // const endDateTimeStr = `${currentReservation.date} ${currentReservation.endTime}`;
          // try {
          //    const endDateTime = new Date(endDateTimeStr.replace(/-/g, '/')); // Handle potential format issues
          //    if (!isNaN(endDateTime) && now > endDateTime) { // Check if date is valid and expired
          //        console.log("当前预约已过期:", currentReservation);
          //        wx.removeStorageSync('userReservation'); // Clean up expired reservation
          //        this.releaseSeatActions(false); // Perform cleanup actions (without backend call maybe?)
          //        return; // Stop further processing for this expired reservation
          //    }
          // } catch (e) {
          //     console.error("Error parsing reservation end time:", e);
          // }
          // --- 结束 过期检查 ---


          this.setData({
              hasReservation: true,
              userReservationDetails: currentReservation, // Store the whole object
              // Load status flags directly from the stored object
              isSignedIn: currentReservation.isSignedIn || false,
              isTemporarilyAway: currentReservation.isTemporarilyAway || false,
          });
          console.log('检测到有效预约:', this.data.userReservationDetails);

          // If currently away, restart the timer logic
          if (this.data.isTemporarilyAway) {
               console.log("检测到暂离状态，尝试恢复计时器...");
               this.resumeTemporaryLeaveTimer(); // Use a dedicated resume function
          } else {
               // If not away, ensure any lingering timer is cleared
               if (this.data.countdownTimer) {
                    console.log("检测到非暂离状态，清除可能残留的计时器");
                    clearInterval(this.data.countdownTimer);
                    this.setData({ countdownTimer: null });
               }
          }

      } else {
          // No valid reservation found in storage or info incomplete
          if (currentReservation) {
              console.warn("Reservation found but invalid/incomplete:", currentReservation);
              // Optionally remove invalid data from storage
              // wx.removeStorageSync('userReservation');
          } else {
              console.log('未检测到有效预约');
          }

          // Clear potential leftover timer if state indicates no reservation
          if (this.data.countdownTimer) {
              clearInterval(this.data.countdownTimer);
          }
          // Reset all relevant states
          this.setData({
              hasReservation: false,
              userReservationDetails: null,
              isSignedIn: false,
              isTemporarilyAway: false,
              countdownTimer: null, // Ensure timer ID is cleared
              remainingTime: 30    // Reset display time
          });
      }
  },

 // (辅助函数) 恢复暂离计时器状态
 resumeTemporaryLeaveTimer: function() {
     const reservation = this.data.userReservationDetails;
     // Ensure we have the necessary info and are actually supposed to be away
     if (!reservation || !reservation.isTemporarilyAway || !reservation.temporaryLeaveStartTime) {
         console.warn("无法恢复计时器：缺少暂离信息或状态不一致。");
         // If state is inconsistent (e.g., isTemporarilyAway true but no startTime), fix it
         if (this.data.isTemporarilyAway || this.data.countdownTimer) {
             if (this.data.countdownTimer) clearInterval(this.data.countdownTimer);
             this.setData({ isTemporarilyAway: false, countdownTimer: null, remainingTime: 30 });
             // Optionally update storage to reflect the correction
             // if (reservation) { reservation.isTemporarilyAway = false; wx.setStorageSync('userReservation', reservation); }
         }
         return;
     }

     const leaveStartTime = reservation.temporaryLeaveStartTime;
     const now = new Date().getTime();
     const elapsedMinutes = Math.floor((now - leaveStartTime) / 60000);
     let remaining = 30 - elapsedMinutes;

     if (remaining <= 0) {
         console.log("恢复计时器时发现已超时，执行释放");
         this.releaseSeatActions(true); // Already overdue, release immediately
     } else {
         console.log(`恢复计时器，剩余时间约: ${remaining} 分钟`);
         this.setData({ remainingTime: remaining });

         // Clear any existing timer first before starting new one to prevent duplicates
         if (this.data.countdownTimer) {
             clearInterval(this.data.countdownTimer);
         }

         // Start a new interval timer, similar to onTemporaryLeaveClick
         const countdownTimer = setInterval(() => {
            const currentTime = new Date().getTime();
            // Recalculate based on the original start time
            const currentElapsed = Math.floor((currentTime - leaveStartTime) / 60000);
            let currentRemaining = 30 - currentElapsed;

            if (currentRemaining <= 0) {
              console.log('暂离超时 (恢复后检测到)，自动释放座位');
              clearInterval(this.data.countdownTimer); // Use current timer ID
              wx.showToast({ title: '暂离超时，座位已释放', icon: 'none', duration: 2500 });
              this.releaseSeatActions(true);
            } else {
              // Update only remaining time if it changed
              if (this.data.remainingTime !== currentRemaining) {
                  this.setData({ remainingTime: currentRemaining });
              }
            }
         }, 60000); // Check every minute

         this.setData({ countdownTimer: countdownTimer }); // Store the new timer ID
     }
 },


  // 加载并处理历史记录
  // showToastIfEmpty: boolean, 如果为 true 且历史为空，则显示提示
  loadHistoryData: function(showToastIfEmpty = false) {
    let history = wx.getStorageSync('reservationHistory') || [];
    if (!Array.isArray(history)) {
      console.warn("缓存中的 reservationHistory 不是数组，已重置。");
      history = [];
      wx.setStorageSync('reservationHistory', history); // Save the reset array
    }
    console.log(`从缓存加载 ${history.length} 条历史记录`);

    // --- DEBUG: 添加测试数据逻辑 ---
    // (保持不变，但确保测试数据包含 signInCode, isSignedIn, isTemporarilyAway, temporaryLeaveStartTime 等字段以模拟真实场景)
    const testFlag = 'add_test_history_done_v3'; // Increment version if structure changes
    if (history.length === 0 && wx.getStorageSync(testFlag) !== true) {
      console.log('无历史记录，添加测试数据...');
      history = [
         { date: '2025-04-24', startTime: '14:00', endTime:"16:00", roomName: '静思阁', seatIndex: 5, bookingTimestamp: '2025-04-24T13:55:00.000Z', id: 'hist1', isSignedIn: true, isTemporarilyAway: false, signInCode: '1111' },
         { date: '2025-04-25', startTime: '09:00', endTime:"11:00", roomName: '博学轩', seatIndex: 1, bookingTimestamp: '2025-04-25T08:45:10.123Z', id: 'hist2', isSignedIn: true, isTemporarilyAway: false, signInCode: '2222' },
         { date: '2025-04-23', startTime: '19:00', endTime:"21:00", roomName: '静思阁', seatIndex: 2, bookingTimestamp: '2025-04-23T18:30:05.000Z', id: 'hist3', isSignedIn: true, isTemporarilyAway: false, signInCode: '3333' }
      ];
      wx.setStorageSync('reservationHistory', history);
      wx.setStorageSync(testFlag, true); // Mark that test data has been added
      console.log('Test history data added and saved.');
    }
    // --- 结束 DEBUG ---

    // Handle empty history case
    if (history.length === 0) {
         if (showToastIfEmpty) {
             wx.showToast({ title: '暂无历史预约记录', icon: 'none' });
         }
         this.setData({ reservationHistory: [] }); // Ensure data is empty array
         return; // Stop processing
    }


    // Process and sort history for display
    const formattedHistory = history.map(item => {
        const timeDisplay = (item.startTime && item.endTime) ? `${item.startTime} - ${item.endTime}` : '时间未定';
        const roomDisplay = item.roomName || '房间未知';
        const seatDisplay = (typeof item.seatIndex === 'number') ? `座位 ${item.seatIndex + 1}` : '座位未知';
        const dateDisplay = item.date || '日期未知';
        let bookingTimeDisplay = '预订时间未知';
        if (item.bookingTimestamp) {
            try {
                 bookingTimeDisplay = new Date(item.bookingTimestamp).toLocaleString('zh-CN', {
                     year: 'numeric', month: '2-digit', day: '2-digit',
                     hour: '2-digit', minute: '2-digit'
                 });
            } catch (e) { bookingTimeDisplay = item.bookingTimestamp; }
        }

        // Return a new object including original data plus display fields
        return {
            ...item, // Keep all original data fields
            displayTime: timeDisplay,
            displayRoom: roomDisplay,
            displaySeat: seatDisplay,
            displayDate: dateDisplay,
            displayBookingTime: bookingTimeDisplay,
        };
    }).sort((a, b) => {
        // Sort by booking timestamp descending (most recent first)
        const timeA = a.bookingTimestamp ? new Date(a.bookingTimestamp).getTime() : 0;
        const timeB = b.bookingTimestamp ? new Date(b.bookingTimestamp).getTime() : 0;
        return timeB - timeA; // Descending order
    });

    this.setData({
      reservationHistory: formattedHistory // Update data with processed history
    });
  },

  // 页面卸载时清理计时器
  onUnload: function() {
    console.log("Page onUnload");
    if (this.data.countdownTimer) {
      console.log("Clearing countdown timer on unload.");
      clearInterval(this.data.countdownTimer);
      // 不需要 setData，页面即将销毁
    }
  },

  // 阻止蒙层下的页面滚动 (需要WXML配合catchtouchmove)
  preventTouchMove: function() {
    // 此函数为空，用于 WXML 中 catchtouchmove="preventTouchMove" 绑定，阻止事件冒泡
  }
});
