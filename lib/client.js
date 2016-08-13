'use strict';

var EventEmitter = require('events').EventEmitter;
var WebSocket = require('ws');
var _ = require('lodash');
var util = require('./util');

var getBrowserWindow = function () {
  if(process.type === 'renderer') {
    return require('electron').remote.getCurrentWindow();
  }
};

var Client = function () {};
var defaultOpt = {
  port: 30080,
  sendBounds: true,
  verbose: false
};
Client.prototype = new EventEmitter();

Client.prototype.warn = function (msg) {
  console.warn('[' + new Date().toISOString() + '] [electron-connect] [client: ' + this.id + '] ' + msg);
};

Client.prototype.info = function (msg) {
  console.log('[' + new Date().toISOString() + '] [electron-connect] [client: ' + this.id + '] ' + msg);
};

Client.prototype.verbose = function (msg) {
  if(this.opt.verbose) console.log('[' + new Date().toISOString() + '] [electron-connect] [client: ' + this.id + '] ' + msg);
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
  var id = browserWindow ? browserWindow.id : '_no_browser';
  this.id = id;
  this.socket = new WebSocket('ws://localhost:' + this.opt.port + '/' + '?window_id=' + id);
  this.socket.on('open', function () {
    this.info('connected server');
    this.socket.on('message', function (msg) {
      try {
        var message = JSON.parse(msg);
        if(message.type && typeof message.type === 'string') {
          this.verbose('receive message: ' +  msg);
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
  return this;
};

Client.prototype.registerWindow = function (browserWindow) {
  this.opt.sendBounds && ['move', 'resize'].forEach(function (eventName) {
    browserWindow.on(eventName, function () {
      this.sendMessage('changeBounds', {bounds: browserWindow.getBounds()});
    }.bind(this));
  }.bind(this));
  if (process.type == 'renderer') {
    if (typeof window === 'object') {
      window.addEventListener('beforeunload', function () {
        this.close(browserWindow);
      }.bind(this));
    }
  } else {
    browserWindow.on('closed', function() {
      this.close(browserWindow);
    }.bind(this));
  }
  this.sendMessage('initBounds', {bounds: browserWindow.getBounds()});
  this.sendMessage('getBounds');
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
    if(browserWindow.webContents) {
      browserWindow.webContents.reloadIgnoringCache();
    }else{
      browserWindow.reloadIgnoringCache();
    }
  }.bind(this));

};

Client.prototype.close = function (browserWindow) {
  if(this.opt.sendBounds) {
    browserWindow.removeAllListeners('move').removeAllListeners('resize');
  }
  this.socket.terminate();
};

var clients = {};

module.exports = {
  create: function (browserWindow, options, cb) {
    return new Client().join(browserWindow, options, cb);
  }
};

