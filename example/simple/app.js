'use strict';

var app = require('app');
var BrowserWindow = require('browser-window');
var client = require('../../').client;

app.on('window-all-closed', function () {
  app.quit();
});

app.on('ready', function () {
  console.log('Hello, browser process');
  var mainWindow = new BrowserWindow({
    width: 400,
    height: 300
  });

  mainWindow.loadUrl('file://' + __dirname + '/index.html');
  // client.create(mainWindow);
  // client.create(mainWindow, function () {
  //   console.log('done');
  // });
  // client.create(mainWindow, {sendBounds: false});
});
