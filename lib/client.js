'use strict';

var EventEmitter = require('events').EventEmitter;
var WebSocket = require('ws');
var _ = require('lodash');
var util = require('./util');

var getBrowserWindow = function () {
  if(process.type === 'renderer') {
    return require('remote').getCurrentWindow();
  }
};

var Client = function () {};
var defaultOpt = {
  port: 30080,
  sendBounds: true
};
Client.prototype = new EventEmitter();

Client.prototype.log = function (msg) {
  console.log('[' + new Date().toISOString() + '] [electron-connect] [client] ' + msg);
};

Client.prototype.join = function (browserWindow, options, cb) {
  if(browserWindow && browserWindow.constructor.name === 'BrowserWindow') {
    if(!options && !cb) {
      this.opt = defaultOpt;
    }else if(!cb && typeof options === 'function') {
      cb = options;
      this.opt = defaultOpt;
    }else{
      this.opt = _.merge(defaultOpt, options);
    }
  }else{
    if(typeof browserWindow === 'object') {
      this.opt = _.merge(defaultOpt, browserWindow);
      cb = options;
    }else{
      this.opt = defaultOpt;
      cb = browserWindow;
    }
    browserWindow = getBrowserWindow();
  }
  this.socket = new WebSocket('ws://localhost:' + this.opt.port);
  this.socket.on('open', function () {
    this.log('connected server');
    this.socket.on('message', function (msg) {
      try {
        var message = JSON.parse(msg);
        if(message.type && typeof message.type === 'string') {
          this.log('receive message: ' + message.type);
          this.emit(message.type, message.data || null);
        }
      }catch (e) {
        console.error(e);
      }
    }.bind(this));

    if(browserWindow) {
      this.registerWindow(browserWindow);
    }
    typeof cb === 'function' && cb();
  }.bind(this));
  this.registerHandler(browserWindow);
  /*
  if(browserWindow) {
    this.browserWindow = browserWindow;
  }*/
  return this;
};

Client.prototype.registerWindow = function (browserWindow) {
  this.opt.sendBounds && ['move', 'resize'].forEach(function (eventName) {
    browserWindow.on(eventName, function () {
      this.sendMessage('changeBounds', {bounds: browserWindow.getBounds()});
    }.bind(this));
    this.sendMessage('getBounds');
  }.bind(this));
  if (window) {
    window.addEventListener('beforeunload', function () {
      browserWindow.removeAllListeners();
    });
  }
};

Client.prototype.sendMessage = function (type, data) {
  util.sendMessage(this.socket, type, data);
};

Client.prototype.registerHandler = function (browserWindow) {
  this.on('setBounds', function (data) {
    this.opt.sendBounds && data.bounds && browserWindow && browserWindow.setBounds(data.bounds);
  }.bind(this));

  this.on('reload', function () {
    if(!browserWindow) return;
    browserWindow.removeAllListeners();
    browserWindow.reloadIgnoringCache();
  }.bind(this));

};

Client.prototype.close = function () {
  this.socket.close();
};

var clients = {};

module.exports = {
  create: function (browserWindow, options, cb) {
    return new Client().join(browserWindow, options, cb);
  }
};

