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
    // 这里应该是从API获取数据，暂时使用模拟数据
    const rooms = [
      { 
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
      { 
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
      { 
        room_id: 3, 
        name: '自习室C', 
        location: '教学楼三楼', 
        status: 1, 
        type: 2, // 物理学院
        seat_number: '30', 
        capacity: '30',
        open_time: 9, 
        close_time: 21
      },
      // 可以添加更多自习室数据...
    ];
    
    // 计算可用座位数
    rooms.forEach(room => {
      room.availableSeats = parseInt(room.seat_number);
      room.totalSeats = parseInt(room.capacity);
    });
    
    this.setData({
      rooms: rooms,
      filteredRooms: rooms
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
    if (this.data.selectedType !== -1) {
      filteredRooms = filteredRooms.filter(room => room.type === this.data.selectedType);
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
    const url = `/pages/reserve/index?roomId=${selectedRoom.room_id}&roomName=${selectedRoom.name}`;
    console.log("跳转的 URL: ", url);  // 输出跳转的 URL，调试时查看
    wx.navigateTo({
      url: url,
    });
  }
});
