import Vue from 'vue'
import Vuex from 'vuex'
import _ from 'underscore';
import deepExtend from 'deep-extend';
import storage from 'electron-json-storage'
import { resultsDb } from '../database'
import moment from 'moment'

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
    streamTitle: null,
    liveChatID: null,
    finalLandingTime: null,
    finalLandingRate: null,
    resetIndex: 0,
    messages: [],
    bets: [],
    results: [],

    // Leaderboard
    leaderboardData: [],
    loaderboardLoading: true,
    latestLeaderboardIndex: 0,
    leaderboardSort: 'medalValue',
    leaderboardTimeSince: 'all',
    leaderboardSortReverse: true,
    leaderboardInterval: null,

    // Local Database adapter
    databaseLoaded: false,

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
    setStreamTitle(state, streamTitle) {
      state.streamTitle = streamTitle;
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
    clearGame (state, reset=true) {
      // Set the reset index to avoid old messages on next calculation
      if (reset) state.resetIndex = state.messages.length;

      state.bets = [];
      state.results = [];
      state.finalLandingTime = null;
      state.finalLandingRate = null;
    },
    clearStream (state) {
      state.liveChatID = null;
      state.streamVideoId = null;
      state.messages = [];
      state.resetIndex = 0;
    },
    setResetIndex (state, resetIndex) {
      state.resetIndex = resetIndex;
    },
    clearResetIndex (state) {
      state.resetIndex = 0;
    },

    setLatestLeaderboardIndex (state, latestLeaderboardIndex) {
      state.latestLeaderboardIndex = latestLeaderboardIndex;
    },
    setLeaderboardData (state, leaderboardData) {
      state.leaderboardData = leaderboardData;
    },
    setLeaderboardLoading (state, loaderboardLoading) {
      state.loaderboardLoading = loaderboardLoading;
    },
    setLeaderboardTimeSince (state, leaderboardTimeSince) {
      state.leaderboardTimeSince = leaderboardTimeSince;
    },
    setLeaderboardSortBy (state, { keyword, reverse }) {
      state.leaderboardSort = keyword;
      state.leaderboardSortReverse = reverse;
    },
    setLeaderboardInterval (state, leaderboardInterval) {
      state.leaderboardInterval = leaderboardInterval;
    },

    setDatabaseLoaded (state, databaseLoaded) {
      state.databaseLoaded = databaseLoaded;
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
    },
    updateLeaderboardData ({ state, commit }) {
      return new Promise((resolve, reject) => {
        commit('setLeaderboardLoading', true);
        
        var args = {};
        var dateStart;
        var since = state.leaderboardTimeSince;

        // Create date rage
        if (since == 'today') dateStart = moment();
        else if (since == '1M') dateStart = moment().subtract(1,'months');
        else if (since == '2M') dateStart = moment().subtract(2,'months');
        else if (since == '3M') dateStart = moment().subtract(3,'months');
        else if (since == '6M') dateStart = moment().subtract(6,'months');
        else if (since == 'year') dateStart = moment().subtract(1,'year');

        if (dateStart) {
          args.date = { $gt: dateStart.startOf('day').toISOString() };
        }

        // Fetch date range against local data store
        var results = resultsDb.find(args, function (err, results) {
          // Group users together with reduce
          var grouped = results.reduce((users, result) => {
            var channelId = result.user.channelId;

            if (!users.hasOwnProperty(channelId)) {
              users[channelId] = {
                user: result.user, results: []
              }
            }

            users[channelId].results.push(result);
            return users;
          }, {});

          // Calculate stats for each user
          var resultsData = Object.keys(grouped).map(key => {
            var user = grouped[key];
            var nbComments = user.results.length;
            var medalsText = "";

            var precisionSum = 0;
            var average = null;
            var nbCharacters = 0;

            var medalValue = 0;
            var medals = { gold: 0, silver: 0, bronze: 0 };

            for (var i = 0; i < user.results.length; i++) {
              var result = user.results[i];

              var rank = result.rank;
              if (rank <= 3) {
                if (rank == 1) medals.gold++;; 
                if (rank == 2) medals.silver++;
                if (rank == 3) medals.bronze++;
              }

              precisionSum += parseFloat(result.precision);
              nbCharacters += result.message.length;
            }

            // Medal text and value
            medalValue = (medals.gold*4.5 + medals.silver*3 + medals.bronze*2);
            for (var j = 0; j < medals.gold; j++) { medalsText += '🥇 '; }
            for (var j = 0; j < medals.silver; j++) { medalsText += '🥈 '; }
            for (var j = 0; j < medals.bronze; j++) { medalsText += '🥉 '; }

            if (precisionSum > 0) {
              average = parseFloat((precisionSum / nbComments).toFixed(2));
            }

            return { 
              user: user.user, 
              nbComments, average, nbCharacters, medalsText, medalValue 
            };
          });

          // Update (leaderboardData) table with data
          commit('setLeaderboardData', resultsData);
          commit('setLeaderboardLoading', false);
        });
      })
    }
  }
})