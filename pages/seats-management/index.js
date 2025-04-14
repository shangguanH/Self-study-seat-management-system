Page({
  data: {
    roomId: '',
    seats: [],
    showSeatDetails: false,
    selectedSeat: null,
    showEditModal: false,
    editMode: false,
    editSeatData: {
      id: '',
      status: 'available',
      hasOutlet: false,
      maxReservationTime: 60,
      statusIndex: 0
    },
    statusOptions: ['可用', '不可用']
  },

  onLoad(options) {
    // 判断是否传递了 roomId 参数
    if (options.id) {
      this.setData({
        roomId: options.id
      });
      this.loadSeatsByRoomId(options.id);
    } else {
      // 如果没有传递 roomId，则加载所有座位
      this.loadAllSeats();
    }
  },

  // 加载所有座位数据
  loadAllSeats() {
    // 使用预定义的座位数据
    const mockSeats = [
      {
        id: 'A1',
        roomId: 'room1',
        status: 'available',
        hasOutlet: true,
        maxReservationTime: 120,
        reservationStatus: '已预约'
      },
      {
        id: 'A2',
        roomId: 'room1',
        status: 'unavailable',
        hasOutlet: false,
        maxReservationTime: 60,
        reservationStatus: null
      },
      {
        id: 'B1',
        roomId: 'room2',
        status: 'available',
        hasOutlet: true,
        maxReservationTime: 90,
        reservationStatus: null
      },
      {
        id: 'B2',
        roomId: 'room2',
        status: 'available',
        hasOutlet: false,
        maxReservationTime: 120,
        reservationStatus: '已预约'
      }
    ];

    // 将预定义的座位数据设置到页面
    this.setData({
      seats: mockSeats
    });
  },

  // 加载特定自习室的座位数据
  loadSeatsByRoomId(roomId) {
    const db = wx.cloud.database();
    db.collection('seats')
      .where({
        roomId: roomId
      })
      .get()
      .then(res => {
        this.setData({
          seats: res.data
        });
      })
      .catch(err => {
        console.error('查询座位失败', err);
        wx.showToast({
          title: '加载座位失败',
          icon: 'none'
        });
      });
  },

  // 查看座位详情
  onViewSeatDetails(e) {
    const seatId = e.currentTarget.dataset.id;
    const seat = this.data.seats.find(item => item.id === seatId);
    if (seat) {
      this.setData({
        showSeatDetails: true,
        selectedSeat: seat
      });
    } else {
      wx.showToast({
        title: '座位信息不存在',
        icon: 'none'
      });
    }
  },

  // 关闭弹窗
  onCloseModal() {
    this.setData({
      showSeatDetails: false,
      showEditModal: false
    });
  },

  // 编辑座位
  onEditSeat() {
    const { selectedSeat } = this.data;
    this.setData({
      showSeatDetails: false,
      showEditModal: true,
      editMode: true,
      editSeatData: {
        id: selectedSeat.id,
        status: selectedSeat.status,
        hasOutlet: selectedSeat.hasOutlet,
        maxReservationTime: selectedSeat.maxReservationTime,
        statusIndex: selectedSeat.status === 'available' ? 0 : 1
      }
    });
  },

  // 删除座位
  onDeleteSeat() {
    const { selectedSeat } = this.data;
    wx.showModal({
      title: '确认删除',
      content: `确定要删除座位 ${selectedSeat.id} 吗？`,
      success: (res) => {
        if (res.confirm) {
          const newSeats = this.data.seats.filter(item => item.id !== selectedSeat.id);
          this.setData({
            seats: newSeats,
            showSeatDetails: false
          });
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 添加新座位
  onAddSeat() {
    this.setData({
      showEditModal: true,
      editMode: false,
      editSeatData: {
        id: '',
        status: 'available',
        hasOutlet: false,
        maxReservationTime: 60,
        statusIndex: 0
      }
    });
  },

  // 保存座位信息
  onSaveSeat() {
    const { editMode, editSeatData } = this.data;
    const { id, status, hasOutlet, maxReservationTime } = editSeatData;

    if (!id) {
      wx.showToast({
        title: '请输入座位ID',
        icon: 'none'
      });
      return;
    }

    if (!maxReservationTime) {
      wx.showToast({
        title: '请输入最长预约时间',
        icon: 'none'
      });
      return;
    }

    if (!editMode && this.data.seats.some(item => item.id === id)) {
      wx.showToast({
        title: '座位ID已存在',
        icon: 'none'
      });
      return;
    }

    let newSeats = [...this.data.seats];
    if (editMode) {
      // 编辑现有座位
      const index = newSeats.findIndex(item => item.id === id);
      if (index !== -1) {
        newSeats[index] = {
          ...newSeats[index],
          status,
          hasOutlet,
          maxReservationTime
        };
      }
    } else {
      // 添加新座位
      newSeats.push({
        id,
        status,
        hasOutlet,
        maxReservationTime,
        reservationStatus: null
      });
    }

    this.setData({
      seats: newSeats,
      showEditModal: false
    });

    wx.showToast({
      title: editMode ? '修改成功' : '添加成功',
      icon: 'success'
    });
  },

  // 表单输入处理
  onInputId(e) {
    this.setData({
      'editSeatData.id': e.detail.value
    });
  },

  onStatusChange(e) {
    const index = e.detail.value;
    this.setData({
      'editSeatData.statusIndex': index,
      'editSeatData.status': index === 0 ? 'available' : 'unavailable'
    });
  },

  onOutletChange(e) {
    this.setData({
      'editSeatData.hasOutlet': e.detail.value
    });
  },

  onTimeChange(e) {
    this.setData({
      'editSeatData.maxReservationTime': e.detail.value
    });
  }
});