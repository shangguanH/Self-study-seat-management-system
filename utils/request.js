// utils/request.js
const { TEST_URL } = require('./config');
//封装请求
function requestWithToken({ url, method = 'GET', data = {}, success, fail }) {
  const token = wx.getStorageSync('token') || '';

  wx.request({
    url: TEST_URL + url,
    method,
    data,
    header: {
      'content-type': 'application/json',
      'Authorization': token
    },
    success,
    fail
  });
}

module.exports = { requestWithToken };
