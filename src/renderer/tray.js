import bus from './main'
import { remote } from 'electron'
import path from 'path'
import email from 'emailjs';

 /**
  * Tray icon handlers
  */ 
export let tray = new remote.Tray(path.join(__static, '/tray.ico'))
export let menu = remote.Menu.buildFromTemplate([
  {
    label: 'Send log report',
    click () {
      var server  = email.server.connect({
        user:     global.__settings.smtpLogin, 
        password: global.__settings.smtpPassword, 
        host:     global.__settings.smtpHost, 
        port:     587, 
        tls:      true
      });

      server.send({
        from:    `Debug FS CHAT <${global.__settings.smtpLogin}>`, 
        to:      "Francis <francis.bourassa@hotmail.fr>",
        subject: "BUG REPORT - FS CHAT",
        text:    JSON.stringify(console.logs, null, 2)
      }, function(err, message) { console.log(err || message); });
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