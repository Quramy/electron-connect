'use strict';

var EventEmitter = require('events').EventEmitter;
var spawn = require('cross-spawn');
var kill = require('tree-kill');
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

  // handle old boolean verbose values
  if (this.opt.verbose === true) {
    this.opt.logLevel = util.LOG_LEVEL_VERBOSE;
  } else if (this.opt.verbose === false) {
    this.opt.logLevel = util.LOG_LEVEL_INFO;
  }

  this.numClients = 0;
  this.electronState = 'init';
  this.restartCallback = null;
  return this;
};

ProcessManager.prototype.warn= function (msg) {
  console.warn('[' + new Date().toISOString() + '] [electron-connect] [server]', msg);
};

ProcessManager.prototype.info = function (msg) {
  if(this.opt.logLevel >= util.LOG_LEVEL_INFO) console.log('[' + new Date().toISOString() + '] [electron-connect] [server]', msg);
};

ProcessManager.prototype.verbose = function (msg) {
  if(this.opt.logLevel >= util.LOG_LEVEL_VERBOSE) console.log('[' + new Date().toISOString() + '] [electron-connect] [server]', msg);
};

ProcessManager.prototype.setStateAndInvokeCallback = function(procState, cb) {
  this.electronState = procState;
  if (cb && (typeof cb === 'function')) {
    cb(procState);
  }
};

ProcessManager.prototype.spawn = function (args, spawnOpt) {
  // HACK - for now, pass electron option to preload some module (i picked 'process' module).
  args = ["-r process"].concat(args);
  this.electronProc = spawn(this.opt.electron, args.concat([this.opt.path]), spawnOpt);
  this.info('started electron process: ' + this.electronProc.pid);
};

ProcessManager.prototype.start = function (args, cb) {

  if(!cb && !args) {
    args = [];
  }else if(!cb && typeof args === 'function') {
    cb = args;
    args = [];
  }else if(typeof args === 'string') {
    args = [args];
  }else if(Array.isArray(args)){
  }else if(typeof args === 'object'){
    args = [];
  }else{
    throw new Error('args must be String or an Array of String');
  }

  this.electronState = 'starting';

  this.wss = new webSocket.Server({ port: this.opt.port}, function () {
    this.spawn(args, this.opt.spawnOpt);
    this.info('created and listening on ' + this.opt.port);
    this.setStateAndInvokeCallback('started', cb);
  }.bind(this));
  this.wss.on('connection', function connection(ws) {
    var wrapper = new SocketWrapper(ws);
    wrapper.on('message', function (message) {
      this.verbose('receive message from client(window_id: ' + wrapper.id + ') '+  message);
      var obj = JSON.parse(message);
      if(obj.type && typeof obj.type === 'string') {
        this.emit(obj.type, obj.data, wrapper);
      }
    }.bind(this));
    wrapper.on('close', function () {
      this.info('client (window_id: ' + wrapper.id + ') closed.');
      SocketWrapper.delete(wrapper.id);
      this.numClients--;
      if (!this.numClients) {
          this.verbose('no more open windows');
        if (this.opt.stopOnClose && this.electronState !== 'restarting' && this.electronState !== 'reloading') {
          this.verbose('stopOnClose is set. So, invoking stop..');
          this.stop(cb);
        } else if (this.electronState === 'restarting') {
          this.info('Respawning electron process..');
          this.spawn(args, this.opt.spawnOpt);
          this.setStateAndInvokeCallback('restarted', this.restartCallback);
        }
      }
    }.bind(this));
    this.info('client (window_id: ' + wrapper.id + ') started.');
    this.numClients++;
  }.bind(this));
  this.registerHandler();
};

ProcessManager.prototype.broadcast = function (type, data) {
  SocketWrapper.broadcast(type, data);
};

// ProcessManager.prototype.sendMessage = function (id, type, data) {
//   SocketWrapper.get(id).sendMessage(type, data);
// };

ProcessManager.prototype.registerHandler = function () {
  this.on('initBounds', function (data, wrapper) {
    if(JSON.stringify(wrapper.get('init_bounds')) !== JSON.stringify(data.bounds)) {
      wrapper.set('init_bounds', data.bounds);
      wrapper.set('bounds', data.bounds);
    }
  }.bind(this));
  this.on('changeBounds', function (data, wrapper) {
    this.verbose('changeBounds for window_id: ' + wrapper.id);
    wrapper.set('bounds', data.bounds);
  }.bind(this));
  this.on('getBounds', function (data, wrapper) {
    var bounds = wrapper.get('bounds');
    this.verbose('getBounds for window_id: ' + wrapper.id + ', bounds: ' + JSON.stringify(bounds));
    wrapper.sendMessage('setBounds', {bounds: bounds});
  }.bind(this));
};

ProcessManager.prototype.restart = function (args, cb) {
  if(!cb && !args) {
    args = [];
  }else if(!cb && typeof args === 'function') {
    cb = args;
    args = [];
  }else if(typeof args === 'string') {
    args = [args];
  }else if(Array.isArray(args)){
  }else if(typeof args === 'object') {
    args = [];
  }else{
    throw new Error('args must be String or an Array of String');
  }

  if (typeof cb === 'function') {
    this.restartCallback = cb;
  }

  this.electronState = 'restarting';
  if (this.electronProc) {
    this.info('restarting electron process: ' + this.electronProc.pid);
    if (!this.numClients) {
      this.killProcess(function() {
        this.info('Respawning electron process..');
        this.spawn(args, this.opt.spawnOpt);
        this.setStateAndInvokeCallback('restarted', this.restartCallback);
      }.bind(this));
    } else {
      this.killProcess(function() {
        if (this.restartCallback) {
          this.restartCallback(this.electronState);
        }
      }.bind(this));
    }
  }
};

ProcessManager.prototype.killProcess = function (cb) {
  if(this.electronProc) {
    this.info('killing electron process tree: ' + this.electronProc.pid);
    kill(this.electronProc.pid, 'SIGTERM', cb);
  }
};

ProcessManager.prototype.stop = function (cb) {
  this.info('stopping electron process: ' + this.electronProc.pid);
  this.electronState = 'stopping';
  this.killProcess(function(err){
    this.wss.close();
    this.setStateAndInvokeCallback('stopped', cb);
  }.bind(this));
};

ProcessManager.prototype.reload = function (ids) {
  var list;
  if(typeof ids === 'string') {
    list = [ids];
  }else if(Array.isArray(ids)) {
    list = ids;
  }

  this.electronState = 'reloading';
  if(!list) {
    this.broadcast('reload');
  }else{
    ids.forEach(function (id) {
      SocketWrapper.get(id).sendMessage('reload');
    });
  }
  setTimeout((self) => {
    self.electronState = 'reloaded';
  }, 3000, this);
};

module.exports = {
  create: function (options) {
    var electron;
    if(options && options.useGlobalElectron) {
      electron = 'electron';
    } else {
      try {
        electron = require('electron');
      } catch (e) {
        if(e.code === 'MODULE_NOT_FOUND') {
          electron = 'electron';
        }
      }
    }
    var opt = _.merge({
      stopOnClose: false,
      electron: electron,
      path: process.cwd(),
      port: 30080,
      logLevel: util.LOG_LEVEL_INFO,
      spawnOpt: {stdio: 'inherit'}
    }, options || {});
    return new ProcessManager().init(opt);
  }
};

