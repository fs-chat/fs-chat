import { ipcRenderer } from 'electron'
import storage from 'electron-json-storage'

import store from './store'

import { google } from 'googleapis';
var OAuth2 = google.auth.OAuth2;

export const AUTH_TYPE = {
  READ_ONLY: 'read_only',
  ELEVATED: 'elevated'
};

export function importTokenStorage() {
  storage.get("googleapi", (err, data) => {
    if (!err) {
      if (data.oauthElevatedToken) {
        signInGoogleApi(data.oauthElevatedToken, AUTH_TYPE.ELEVATED);
      }
      if (data.oauthReadOnlyToken){
        signInGoogleApi(data.oauthReadOnlyToken, AUTH_TYPE.READ_ONLY);
      }
    }
  });
}

export function exportTokenStorage() {
  storage.set('googleapi', {
    login_option: store.state.loginOption,
    oauthElevatedToken: store.state.oauthElevatedToken,
    oauthReadOnlyToken: store.state.oauthReadOnlyToken,
  });
}

export function signInGoogleApi(token, type) {
  var auth = new OAuth2(global.__settings.clientId, global.__settings.clientSecret);
  auth.setCredentials(token);

  // Fetch and save user information
  var service = google.youtube('v3');
  service.channels.list({
    auth: auth,
    part: 'snippet,contentDetails,brandingSettings,invideoPromotion,statistics',
    mine: true
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var channels = response.data.items;
    if (channels.length == 0) {
      console.log('No channel found.');
    } else {
      if (type == AUTH_TYPE.READ_ONLY) {
        store.commit('setOauthReadOnlyToken', token);
        store.commit('setReadOnlyChannelInfo', channels[0]);
      }
      else if (type == AUTH_TYPE.ELEVATED) {
        store.commit('setOauthElevatedToken', token);
        store.commit('setElevatedChannelInfo', channels[0]);
      }

      exportTokenStorage();
    }
  });
}

export function signOutGoogleApi() {
  storage.set('googleapi', {});
  store.commit('setOauthReadOnlyToken', null);
  store.commit('setReadOnlyChannelInfo', null);
  store.commit('setOauthElevatedToken', null);
  store.commit('setElevatedChannelInfo', null);
}