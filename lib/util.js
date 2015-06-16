'use strict';

var webSocket = require('ws');

module.exports = {
  sendMessage: function (socket, type, data) {
    if(!type || !socket || socket.readyState !== webSocket.OPEN) return;
    var obj = {type: type};
    if(data) obj.data = data;
    socket.send(JSON.stringify(obj));
  }
};
