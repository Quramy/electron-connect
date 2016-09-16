'use strict';

var gulp = require('gulp');
var electron = require('../../').server.create();

// var electron = require('../../').server.create({
//   useGlobalElectron: true,
//   logLevel: 2
// });

gulp.task('serve', function () {
  // Start browser process
  electron.start();

  // // Add an argument
  // electron.start('Hoge!');

  // // Add list of arguments
  // electron.start(['Hoge', 'foo']);

  // // Callback
  // electron.start(function () {
  //   console.log('started');
  // });

  // Restart browser process
  gulp.watch('app.js', electron.restart);

  // Reload renderer process
  gulp.watch(['index.js', 'index.html'], electron.reload);
});

gulp.task('reload:browser', function () {
  // Restart main process
  electron.restart();
});

gulp.task('reload:renderer', function () {
  // Reload renderer process
  electron.reload();
});

gulp.task('default', ['serve']);

