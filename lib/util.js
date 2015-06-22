'use strict';

var webSocket = require('ws');

module.exports = {
  sendMessage: function (socket, type, data) {
    if(!type || !socket || socket.readyState !== webSocket.OPEN) return;
    var obj = {type: type};
    if(data) obj.data = data;
    socket.send(JSON.stringify(obj));
  },
  getIdFromUrl: function (url) {
    var matched = url.match(/\?window_id=([^&])/);
    return matched && matched[1];
  }
};
