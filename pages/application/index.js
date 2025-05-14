const { requestWithToken } = require('../../utils/request');
Page({
  data: {
    minSeatCount: '', // 最小座位数筛选值
    selectedType: -1, // 选择的自习室类型 (-1表示全部)
    typeOptions: [
      { id: -1, name: '全部类型' },
      { id: 0, name: '通用' },
      { id: 1, name: '计算机学院' },
      { id: 2, name: '物理学院' }
    ],
    rooms: [], // 自习室数据
    filteredRooms: [], // 筛选后的自习室列表
  },

  onLoad: function() {
    // 获取自习室数据
    this.fetchRooms();
  },

  // 获取自习室数据
  fetchRooms: function() {
    this.setData({ loading: true });
    
    requestWithToken({
      url: '/api/v1.0/student/rooms',
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) {
          console.log(res.data.rooms);
          const rooms = res.data.rooms || [];
          
          // 计算可用座位数并格式化时间
          rooms.forEach(room => {
            room.availableSeats = parseInt(room.seat_number);
            room.totalSeats = parseInt(room.capacity);
            
            // 将时间戳转换为可读时间格式
            if (room.open_time) {
              room.formattedOpenTime = this.formatTime(room.open_time);
            }
            if (room.close_time) {
              room.formattedCloseTime = this.formatTime(room.close_time);
            }
          });
          
          this.setData({
            rooms: rooms,
            filteredRooms: rooms,
            loading: false
          });
        } else {
          console.log(res.statusCode);
          this.handleError('加载失败');
        }
      },
      fail: () => this.handleError('网络错误')
    });
  },

  // 格式化时间戳为可读时间
  formatTime: function(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  handleError: function(message) {
    this.setData({ loading: false });
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    });
  },

  // 处理可用座位数筛选
  onSeatCountChange: function(e) {
    const minSeatCount = e.detail.value;
    this.setData({ minSeatCount }, this.filterRooms);
  },

  // 处理自习室类型筛选
  onTypeChange: function(e) {
    const selectedType = parseInt(e.detail.value);
    this.setData({ selectedType }, this.filterRooms);
  },

  // 筛选自习室
  filterRooms: function() {
    let filteredRooms = this.data.rooms;

    // 根据最小可用座位数进行筛选
    if (this.data.minSeatCount) {
      filteredRooms = filteredRooms.filter(room => room.availableSeats >= this.data.minSeatCount);
    }

    // 根据自习室类型进行筛选
    if (this.data.selectedType !== 0) {
      console.log(this.data.selectedType);
      filteredRooms = filteredRooms.filter(room => room.type === this.data.selectedType - 1);
    }

    // 更新筛选后的自习室列表
    this.setData({
      filteredRooms
    });
  },

  // 点击自习室跳转到预约页面
  onRoomClick: function(e) {
    const roomIndex = e.currentTarget.dataset.index;
    const selectedRoom = this.data.filteredRooms[roomIndex];
    const url = `/pages/reserve/index?roomId=${selectedRoom.room_id}`;
    console.log("跳转的 URL: ", url);  // 输出跳转的 URL，调试时查看
    wx.navigateTo({
      url: url,
    });
  }
});
