# electron-connect [![Build Status](https://travis-ci.org/Quramy/electron-connect.svg?branch=master)](https://travis-ci.org/Quramy/electron-connect) [![npm version](https://badge.fury.io/js/electron-connect.svg)](http://badge.fury.io/js/electron-connect) ![dependency](https://david-dm.org/quramy/electron-connect.svg)
Utility tool to develop applications with [Electron](http://electron.atom.io/).

Using this in your Node.js scripts(e.g. `gulpfile.js`), you can livereload your Electron app.

It provides the following features:

* start(and restart) Electron process in your Node.js script
* reload renderer process in your Node.js script

## Install
Use npm:

```bash
npm install -g electron-prebuilt
npm install electron-connect
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
A client can be created in browser process or renderer process.

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

* `option` Object
 * `electron` Object. An `electron-prebuilt` module. Set it If you want to use your forked Electron.
 * `useGlobalElectron` Boolean. If set, electron-connect use `electron-prebuilt` installed globally(default: `false`).
 * `path` String. A path to your `package.json` file(default: `process.cwd()`).
 * `port` Number. WebSocket server port(default: `30080`).
 * `spawnOpt` Object. Options for [spawn](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options).
 * `verbose` Boolean. If set, show all electron-connect log in your prompt(default: `false`).

Returns a new `ProcessManager` object.

If neither `electron` nor `useGlobalElectron` are set, electron-connect searches `electron-prebuilt` modules automatically.

1. First, electron-connect searches `electron-prebuilt` installed locally.
1. If not hit, electron-connect uses `electron-prebuilt` installed globally.

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

Registers an eventhandler. It can be emitted by `Client.sendMessage`.

### broadcast(eventName, [data])

* `eventName` String. A message type.
* `data` Object. A message data.

Broadcasts a event to all clients.

## client.create([browserWindow], [options], [callback])

* `browserWindow` Object
* `options` Object
 * `port` Number
 * `sendBounds` Boolean
 * `verbose` Boolean
* `callback` Function

Creates a new `Client` object with `browserWindow` and connects to `ProcessManager`. The `browserWindow` should be an Electron [browser-window](https://github.com/atom/electron/blob/master/docs/api/browser-window.md) instance.
Once a client is created and connects the server, the client can receive events(e.g. reload).
You can omit `browserWindow` in only rendererProcess.

If `sendBounds` is set(default `true`), the client sends a bounds object when `browserWindow` moves or resizes.
And when `ProcessManager.restart()` is called, the client recover the bounds stored at server.

## class: Client

### id

An identifier of this client. It is a same value `browserWindow.id`.

### on(eventName, callback)

* `eventName` String
* `callback` Function

Registers an eventhandler. It can be emitted by `ProcessManager.broadcast`.

### sendMessage(eventName, [data])

* `eventName` String. A message type.
* `data` Object. A message data.

Emits an event to `ProcessManager`.

## License
MIT
