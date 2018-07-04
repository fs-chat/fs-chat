import Vue from 'vue'
import Vuex from 'vuex'
import _ from 'underscore';
import deepExtend from 'deep-extend';
import storage from 'electron-json-storage'

Vue.use(Vuex)

export default new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production',
  state: {
    // Variables
    title: "FS Chat",

    // Betting game
    streamVideoUrl: null,
    streamVideoId: null,
    liveChatID: null,
    registeringBets: false,
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

    setLiveChatID (state, liveChatID) {
      state.liveChatID = liveChatID;
    },
    setStreamVideoUrl(state, streamVideoUrl) {
      state.streamVideoUrl = streamVideoUrl;
    },
    setStreamVideoId(state, streamVideoId) {
      state.streamVideoId = streamVideoId;
    },
    setRegisteringBets (state, isRegistering) {
      state.registeringBets = isRegistering;
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
    setFinalLandingRate (state, finalLandingRate) {
      state.finalLandingRate = finalLandingRate;
    },
    setResults (state, results) {
      state.results = results;
    },
    clearGame (state) {
      state.registeringBets = false;
      state.bets = [];
      state.results = [];
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
    saveSettings ({ state }) {
      return new Promise((resolve, reject) => {
        storage.set('settings', { 
          streamVideoUrl: state.streamVideoUrl
        }, function(error) {
          if (error) reject();
          else resolve();
        });
      })
    }
  }
})