Page({
  data: {
    minSeatCount: '', // 最小座位数筛选值
    isCharging: false, // 是否带充电插座
    isQuiet: false, // 是否为安静学习区
    rooms: [ // 假设的自习室数据
      { name: '自习室A', availableSeats: 5, totalSeats: 10, hasCharging: true, isQuiet: true },
      { name: '自习室B', availableSeats: 0, totalSeats: 10, hasCharging: false, isQuiet: false },
      { name: '自习室C', availableSeats: 8, totalSeats: 10, hasCharging: true, isQuiet: true },
      { name: '自习室D', availableSeats: 2, totalSeats: 10, hasCharging: false, isQuiet: true },
      { name: '自习室E', availableSeats: 3, totalSeats: 10, hasCharging: true, isQuiet: false },
    ],
    filteredRooms: [], // 筛选后的自习室列表
  },

  onLoad: function() {
    // 初始化时显示所有自习室
    this.setData({
      filteredRooms: this.data.rooms
    });
  },

  // 处理可用座位数筛选
  onSeatCountChange: function(e) {
    const minSeatCount = e.detail.value;
    this.setData({ minSeatCount }, this.filterRooms);
  },

  // 处理带充电插座和安静学习区筛选
  onAmenitiesChange: function(e) {
    const values = e.detail.value;
    this.setData({
      isCharging: values.includes('charging'),
      isQuiet: values.includes('quiet')
    }, this.filterRooms);
  },

  // 筛选自习室
  filterRooms: function() {
    let filteredRooms = this.data.rooms;

    // 根据最小可用座位数进行筛选
    if (this.data.minSeatCount) {
      filteredRooms = filteredRooms.filter(room => room.availableSeats >= this.data.minSeatCount);
    }

    // 根据是否带充电插座进行筛选
    if (this.data.isCharging) {
      filteredRooms = filteredRooms.filter(room => room.hasCharging);
    }

    // 根据是否为安静学习区进行筛选
    if (this.data.isQuiet) {
      filteredRooms = filteredRooms.filter(room => room.isQuiet);
    }

    // 更新筛选后的自习室列表
    this.setData({
      filteredRooms
    });
  }
});
