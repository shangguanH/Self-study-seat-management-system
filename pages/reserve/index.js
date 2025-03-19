Page({
  data: {
    roomName: '',      // 自习室名称
    totalSeats: 0,     // 总座位数
    availableSeats: 0, // 空闲座位数
    reservedSeats: 0,  // 用户已预约座位数量（最多为1）
    hasCharging: false,// 是否有充电插座
    isQuiet: false,    // 是否安静区域
    seats: [],         // 座位分布图（二维数组）
    userHasReserved: false, // 用户是否已经预定了座位（限制一次只能预定1个）
    rows: 5,           // 默认行数
    cols: 5            // 默认列数
  },
  
  onLoad: function(options) {
    // 获取从上一个页面传递过来的自习室信息
    const rows = options.rows ? parseInt(options.rows) : 5;
    const cols = options.cols ? parseInt(options.cols) : 5;
    
    this.setData({
      roomName: options.roomName || '默认自习室',
      totalSeats: parseInt(options.totalSeats || rows * cols),
      availableSeats: parseInt(options.availableSeats || rows * cols - 2), // 默认减去两个预定座位
      hasCharging: options.hasCharging === 'true',
      isQuiet: options.isQuiet === 'true',
      userHasReserved: false,
      rows: rows,
      cols: cols
    });
    
    // 初始化座位布局
    this.initializeSeats();
  },
  
  // 初始化座位布局：全部座位默认均为空闲（available）
  initializeSeats: function() {
    let { rows, cols } = this.data;
    let seats = [];
    
    for (let i = 0; i < rows; i++) {
      let row = [];
      for (let j = 0; j < cols; j++) {
        row.push({
          status: 'available', // 'available' | 'reserved' | 'user_reserved'
          row: i,
          col: j
        });
      }
      seats.push(row);
    }
    
    // 模拟部分座位已被其他人预约（状态为 reserved）
    if (rows > 1 && cols > 1) {
      seats[1][1].status = 'reserved'; // 第二行第二列
    }
    
    if (rows > 2 && cols > 3) {
      seats[2][3].status = 'reserved'; // 第三行第四列
    }
    
    this.setData({
      seats: seats
    });
  },
  
  // 获取座位图标类名
  getSeatClass: function(status) {
    if (status === 'reserved') {
      return 'seat-reserved';  // 红色：已被预约
    } else if (status === 'user_reserved') {
      return 'seat-user-reserved';  // 蓝色：我的预约
    } else {
      return 'seat-available';  // 绿色：空闲可预约
    }
  },
  
  // 获取座位图标
  getSeatIcon: function(status) {
    if (status === 'reserved') {
      return '🔒';  // 已被预约 - 锁图标
    } else if (status === 'user_reserved') {
      return '👤';  // 我的预约 - 人物图标
    } else {
      return '';  // 空闲可预约
    }
  },
  
  // 点击座位处理函数：根据当前状态进行预约或取消预约
  seatTap: function(e) {
    const { row, col } = e.currentTarget.dataset;
    let seats = this.data.seats;
    let seat = seats[row][col];
    
    if (seat.status === 'available') {
      // 如果该座位空闲，先判断用户是否已预定其他座位
      if (this.data.userHasReserved) {
        wx.showToast({
          title: '您已经预定了一个座位',
          icon: 'none',
        });
        return;
      }
      
      // 弹出对话框询问用户是否确认预约
      wx.showModal({
        title: '预约确认',
        content: `您确定要预约第${row + 1}行第${col + 1}列的座位吗？`,
        success: (res) => {
          if (res.confirm) {
            // 用户确认预约
            seat.status = 'user_reserved';
            this.setData({
              seats: seats,
              userHasReserved: true,
              reservedSeats: 1,
              availableSeats: this.data.availableSeats - 1
            });
            
            wx.showToast({
              title: '预约成功',
              icon: 'success',
            });
          }
        }
      });
    } else if (seat.status === 'user_reserved') {
      // 如果点击的是自己预定的座位，则取消预约
      wx.showModal({
        title: '取消预约',
        content: '确定要取消预约此座位吗？',
        success: (res) => {
          if (res.confirm) {
            seat.status = 'available';
            this.setData({
              seats: seats,
              userHasReserved: false,
              reservedSeats: 0,
              availableSeats: this.data.availableSeats + 1
            });
            
            wx.showToast({
              title: '取消预约成功',
              icon: 'success',
            });
          }
        }
      });
    } else if (seat.status === 'reserved') {
      wx.showToast({
        title: '该座位已被预约',
        icon: 'none',
      });
    }
  },
  
  // 查看当前预定信息
  viewReservedSeats: function() {
    // 找到用户预约的座位
    let userSeat = null;
    
    for (let i = 0; i < this.data.seats.length; i++) {
      for (let j = 0; j < this.data.seats[i].length; j++) {
        if (this.data.seats[i][j].status === 'user_reserved') {
          userSeat = {row: i, col: j};
          break;
        }
      }
      if (userSeat) break;
    }
    
    if (this.data.userHasReserved && userSeat) {
      wx.showModal({
        title: '预约信息',
        content: `您已预定${this.data.roomName}自习室第${userSeat.row + 1}行第${userSeat.col + 1}列的座位`,
        showCancel: false
      });
    } else {
      wx.showToast({
        title: '您还没有预定座位',
        icon: 'none'
      });
    }
  }
});