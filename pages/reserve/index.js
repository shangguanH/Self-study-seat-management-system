const { requestWithToken } = require('../../utils/request');

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

// 格式化时间
const formatTime = (date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};
const currentTime = formatTime(today);

// 根据自习室类型获取类型名称
function getRoomTypeName(type) {
  const typeNames = {
    0: '通用',
    1: '计算机学院',
    2: '物理学院'
  };
  return typeNames[type] || '未知类型';
}

// 时间戳转换函数
function formatTimestamp(timestamp) {
  if (!timestamp) return '未设置';
  
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

// 获取自习室详情和座位状态的函数
async function fetchRoomDetailsAndSeats(roomId) {
  try {
    console.log(`获取自习室ID: ${roomId}`);
    
    // 首先获取所有自习室列表
    return new Promise((resolve, reject) => {
      requestWithToken({
        url: '/api/v1.0/student/rooms',
        method: 'GET',
        success: (res) => {
          if (res.statusCode === 200) {
            console.log('自习室列表API响应成功');
            const rooms = res.data.rooms || [];
            
            // 从列表中找到当前自习室
            const roomDetails = rooms.find(room => 
              room.room_id && room.room_id.toString() === roomId.toString()
            );
            
            if (!roomDetails) {
              console.error(`在列表中未找到ID为"${roomId}"的自习室`);
              reject(new Error(`自习室ID"${roomId}"不存在`));
              return;
            }
            
            // 添加类型名称
            roomDetails.typeName = getRoomTypeName(roomDetails.type);
            
            // 格式化时间
            if (roomDetails.open_time) {
              roomDetails.formattedOpenTime = formatTimestamp(roomDetails.open_time);
            }
            if (roomDetails.close_time) {
              roomDetails.formattedCloseTime = formatTimestamp(roomDetails.close_time);
            }
            
            // 获取该自习室的座位状态
            requestWithToken({
              url: `/api/v1.0/student/rooms/${roomId}/seats`,
              method: 'GET',
              success: (seatsRes) => {
                if (seatsRes.statusCode === 200) {
                  console.log('座位数据API响应成功');
                  
                  // 确保seats是一个数组
                  const seats = seatsRes.data.seats || [];
                  
                  // 映射座位状态到前端需要的格式
                  const mappedSeats = seats.map((seat, index) => {
                    // 处理ordering_list，转换时间戳为可读格式
                    let orderingList = [];
                    if (Array.isArray(seat.ordering_list) && seat.ordering_list.length > 0) {
                      orderingList = seat.ordering_list.map(order => {
                        return {
                          ...order,
                          formattedStartTime: order.start_time ? formatTimestamp(order.start_time) : '未设置',
                          formattedEndTime: order.end_time ? formatTimestamp(order.end_time) : '未设置'
                        };
                      });
                    }
                    // console.log(seat.seat_id);
                    // console.log(seat.ordering_list);
                    
                    return {
                      id: seat.seat_id || index,
                      name: seat.name || `座位${index + 1}`,
                      status: seat.status === 0 ? 'available' : 
                              seat.status === 1 ? 'unavailable' : 
                              seat.status === 2 ? 'reserved' : 
                              seat.status === 3 ? 'userReserved' : 
                              seat.status === 4 ? 'temporarilyAway' : 'unknown',
                      has_socket: seat.has_socket || 0, // 0代表没有，1代表有
                      ordering_list: orderingList,
                      rawOrderingList: seat.ordering_list || [] // 保存原始数据
                    };
                  });
                  // 计算可用座位数（取API数据或根据座位列表计算）
                  const availableCount = roomDetails.available_seats !== undefined ? 
                                        roomDetails.available_seats : 
                                        mappedSeats.filter(s => s.status === 'available').length;
                  
                  // 确定总座位数
                  const totalSeats = roomDetails.total_seats || 
                                     roomDetails.capacity || 
                                     roomDetails.seat_number || 
                                     mappedSeats.length;
                  
                  const fullData = {
                    ...roomDetails,
                    seats: mappedSeats,
                    availableSeats: availableCount,
                    totalSeats: totalSeats
                  };
                  
                  console.log(`已获取自习室数据 ${roomDetails.name}`);
                  resolve(fullData);
                } else {
                  console.error('获取座位数据失败:', seatsRes.statusCode);
                  reject(new Error(`获取座位数据失败: ${seatsRes.statusCode}`));
                }
              },
              fail: (error) => {
                console.error('获取座位数据请求失败:', error);
                reject(new Error('获取座位数据网络错误'));
              }
            });
          } else {
            console.error('获取自习室列表失败:', res.statusCode);
            reject(new Error(`获取自习室列表失败: ${res.statusCode}`));
          }
        },
        fail: (error) => {
          console.error('获取自习室列表请求失败:', error);
          reject(new Error('获取自习室列表网络错误'));
        }
      });
    });
  } catch (error) {
    console.error(`获取自习室(ID:${roomId})数据失败:`, error);
    throw error;
  }
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
    userSeatId: null, // 当前用户在此自习室的座位ID
    userReservationDate: null,
    userReservationStartTime: null,
    userReservationEndTime: null,
    hasReservation: false, // 用户是否在任何自习室有预约？

    // --- 预约选择模态框状态 ---
    showReservationModal: false,
    selectedSeatIndex: null, // 通过模态框预订的座位索引
    selectedDate: currentDate,
    startTime: currentTime,
    endTime: currentTime,
    minDate: currentDate,
    maxDate: threeDaysLater,
    minStartTime: currentTime,
    endDateIsTomorrow: false, // 是否跨天预约
    
    // --- 最大预约时长 ---
    maxBookingHours: 4, // 默认为4小时，可以由API更新
    
    // --- 半小时间隔时间选择器 ---
    timeOptions: [
      "00:00", "00:30",
      "01:00", "01:30",
      "02:00", "02:30",
      "03:00", "03:30",
      "04:00", "04:30",
      "05:00", "05:30",
      "06:00", "06:30",
      "07:00", "07:30",
      "08:00", "08:30", 
      "09:00", "09:30", 
      "10:00", "10:30", 
      "11:00", "11:30", 
      "12:00", "12:30", 
      "13:00", "13:30", 
      "14:00", "14:30", 
      "15:00", "15:30", 
      "16:00", "16:30", 
      "17:00", "17:30", 
      "18:00", "18:30", 
      "19:00", "19:30", 
      "20:00", "20:30", 
      "21:00", "21:30", 
      "22:00", "22:30",
      "23:00", "23:30"
    ],
    startTimeIndex: 0,
    endTimeIndex: 1,
    endTimeSelectIndex: 0,
    availableEndTimeOptions: [], // 可选的结束时间选项
    availableEndTimeIndices: [], // 可选结束时间对应的原索引

    // --- 取消确认模态框状态 ---
    showCancelModal: false,
    cancelModalMessage: '',
    seatIndexToCancel: null, // 通过模态框取消的座位索引
    
    // --- 座位详情模态框状态 ---
    showSeatDetailModal: false,
    seatDetailInfo: null, // 显示座位详情信息
  },

  onLoad: function(options) {
    console.log('预约页面加载选项:', options);
    // 获取roomId和roomName
    const roomId = options.roomId ? options.roomId : null;
    const roomName = options.roomName ? decodeURIComponent(options.roomName) : null;
    
    // 获取可能存在的seat_id和autoOpenSeat标志
    const seatId = options.seatId || null;
    const autoOpenSeat = options.autoOpenSeat === 'true';
  
    if (!roomId) {
      console.error('错误: 缺少roomId参数!');
      this.setData({
        isLoading: false,
        errorMessage: '无法加载自习室信息：缺少自习室ID参数。'
      });
      wx.showToast({ title: '页面加载失败', icon: 'error', duration: 2500 });
      return;
    }
  
    // 设置初始状态
    this.setData({
      roomId: roomId,
      roomName: roomName || '',
      isLoading: true,
      errorMessage: '',
      selectedDate: currentDate,
      minDate: currentDate,     
      maxDate: threeDaysLater,
      minStartTime: currentTime,
      // 保存需要自动打开的座位ID
      autoOpenSeatId: seatId,
      autoOpenSeat: autoOpenSeat
    });
  
    // 初始化时间选择器索引
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentIndex = this.getTimeIndexByHourAndMinute(hours, minutes);
    
    this.setData({
      startTimeIndex: currentIndex,
      endTimeIndex: Math.min(currentIndex + 1, this.data.timeOptions.length - 1),
      startTime: this.data.timeOptions[currentIndex],
      endTime: this.data.timeOptions[Math.min(currentIndex + 1, this.data.timeOptions.length - 1)]
    });
    
    // 初始化可选结束时间
    this.updateAvailableEndTimes(currentIndex);
  
    // 根据roomId获取自习室详情和座位状态
    this.loadRoomData(roomId);

    // 获取最大预约时长的API调用
    requestWithToken({
      url: '/api/v1.0/admin/system',
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.max_booking_time) {
          this.setData({
            maxBookingHours: res.data.max_booking_time
          });
          // 更新可选结束时间，使用新的最大预约时长
          this.updateAvailableEndTimes(this.data.startTimeIndex);
        }
      }
    });
  },

  // --- 页面刷新 ---
  onPullDownRefresh: function() {
    console.log('下拉刷新触发');
    if (this.data.roomId) {
      this.loadRoomData(this.data.roomId);
    }
    wx.stopPullDownRefresh();
  },

  // --- 核心数据加载功能 ---
  loadRoomData: function(roomId) {
    this.setData({
      isLoading: true,
      errorMessage: ''
    });

    fetchRoomDetailsAndSeats(roomId)
    .then(fetchedData => {
      // 数据获取成功
      console.log("加载的自习室数据:", fetchedData);
      // 确保seats是一个数组
      let localSeats = fetchedData.seats || [];
      
      // 直接从座位数据中查找用户已预约的座位
        let userSeatIndex = null;
        let userSeatId = null;
        let userReservationStartTime = null;
        let userReservationEndTime = null;
        let userReservationDate = null;
        let hasReservation = false;

        // 查找用户预约的座位（status为userReserved）
        for (let i = 0; i < localSeats.length; i++) {
          if (localSeats[i].status === 'userReserved') {
            userSeatIndex = i;
            userSeatId = localSeats[i].id;
            hasReservation = true;
            
            // 尝试从ordering_list获取预约时间
            if (localSeats[i].ordering_list && localSeats[i].ordering_list.length > 0) {
              // 获取当前用户的预约（通常是第一个）
              const userOrder = localSeats[i].ordering_list[0];
              if (userOrder.formattedStartTime) {
                const startParts = userOrder.formattedStartTime.split(' ');
                if (startParts.length === 2) {
                  userReservationDate = startParts[0];
                  userReservationStartTime = startParts[1];
                }
              }
              if (userOrder.formattedEndTime) {
                const endParts = userOrder.formattedEndTime.split(' ');
                if (endParts.length === 2) {
                  userReservationEndTime = endParts[1];
                }
              }
            }
            break;
          }
        }

        this.setData({
          roomDetails: { // 存储静态详情
            room_id: fetchedData.room_id,
            name: fetchedData.room_name,
            location: fetchedData.location,
            status: fetchedData.status,
            type: fetchedData.type,
            typeName: fetchedData.typeName,
            available_seats: fetchedData.availableSeats,
            total_seats: fetchedData.totalSeats,
            open_time: fetchedData.open_time,
            close_time: fetchedData.close_time,
            formattedOpenTime: fetchedData.formattedOpenTime,
            formattedCloseTime: fetchedData.formattedCloseTime,
          },
          totalSeats: fetchedData.totalSeats,
          availableSeats: fetchedData.availableSeats,
          seats: localSeats,
          isLoading: false,
          errorMessage: '',
          totalSeats: fetchedData.totalSeats,
          availableSeats: fetchedData.availableSeats,
          seats: localSeats, // 设置最终的座位数组
          isLoading: false,
          errorMessage: '',
          // 设置特定于此自习室的用户预约详情
          hasReservation: hasReservation,
          userSeatIndex: userSeatIndex,
          userSeatId: userSeatId,
          userReservationDate: userReservationDate,
          userReservationStartTime: userReservationStartTime,
          userReservationEndTime: userReservationEndTime,
        });
        if (this.data.autoOpenSeat && this.data.autoOpenSeatId) {
          // 查找对应的座位索引
          const seatIndex = localSeats.findIndex(seat => 
            seat.id.toString() === this.data.autoOpenSeatId.toString()
          );
          
          if (seatIndex !== -1) {
            console.log(`自动打开座位 ID: ${this.data.autoOpenSeatId}, 索引: ${seatIndex}`);
            // 延迟一小段时间后打开座位详情，确保界面已经渲染完成
            setTimeout(() => {
              this.showSeatDetails(seatIndex, localSeats[seatIndex]);
            }, 300);
          } else {
            console.error(`未找到ID为${this.data.autoOpenSeatId}的座位`);
          }
        }
        
        console.log("加载和检查后设置的最终数据:", this.data);
      })
      .catch(error => {
        // 处理获取错误
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
    
    if (!seat) {
      console.error("点击了无效的座位索引:", seatIndex);
      return;
    }

    // 无论座位状态如何，显示座位详情
    this.showSeatDetails(seatIndex, seat);
  },
  
  // 获取时间索引的辅助方法
  getTimeIndexByHourAndMinute: function(hour, minute) {
    // 根据小时和分钟计算timeOptions中的索引
    const index = (hour) * 2 + (minute >= 30 ? 1 : 0);
    return Math.max(0, Math.min(index, this.data.timeOptions.length - 1));
  },
  
  // 根据开始时间更新可选结束时间
  updateAvailableEndTimes: function(startIndex) {
    const timeOptions = this.data.timeOptions;
    const startTimeStr = timeOptions[startIndex];
    const { maxBookingHours } = this.data;
    
    // 解析开始时间
    const [startHours, startMinutes] = startTimeStr.split(':').map(Number);
    
    // 找出所有有效的结束时间选项
    const validEndTimeOptions = [];
    const validEndTimeIndices = [];
    
    // 最多可预约的半小时时段数
    const maxSlots = maxBookingHours * 2;
    let slotsAdded = 0;
    let endDateIsTomorrow = false;
    
    // 首先添加当天的可能时间
    for (let i = startIndex + 1; i < timeOptions.length && slotsAdded < maxSlots; i++) {
      validEndTimeOptions.push(timeOptions[i]);
      validEndTimeIndices.push(i);
      slotsAdded++;
    }
    
    // 如果还可以添加更多时段且已经用完了当天所有选项，添加次日时间
    if (slotsAdded < maxSlots) {
      // 标记为跨天预约
      endDateIsTomorrow = true;
      
      // 从次日的第一个时间段开始添加
      for (let i = 0; i < timeOptions.length && slotsAdded < maxSlots; i++) {
        validEndTimeOptions.push(`${timeOptions[i]} (次日)`);
        validEndTimeIndices.push(i);
        slotsAdded++;
      }
    }
    
    // 如果当前选择的结束时间已不在有效范围内，重置为第一个有效选项
    const newEndTimeIndex = validEndTimeIndices[0] || (startIndex + 1);
    
    // 更新数据
    this.setData({
      availableEndTimeOptions: validEndTimeOptions,
      availableEndTimeIndices: validEndTimeIndices,
      endTimeIndex: newEndTimeIndex,
      endTime: timeOptions[newEndTimeIndex],
      endDateIsTomorrow: endDateIsTomorrow,
      endTimeSelectIndex: 0
    });
  },
  
  // 显示座位详情
  showSeatDetails: function(seatIndex, seat) {
    // 生成时间轴数据
    const timelineData = this.generateTimelineData(seat);
    
    // 准备座位详情信息
    const seatDetail = {
      index: seatIndex,
      id: seat.id,
      name: seat.name,
      status: seat.status,
      statusText: this.getSeatStatusText(seat.status),
      hasSocket: seat.has_socket === 1 ? '有' : '无',
      orderingList: seat.ordering_list || [],
      timelineData: timelineData
    };
    
    this.setData({
      seatDetailInfo: seatDetail,
      showSeatDetailModal: true
    });
  },
  
  // 生成时间轴数据
  generateTimelineData: function(seat) {
    // 创建时间轴数组 (8:00-22:30, 每半小时一格, 共29格)
    const timelineData = new Array(48).fill('available');
    
    // 如果有预约记录，更新时间轴
    if (seat.ordering_list && seat.ordering_list.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      seat.ordering_list.forEach(order => {
        // 跳过已取消的预约（booking_status === 4）
        if (order.booking_status === 4) return;
        
        // 解析订单开始和结束时间
        const startDateTime = order.formattedStartTime ? new Date(order.formattedStartTime.replace(' ', 'T')) : null;
        const endDateTime = order.formattedEndTime ? new Date(order.formattedEndTime.replace(' ', 'T')) : null;
        
        if (!startDateTime || !endDateTime) return;
        
        // 检查预约是否为今天
        const orderDate = new Date(startDateTime);
        orderDate.setHours(0, 0, 0, 0);
        
        if (orderDate.getTime() === today.getTime()) {
          // 转换为时间轴索引 (8:00为索引0)
          const startIndex = Math.max(0, (startDateTime.getHours()) * 2 + (startDateTime.getMinutes() >= 30 ? 1 : 0));
          const endIndex = Math.min(47, (endDateTime.getHours()) * 2 + (endDateTime.getMinutes() > 0 ? 1 : 0));
          
          // 更新时间轴状态
          for (let i = startIndex; i < endIndex; i++) {
            // 检查是否是用户自己的预约
            timelineData[i] = seat.status === 'userReserved' ? 'user-reserved' : 'reserved';
          }
        }
      });
    }
    
    return timelineData;
  },
  
  // 获取座位状态文本
  getSeatStatusText: function(status) {
    switch(status) {
      case 'available': return '可用';
      case 'unavailable': return '不可用';
      case 'reserved': return '已被预约';
      case 'userReserved': return '您已预约此座位';
      case 'temporarilyAway': return '暂时离开';
      default: return '未知状态';
    }
  },
  
  // 关闭座位详情模态框
  closeSeatDetailModal: function() {
    this.setData({
      showSeatDetailModal: false,
      seatDetailInfo: null
    });
  },
  
  // 从座位详情转到预约
  goToReserveFromDetail: function() {
    const { seatDetailInfo, hasReservation } = this.data;
    
    if (!seatDetailInfo || seatDetailInfo.status == 'unavailable') {
      wx.showToast({
        title: '此座位无法预约',
        icon: 'none'
      });
      return;
    }
    
    // 检查用户是否已有预约
    if (hasReservation) {
      wx.showToast({
        title: '您已有预约，无法再次预约',
        icon: 'none',
        duration: 2500
      });
      return;
    }
    
    // 初始化时间选择器索引
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentIndex = this.getTimeIndexByHourAndMinute(hours, minutes);
    
    // 关闭详情模态框，打开预约模态框
    this.setData({
      showSeatDetailModal: false,
      showReservationModal: true,
      selectedSeatIndex: seatDetailInfo.index,
      // 打开模态框时重置时间选择为默认值
      selectedDate: currentDate,
      startTimeIndex: currentIndex,
      startTime: this.data.timeOptions[currentIndex]
    });
    
    // 更新可选结束时间
    this.updateAvailableEndTimes(currentIndex);
  },
  
  // 从座位详情显示取消预约确认
  showCancelReservationFromDetail: function() {
    const { seatDetailInfo, userReservationDate, userReservationStartTime, userReservationEndTime } = this.data;
    if (!seatDetailInfo || seatDetailInfo.status !== 'userReserved') {
      return;
    }
    
    // 关闭座位详情模态框，打开取消确认模态框
    this.setData({
      showSeatDetailModal: false,
      showCancelModal: true,
      cancelModalMessage: `取消预约座位 ${seatDetailInfo.index + 1} (${userReservationDate} ${userReservationStartTime}-${userReservationEndTime}) 吗?`,
      seatIndexToCancel: seatDetailInfo.index
    });
  },

  // --- 预约选择模态框处理程序 ---
  bindDateChange: function(e) {
    this.setData({
      selectedDate: e.detail.value
    });
    
    // 如果是当天预约，检查当前时间并调整时间选择器
    if (e.detail.value === currentDate) {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const currentIndex = this.getTimeIndexByHourAndMinute(hours, minutes);
      
      this.setData({
        startTimeIndex: currentIndex,
        startTime: this.data.timeOptions[currentIndex]
      });
      
      // 更新可选结束时间
      this.updateAvailableEndTimes(currentIndex);
    }
  },

  bindStartTimeChange: function(e) {
    const index = parseInt(e.detail.value);
    const startTime = this.data.timeOptions[index];
    
    // 更新可选结束时间
    this.updateAvailableEndTimes(index);
    
    this.setData({
      startTimeIndex: index,
      startTime: startTime
    });
  },

  bindEndTimeChange: function(e) {
    const selectedIndex = parseInt(e.detail.value);
    const selectedOption = this.data.availableEndTimeOptions[selectedIndex];
    const endTimeIndex = this.data.availableEndTimeIndices[selectedIndex];
    
    // 检查是否是次日选项
    const endDateIsTomorrow = selectedOption.includes('(次日)');
    
    // 更新UI
    this.setData({
      endTimeIndex: endTimeIndex,
      endTime: this.data.timeOptions[endTimeIndex],
      endDateIsTomorrow: endDateIsTomorrow,
      endTimeSelectIndex: selectedIndex // 新增这行
    });
  },

  // 不确认关闭预约选择模态框 - 返回座位详情
  cancelReservationSelection: function() {
    const seatIndex = this.data.selectedSeatIndex;
    
    // 关闭预约模态框
    this.setData({
      showReservationModal: false
    });
    
    // 如果有有效的座位索引，重新打开座位详情
    if (seatIndex !== null && this.data.seats[seatIndex]) {
      const seat = this.data.seats[seatIndex];
      this.showSeatDetails(seatIndex, seat);
    }
  },

  // 将日期时间字符串转换为毫秒时间戳
  dateTimeToTimestamp: function(dateStr, timeStr, isNextDay = false) {
    // 创建日期对象
    const dateParts = dateStr.split('-').map(Number);
    const timeParts = timeStr.split(':').map(Number);
    
    const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], timeParts[0], timeParts[1], 0, 0);
    
    // 如果是次日，加上24小时
    if (isNextDay) {
      date.setDate(date.getDate() + 1);
    }
    
    return date.getTime();
  },

  // 从选择模态框确认预约
  confirmReservation: function() {
    const { selectedSeatIndex, selectedDate, timeOptions, startTimeIndex, endTimeIndex, seats, endDateIsTomorrow } = this.data;
    
    // 基本验证
    if (selectedSeatIndex === null || !selectedDate) {
      wx.showToast({ title: '请选择完整的预约信息', icon: 'none' });
      return;
    }
    
    const startTime = timeOptions[startTimeIndex];
    const endTime = timeOptions[endTimeIndex];
    
    const selectedSeat = seats[selectedSeatIndex];
    if (!selectedSeat || selectedSeat.status === 'unavailable' || selectedSeat.status === 'reserved') {
      wx.showToast({ title: '该座位已被预约或无效', icon: 'none' });
      this.setData({ 
        showReservationModal: false,
        showSeatDetailModal: false,
        selectedSeatIndex: null 
      });
      return;
    }
    
    // 转换为毫秒时间戳，考虑跨天情况
    const startTimestamp = this.dateTimeToTimestamp(selectedDate, startTime, false);
    const endTimestamp = this.dateTimeToTimestamp(selectedDate, endTime, endDateIsTomorrow);
    // console.log(startTime);
    // console.log(endTime);
    // console.log(startTimestamp);
    // console.log(endTimestamp);
    // 显示加载提示
    wx.showLoading({
      title: '提交预约中...',
      mask: true
    });
    
    // 调用预约API
    requestWithToken({
      url: '/api/v1.0/student/seats/book',
      method: 'POST',
      data: {
        seat_id: selectedSeat.id,
        start_time: startTimestamp,
        end_time: endTimestamp
      },
      success: (res) => {
        wx.hideLoading();
        
        if (res.statusCode === 200) {
          // 预约成功，刷新自习室数据
          wx.showToast({
            title: `座位 ${selectedSeatIndex + 1} 预约成功`,
            icon: 'success',
            duration: 2000
          });
          
          // 关闭所有模态框并刷新数据
          this.setData({
            showReservationModal: false,
            showSeatDetailModal: false,
            selectedSeatIndex: null,
            seatDetailInfo: null
          });
          
          // 重新加载自习室数据以获取最新的预约状态
          this.loadRoomData(this.data.roomId);
          
        } else if (res.statusCode === 403) {
          // 预约失败，显示错误信息
          console.error('预约API调用失败:', res.data);
          let errorMessage = '预约失败';
          if (res.data && res.data.message) {
            errorMessage = res.data.message;
          }
          wx.showToast({
            title: errorMessage,
            icon: 'none',
            duration: 2500
          });
        } else if(res.statusCode === 401){
          wx.showToast({
            title: `该自习室为专用自习室，您无法预约`,
            icon: 'none',
            duration: 2000
          });
        } else {
          // 其他错误
          console.error('预约API调用返回未知状态:', res.statusCode, res.data);
          wx.showToast({
            title: `预约失败 (${res.statusCode})`,
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: (error) => {
        wx.hideLoading();
        console.error('预约API请求失败:', error);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none',
          duration: 2000
        });
      }
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

  // 确认取消预约
  confirmCancellation: function() {
    const { userSeatId, seatIndexToCancel, seats } = this.data;
    
    if (seatIndexToCancel === null || userSeatId === null) {
      wx.showToast({
        title: '无法取消，未找到预约信息',
        icon: 'none'
      });
      return;
    }
    
    // 显示加载提示
    wx.showLoading({
      title: '取消预约中...',
      mask: true
    });
    
    // 调用取消预约API
    requestWithToken({
      url: '/api/v1.0/student/seats/cancel',
      method: 'POST',
      data: {
        seat_id: userSeatId
      },
      success: (res) => {
        wx.hideLoading();
        
        if (res.statusCode === 200) {
          // 取消成功
          wx.showToast({
            title: '预约已成功取消',
            icon: 'success',
            duration: 2000
          });
          
          // 关闭模态框并刷新数据
          this.setData({
            showCancelModal: false,
            cancelModalMessage: '',
            seatIndexToCancel: null
          });
          
          // 重新加载自习室数据以获取最新状态
          this.loadRoomData(this.data.roomId);
          
        } else {
          // 失败处理
          let errorMessage = '取消预约失败';
          if (res.data && res.data.message) {
            errorMessage = res.data.message;
          }
          
          wx.showToast({
            title: errorMessage,
            icon: 'none',
            duration: 2500
          });
        }
      },
      fail: (error) => {
        wx.hideLoading();
        console.error('取消预约请求失败:', error);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },
  
  // 取消取消预约操作
  cancelCancellationAction: function() {
    // 关闭取消确认模态框
    this.setData({
      showCancelModal: false,
      cancelModalMessage: '',
      seatIndexToCancel: null
    });
    
    // 重新打开座位详情
    const seatIndex = this.data.userSeatIndex;
    if (seatIndex !== null && this.data.seats[seatIndex]) {
      const seat = this.data.seats[seatIndex];
      this.showSeatDetails(seatIndex, seat);
    }
  }
});

