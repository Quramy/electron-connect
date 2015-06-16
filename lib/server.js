'use strict';

var EventEmitter = require('events').EventEmitter;
var proc = require('child_process');
var electron = require('electron-prebuilt');
var webSocket = require('ws');
var _ = require('lodash');
var util = require('./util');

var createReply = function (ws) {
  return function (type, data) {
    return util.sendMessage(ws, type, data);
  };
};

var ProcessManager = function () {
  this.start = this.start.bind(this);
  this.restart = this.restart.bind(this);
  this.reload = this.reload.bind(this);
  this.stop = this.stop.bind(this);
};
ProcessManager.prototype = new EventEmitter();
ProcessManager.prototype.init = function (opt) {
  this.opt = opt;
  this.sessions = [];
  return this;
};

ProcessManager.prototype.log = function (msg) {
  console.log('[' + new Date().toISOString() + '] [electron-connect] [server]', msg);
};

ProcessManager.prototype.start = function (cb) {
  this.wss = new webSocket.Server({ port: this.opt.port}, function () {
    this.electronProc = proc.spawn(this.opt.electron, [this.opt.path], {stdio: 'inherit'});
    this.log('created and liseten to ' + this.opt.port);
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
      this.log('receive message: ' +  message);
      var obj = JSON.parse(message);
      if(obj.type && typeof obj.type === 'string') {
        this.emit(obj.type, obj.data, reply);
      }
    }.bind(this));
  }.bind(this));
  this.registerHandler();
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
  this.killProcess();
  this.electronProc =  proc.spawn(this.opt.electron, [this.opt.path], {stdio: 'inherit'});
  this.log('restart electron process');
  if(typeof cb === 'function') {
    cb();
  }
};

ProcessManager.prototype.killProcess = function () {
  if(this.electronProc) {
    this.log('kill electron process');
    this.electronProc.kill();
  }
};

ProcessManager.prototype.stop = function (cb) {
  this.killProcess();
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
    var opt = _.merge({
      electron: require('electron-prebuilt'),
      path: process.cwd(),
      port: 30080
    }, options || {});
    return new ProcessManager().init(opt);
  }
};

