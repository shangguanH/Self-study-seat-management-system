Page({
  data: {
    roomName: '', // 自习室名称
    totalSeats: 0, // 总座位数
    availableSeats: 0, // 可用座位数
    hasCharging: false, // 是否有充电插座
    isQuiet: false, // 是否为安静学习区
    seats: [], // 座位状态数组
    userSeatIndex: null, // 当前用户预约的座位索引
    showModal: false, // 是否显示预约弹窗
    modalMessage: '', // 弹窗显示的信息
  },

  onLoad: function(options) {
    // 从参数中获取自习室信息
    const { roomName, totalSeats, availableSeats, hasCharging, isQuiet } = options;
    
    // 初始化座位数组（默认每个座位都可以预约）
    const seats = Array.from({ length: totalSeats }, (_, index) => ({
      id: index,
      status: 'available', // 'available', 'reserved', 'userReserved'
    }));

    this.setData({
      roomName,
      totalSeats: parseInt(totalSeats),
      availableSeats: parseInt(availableSeats),
      hasCharging: hasCharging === 'true',
      isQuiet: isQuiet === 'true',
      seats: seats,
    });
  },

  // 点击座位事件
  onSeatClick: function(e) {
    const seatIndex = e.currentTarget.dataset.index;
    const seat = this.data.seats[seatIndex];
    const { userSeatIndex } = this.data;

    if (seat.status === 'available') {
      // 如果没有预约座位，则可以预约
      if (userSeatIndex === null) {
        console.log(seatIndex);
        console.log(userSeatIndex);
        this.setData({
          showModal: true,
          modalMessage: `是否预约座位 ${seatIndex + 1}?`,
          userSeatIndex: seatIndex,
        });
      } else {
        console.log(1);
        // 如果已经预约了座位，弹出提示
        this.setData({
          showModal: true,
          modalMessage: `你已经预约了座位 ${userSeatIndex + 1}，要取消原先的预约并预约座位 ${seatIndex + 1} 吗?`,
          userSeatIndex: seatIndex,
        });
      }
    } else if (seat.status === 'userReserved') {
      // 如果点击的是当前用户预约的座位，弹出取消预约提示
      this.setData({
        showModal: true,
        modalMessage: `是否取消预约座位 ${seatIndex + 1}?`,
        userSeatIndex: seatIndex,
      });
    }
  },

  // 关闭弹窗
  closeModal: function() {
    this.setData({
      showModal: false,
      modalMessage: '',
      userSeatIndex: null,
    });
  },

  // 确定预约/取消预约
  confirmAction: function() {
    const { userSeatIndex, seats } = this.data;
    const newSeats = [...seats];

    if (newSeats[userSeatIndex].status === 'available') {
      newSeats[userSeatIndex].status = 'userReserved';
    } else if (newSeats[userSeatIndex].status === 'userReserved') {
      newSeats[userSeatIndex].status = 'available';
    }

    this.setData({
      seats: newSeats,
      showModal: false,
      modalMessage: '',
      userSeatIndex: null,
    });
  },

  // 取消预约
  cancelAction: function() {
    this.closeModal();
  },
});
