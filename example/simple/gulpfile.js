'use strict';

var gulp = require('gulp');
var electron = require('../../').server.create();

gulp.task('watch', function () {
  // Restart main process
  gulp.watch('app.js', electron.restart);
  // Reload renderer process
  gulp.watch(['index.js', 'index.html'], electron.reload);
});

gulp.task('serve', ['watch'], function () {
  // Start Electron process
  electron.start();
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

