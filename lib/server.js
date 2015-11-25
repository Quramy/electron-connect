'use strict';

var EventEmitter = require('events').EventEmitter;
var proc = require('child_process');
var webSocket = require('ws');
var _ = require('lodash');
var SocketWrapper = require('./socketWrapper');
var util = require('./util');

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

ProcessManager.prototype.spawn = function (args, spawnOpt) {
  this.electronProc = proc.spawn(this.opt.electron, [this.opt.path].concat(args), spawnOpt);
};

ProcessManager.prototype.start = function (args, cb) {

  if(!cb && !args) {
    args = [];
  }else if(!cb && typeof args === 'function') {
    cb = args;
  }else if(typeof args === 'string') {
    args = [args];
  }else if(Array.isArray(args)){
  }else if(typeof args === 'object'){
    args = [];
  }else{
    throw new Error('args must be String or an Array of String');
  }

  this.wss = new webSocket.Server({ port: this.opt.port}, function () {
    this.spawn(args, this.opt.spawnOpt);
    this.log('created and listening on ' + this.opt.port);
    if(typeof cb === 'function') {
      cb();
    }
  }.bind(this));
  this.wss.on('connection', function connection(ws) {
    var wrapper = new SocketWrapper( ws); 
    wrapper.on('message', function (message) {
      this.log('receive message from client(window_id: ' + wrapper.id + ') '+  message);
      var obj = JSON.parse(message);
      if(obj.type && typeof obj.type === 'string') {
        this.emit(obj.type, obj.data, wrapper);
      }
    }.bind(this));
    wrapper.on('close', function () {
      this.log('client (window_id: ' + wrapper.id + ') closed.');
      SocketWrapper.delete(wrapper.id);
    }.bind(this));

  }.bind(this));
  this.registerHandler();
};

ProcessManager.prototype.broadcast = function (type, data) {
  SocketWrapper.broadcast(type, data);
};

ProcessManager.prototype.sendMessage = function (id, type, data) {
  SocketWrapper.get(id).sendMessage(type, data);
};

ProcessManager.prototype.registerHandler = function () {
  this.on('changeBounds', function (data, wrapper) {
    wrapper.set('bounds', data.bounds);
  }.bind(this));
  this.on('getBounds', function (data, wrapper) {
    var bounds = wrapper.get('bounds');
    wrapper.sendMessage('setBounds', {bounds: bounds});
  }.bind(this));
};

ProcessManager.prototype.restart = function (args, cb) {
  if(!cb && !args) {
    args = [];
  }else if(!cb && typeof args === 'function') {
    cb = args;
  }else if(typeof args === 'string') {
    args = [args];
  }else if(Array.isArray(args)){
  }else if(typeof args === 'object') {
    args = [];
  }else{
    throw new Error('args must be String or an Array of String');
  }
  this.killProcess();
  this.spawn(args, this.opt.spawnOpt);
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

ProcessManager.prototype.reload = function (ids) {
  var list;
  if(typeof ids === 'string') {
    list = [ids];
  }else if(Array.isArray(ids)) {
    list = ids;
  }

  if(!list) {
    this.broadcast('reload');
  }else{
    ids.forEach(function (id) {
      SocketWrapper.get(id).sendMessage('reload');
    });
  }

};

module.exports = {
  create: function (options) {
    var electron;
    if(options && options.useGlobalElectron) {
      electron = 'electron';
    } else {
      try {
        electron = require('electron-prebuilt');
      } catch (e) {
        if(e.code === 'MODULE_NOT_FOUND') {
          electron = 'electron';
        }
      }
    }
    var opt = _.merge({
      electron: electron,
      path: process.cwd(),
      port: 30080,
      spawnOpt: {stdio: 'inherit'}
    }, options || {});
    return new ProcessManager().init(opt);
  }
};

