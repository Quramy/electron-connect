# electron-connect
Utility tool to develop applications with [Electron](http://electron.atom.io/).

It provides the following features:

* Live reload(main process and renderer process)

## Install
Use npm:

```bash
npm install electron-connect
```

## Usage

### Using with gulp

* gulpfile.js

```js
'use strict';

var gulp = require('gulp');
var electron = require('electron-connect').server.create();

gulp.task('watch', function () {
  gulp.watch('app.js', ['reload:browser']);
  gulp.watch(['index.js', 'index.html'], ['reload:renderer']);
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
```

* app.js(an entry point of your Electron app)

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
  client.create().connect(app, mainWindow);
});
```

## License
MIT
