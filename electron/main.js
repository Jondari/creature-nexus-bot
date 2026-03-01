const path = require('path');
const { app, BrowserWindow } = require('electron');

const isDev = Boolean(process.env.ELECTRON_START_URL);

const getIndexUrl = () => {
  if (isDev) {
    return process.env.ELECTRON_START_URL;
  }

  const fileUrl = new URL('../dist/index.html', `file://${__dirname}/`);
  return fileUrl.toString();
};

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    backgroundColor: '#121626',
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../assets/images/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.once('ready-to-show', () => win.show());
  win.loadURL(getIndexUrl());

  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' });
  }
};

app.whenReady().then(() => {
  app.setAppUserModelId('com.jondari.creaturenexustcg');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
