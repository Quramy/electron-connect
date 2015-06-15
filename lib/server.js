'use strict';

var EventEmitter = require('events').EventEmitter;
var proc = require('child_process');
var electron = require('electron-prebuilt');
var webSocket = require('ws');
var _ = require('lodash');
var util = require('./util');

var ProcessManager = function () {};
ProcessManager.prototype = new EventEmitter();
ProcessManager.prototype.init = function (opt) {
  this.opt = opt;
  return this;
};

ProcessManager.prototype.start = function (cb) {
  this.electronProc = proc.spawn(this.opt.electron, [this.opt.path], {stdio: 'inherit'});
  var WebSocketServer = webSocket.Server
  this.wss = new WebSocketServer({ port: this.opt.port});
  this.wss.on('connection', function connection(ws) {
    this.ws = ws;
    this.ws.on('message', function incoming(message) {
      console.log('server:receive: %s', message);
      var obj = JSON.parse(message);
      if(obj.type && typeof obj.type === 'string') {
        this.emit(obj.type, obj.data);
      }
    }.bind(this));
  }.bind(this));
  this.registerHandler();
  if(typeof cb === 'function') {
    cb();
  }
};

ProcessManager.prototype.sendMessage = function (type, data) {
  //return util.sendMessage(this.ws, type, data);
  if(!type || !this.ws || this.ws.readyState !== webSocket.OPEN) return;
  var obj = {type: type};
  if(data) obj.data = data;
  this.ws.send(JSON.stringify(obj));
};

ProcessManager.prototype.registerHandler = function () {
  this.on('changeBounds', function (data) {
    this.bounds= data.bounds;
  }.bind(this));
  this.on('getPosition', function () {
    this.sendMessage('setBounds', {bounds: this.bounds});
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
  this.sendMessage('reload');
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

