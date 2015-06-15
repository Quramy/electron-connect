'use strict';

var EventEmitter = require('events').EventEmitter;
var WebSocket = require('ws');

var Client = function () {};
Client.prototype = new EventEmitter();

Client.prototype.connect = function (app, browserWindow) {
  this.app = app;
  this.socket = new WebSocket('ws://localhost:30080');
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
      this._registerWindow();
    }
  }.bind(this));
  this.registerHandler();
  if(browserWindow) {
    this.browserWindow = browserWindow;
  }
  return this;
};

Client.prototype._registerWindow = function () {
  ['move', 'resize'].forEach(function (eventName) {
    this.browserWindow.on(eventName, function () {
      this.sendMessage('changeBounds', {bounds: this.browserWindow.getBounds()});
    }.bind(this));
    this.sendMessage('getPosition');
  }.bind(this));
};

Client.prototype.registerWindow = function (browserWindow) {
  this.browserWindow = browserWindow;
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

var obj = {
  create: function (app, browserWindow) {
    return new Client();
  }
};

module.exports = obj;
