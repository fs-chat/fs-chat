import { ipcRenderer } from 'electron'
import storage from 'electron-json-storage'
import request from 'request'

import store from './store'
import syncUtils from './sync_utils'

import { google } from 'googleapis';
var OAuth2 = google.auth.OAuth2;

export const AUTH_TYPE = {
  READ_ONLY: 'read_only',
  ELEVATED: 'elevated'
};

export var auth;

export function importTokenStorage() {
  storage.get("googleapi", (err, data) => {
    if (!err) {
      if (data.oauthElevatedToken) {
        signInGoogleApi(data.oauthElevatedToken, AUTH_TYPE.ELEVATED);
      }
      if (data.oauthReadOnlyToken){
        signInGoogleApi(data.oauthReadOnlyToken, AUTH_TYPE.READ_ONLY);
      }
      if (data.oauthStreamlabsToken){
        signInStreamlabsApi(data.oauthStreamlabsToken, false);
      }
      if (data.syncApiToken){
        store.commit('setSyncApiToken', data.syncApiToken);
        syncUtils.sync_results();
      }
    }
  });
}

export function exportTokenStorage() {
  storage.set('googleapi', {
    login_option: store.state.loginOption,
    oauthElevatedToken: store.state.oauthElevatedToken,
    oauthReadOnlyToken: store.state.oauthReadOnlyToken,
    oauthStreamlabsToken: store.state.oauthStreamlabsToken,
    syncApiToken: store.state.syncApiToken,
  });
}

export function signInGoogleApi(token, type) {
  auth = new OAuth2(global.__settings.clientId, global.__settings.clientSecret);
  auth.on('tokens', (token) => {
    if (token.refresh_token) {
      // store the new token locally
      console.log(token);
      store.commit('setOauthElevatedToken', token);
      exportTokenStorage();
    }
  });

  auth.setCredentials(token);

  // Fetch and save user information
  var service = google.youtube('v3');
  service.channels.list({
    auth: auth,
    part: 'snippet,contentDetails,brandingSettings,invideoPromotion,statistics',
    mine: true
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ', err);
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

/**
 * Stores the tokens locally.
 * @param  {[type]} token  Result of the OAuth request
 */
export function signInStreamlabsApi(token, save=true) {
  var options = { method: 'GET',
    url: 'https://streamlabs.com/api/v1.0/user',
    qs: { access_token: token.access_token } };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    else {
      var accountInfo = JSON.parse(body);
      if (accountInfo) {
        store.commit('setStreamlabsAccountInfo', accountInfo);
      }
    }
  });

  store.commit('setOauthStreamlabsToken', token);
  if (save) exportTokenStorage();
}

export function signOutStreamlabsApi() {
  store.commit('setOauthStreamlabsToken', null);
  exportTokenStorage();
}
