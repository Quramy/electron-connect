'use strict';

var app = require('app');
var BrowserWindow = require('browser-window');
var client = require('../../').client;

app.on('window-all-closed', function () {
  app.quit();
});


app.on('ready', function () {
  console.log(process.argv.join(', '));
  console.log('Hello, browser process');
  var mainWindow = new BrowserWindow({
    width: 400,
    height: 300
  });

  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // client can be created in the browser process.

  // client.create(mainWindow);

  // or with callback

  // client.create(mainWindow, function () {
  //   console.log('done');
  // });

  // or with options

  // client.create(mainWindow, {sendBounds: false});

});
