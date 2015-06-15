'use strict';

var webSocket = require('ws');

module.exports = {
  sendMessage: function (socket, type, data) {
    if(!type || !this.socket || this.socket.readyState !== webSocket.OPEN) return;
    var obj = {type: type};
    if(data) obj.data = data;
    this.socket.send(JSON.stringify(obj));
  }
};
