const { requestWithToken } = require('../../utils/request');
Page({
  data: {
    roomId: '',
    seats: [],
    showSeatModal: false,
    isEditMode: false,
    showBatchModal: false,
    batchForm: {
      prefix: '',
      count: 0
    },

    statuTypes: [
      { id: 0, name: '可用' },
      { id: 1, name: '不可用' },
      { id: 2, name: '占用中' },
      { id: 3, name: '暂离'  }
    ],

    seatForm: {
      seat_name: '',
      has_socket: 0,
    },
  },

  onLoad:function(options) {
    // 判断是否传递了 roomId 参数
    if (options.roomid) {
      this.setData({roomId: options.roomid});
      this.loadSeatsByRoomId(options.roomid);
    } 
  },

  // 加载特定自习室的座位数据
  loadSeatsByRoomId:function(roomId) {
    requestWithToken({
      url: `/api/v1.0/admin/rooms/${roomId}/seats`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({ seats: res.data.seats });
          console.log(res.data.seats);
        } else {
          wx.showToast({ title: '加载座位失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '加载座位失败', icon: 'none' });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  // 关闭弹窗
  onCloseModal() {
    this.setData({
      showSeatModal: false,
      isEditMode: false
    });
  },

  // 编辑座位
  onEditSeat(e) {
    const seatId = e.currentTarget.dataset.id;
    const seat = this.data.seats.find(s => s.seat_id === seatId);
    if (!seat) return;
    console.log(seat);
    this.setData({
      isEditMode: true,
      showSeatModal: true,
      seatForm: {
        seat_name: seat.seat_name,
        has_socket: seat.has_socket,
        status: seat.status,
        seat_id: seat.seat_id,
      }
    });
  },
// 处理类型选择变化
onStatusChange: function(e) {
  const statusIndex = e.detail.value;
  this.setData({
    'seatForm.status': statusIndex
  });
},
  // 删除座位
  onDeleteSeat() {
    const { seatForm, roomId } = this.data;
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除座位 ${seatForm.seat_name} 吗？`,
      success: (res) => {
        if (res.confirm) {
          requestWithToken({
            url: `/api/v1.0/admin/seats/${seatForm.seat_id}`,
            method: 'DELETE',
            success: (res) => {
              console.log(res);
              if (res.statusCode === 200) {
                wx.showToast({ title: '删除成功', icon: 'success' });
                this.setData({ showSeatModal: false });
                this.loadSeatsByRoomId(roomId);
              } else {
                wx.showToast({ title: '删除失败', icon: 'none' });
              }
            },
            fail: () => {
              wx.showToast({ title: '请求失败', icon: 'none' });
            }
          });
        }
      }
    });
  },

  // 添加新座位
  onAddSeat() {
    this.setData({
      isEditMode: false,
      showSeatModal: true,
      seatForm: {
        seat_name: '',
        has_socket: 0,
      }
    });
  },
  
  onAddSeatConfirm() {
    const { roomId, seatForm } = this.data;
    if (!seatForm.seat_name) {
      wx.showToast({ title: '请输入座位name', icon: 'none' });
      return;
    }
  
    requestWithToken({
      url: `/api/v1.0/admin/seats`,
      method: 'POST',
      data: {
        room_id: roomId,
        seat_name: seatForm.seat_name,
        has_socket: seatForm.has_socket ? 1 : 0,
      },
      success: (res) => {
        if (res.statusCode === 201) {
          wx.showToast({ title: '添加成功', icon: 'success' });
          this.setData({ showSeatModal: false });
          this.loadSeatsByRoomId(roomId);
        } else {
          wx.showToast({ title: '添加失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '请求失败', icon: 'none' });
      }
    });
  },
  
  onUpdateSeat() {
    const { roomId, seatForm } = this.data;
    requestWithToken({
      url: `/api/v1.0/admin/seats/${seatForm.seat_id}`,
      method: 'PATCH',
      data: {
        has_socket: seatForm.has_socket ? 1 : 0,
       seat_name: seatForm.seat_name,
       status: seatForm.status 
      },
      success: (res) => {
        if (res.statusCode === 200) {
          wx.showToast({ title: '修改成功', icon: 'success' });
          this.setData({ showSeatModal: false });
          this.loadSeatsByRoomId(roomId);
        } else {
          wx.showToast({ title: '修改失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '请求失败', icon: 'none' });
      }
    });
  },
  
  // 表单输入处理
  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`seatForm.${field}`]: e.detail.value
    });
  },
  
  onSwitchChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`seatForm.${field}`]: e.detail.value
    });
  },
  onConfirmSeat() {
    if (this.data.isEditMode) {
      this.onUpdateSeat();
    } else {
      this.onAddSeatConfirm();
    }
  },
  onAddManySeat() {
    this.setData({
      showBatchModal: true,
      batchForm: { prefix: '', count: 0 }
    });
  },

  // 输入更新
  onBatchInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`batchForm.${field}`]: value
    });
  },

  // 关闭弹窗
  onCloseBatchModal() {
    this.setData({
      showBatchModal: false
    });
  },

  // 确认一键添加
onConfirmBatchAdd() {
  const { roomId} = this.data;
  const { prefix, count } = this.data.batchForm;
  if (!prefix || !count || parseInt(count) <= 0) {
    wx.showToast({ title: '请输入有效的前缀和数量', icon: 'none' });
    return;
  }
  for(let i = 1;i <= parseInt(count); i++) {
    console.log(roomId);
    requestWithToken({
      url: `/api/v1.0/admin/seats`,
      method: 'POST',
      data: {
        room_id: roomId,
        seat_name: prefix + i,
        has_socket: 0,
      },
      success: (res) => {
        if (res.statusCode === 201) {
          wx.showToast({ title: '添加成功', icon: 'success' });
        } else {
          wx.showToast({ title: '添加失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '请求失败', icon: 'none' });
      }
    });
    this.setData({ showBatchModal: false });
    this.loadSeatsByRoomId(roomId);
  }

  }
});