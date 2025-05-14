// /pages/reserve/index.js

// Get today's date in YYYY-MM-DD format
const today = new Date();
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const currentDate = formatDate(today);

const getDateAfterDays = (days) => {
  const today = new Date();
  // 创建一个新日期对象，将当前日期加上指定的天数
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + days);
  
  // 格式化日期
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  return formatDate(futureDate);
};
// 获取三天后的日期
const threeDaysLater = getDateAfterDays(3);

const formatTime = (date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};
const currentTime = formatTime(today);

// --- Data Simulation ---
// 在真实应用中，这些数据将来自后端API调用
const allRoomsData = {
  1: { 
    room_id: 1, 
    name: '自习室A', 
    location: '图书馆一楼', 
    status: 1, 
    type: 0, // 通用
    seat_number: '50', 
    capacity: '50',
    open_time: 8, 
    close_time: 22
  },
  2: { 
    room_id: 2, 
    name: '自习室B', 
    location: '图书馆二楼', 
    status: 1, 
    type: 1, // 计算机学院
    seat_number: '40', 
    capacity: '40',
    open_time: 8, 
    close_time: 22
  },
  3: { 
    room_id: 3, 
    name: '自习室C', 
    location: '教学楼三楼', 
    status: 1, 
    type: 2, // 物理学院
    seat_number: '30', 
    capacity: '30',
    open_time: 9, 
    close_time: 21
  }
};

// 模拟根据ID获取自习室详情和座位状态
function fetchRoomDetailsAndSeats(roomId) {
  return new Promise((resolve, reject) => {
    console.log(`模拟获取自习室ID: ${roomId}`);
    const roomDetails = allRoomsData[roomId];

    if (!roomDetails) {
      console.error(`在模拟数据中未找到ID为"${roomId}"的自习室数据。`);
      setTimeout(() => reject(new Error(`自习室ID"${roomId}"不存在`)), 100); // 模拟延迟
      return;
    }

    // 模拟初始座位状态（实际应用中替换为真实API调用）
    const totalSeats = parseInt(roomDetails.capacity);
    const seats = Array.from({ length: totalSeats }, (_, index) => {
      // 简单模拟：将一些座位标记为被他人预约
      const isReservedByOther = Math.random() < 0.3; // 30%的几率被他人预约
      return {
        id: index,
        status: isReservedByOther ? 'reserved' : 'available', // 'available', 'reserved', 'userReserved'
      };
    });

    // 计算可用座位数（不包括用户可能的预约）
    const availableCount = seats.filter(s => s.status === 'available').length;

    const fullData = {
      ...roomDetails,
      seats: seats,
      availableSeats: availableCount // 计算可用座位数
    };

    console.log(`已模拟获取自习室数据 ${roomDetails.name}:`, fullData);
    // 模拟网络延迟
    setTimeout(() => resolve(fullData), 400); // 模拟400ms延迟
  });
}
// --- 模拟数据结束 ---

// 根据自习室类型获取类型名称
function getRoomTypeName(type) {
  const typeNames = {
    0: '通用',
    1: '计算机学院',
    2: '物理学院'
  };
  return typeNames[type] || '未知类型';
}

Page({
  data: {
    roomId: '', // 从URL参数获取
    roomName: '', // 从URL参数获取
    roomDetails: null, // 存储获取的详情
    totalSeats: 0, // 从获取的数据派生
    availableSeats: 0, // 从获取的数据派生
    seats: [], // 座位状态数组，在获取数据后填充

    // --- 加载和错误状态 ---
    isLoading: true,
    errorMessage: '',

    // --- 用户当前预约信息 ---
    userSeatIndex: null, // 当前用户在此自习室的确认座位索引
    userReservationDate: null,
    userReservationStartTime: null,
    userReservationEndTime: null,
    hasReservation: false, // 用户是否在任何自习室有预约？

    // --- 预约选择模态框状态 ---
    showReservationModal: false,
    selectedSeatIndex: null, // 通过模态框预订的座位索引
    selectedDate: currentDate,
    startTime: '09:00',
    endTime: '10:00',
    minDate: currentDate,
    maxDate: threeDaysLater,
    minStartTime: currentTime,

    // --- 取消确认模态框状态 ---
    showCancelModal: false,
    cancelModalMessage: '',
    seatIndexToCancel: null, // 通过模态框取消的座位索引
  },

  onLoad: function(options) {
    console.log('预约页面加载选项:', options);
    // 1. 获取roomId和roomName（主要标识符）
    const roomId = options.roomId ? options.roomId : null;
    const roomName = options.roomName ? decodeURIComponent(options.roomName) : null;

    if (!roomId) {
      console.error('错误: 缺少roomId参数!');
      this.setData({
        isLoading: false,
        errorMessage: '无法加载自习室信息：缺少自习室ID参数。'
      });
      wx.showToast({ title: '页面加载失败', icon: 'error', duration: 2500 });
      return;
    }

    // 2. 设置初始状态（加载中和已知的roomId和roomName）
    this.setData({
      roomId: roomId,
      roomName: roomName || '',
      isLoading: true,
      errorMessage: '',
      selectedDate: currentDate, // 确保默认值已设置
      minDate: currentDate,     
      maxDate: threeDaysLater,
      minStartTime: currentTime,
    });

    // 3. 根据roomId获取自习室详情和座位状态
    this.loadRoomData(roomId);
  },

  // --- 核心数据加载功能 ---
  loadRoomData: function(roomId) {
    fetchRoomDetailsAndSeats(roomId)
      .then(fetchedData => {
        // 4. 数据获取成功
        let localSeats = fetchedData.seats; // 获取的初始座位（可用/已预约）
        let currentUserReservation = wx.getStorageSync('userReservation');
        let userSeatIndex = null;
        let userReservationDate = null;
        let userReservationStartTime = null;
        let userReservationEndTime = null;
        let hasReservationInThisRoom = false; // 存储的预约是否为此自习室？

        // 5. 检查存储的预约是否属于此自习室
        if (currentUserReservation && currentUserReservation.roomId == roomId && currentUserReservation.seatIndex !== undefined) {
          console.log(`用户在此自习室(${roomId})有预约，座位索引: ${currentUserReservation.seatIndex}`);
          userSeatIndex = currentUserReservation.seatIndex;
          userReservationDate = currentUserReservation.date;
          userReservationStartTime = currentUserReservation.startTime;
          userReservationEndTime = currentUserReservation.endTime;
          hasReservationInThisRoom = true;

          // 在localSeats数组中标记用户的座位
          if (localSeats[userSeatIndex]) {
            localSeats[userSeatIndex].status = 'userReserved';
          } else {
            console.warn("存储的userSeatIndex超出了获取的座位范围:", userSeatIndex);
            // 这表示不一致，可能需要清除存储？
            wx.removeStorageSync('userReservation');
            hasReservationInThisRoom = false;
            userSeatIndex = null; // 重置索引
          }
        } else if (currentUserReservation && currentUserReservation.roomId != roomId) {
            console.log(`用户在另一个自习室有预约: ID=${currentUserReservation.roomId}, 名称=${currentUserReservation.roomName}`);
            // 全局保持hasReservation为true，但对此自习室为false
        }

        // 获取自习室类型名称
        const typeName = getRoomTypeName(fetchedData.type);

        // 6. 使用获取和处理的信息更新页面数据
        this.setData({
          roomDetails: { // 存储静态详情
            room_id: fetchedData.room_id,
            name: fetchedData.name,
            location: fetchedData.location,
            status: fetchedData.status,
            type: fetchedData.type,
            typeName: typeName,
            seat_number: fetchedData.seat_number,
            capacity: fetchedData.capacity,
            open_time: fetchedData.open_time,
            close_time: fetchedData.close_time,
          },
          totalSeats: parseInt(fetchedData.capacity),
          availableSeats: fetchedData.availableSeats, // 使用计算的可用数量
          seats: localSeats, // 设置最终的座位数组
          isLoading: false,
          errorMessage: '',
          // 设置特定于此自习室的用户预约详情
          hasReservation: !!currentUserReservation, // 全局检查：用户是否有任何预约？
          userSeatIndex: hasReservationInThisRoom ? userSeatIndex : null,
          userReservationDate: hasReservationInThisRoom ? userReservationDate : null,
          userReservationStartTime: hasReservationInThisRoom ? userReservationStartTime : null,
          userReservationEndTime: hasReservationInThisRoom ? userReservationEndTime : null,
        });
        console.log("加载和检查后设置的最终数据:", this.data);

      })
      .catch(error => {
        // 7. 处理获取错误
        console.error('加载自习室数据失败:', error);
        this.setData({
          isLoading: false,
          errorMessage: `加载自习室ID "${roomId}" 信息失败：${error.message}`
        });
        wx.showToast({ title: '数据加载失败', icon: 'none' });
      });
  },

  // --- 点击座位事件 ---
  onSeatClick: function(e) {
    if (this.data.isLoading) return; // 加载时不处理点击

    const seatIndex = e.currentTarget.dataset.index;
    const seat = this.data.seats[seatIndex];
    const currentUserReservation = wx.getStorageSync('userReservation'); // 再次检查全局预约状态

    if (!seat) {
      console.error("点击了无效的座位索引:", seatIndex);
      return;
    }

    if (seat.status === 'available') {
      // --- 情况1: 座位可用 ---
      if (currentUserReservation) {
        // 如果用户已经在任何地方有预约，阻止再次预约
        let roomTypeName = '';
        if (currentUserReservation.roomType !== undefined) {
          roomTypeName = getRoomTypeName(currentUserReservation.roomType);
        }
        
        wx.showToast({
          title: `您已在 ${currentUserReservation.roomName} (${roomTypeName}) 预约了座位 ${currentUserReservation.seatIndex + 1} (${currentUserReservation.date} ${currentUserReservation.startTime}-${currentUserReservation.endTime})`,
          icon: 'none',
          duration: 3500, // 更长时间
        });
      } else {
        // 没有当前预约，打开预约详情模态框
        this.setData({
          showReservationModal: true,
          selectedSeatIndex: seatIndex,
          // 打开模态框时重置时间选择为默认值
          selectedDate: currentDate,
          startTime: '09:00',
          endTime: '10:00',
        });
      }
    } else if (seat.status === 'userReserved') {
      // --- 情况2: 点击了此自习室中自己预约的座位 ---
       if (this.data.userSeatIndex === seatIndex) { // 再次检查它是否是正确的用户座位
            this.setData({
                showCancelModal: true,
                cancelModalMessage: `取消预约座位 ${seatIndex + 1} (${this.data.userReservationDate} ${this.data.userReservationStartTime}-${this.data.userReservationEndTime}) 吗?`,
                seatIndexToCancel: seatIndex
            });
       } else {
            // 如果逻辑正确，应该不会发生，但安全检查
            console.warn("点击了userReserved座位，但索引与存储的userSeatIndex不匹配。");
             wx.showToast({ title: `您已预约此座位`, icon: 'none' });
       }

    } else if (seat.status === 'reserved') {
        // --- 情况3: 点击了他人预约的座位 ---
         wx.showToast({
          title: `座位 ${seatIndex + 1} 已被他人预约`,
          icon: 'none',
          duration: 2000,
        });
    }
  },

  // --- 预约选择模态框处理程序 ---
  bindDateChange: function(e) {
    this.setData({
      selectedDate: e.detail.value
    });
  },

  bindStartTimeChange: function(e) {
    this.setData({
      startTime: e.detail.value
    });
  },

  bindEndTimeChange: function(e) {
    this.setData({
      endTime: e.detail.value
    });
  },

  // 不确认关闭预约选择模态框
  cancelReservationSelection: function() {
    this.setData({
      showReservationModal: false,
      selectedSeatIndex: null, // 清除选定的座位索引
    });
  },

  // 从选择模态框确认预约
  confirmReservation: function() {
    const { roomId, roomDetails, selectedSeatIndex, selectedDate, startTime, endTime, seats } = this.data;

    // 基本验证
    if (selectedSeatIndex === null || !selectedDate || !startTime || !endTime) {
        wx.showToast({ title: '请选择完整的预约信息', icon: 'none' });
        return;
    }
    if (startTime >= endTime) {
        wx.showToast({ title: '结束时间必须晚于开始时间', icon: 'none' });
        return;
    }

    // --- 假设验证通过 ---
    const newSeats = [...seats];
    if (!newSeats[selectedSeatIndex] || newSeats[selectedSeatIndex].status !== 'available') {
         wx.showToast({ title: '该座位已被预约或无效', icon: 'none' });
         this.setData({ showReservationModal: false, selectedSeatIndex: null });
         return;
    }

    newSeats[selectedSeatIndex].status = 'userReserved';

    // --- 准备当前预约和历史的详情 ---
    const reservationDetails = {
        roomId: roomId,
        roomName: roomDetails.name,
        roomType: roomDetails.type,
        seatIndex: selectedSeatIndex,
        date: selectedDate,
        startTime: startTime,
        endTime: endTime,
        bookingTimestamp: new Date().toISOString(), // 添加预约时间戳
        isSignedIn: false, // 新预约的默认状态
        isTemporarilyAway: false, // 默认状态
    };

    // --- 1. 存储当前预约详情 ---
    wx.setStorageSync('userReservation', reservationDetails);

    // --- 2. 添加到预约历史 ---
    try {
        let history = wx.getStorageSync('reservationHistory') || [];
        if (!Array.isArray(history)) {
            console.warn("存储中的预约历史不是数组。重置。");
            history = [];
        }
        history.push(reservationDetails);
        wx.setStorageSync('reservationHistory', history);
        console.log('预约已添加到历史:', reservationDetails);
        console.log('更新后的历史长度:', history.length);

    } catch (e) {
        console.error("更新预约历史失败:", e);
    }
    // --- 历史更新结束 ---

    // 更新页面数据
    this.setData({
      seats: newSeats,
      hasReservation: true, // 现在用户全局有预约
      userSeatIndex: selectedSeatIndex, // 预约在此自习室
      userReservationDate: selectedDate,
      userReservationStartTime: startTime,
      userReservationEndTime: endTime,
      showReservationModal: false, // 关闭选择模态框
      selectedSeatIndex: null,    // 清除临时选择索引
      // 根据计算更新可用座位数
      availableSeats: newSeats.filter(s => s.status === 'available').length,
    });

    wx.showToast({
        title: `座位 ${selectedSeatIndex + 1} 预约成功`,
        icon: 'success',
        duration: 2000
    });
  },

  // --- 取消确认模态框处理程序 ---

  // 关闭取消确认模态框
  closeCancelModal: function() {
      this.setData({
          showCancelModal: false,
          cancelModalMessage: '',
          seatIndexToCancel: null,
      });
  },

  // 确认取消
  confirmCancellation: function() {
      const { seatIndexToCancel, seats } = this.data;
       if (seatIndexToCancel === null) return; // 不应该发生

      const newSeats = [...seats];

      // 只允许取消用户预约的座位
      if (newSeats[seatIndexToCancel] && newSeats[seatIndexToCancel].status === 'userReserved') {
        newSeats[seatIndexToCancel].status = 'available';

        // 从本地存储中移除当前预约
        wx.removeStorageSync('userReservation');
        console.log("用户预约已从存储中删除。");

        // 更新页面数据
        this.setData({
            seats: newSeats,
            hasReservation: false, // 用户不再有活动预约
            userSeatIndex: null,
            userReservationDate: null,
            userReservationStartTime: null,
            userReservationEndTime: null,
            showCancelModal: false, // 关闭取消模态框
            cancelModalMessage: '',
            seatIndexToCancel: null,
            // 更新可用座位数
            availableSeats: newSeats.filter(s => s.status === 'available').length,
        });

         wx.showToast({
            title: '预约已取消',
            icon: 'success',
            duration: 2000
        });

      } else {
          console.error("尝试取消一个不是'userReserved'或不存在的座位。");
          wx.showToast({ title: '取消失败，状态异常', icon: 'none'});
          this.closeCancelModal(); // 无论如何关闭模态框
      }
  },

  // 取消取消操作（只关闭模态框）
  cancelCancellationAction: function() {
    this.closeCancelModal();
  },
});
