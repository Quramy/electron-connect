'use strict';

var Application = require('spectron').Application;
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

  describe('#application launch: simple example', function () {
    this.timeout(10000);

      beforeEach(function () {
        this.app = new Application({
          path: __dirname + '/../node_modules/.bin/electron',
          args: [__dirname + '/../example/simple']
        });
        return this.app.start();
      });

    afterEach(function () {
      if (this.app && this.app.isRunning()) {
        return this.app.stop();
      }
    });

    it('shows an initial window', function () {
      return this.app.client.getWindowCount().then(function (count) {
        assert.equal(count, 1);
      });
    });
  });

  describe('#application launch: multiple-window example', function () {
    this.timeout(10000);

      beforeEach(function () {
        this.app = new Application({
          path: __dirname + '/../node_modules/.bin/electron',
          args: [__dirname + '/../example/multiple-window']
        });
        return this.app.start();
      });

    afterEach(function () {
      if (this.app && this.app.isRunning()) {
        return this.app.stop();
      }
    });

    it('shows two initial windows', function () {
      return this.app.client.getWindowCount().then(function (count) {
        assert.equal(count, 2);
      });
    });
  });
});
