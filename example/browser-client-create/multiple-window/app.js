const electron = require('electron');
const {app} = electron;
const {BrowserWindow} = electron;
const {client} = require('../../../');

let win1;
let win2;

function createWindowOne() {
  win1 = new BrowserWindow({width: 200, height: 200, x: 100, y: 120});
  win1.loadURL(`file://${__dirname}/win1.html`);
  win1.on('closed', () => {
    win1 = null;
  });
  client.create(win1);
}

function createWindowTwo() {
  win2 = new BrowserWindow({width: 200, height: 200, x: 300, y: 300});
  win2.loadURL(`file://${__dirname}/win2.html`);
  win2.on('closed', () => {
    win2 = null;
  });
  client.create(win2);
}

function createWindows() {
  createWindowOne();
  createWindowTwo();
}

app.on('ready', createWindows);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (win1 === null) {
    createWindowOne();
  }
  if (win2 === null) {
    createWindowTwo();
  }
});
