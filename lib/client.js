'use strict';

var EventEmitter = require('events').EventEmitter;
var WebSocket = require('ws');
var _ = require('lodash');

var Client = function () {};
var defaultOpt = {
  port: 30080,
  sendBounds: true
};
Client.prototype = new EventEmitter();

Client.prototype.join = function (browserWindow, options, cb) {
  if(!options && !cb) {
    this.opt = defaultOpt;
  }else if(!cb && typeof options === 'function') {
    cb = options;
    this.opt = defaultOpt;
  }else{
    this.opt = _.merge(options, defaultOpt);
  }
  this.socket = new WebSocket('ws://localhost:' + this.opt.port);
  this.socket.on('open', function () {
    console.log('client:connected');
    this.socket.on('message', function (msg) {
      try {
        var message = JSON.parse(msg);
        if(message.type && typeof message.type === 'string') {
          console.log('client:recieve: ' + message.type);
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
  if(!type) return;
  var obj = {type: type};
  if(data) obj.data = data;
  this.socket.send(JSON.stringify(obj));
};

Client.prototype.registerHandler = function () {
  this.on('setBounds', function (data) {
    data.bounds && this.browserWindow && this.browserWindow.setBounds(data.bounds);
  }.bind(this));

  this.on('reload', function () {
    if(!this.browserWindow) return;
    this.browserWindow.reloadIgnoringCache();
  }.bind(this));

};

module.exports = {
  create: function (browserWindow, options, cb) {
    return new Client().join(browserWindow, options, cb);
  }
};

