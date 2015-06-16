'use strict';

var EventEmitter = require('events').EventEmitter;
var proc = require('child_process');
var electron = require('electron-prebuilt');
var webSocket = require('ws');
var _ = require('lodash');
var util = require('./util');

var createReply = function (ws) {
  return function (type, data) {
    //return util.sendMessage(this.ws, type, data);
    if(!type || ws.readyState !== webSocket.OPEN) return;
    var obj = {type: type};
    if(data) obj.data = data;
    ws.send(JSON.stringify(obj));
  };
};

var ProcessManager = function () {};
ProcessManager.prototype = new EventEmitter();
ProcessManager.prototype.init = function (opt) {
  this.opt = opt;
  this.sessions = [];
  return this;
};

ProcessManager.prototype.start = function (cb) {
  this.electronProc = proc.spawn(this.opt.electron, [this.opt.path], {stdio: 'inherit'});
  this.wss = new webSocket.Server({ port: this.opt.port}, function () {
    this.registerHandler();
    if(typeof cb === 'function') {
      cb();
    }
  }.bind(this));
  this.wss.on('connection', function connection(ws) {
    var reply = createReply(ws);
    this.sessions.push({
      _socket: ws,
      sender: reply
    });
    ws.on('message', function (message) {
      console.log('server:receive: %s', message);
      var obj = JSON.parse(message);
      if(obj.type && typeof obj.type === 'string') {
        this.emit(obj.type, obj.data, reply);
      }
    }.bind(this));
  }.bind(this));
};

ProcessManager.prototype.broadcast = function (type, data) {
  this.sessions.forEach(function (it) {
    it.sender(type, data);
  });
};

ProcessManager.prototype.registerHandler = function () {
  this.on('changeBounds', function (data) {
    this.bounds= data.bounds;
  }.bind(this));
  this.on('getBounds', function (data, reply) {
    reply('setBounds', {bounds: this.bounds});
  }.bind(this));
};

ProcessManager.prototype.restart = function (cb) {
  if(this.electronProc) {
    this.electronProc.kill();
  }
  this.electronProc =  proc.spawn(this.opt.electron, [this.opt.path], {stdio: 'inherit'});
  if(typeof cb === 'function') {
    cb();
  }
};

ProcessManager.prototype.stop = function (cb) {
  if(this.electronProc) {
    this.electronProc.kill();
  }
  this.wss.close();
  if(typeof cb === 'function') {
    cb();
  }
};

ProcessManager.prototype.reload = function () {
  this.broadcast('reload');
};

module.exports = {
  create: function (options) {
    var opt = _.merge(options || {}, {
      electron: require('electron-prebuilt'),
      path: process.cwd(),
      port: 30080
    });
    return new ProcessManager().init(opt);
  }
};

