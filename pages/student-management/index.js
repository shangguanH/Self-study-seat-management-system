const { requestWithToken } = require('../../utils/request');
//可以更直接显示其座位的状态，在详情里展示其预约的学生列表
Page({
  data: {
    students: [],
    showModal: false,
    selectedStudent: null
  },

  onLoad: function () {
    this.loadStudents();
  },

  loadStudents: function () {
    requestWithToken({
      url: '/api/v1.0/admin/students',
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({ students: res.data.students });
        } else {
          wx.showToast({ title: '加载失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  onViewStudent: function (e) {
    const student = e.currentTarget.dataset.student;
    this.setData({
      selectedStudent: {
        ...student,
        typeName: this.mapType(student.type)
      },
      showModal: true
    });
  },

  onCloseModal: function () {
    this.setData({
      showModal: false,
      selectedStudent: null
    });
  },
  mapStatus: function (status) {
    const map = {
      0: '可用',
      1: '不可用',
      2: '已预约',
      3: '本人预约',
      4: '暂离'
    };
    return map[status] || '未知';
  },
  mapType: function (typeId) {
    const map = {
      0: '计算机学院',
      1: '物理学院',
      2: '电子信息学院'
    };
    return map[typeId] || '未知';
  }
});
