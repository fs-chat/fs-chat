import bus from './main'
import { remote } from 'electron'
import path from 'path'

 /**
  * Tray icon handlers
  */ 
export let tray = new remote.Tray(path.join(__static, '/tray.ico'))
export let menu = remote.Menu.buildFromTemplate([
  {
    label: 'Debug',
    click () {
      var window = remote.getCurrentWindow();
      window.webContents.toggleDevTools();
    }
  },
  {
    label: 'Quitter',
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