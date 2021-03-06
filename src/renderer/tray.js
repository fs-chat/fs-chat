import bus from './main'
import { remote } from 'electron'
import path from 'path'
import email from 'emailjs';

export function sendLogs() {
  var server  = email.server.connect({
    user:     global.__settings.smtpLogin, 
    password: global.__settings.smtpPassword, 
    host:     global.__settings.smtpHost, 
    port:     587, 
    tls:      true
  });

  var report = {
    logs: console.logs,
    errors: console.errors
  };
  server.send({
    from:    `Debug FS CHAT <${global.__settings.smtpLogin}>`, 
    to:      "Francis <francis.bourassa@hotmail.fr>",
    subject: "BUG REPORT - FS CHAT",
    text:    JSON.stringify(report, null, 2)
  }, function(err, message) { console.log(err || message); });
}

 /**
  * Tray icon handlers
  */ 
export let tray = new remote.Tray(path.join(__static, '/tray.ico'))
export let menu = remote.Menu.buildFromTemplate([
  {
    label: 'Send log report',
    click () {
      sendLogs();
    }
  },
  {
    label: 'Debug',
    click () {
      var window = remote.getCurrentWindow();
      window.webContents.toggleDevTools();
    }
  },
  {
    label: 'Quit',
    click () {
      sendLogs();
      remote.app.quit();
    }
  }
])

tray.on('click', function (e, bounds) {
  bus.$emit('trayClicked');
  var window = remote.getCurrentWindow();
  (window.isVisible()) ? window.hide() : window.show();
});

tray.setToolTip('FS Chat')
tray.setContextMenu(menu)