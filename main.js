// Modules to control application life and create native browser window
const electron = require('electron')
const { app, BrowserWindow } = electron
const path = require('path')
const ejse = require('ejs-electron')


let mainWindow

function createWindow () {
  const path = require("path");
  const fs = require("fs");
  const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true
    },
    icon: path.join(__dirname, '/assets/img/icon.ico')
  });


  mainWindow.maximize()

  mainWindow.setMenuBarVisibility(false);

  mainWindow.loadFile('index.ejs')

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  if (mainWindow === null) createWindow()
})


