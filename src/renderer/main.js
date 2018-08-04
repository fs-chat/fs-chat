import Vue from 'vue'
import axios from 'axios'
import _ from 'underscore';
import moment from 'moment'
import URL from 'url'
import path from 'path'

import App from './App'
import router from './router'
import store from './store'
import { ipcRenderer, remote } from 'electron'
import Updates from './updates'
import Game from './game'

import { tray } from './tray'
import { signInGoogleApi, AUTH_TYPE,
  importTokenStorage } from './auth'
import storage from 'electron-json-storage'

import VeeValidate from 'vee-validate';

console.logs = []; // Logging util

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
if (process.env.NODE_ENV == 'development') {
  global.__settings = require('../settings/settings.dev.js').default;
} else {
  global.__settings = require('../settings/settings.prod.js').default;
  // Production logging utils
  console.stdlog = console.log.bind(console);
  console.log = function(){
    console.logs.push({
      time: moment().toString(),
      log: Array.from(arguments)
    });
    console.stdlog.apply(console, arguments);
  }
}

Updates.listenForUpdates();

Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

Vue.use(VeeValidate, {
  locale: "en"
})

// Vuex store restore utils
const initialStateCopy = JSON.parse(JSON.stringify(store.state))
export function resetState() {
  store.replaceState(JSON.parse(JSON.stringify(initialStateCopy)))
}

ipcRenderer.on('login-google-result', function(event, data) {
  if (data.type == AUTH_TYPE.ELEVATED) {
    var tokenElevated = data.token;
    signInGoogleApi(tokenElevated, data.type);
  } else if (data.type == AUTH_TYPE.READ_ONLY) {
    var tokenReadOnly = data.token;
    signInGoogleApi(tokenReadOnly, data.type);
  }
});

// Resume last session
importTokenStorage();

// Init Event listeners for external API
Game.createEndpointListeners();

var mainWindow = remote.getCurrentWindow();
mainWindow.tray = tray;

mainWindow.onbeforeunload = (e) => {
  if (mainWindow.tray) {
    mainWindow.tray.destroy();
  }
};

/* eslint-disable no-new */
export default new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
