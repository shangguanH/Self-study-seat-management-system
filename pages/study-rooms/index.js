Page({
  data: {
    studyRooms: [], // 自习室列表
    showModal: false, // 是否显示新增自习室弹窗
    showRoomDetails: false, // 是否显示自习室详情弹窗
    roomTypes: ['通用', '院系'], // 自习室类型选项
    statusOptions: ['开放', '关闭'], // 状态选项
    timeOptions: [], // 时间选项
    selectedRoomType: '', // 选中的自习室类型
    roomName: '', // 自习室名字
    seatCount: '', // 座位个数
    startTime: '', // 开始时间
    endTime: '', // 结束时间
    startTimeText: '', // 开始时间文本
    endTimeText: '', // 结束时间文本
    currentStatus: '', // 当前状态
    currentRoom: null, // 当前选中的自习室
    editRoomType: '', // 编辑时的自习室类型
    editStartTime: '', // 编辑时的开始时间
    editEndTime: '', // 编辑时的结束时间
    editStatus: '', // 编辑时的状态
    editSeatCount: '', // 编辑时的座位个数
    editRoomName: '' // 编辑时的自习室名字
  },

  onLoad: function() {
    this.loadStudyRooms();
    this.generateTimeOptions();
  },

  loadStudyRooms: function() {
    // 模拟从服务器获取自习室列表
    const studyRooms = [
      { 
        id: 1, 
        name: '自习室A', 
        type: '通用', 
        seatCount: 50, 
        startTime: '07:00', 
        endTime: '21:00', 
        status: '开放' 
      },
      { 
        id: 2, 
        name: '自习室B', 
        type: '院系', 
        seatCount: 30, 
        startTime: '08:00', 
        endTime: '22:00', 
        status: '关闭' 
      },
      // 更多自习室数据...
    ];
    this.setData({ studyRooms });
  },

  generateTimeOptions: function() {
    const timeOptions = [];
    for (let hour = 0; hour < 24; hour++) {
      timeOptions.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 23) {
        timeOptions.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    this.setData({ timeOptions });
  },

  onAddStudyRoom: function() {
    this.setData({
      showModal: true,
      roomName: '',
      seatCount: '',
      selectedRoomType: '',
      startTime: '',
      endTime: '',
      startTimeText: '',
      endTimeText: '',
      currentStatus: ''
    });
  },

  onInputRoomName: function(e) {
    this.setData({
      roomName: e.detail.value
    });
  },

  onRoomTypeChange: function(e) {
    this.setData({
      selectedRoomType: this.data.roomTypes[e.detail.value]
    });
  },

  onInputSeatCount: function(e) {
    this.setData({
      seatCount: e.detail.value
    });
  },

  onStartTimeChange: function(e) {
    const startTime = this.data.timeOptions[e.detail.value];
    this.setData({
      startTime: startTime,
      startTimeText: startTime
    });
  },

  onEndTimeChange: function(e) {
    const endTime = this.data.timeOptions[e.detail.value];
    this.setData({
      endTime: endTime,
      endTimeText: endTime
    });
  },

  onStatusChange: function(e) {
    this.setData({
      currentStatus: this.data.statusOptions[e.detail.value]
    });
  },

  onSaveStudyRoom: function() {
    if (!this.data.roomName || !this.data.seatCount || !this.data.selectedRoomType) {
      wx.showToast({
        title: '请填写所有字段',
        icon: 'none'
      });
      return;
    }

    const newRoom = {
      id: this.data.studyRooms.length + 1,
      name: this.data.roomName,
      type: this.data.selectedRoomType,
      seatCount: parseInt(this.data.seatCount),
      startTime: this.data.startTime,
      endTime: this.data.endTime,
      status: this.data.currentStatus || '开放'
    };

    this.setData({
      studyRooms: [...this.data.studyRooms, newRoom],
      showModal: false
    });

    wx.showToast({
      title: '自习室添加成功',
      icon: 'success'
    });
  },

  onCancel: function() {
    this.setData({
      showModal: false
    });
  },

  onViewRoomDetails: function(e) {
    const roomId = e.currentTarget.dataset.id;
    const room = this.data.studyRooms.find(r => r.id === roomId);
    this.setData({
      showRoomDetails: true,
      currentRoom: room,
      editRoomName: room.name,
      editRoomType: room.type,
      editStartTime: room.startTime,
      editEndTime: room.endTime,
      editStatus: room.status,
      editSeatCount: room.seatCount.toString()
    });
  },

  onCloseDetails: function() {
    this.setData({
      showRoomDetails: false,
      currentRoom: null
    });
  },

  onEditRoomName: function(e) {
    this.setData({
      editRoomName: e.detail.value
    });
  },

  onEditRoomTypeChange: function(e) {
    this.setData({
      editRoomType: this.data.roomTypes[e.detail.value]
    });
  },

  onEditSeatCount: function(e) {
    this.setData({
      editSeatCount: e.detail.value
    });
  },

  onEditStartTimeChange: function(e) {
    const startTime = this.data.timeOptions[e.detail.value];
    this.setData({
      editStartTime: startTime
    });
  },

  onEditEndTimeChange: function(e) {
    const endTime = this.data.timeOptions[e.detail.value];
    this.setData({
      editEndTime: endTime
    });
  },

  onEditStatusChange: function(e) {
    this.setData({
      editStatus: this.data.statusOptions[e.detail.value]
    });
  },

  onUpdateRoom: function() {
    if (!this.data.editRoomName || !this.data.editSeatCount || !this.data.editRoomType) {
      wx.showToast({
        title: '请填写所有字段',
        icon: 'none'
      });
      return;
    }

    const updatedRooms = this.data.studyRooms.map(room => {
      if (room.id === this.data.currentRoom.id) {
        return {
          ...room,
          name: this.data.editRoomName,
          type: this.data.editRoomType,
          seatCount: parseInt(this.data.editSeatCount),
          startTime: this.data.editStartTime,
          endTime: this.data.editEndTime,
          status: this.data.editStatus
        };
      }
      return room;
    });

    this.setData({
      studyRooms: updatedRooms,
      showRoomDetails: false,
      currentRoom: null
    });

    wx.showToast({
      title: '自习室修改成功',
      icon: 'success'
    });
  },

  onManageSeats: function() {
    const roomId = this.data.currentRoom.id;
    // 确保目标页面存在
    wx.navigateTo({
      // url: '/pages/seats-management/index?id=' + roomId
      url: '/pages/seats-management/index'
    });
  },

  onDeleteRoom: function() {
    wx.showModal({
      title: '确认删除',
      content: '是否确认删除该自习室？',
      success: (res) => {
        if (res.confirm) {
          const updatedStudyRooms = this.data.studyRooms.filter(room => room.id !== this.data.currentRoom.id);
          this.setData({
            studyRooms: updatedStudyRooms,
            showRoomDetails: false,
            currentRoom: null
          });
          wx.showToast({
            title: '自习室删除成功',
            icon: 'success'
          });
        }
      }
    });
  }

  
});