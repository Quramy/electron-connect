'use strict';

var gulp = require('gulp');
var electron = require('../../../').server.create({
  logLevel: 2
});

gulp.task('serve', function () {

  // Start browser process
  electron.start();

  // Restart browser process
  gulp.watch('app.js', ['restart:browser']);

  gulp.watch('*.html', ['reload:renderer']);

});

gulp.task('restart:browser', function(done) {
  electron.restart();
  done();
});

gulp.task('reload:renderer', function (done) {
  // Reload renderer process
  electron.reload();
  done();
});

gulp.task('default', ['serve']);

