import { app, BrowserWindow, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import path from 'path'

import expressInit from '../express/server.js'

import SETTINGS_DEV from '../settings/settings.dev.js'
import SETTINGS_PROD from '../settings/settings.prod.js'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
  global.__settings = SETTINGS_PROD;
} else {
  global.__settings = SETTINGS_DEV;
}

let mainWindow;

let willQuitApp = false;
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

const electronGoogleOauth = require('electron-google-oauth');

let microscopeScope = null;

function createWindow () {
  var shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      else if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });

  if (shouldQuit) {
    app.quit();
    return;
  }

  var winSize = __settings.window_settings||{};

  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    ...winSize
  })

  mainWindow.setMenu(null)

  mainWindow.loadURL(winURL)

  mainWindow.on('close', (event) => {
    if(!willQuitApp && __settings.prevent_close) {
      event.preventDefault();
      mainWindow.hide();
    }
  })

  mainWindow.on('closed', (event) => {
    mainWindow = null
  })

  mainWindow.on('show', (event) => {
    autoUpdater.checkForUpdates();
  })

  autoUpdater.autoDownload = false;

  ipcMain.on('download-update', function(event) {
    autoUpdater.downloadUpdate();
  })
  ipcMain.on('quit-and-install', function(event) {
    autoUpdater.quitAndInstall();  
  })
  ipcMain.on('check-for-updates', function(event) {
    autoUpdater.checkForUpdates();  
  })

  autoUpdater.on('checking-for-update', () => {
    mainWindow.webContents.send("updateStatusMessage", 'Checking for updates...');
  })
  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send("updateStatusMessage", `Update available. ${info.version}`);
    mainWindow.webContents.send("updateAvailable", info);
  })
  autoUpdater.on('update-not-available', (info) => {
    mainWindow.webContents.send("updateStatusMessage", 'Up to date.');
  })
  autoUpdater.on('error', (err) => {
    // mainWindow.webContents.send("updateStatusMessage", 'Erreur lors de la mise à jour automatique. ' + err);
    mainWindow.webContents.send("updateStatusMessage", err);
  })
  autoUpdater.on('download-progress', (progressObj) => {
    let percent = parseInt(progressObj.percent);
    let log_message = `Downloading ${percent}%`;
    mainWindow.webContents.send("updateStatusMessage", log_message);
  })
  autoUpdater.on('update-downloaded', (info) => {
    mainWindow.webContents.send("updateStatusMessage", `Update downloaded. ${info.version}`);
    mainWindow.webContents.send("updateDownloaded", true);
  });

  ipcMain.on('login-google', function(event, { scopes, type }) {
    const googleOauth = electronGoogleOauth({
      center: true,
      height : 700,
      show: true,
      resizable: false,
      autoHideMenuBar: true,
      webPreferences: {
        devTools : false,
        nodeIntegration: false
      }
    });
    googleOauth.getAccessToken(
      scopes,
      __settings.clientId,
      __settings.clientSecret
    ).then((token) => {
      mainWindow.webContents.send("login-google-result", {
        type, token
      });
    });
  });

  ipcMain.on('open-modal-external-url', function(event, { url, title='New widnow' }) {
    var winOptions = { 
      title,
      width: 600,
      height: 800,
      webPreferences: {
        devTools : false,
        nodeIntegration: false
      }
    };
    var chatWindow = new BrowserWindow(winOptions);
    chatWindow.loadURL(url);
    chatWindow.show();
  });

  // TODO: Custom port
  expressInit(mainWindow);
}

app.on('ready', createWindow)

app.on('before-quit', () => willQuitApp = true);

app.on('window-all-closed', () => {
  // if (process.platform !== 'darwin') {
  //   app.quit()
  // }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})


/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

// autoUpdater.on('update-downloaded', () => {
//   autoUpdater.quitAndInstall()
// })

// app.on('ready', () => {
//   if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
// })

