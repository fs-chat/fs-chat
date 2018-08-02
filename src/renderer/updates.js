import { autoUpdater } from 'electron-updater'
import { ipcRenderer, remote } from 'electron'
import store from './store'

export default {
  listenForUpdates() {
  	ipcRenderer.on('updateStatusMessage', function(event, text) {
	  	store.commit("setUpdateStatusText", text);
		})

  	ipcRenderer.on('updateAvailable', function(event, updateInfo) {
	  	store.commit("setUpdateAvailable", updateInfo);
		})

  	ipcRenderer.on('updateDownloaded', function(event, isDownloaded) {
	  	store.commit("setUpdateDownloaded", isDownloaded);
		})
  }
}