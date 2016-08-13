const electron = require('electron');
const {app} = electron;
const {BrowserWindow} = electron;
const {client} = require('../../../');

let mainWindow;

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function createWindow() {
  console.log('Hello, browser process');
  mainWindow = new BrowserWindow({
    width: 800,
    height: 300
  });

  mainWindow.loadURL(`file://${__dirname}/index.html`);

  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  client.create(mainWindow);
}

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('ready', createWindow);

