const { app, globalShortcut, ipcMain, dialog, BrowserWindow } = require('electron');
const path = require('path');

require('dotenv').config();
require('@electron/remote/main').initialize()

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 630,

    minWidth: 800,
    minHeight: 630,

    maxWidth: process.env.DEV_ENV ? 1920 : 800,
    maxHeight: process.env.DEV_ENV ? 1080: 630,

    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  require("@electron/remote/main").enable(mainWindow.webContents)

  // we dont like menus
  if (!process.env.DEV_ENV) {
    mainWindow.removeMenu();
  } else {
    mainWindow.removeMenu();
    mainWindow.webContents.openDevTools();
  }

  // load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', ()=> {
  createWindow()
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});