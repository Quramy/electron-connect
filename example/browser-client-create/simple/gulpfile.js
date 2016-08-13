'use strict';

var gulp = require('gulp');
var electron = require('../../../').server.create();

gulp.task('serve', function () {
  // Start browser process
  electron.start();

  // Restart browser process
  gulp.watch('app.js', ['reload:browser']);

  // Reload renderer process
  gulp.watch(['index.js', 'index.html'], ['reload:renderer']);
});

gulp.task('reload:browser', function (done) {
  // Restart main process
  electron.restart();
  done();
});

gulp.task('reload:renderer', function (done) {
  // Reload renderer process
  electron.reload();
  done();
});

gulp.task('default', ['serve']);

