import Vue from 'vue'
import Vuex from 'vuex'
import _ from 'underscore';
import deepExtend from 'deep-extend';
import storage from 'electron-json-storage'

export const DEFAULT_SETTINGS = { 
  streamChannelUrl: '',
  game_settings: {
    game_mode: 'last_bet_overwrite',
    minutes_before: 10,
    stream_delay_sec: 15,
    rounded_rate: false,
    vote_end_messages: [
      'EVERYONE: Voting for the landing rate has been closed. Good luck!'
    ]
  }
};

Vue.use(Vuex)

export default new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production',
  state: {
    // Variables
    title: "FS Chat",
    settings: {},

    // Betting game
    streamChannelUrl: null,
    streamVideoUrl: null,
    streamVideoId: null,
    liveChatID: null,
    finalLandingTime: null,
    finalLandingRate: null,
    resetIndex: 0,
    messages: [],
    bets: [],
    results: [],

    // Google API
    loginOption: null,
    oauthElevatedToken: null,
    elevatedChannelInfo: null,
    oauthReadOnlyToken: null,
    readOnlyChannelInfo: null,

    // Update info
    updateStatusText: "",
    updateNotificationSent: false,
    updateSkipConfirm: false,
    updateAvailable: null,
    updateDownloaded: false,
    updateDownloading: false,
  },
  getters: {
    getObj: ( state ) => ( collection, id ) => {
      var obj = null;
      if (state.hasOwnProperty(collection) ) {
        obj = state[collection].find(obj => obj.id == id);
      }
      return obj;
    }
  },
  mutations: {
    setTitle (state, title) {
      document.title = `FS Chat - ${title}`;
      state.title = title;
    },

    setSettings (state, settings) {
      state.settings = settings;
    },
    setLiveChatID (state, liveChatID) {
      state.liveChatID = liveChatID;
    },
    setStreamVideoUrl(state, streamVideoUrl) {
      state.streamVideoUrl = streamVideoUrl;
    },
    setStreamChannelUrl(state, streamChannelUrl) {
      state.streamChannelUrl = streamChannelUrl;
    },
    setStreamVideoId(state, streamVideoId) {
      state.streamVideoId = streamVideoId;
    },
    pushMessages (state, messages) {
      for (var i = 0; i < messages.length; i++) {
        state.messages.push(messages[i]);
      }
    },
    placeBet (state, bet) {
      state.bets.push(bet);
    },
    deleteBet (state, indexDelete) {
      Vue.delete(state.bets, indexDelete);
    },
    setFinalLandingTime (state, finalLandingTime) {
      state.finalLandingTime = finalLandingTime;
    },
    setFinalLandingRate (state, finalLandingRate) {
      state.finalLandingRate = finalLandingRate;
    },
    setResults (state, results) {
      state.results = results;
    },
    clearGame (state) {
      // Set the reset index to avoid old messages on next calculation
      state.resetIndex = state.messages.length;

      state.bets = [];
      state.results = [];
      state.finalLandingTime = null;
      state.finalLandingRate = null;
    },
    clearStream (state) {
      state.liveChatID = null;
      state.streamVideoId = null;
      state.messages = [];
    },
    clearResetIndex (state) {
      state.resetIndex = 0;
    },

    setLoginOption (state, loginOption) {
      state.loginOption = loginOption;
    },

    setOauthElevatedToken (state, token) {
      state.oauthElevatedToken = token;
    },
    setElevatedChannelInfo (state, info) {
      state.elevatedChannelInfo = info;
    },

    setOauthReadOnlyToken (state, token) {
      state.oauthReadOnlyToken = token;
    },
    setReadOnlyChannelInfo (state, info) {
      state.readOnlyChannelInfo = info;
    },

    setUpdateDownloading (state, status) {
      state.updateDownloading = status;
    },
    setUpdateStatusText (state, status) {
      state.updateStatusText = status;
    },
    setUpdateAvailable (state, updateInfo) {
      state.updateAvailable = updateInfo;
    },
    setUpdateNotificationSent (state, isSent) {
      state.updateNotificationSent = isSent;
    },
    setUpdateSkipConfirm (state, isSkip) {
      state.updateSkipConfirm = isSkip;
    },
    setUpdateDownloaded (state, isDownloaded) {
      state.updateDownloaded = isDownloaded;
    },

    updateObj (state, {collection, obj}) {
      if (state.hasOwnProperty(collection) ) {
        // console.log("update " + collection);
        var index = _.findIndex(state[collection], {id:obj.id});
        if (index != -1) {
          var objUpdate = deepExtend(state[collection][index], obj);
          state[collection][index] = objUpdate;
        } else {
          state[collection].push(obj);
        }
      }
    },
    deleteObj (state, {collection, id}) {
      if (state.hasOwnProperty(collection) ) {
        var index = _.findIndex(state[collection], {id: id});
        if (index != -1) state[collection].splice(index, 1);
      }
    }
  },
  actions: {
     getSettings ({ state, commit }) {
      return new Promise((resolve, reject) => {
        storage.get('settings', function(error, settings) {
          // Import and merge saved settings
          var extendSettings = deepExtend(DEFAULT_SETTINGS, settings||{});
          commit('setSettings', extendSettings);
          commit('setStreamChannelUrl', extendSettings.streamChannelUrl);

          resolve();
        });
      })
    },
    saveSettings ({ state, commit }) {
      return new Promise((resolve, reject) => {
        storage.set('settings', {
          ...state.settings,
          streamChannelUrl: state.streamChannelUrl
        }, function(error) {
          if (error) reject();
          else resolve();
        });
      })
    }
  }
})