'use strict';

var electron = require('electron');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
var client = require('../../').client;

app.on('window-all-closed', function () {
  app.quit();
});


app.on('ready', function () {
  console.log('Hello, browser process');
  var window1 = new BrowserWindow({
    width: 400,
    height: 300
  });

  window1.loadURL('file://' + __dirname + '/win1.html');
  //client.create(window1);

  var window2 = new BrowserWindow({
    width: 400,
    height: 300
  });

  window2.loadURL('file://' + __dirname + '/win2.html');
  //client.create(window2);
});
