# electron-connect [![Build Status](https://travis-ci.org/Quramy/electron-connect.svg?branch=master)](https://travis-ci.org/Quramy/electron-connect) [![npm version](https://badge.fury.io/js/electron-connect.svg)](http://badge.fury.io/js/electron-connect) ![dependency](https://david-dm.org/quramy/electron-connect.svg)
Utility tool to develop applications with [Electron](http://electron.atom.io/).

Using this in your Node.js scripts (e.g. `gulpfile.js`), you can livereload your Electron app.

It provides the following features:

* start (and restart) Electron application.
* reload renderer processes.
* stop Electron application.

## Install
Use npm:

```bash
npm install electron
npm install electron-connect --save-dev
```

## Usage
`electron-connect` has server and client components. They communicate with each other using WebSocket.
The server component manages Electron process and broadcasts reload event to client, and client components reload renderer's resources.

### Server
Here is an example creating a server in [gulpfile](http://gulpjs.com/).

```js
'use strict';

var gulp = require('gulp');
var electron = require('electron-connect').server.create();

gulp.task('serve', function () {

  // Start browser process
  electron.start();

  // Restart browser process
  gulp.watch('app.js', electron.restart);

  // Reload renderer process
  gulp.watch(['index.js', 'index.html'], electron.reload);
});
```

### Client
A client can be created in either browser process or renderer process.
`Note:` Please make sure it is not done in both.

* RendererProcess
```html
<html>
<body>
<!-- build:remove -->
<!-- Connect to server process -->
<script>require('electron-connect').client.create()</script>
<!-- end:build -->
</body>
</html>
```

Do you want to use this tool for only develop environment ?
You can remove the `<script>` block in your gulpfile using [gulp-useref](https://www.npmjs.com/package/gulp-useref#usage).

* BrowserProcess 

```js
'use strict';

var app = require('app');
var BrowserWindow = require('browser-window');
var client = require('electron-connect').client;

app.on('ready', function () {
  var mainWindow = new BrowserWindow({
    width: 400,
    height: 300
  });
  mainWindow.loadUrl('file://' + __dirname + '/index.html');

  // Connect to server process
  client.create(mainWindow);
});
```

If you want details, see [example/simple](example/simple).

## API References

## server.create([options])

* `options` Object
 * `electron` Object. An `electron` module. Set it If you want to use your forked Electron.
 * `useGlobalElectron` Boolean. If set, electron-connect uses `electron` module installed globally (default: `false`).
 * `path` String. A path to your `package.json` file (default: `process.cwd()`).
 * `port` Number. WebSocket server port (default: `30080`).
 * `spawnOpt` Object. Options for [spawn](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options).
 * `logLevel` Number. The granularity of the electron-connect logging in your prompt. `0` - warning only, `1` - warning and info only, `2` - all logs (default: `1`).
 * `stopOnClose` Boolean. If set, closing last remaining window stops the electron application.

Returns a new `ProcessManager` object.

If neither `electron` nor `useGlobalElectron` option is set, electron-connect searches for `electron` module automatically.

1. First, electron-connect searches `electron` installed locally.
1. If not hit, electron-connect uses `electron` installed globally.

**New in version 0.5.x and onwards :**
Now, ProcessManager's `start()`, `restart()` and `stop()` methods invoke ``callback`` with an argument that indicates the `state` of the electron process, which could be one of the following string values -
* `started`
* `restarting`
* `restarted`
* `stopped`

See [example/stop-on-close](example/stop-on-close), where you can find sample code that uses `stopOnClose` option and `stopped` state to shutdown gulp process gracefully.

## Class: ProcessManager

### start([args], [callback])

* `args` String or Array. Additional arguments used when create a process.
* `callback` Function

Starts a server and Electron application process.

### restart([args], [callback])

* `args` String or Array. Additional arguments used when create a process.
* `callback` Function

Kills Electron process if it exsists, and starts new one.

This method is useful for callback of your browserProcess sourcecodes' change event.

### reload([ids])

* `ids` String or Array. A list of id of target client.

Emit reload event to target clients. Broadcasts reload event to all connected `Client` object if `ids` not set.
This method does not kill any Electron processes.

This method is useful for callback of your rendererProcess sourcecodes' change event.

### stop([callback])

* `callback` Function

Kills Electron process and stops server.

### on(eventName, callback)

* `eventName` String
* `callback` Function

Registers an eventhandler that gets invoked when an event is emitted by `Client.sendMessage`.

### broadcast(eventName, [data])

* `eventName` String. A message type.
* `data` Object. A message data.

Broadcasts an event to all clients.

## client.create([browserWindow], [options], [callback])

* `browserWindow` Object. Optional, in rendererProcess only. Required, when client is created in browserProcess.
* `options` Object
 * `port` Number. WebSocket server port (default: `30080`) that client should connect to.
 * `sendBounds` Boolean
 * `logLevel` Number. See [server.create([options]).logLevel](#servercreateoptions).
* `callback` Function

Creates a new `Client` object associated with `browserWindow` and connects to `ProcessManager`.

The `browserWindow` should be an Electron [browser-window](https://github.com/atom/electron/blob/master/docs/api/browser-window.md) instance.
Once a client is created and connected to the server, client can receive events (e.g. reload).

If `sendBounds` is set (default `true`), client sends a bounds object when `browserWindow` moves or resizes.
And when `ProcessManager.restart()` is called, client recovers the bounds stored at server.

## Class: Client

### id

An identifier of this client. It is a same value `browserWindow.id`.

### on(eventName, callback)

* `eventName` String
* `callback` Function

Registers an eventhandler that gets invoked, when an event is emitted by `ProcessManager.broadcast`.

### sendMessage(eventName, [data])

* `eventName` String. A message type.
* `data` Object. A message data.

Emits an event to `ProcessManager`.

## License
MIT
