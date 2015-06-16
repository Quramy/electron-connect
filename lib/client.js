'use strict';

var EventEmitter = require('events').EventEmitter;
var WebSocket = require('ws');
var _ = require('lodash');
var util = require('./util');

var Client = function () {};
var defaultOpt = {
  port: 30080,
  sendBounds: true
};
Client.prototype = new EventEmitter();

Client.prototype.log = function (msg) {
  console.log('[' + new Date().toISOString() + '] [electron-connect] [client]', msg);
};

Client.prototype.join = function (browserWindow, options, cb) {
  if(!options && !cb) {
    this.opt = defaultOpt;
  }else if(!cb && typeof options === 'function') {
    cb = options;
    this.opt = defaultOpt;
  }else{
    this.opt = _.merge(defaultOpt, options);
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

    if(this.browserWindow) {
      this.registerWindow();
    }
    typeof cb === 'function' && cb();
  }.bind(this));
  this.registerHandler();
  if(browserWindow) {
    this.browserWindow = browserWindow;
  }
  return this;
};

Client.prototype.registerWindow = function () {
  this.opt.sendBounds && ['move', 'resize'].forEach(function (eventName) {
    this.browserWindow.on(eventName, function () {
      this.sendMessage('changeBounds', {bounds: this.browserWindow.getBounds()});
    }.bind(this));
    this.sendMessage('getBounds');
  }.bind(this));
};

Client.prototype.sendMessage = function (type, data) {
  util.sendMessage(this.socket, type, data);
};

Client.prototype.registerHandler = function () {
  this.on('setBounds', function (data) {
    this.opt.sendBounds && data.bounds && this.browserWindow && this.browserWindow.setBounds(data.bounds);
  }.bind(this));

  this.on('reload', function () {
    if(!this.browserWindow) return;
    this.browserWindow.reloadIgnoringCache();
  }.bind(this));

};

Client.prototype.close = function () {
  this.socket.close();
};

module.exports = {
  create: function (browserWindow, options, cb) {
    return new Client().join(browserWindow, options, cb);
  }
};

