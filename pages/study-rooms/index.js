const { TEST_URL } = require('../../utils/config');
const { requestWithToken } = require('../../utils/request');

//时间戳和字符串之间的转换
function timeStrToTimestamp(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date(); // 用今天的日期填充
  now.setHours(hours, minutes, 0, 0);
  return now.getTime(); // 返回时间戳（毫秒）
}

function timestampToTimeStr(timestamp) {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}


Page({
  data: {
    // 自习室列表（保持与API完全一致的结构）
    studyRooms: [],
    
    // UI控制状态
    showModal: false,
    isEditMode: false,
    loading: true,
    
    // 表单选项数据
    roomTypes: [
      { id: 0, name: '通用' },
      { id: 1, name: '计算机学院' },
      { id: 2, name: '物理学院' }
    ],
    statusOptions: [
      { id: 1, name: '开放' },
      { id: 0, name: '关闭' }
    ],
    timeOptions: [],
    
    // 新增自习室表单数据
    currentRoom: {
      name: '',
      location: '',
      type: 0,        // 默认通用类型
      status: 1,      // 默认开放
      seat_number: '',
      capacity: '',
      open_time: '08:00',  // 默认开放时间
      close_time: '22:00'  // 默认关闭时间
    },
  },

  onLoad: function() {
    this.loadStudyRooms();
    this.generateTimeOptions();
  },

  // 生成时间选择器选项
  generateTimeOptions: function() {
    const options = [];
    for (let h = 0; h < 24; h++) {
      const hour = h.toString().padStart(2, '0');
      options.push(`${hour}:00`);
      options.push(`${hour}:30`);
    }
    this.setData({ timeOptions: options });
  },
  // 从API加载自习室数据
  loadStudyRooms: function() {
    this.setData({ loading: true });
  
    requestWithToken({
      url: '/api/v1.0/admin/rooms',
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({
            studyRooms: res.data.rooms || [],
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

  // 错误处理
  handleError: function(msg) {
    this.setData({ loading: false });
    wx.showToast({ title: msg, icon: 'none' });
  },

// 处理类型选择变化
onTypeChange: function(e) {
  const typeIndex = e.detail.value;
  this.setData({
    'currentRoom.type': typeIndex
  });
},


// 处理时间选择变化
onTimeChange: function(e) {
  const { field, room } = e.currentTarget.dataset;
  const time = this.data.timeOptions[e.detail.value];
  this.setData({[`currentRoom.${field}`]: time});
},

// 处理状态选择变化
onStatusChange: function(e) {
  const { room } = e.currentTarget.dataset;
  const statusIndex = e.detail.value;
  this.setData({'currentRoom.status': statusIndex});
},

// 关闭详情弹窗
onCloseDetails: function() {
  this.setData({
    showRoomDetails: false
  });
},

  // 打开新增自习室弹窗
  onAddStudyRoom: function() {
    this.setData({
      showModal: true,
      isEditMode: false,
      currentRoom: {
        name: '',
        location: '',
        type: 0,
        status: 1,
        capacity: '',
        open_time: '08:00',
        close_time: '22:00'
      }
    });
  },
  
  // 查看详情
  onViewRoomDetails(e) {
    const roomId = e.currentTarget.dataset.id;
    const room = this.data.studyRooms.find(r => r.room_id === roomId);
    
    const transformedRoom = {
      ...room,
      open_time: timestampToTimeStr(room.open_timestamp),
      close_time: timestampToTimeStr(room.close_timestamp)
    };

    this.setData({
      showModal: true,
      isEditMode: true,
      currentRoom: transformedRoom // 深拷贝避免直接修改原数据
    });
  },

  // 处理表单输入
  onInputChange: function(e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      this.setData({
        [`${parent}.${child}`]: value
      });
    } else {
      this.setData({
        [field]: value
      });
    }
  },

  onSaveStudyRoom: function() {
    const { currentRoom } = this.data;
    
    if (!currentRoom.name || !currentRoom.location || !currentRoom.capacity) {
      wx.showToast({
        title: '请填写所有字段',
        icon: 'none'
      });
      return;
    }

    // 转换为数字类型
    const payload = {
      ...currentRoom,
      capacity: parseInt(currentRoom.capacity),
      type: currentRoom.type,
      status: currentRoom.status,
      open_time: timeStrToTimestamp(currentRoom.open_time),
      close_time: timeStrToTimestamp(currentRoom.close_time)
    };
    console.log(payload);
    requestWithToken({
      url: '/api/v1.0/admin/rooms',
      method: 'POST',
      data: payload,
      success: (res) => {
        if (res.statusCode === 201) {
          wx.showToast({ title: '添加成功' });
          this.loadStudyRooms();
          this.setData({ showModal: false });
        } else {
          this.handleError('添加失败');
          console.log(res);
        }
      },
      fail: () => this.handleError('网络错误')
    });
  },

  onCancel: function() {
    this.setData({
      showModal: false
    });
  },

  onUpdateRoom: function() {
    const { currentRoom } = this.data;
    const payload = {
      ...currentRoom,
      capacity: parseInt(currentRoom.capacity),
      type: parseInt(currentRoom.type),
      status: parseInt(currentRoom.status),
      open_time: timeStrToTimestamp(currentRoom.open_time),
      close_time: timeStrToTimestamp(currentRoom.close_time)
    };
    requestWithToken({
      url:`/api/v1.0/admin/rooms/${currentRoom.room_id}`,
      method: 'PATCH',
      data: payload,
      success: (res) => {
        if (res.statusCode === 200) {
          wx.showToast({ title: '更新成功' });
          this.loadStudyRooms();
          this.setData({ showRoomDetails: false });
        } else {
          this.handleError('更新失败');
        }
      },
      fail: () => this.handleError('网络错误')
    });
  },

  onManageSeats: function() {
    const roomId = this.data.currentRoom.id;
    // 确保目标页面存在
    wx.navigateTo({
      url: '/pages/seats-management/index?roomid=' + roomId
      // url: '/pages/seats-management/index'
    });
  },

  // 删除自习室
  onDeleteRoom: function() {
    const { currentRoom } = this.data;
    wx.showModal({
      title: '确认删除',
      content: `确定删除自习室 ${currentRoom.name} 吗？`,
      success: (res) => {
        if (res.confirm) {
          requestWithToken({
            url: `/api/v1.0/admin/rooms/${currentRoom.room_id}`,
            method: 'DELETE',
            success: (res) => {
              if (res.statusCode === 200) {
                wx.showToast({ title: '删除成功' });
                this.loadStudyRooms();
                this.setData({ showRoomDetails: false });
              } else {
                this.handleError('删除失败');
              }
            },
            fail: () => this.handleError('网络错误')
          });
        }
      }
    });
  }
});