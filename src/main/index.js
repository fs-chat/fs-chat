import { app, BrowserWindow, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import { OAuth2Provider } from 'electron-oauth-helper'
import dgram from 'dgram'
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
    frame: false,
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
      width: 600,
      height: 800,
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

  ipcMain.on('login-streamlabs', function(event, { scope }) {
    const config = {
      client_id: __settings.streamLabsClientId,
      client_secret: __settings.streamLabsClientSecret,
      scope: scope,
      response_type: "code",
      redirect_uri: "http://127.0.0.1",
      authorize_url: "https://streamlabs.com/api/v1.0/authorize",
      access_token_url: "https://streamlabs.com/api/v1.0/token",
    };

    const window = new BrowserWindow({
      width: 600,
      height: 800,
      center: true,
      show: true,
      resizable: false,
      autoHideMenuBar: true,
      webPreferences: {
        devTools : false,
        nodeIntegration: false, // We recommend disabling nodeIntegration for security.
        contextIsolation: true // We recommend enabling contextIsolation for security.
        // see https://github.com/electron/electron/blob/master/docs/tutorial/security.md
      }
    });

    const provider = new OAuth2Provider(config);
    provider.perform(window)
      .then(resp => {
        window.close();
        mainWindow.webContents.send("login-streamlabs-result", {
          token: resp
        });

      }).catch(error => { 
        console.error(error);
      })
  });

  // Start express server for external landing endpoint
  expressInit(mainWindow);

  // Start listening for UDP
  const server = dgram.createSocket('udp4');
  server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
  });

  server.on('message', (msg, rinfo) => {
    mainWindow.webContents.send("receive-udp-message", {
      msg, rinfo
    });

    if (msg == 'ping') {
      server.send('pong', UDP_PORT, 'localhost', (err) => {
        // ...
      });
    }
  });

  server.on('listening', () => {
    const address = server.address();
    console.log(`server listening ${address.address}:${address.port}`);
  });

  var UDP_PORT = global.__settings.udp_port || 7;
  server.bind(UDP_PORT);

  ipcMain.on('send-udp-message', function(event, { msg }) {
    const message = Buffer.from(msg);
    const client = dgram.createSocket('udp4');
    client.send(message, UDP_PORT, 'localhost', (err) => {
      client.close();
    });
  });
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

