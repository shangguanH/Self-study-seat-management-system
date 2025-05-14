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

const formatTime = (date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
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

// 将日期时间字符串转换为毫秒时间戳
function dateTimeToTimestamp(dateStr, timeStr) {
  // 格式: YYYY-MM-DD HH:MM
  const fullTimeStr = `${dateStr} ${timeStr}:00`;
  return new Date(fullTimeStr).getTime();
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
            name: fetchedData.name,
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
  
  // 显示座位详情
  showSeatDetails: function(seatIndex, seat) {
    // 准备座位详情信息
    const seatDetail = {
      index: seatIndex,
      id: seat.id,
      name: seat.name,
      status: seat.status,
      statusText: this.getSeatStatusText(seat.status),
      hasSocket: seat.has_socket === 1 ? '有' : '无',
      orderingList: seat.ordering_list || []
    };
    
    this.setData({
      seatDetailInfo: seatDetail,
      showSeatDetailModal: true
    });
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
    
    if (!seatDetailInfo || seatDetailInfo.status !== 'available') {
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
    
    // 关闭详情模态框，打开预约模态框
    this.setData({
      showSeatDetailModal: false,
      showReservationModal: true,
      selectedSeatIndex: seatDetailInfo.index,
      // 打开模态框时重置时间选择为默认值
      selectedDate: currentDate,
      startTime: currentTime,
      endTime: currentTime,
    });
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

  // 从选择模态框确认预约
  confirmReservation: function() {
    const { selectedSeatIndex, selectedDate, startTime, endTime, seats } = this.data;

    // 基本验证
    if (selectedSeatIndex === null || !selectedDate || !startTime || !endTime) {
        wx.showToast({ title: '请选择完整的预约信息', icon: 'none' });
        return;
    }
    if (startTime >= endTime) {
        wx.showToast({ title: '结束时间必须晚于开始时间', icon: 'none' });
        return;
    }

    const selectedSeat = seats[selectedSeatIndex];
    if (!selectedSeat || selectedSeat.status !== 'available') {
         wx.showToast({ title: '该座位已被预约或无效', icon: 'none' });
         this.setData({ 
           showReservationModal: false,
           showSeatDetailModal: false,
           selectedSeatIndex: null 
         });
         return;
    }

    // 转换为毫秒时间戳
    const startTimestamp = dateTimeToTimestamp(selectedDate, startTime);
    const endTimestamp = dateTimeToTimestamp(selectedDate, endTime);

    // 显示加载提示
    wx.showLoading({
      title: '预约中...',
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
        }else if(res.statusCode === 401){
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
    const { seatIndexToCancel, seats, userSeatId } = this.data;
    if (seatIndexToCancel === null || !userSeatId) return;

    const seat = seats[seatIndexToCancel];
    if (!seat || seat.status !== 'userReserved') {
      wx.showToast({ 
        title: '无法取消：座位状态已改变', 
        icon: 'none' 
      });
      this.closeCancelModal();
      return;
    }

    // 显示加载提示
    wx.showLoading({
      title: '取消预约中...',
      mask: true
    });

    // 调用取消预约API
    requestWithToken({
      url: `/api/v1.0/student/seats/${userSeatId}/release`,
      method: 'POST',
      success: (res) => {
        wx.hideLoading();
        
        if (res.statusCode === 200) {
          // 取消成功
          wx.showToast({
            title: '预约已取消',
            icon: 'success',
            duration: 2000
          });
          
          // 关闭所有模态框并刷新数据
          this.setData({
            showCancelModal: false,
            showSeatDetailModal: false,
            cancelModalMessage: '',
            seatIndexToCancel: null,
            seatDetailInfo: null
          });
          
          // 重新加载自习室数据以获取最新的座位状态
          this.loadRoomData(this.data.roomId);
          
        } else {
          // 取消失败
          console.error('取消预约API调用失败:', res.statusCode, res.data);
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
        console.error('取消预约API请求失败:', error);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 取消取消操作（关闭模态框并返回座位详情）
  cancelCancellationAction: function() {
    const seatIndex = this.data.seatIndexToCancel;
    
    // 关闭取消模态框
    this.setData({
      showCancelModal: false,
      cancelModalMessage: '',
      seatIndexToCancel: null
    });
    
    // 如果有有效座位索引，重新打开座位详情
    if (seatIndex !== null && this.data.seats[seatIndex]) {
      const seat = this.data.seats[seatIndex];
      this.showSeatDetails(seatIndex, seat);
    }
  },
});
