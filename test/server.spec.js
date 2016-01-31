'use strict';

var assert = require('assert');
var server = require('../lib/server');

describe('server', function () {
  describe('#create', function () {
    it('returns an Electron server', function () {
      var s = server.create();
      assert(s);
    });
  });

  describe('#start', function () {
    it('starts a new Electron process', function (done) {
      var s = server.create({
        path: __dirname + '/../example/simple'
      });
      s.start(function () {
        s.stop(function() {
          done();
        });
      });
    });
  });

  describe('#stop', function () {
    it('stops a new Electron process', function (done) {
      var s = server.create({
        path: __dirname + '/../example/simple'
      });
      s.start(function () {
        s.stop(function () {
          done();
        });
      });
    });
  });

  describe('#restart', function () {
    it('restarts a new Electron process', function (done) {
      var s = server.create({
        path: __dirname + '/../example/simple'
      });
      s.start(function () {
        s.restart(function(){
          s.stop(function () {
            done();
          });
        });
      });
    });
  });


});
