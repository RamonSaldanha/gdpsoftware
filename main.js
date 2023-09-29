// Modules to control application life and create native browser window
const electron = require('electron')
const { app, BrowserWindow, dialog, ipcMain } = electron
const path = require('path')
const ejse = require('ejs-electron')
const { autoUpdater } = require('electron-updater');

let mainWindow;
let progressWin;

function createWindow () {
  const path = require("path");
  const fs = require("fs");
  const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize

  autoUpdater.checkForUpdatesAndNotify();

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

function createProgressWindow() {
    progressWin = new BrowserWindow({
        width: 350,
        height: 150,
        useContentSize: true,
        autoHideMenuBar: true,
        modal: true,
        show: false
    });

    progressWin.loadURL(`file://${__dirname}/progress.html`);  // Carregue um arquivo HTML que contém a barra de progresso

    progressWin.on('closed', () => {
        progressWin = null;
    });

    progressWin.once('ready-to-show', () => {
        progressWin.show();
    });
}

app.on('ready', createWindow)

autoUpdater.on('update-available', () => {
  // Notifica o usuário sobre a atualização disponível
  dialog.showMessageBox({
      type: 'info',
      title: 'Atualização Disponível',
      message: 'Uma nova versão do aplicativo está disponível. Deseja atualizar agora?',
      buttons: ['Sim', 'Não']
  }).then(result => {
      const buttonIndex = result.response;
      if (buttonIndex === 0) {
          // Se o usuário clicar em 'Sim', inicie o processo de atualização
          createProgressWindow();
          autoUpdater.downloadUpdate();
      }
  });
});

ipcMain.on('update-progress', (event, percent) => {
  const progressBar = document.getElementById('progressBar');
  const progressPercent = document.getElementById('progressPercent');
  
  if (progressBar) {
      progressBar.value = percent;
  }
  
  if (progressPercent) {
      progressPercent.innerText = `${Math.round(percent)}%`;
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  if (progressWin) {
      progressWin.webContents.send('update-progress', progressObj.percent);
  }
});


autoUpdater.on('update-downloaded', () => {
  // Notifica o usuário de que a atualização foi baixada e está pronta para ser instalada
  dialog.showMessageBox({
      type: 'info',
      title: 'Atualização Pronta',
      message: 'A atualização foi baixada. O aplicativo será fechado e a atualização será instalada.',
      buttons: ['OK']
  }).then(() => {
      // Aplica a atualização e reinicia o aplicativo
      autoUpdater.quitAndInstall();
      if (progressWin) progressWin.close();
  });
});


app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  if (mainWindow === null) createWindow()
})


