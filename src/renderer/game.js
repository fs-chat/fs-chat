import { ipcRenderer } from 'electron'
import moment from 'moment'

import store from './store'
import YoutubeAPI from './youtube_api';

// Betting modes
export const GAME_MODES = {
  FIRST_BET_STANDING: 'first_bet_standing',
  LAST_BET_OVERWRITE: 'last_bet_overwrite',
};

let nextPageToken = null;

var Game = {
  /**
   * Start listening for chat.
   * 
   * @param  {Object} liveChatId    Valid live chat ID
   * @param  {[type]} token         Valid google oAuth token
   */
  init(liveChatId, token) {
    nextPageToken = null;
    store.commit('setLiveChatID', liveChatId);

    function processcomments(comments) {
      if (comments.length > 0) {
        store.commit('pushMessages', comments);
        // console.log(comments);
      }
    }
    
    function fetchcomments() {
      if (liveChatId == store.state.liveChatID) {
        YoutubeAPI.getNewComments(token, liveChatId, nextPageToken, (res) => {
          // Update next page token
          nextPageToken = res.nextPageToken;

          // Process comments
          processcomments(res.items);

          // Wait till API is ready to receive next call..
          console.log('Timeout: ' + res.pollingIntervalMillis);
          setTimeout(fetchcomments, res.pollingIntervalMillis);
        });
      }
    }

    fetchcomments();
  },
  /**
   * Set the landing time and update the "bets" list with the messages that date max X (settings.minutes_before)
   * 
   * @param {String} time     Date object, or null to reset
   */
  setLandingTime(time) {
    if (time) {
      store.commit('clearGame');
      store.commit('setFinalLandingTime', time);

      var gameSettings = store.state.settings.game_settings;
      var gameMode = gameSettings.game_mode;
      var minutesSetting = gameSettings.minutes_before;

      // For date comparison
      var momentLanding = moment(time);

      // Get valid bets for the last (minutes_before) minutes
      var comments = store.state.messages;
      for (var i = 0; i < comments.length; i++) {
        var comment = comments[i];

        // Verify time constraint
        var diffMinutes = Math.abs(moment(comment.snippet.publishedAt).diff(momentLanding, 'minutes'));
        // console.log({diffMinutes, max: minutesSetting, valid: (diffMinutes < minutesSetting)});

        // Check time validity before landing
        if (diffMinutes < minutesSetting) {
          var channelId = comment.snippet.authorChannelId;
          var message = comment.snippet.textMessageDetails.messageText;

          var placeBet = false;
          var deleteBetIndex = false;
          var existingBetIndex = store.state.bets.findIndex(bet => {
            return bet.comment.snippet.authorChannelId == comment.snippet.authorChannelId;
          });

          if (gameMode == GAME_MODES.LAST_BET_OVERWRITE) {
            if (existingBetIndex != -1) {
              // Delete current bet for user
              deleteBetIndex = existingBetIndex;
            }
            placeBet = true;
          } else if (gameMode == GAME_MODES.FIRST_BET_STANDING) {
            if (existingBetIndex == -1) placeBet = true;
          }

          if (placeBet) {
            // Check eligibility for placing bets
            // Must be a string up to 20 characters containing a number
            var numberParse = message.match(/[\d\.]+/g);
            if (numberParse && message.length <= 20) {
              var numbers = numberParse.map(Number);
              if (numbers.length == 1 && !isNaN(numbers[0])) {
                store.commit('placeBet', {  
                  deleteBetIndex: deleteBetIndex,
                  bet: {
                    value: numbers[0],
                    comment: comment
                  }
                });
              }
            }
          }
        }
      }
    }
  },
  /**
   * Upadte the "results" list by comparing each bet with the landing rate.
   * 
   * @param  {String} landingRate 
   */
  compileResults(landingRate) {
    var rate = Math.abs(landingRate);
    var betsCopy = JSON.parse(JSON.stringify(store.state.bets));

    var sorted = betsCopy.map(bet => {
      bet.diff = Math.abs(bet.value - rate);
      return bet;
    }).sort((a, b) => {
      return ((a.diff < b.diff) ? -1 : ((a.diff > b.diff) ? 1 : 0));
    });

    store.commit('setFinalLandingRate', rate);
    store.commit('setResults', sorted);
  },
  /*
   * Reset results 
   */
  resetGame() {
    store.commit('clearGame');
  },
  /**
   * Get a reprensation of the winners to post in chat.
   * @return {String} Top 3 results in text format.
   */
  resultsToText() {
    var results = store.state.results;
    var rate = store.state.finalLandingRate;
    if (results && rate) {
      var winnerTextArr = [];
      var medalEmojis = ['🥇','🥈','🥉'];

      // Display util
      function diffLanding (value, actual) {
        var diff = value - actual;
        if (diff == 0) return 'Exact value!';
        else {
          var diffFixed = (diff % 1 != 0) ? diff.toFixed(1) : diff;
          return (diff>0) ? '+'+diffFixed : diffFixed;
        }
      }

      for (var i = 0; (i < results.length && i < 3); i++) {
        var result = results[i];
        winnerTextArr.push(`${medalEmojis[i]} ${result.comment.authorDetails.displayName}, -${result.value} fpm `+
          `(${diffLanding(result.value,rate)})`)
      }

      return winnerTextArr.join(' || ');
    } else {
      return '';
    }
  },
  /**
   * Bypass calling 'resultsToText' and use this function to post results to chat directly.
   */
  postResultsChat(token) {
    var results = store.state.results;
    var liveChatID = store.state.liveChatID;
    if (token && results.length > 0 && liveChatID) {
      YoutubeAPI.insertComment(token, liveChatID, Game.resultsToText()); 
    }
  }
};

// (External endpoint) Reset results 
// See: src/express/routes.js
ipcRenderer.on('external-clear-results', function(event) {
  console.log("Rate: Reset");
  Game.resetGame();
});

// (External endpoint) Set a final landing rate
// See: src/express/routes.js
ipcRenderer.on('external-compile-results', function(event, { rate }) {
  console.log("Rate: " + rate);
  var token = store.state.oauthElevatedToken;
  if (token && !isNaN(parseFloat(rate)) && isFinite(rate)) {
    Game.setLandingTime(new Date());
    Game.compileResults(rate);
    Game.postResultsChat(token);
  }
});

export default Game;