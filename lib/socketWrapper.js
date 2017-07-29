'use strict';

var util = require('./util');

var createReply = function (ws) {
  return function (type, data) {
    return util.sendMessage(ws, type, data);
  };
};

var repo = {};
var registry = {};
var SocketWrapper = function (ws, request) {
  this._socket = ws;
  if(request && request.url) {
    this.id = util.getIdFromUrl(request.url);
  }
  this.sendMessage = createReply(ws);
  if(!registry[this.id]) {
    registry[this.id] = {};
  }
  SocketWrapper.add(this);
};

SocketWrapper.get = function (id) {
  return repo[id];
};

SocketWrapper.add = function (wrapper) {
  repo[wrapper.id] = wrapper;
};

SocketWrapper.delete = function (id) {
  delete repo[id];
};

SocketWrapper.broadcast = function (type, data) {
  for(var id in repo) {
    repo[id].sendMessage(type, data);
  }
};

SocketWrapper.prototype.on = function () {
  this._socket.on.apply(this._socket, arguments);
  return this;
};

SocketWrapper.prototype.get = function (key) {
  if(registry[this.id]){
    return registry[this.id][key];
  }
  return;
};

SocketWrapper.prototype.set = function (key, value) {
  if(registry[this.id]){
    registry[this.id][key] = value;
  }
};

SocketWrapper.prototype.clearAll = function () {
  registry[this.id] = {};
};

module.exports = SocketWrapper;

