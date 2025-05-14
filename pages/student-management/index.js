const { requestWithToken } = require('../../utils/request');

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

  mapType: function (typeId) {
    const map = {
      0: '计算机学院',
      1: '物理学院',
      2: '电子信息学院'
    };
    return map[typeId] || '未知';
  }
});
