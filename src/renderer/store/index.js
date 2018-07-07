import Vue from 'vue'
import Vuex from 'vuex'
import _ from 'underscore';
import deepExtend from 'deep-extend';
import storage from 'electron-json-storage'

import { GAME_MODES } from '../game'

export const DEFAULT_SETTINGS = { 
  streamVideoUrl: '',
  game_settings: {
    game_mode: GAME_MODES.LAST_BET_OVERWRITE,
    minutes_before: 10
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
    streamVideoUrl: null,
    streamVideoId: null,
    liveChatID: null,
    finalLandingTime: null,
    finalLandingRate: null,
    messages: [],
    bets: [],
    results: [],

    // Google API
    loginOption: null,
    oauthElevatedToken: null,
    elevatedChannelInfo: null,
    oauthReadOnlyToken: null,
    readOnlyChannelInfo: null
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
    setStreamVideoId(state, streamVideoId) {
      state.streamVideoId = streamVideoId;
    },
    pushMessages (state, messages) {
      for (var i = 0; i < messages.length; i++) {
        state.messages.push(messages[i]);
      }
    },
    placeBet (state, { bet, deleteBetIndex }) {
      if (typeof deleteBetIndex != 'undefined') {
        Vue.delete(state.bets, deleteBetIndex);
      }
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
          commit('setStreamVideoUrl', extendSettings.streamVideoUrl);

          resolve();
        });
      })
    },
    saveSettings ({ state, commit }) {
      return new Promise((resolve, reject) => {
        storage.set('settings', {
          ...state.settings,
          streamVideoUrl: state.streamVideoUrl
        }, function(error) {
          if (error) reject();
          else resolve();
        });
      })
    }
  }
})