import { ipcRenderer } from 'electron'
import moment from 'moment'

import store from './store'
import YoutubeAPI from './youtube_api';

// Betting modes
export const GAME_MODES = {
  LAST_BET_OVERWRITE: 'last_bet_overwrite',
  FIRST_BET_STANDING: 'first_bet_standing'
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
        for (var i=0; i < comments.length; i++) {
          comments[i].publishedAt = new Date();
        }
        
        store.commit('pushMessages', comments);
        // console.log(comments);
      }
    }
    
    function fetchNewComments() {
      if (liveChatId == store.state.liveChatID) {
        YoutubeAPI.getNewComments(liveChatId, nextPageToken, (err, res) => {
          if (err) {
            console.log("Retry on API error after timeout.");
            setTimeout(fetchNewComments, 15000);
          } else {
            // Update next page token
            nextPageToken = res.nextPageToken;

            // Process comments
            processcomments(res.items);

            // Wait till API is ready to receive next call..
            // console.log('Timeout: ' + res.pollingIntervalMillis);
            setTimeout(fetchNewComments, res.pollingIntervalMillis);
          }
        });
      }
    }

    fetchNewComments();
  },
  /**
   * Set the landing time and update the "bets" list with the messages that date max X (settings.minutes_before)
   * 
   * @param {String} time     Date object, or null to reset
   * @param {String} reset    Wether we set a reset index or not
   */
  setLandingTime(time, reset=true) {
    if (time) {
      // Make a copy of the previous reset index
      // The reset index is the index of the next comment to start from
      var resetIndex = store.state.resetIndex;

      store.commit('clearGame', reset);
      store.commit('setFinalLandingTime', time);

      var gameSettings = store.state.settings.game_settings;
      var gameMode = gameSettings.game_mode;
      var minutesSetting = gameSettings.minutes_before;

      // For date comparison
      var momentLanding = moment(time);

      // Get valid bets for the last (minutes_before) minutes
      var comments = store.state.messages;
      for (var i = resetIndex; i < comments.length; i++) {
        try {
          var comment = comments[i];
          var momentPublishedAt = moment(comment.publishedAt);

          // Verify time constraint in minutes before landing
          var diffMinutes = Math.abs(momentPublishedAt.diff(momentLanding, 'minutes'));
          // console.log({diffMinutes, max: minutesSetting, valid: (diffMinutes < minutesSetting)});

          // Check time validity before landing
          if (diffMinutes < minutesSetting) {
            var channelId = comment.snippet.authorChannelId;
            var message = comment.snippet.textMessageDetails.messageText;

            var placeBet = false;
            var deleteBetIndex = null;
            var existingBetIndex = store.state.bets.findIndex(bet => {
              return bet.comment.snippet.authorChannelId == comment.snippet.authorChannelId;
            });

            if (global.__settings.multipleBets == true) {
              placeBet = true;
            } else if (gameMode == GAME_MODES.LAST_BET_OVERWRITE) {
              if (existingBetIndex != -1) {
                // Delete current bet for user
                deleteBetIndex = existingBetIndex;
              }
              placeBet = true;
            } else if (gameMode == GAME_MODES.FIRST_BET_STANDING) {
              if (existingBetIndex == -1) placeBet = true;
            }

            if (placeBet && message) {
              // Check eligibility for placing bets
              // Must be a string up to 20 characters containing a number
              var numberParse = message.match(/[\d\.]+/g);
              if (numberParse && message.length <= 20) {
                var numbers = numberParse.map(Number);
                if (numbers.length == 1 && !isNaN(numbers[0])) {
                  if (deleteBetIndex != null) store.commit('deleteBet', deleteBetIndex); 
                  store.commit('placeBet', {  
                    value: numbers[0],
                    comment: comment
                  });
                }
              }
            }
          }
        } catch (err) {
          console.log("Error parsing comment: " + comments[i]);
          console.log(err);
        }
      }

      // Notifiy chat that the voting game has ended
      if (store.state.bets.length > 0) {
        var endMessages = gameSettings.vote_end_messages;
        // Has to be at least one message to enable the feature
        if (endMessages && endMessages.length > 0) {
          var message = endMessages[Math.floor(Math.random()*endMessages.length)];
          var token = store.state.oauthElevatedToken;
          var liveChatID = store.state.liveChatID;

          if (token && liveChatID) {
            YoutubeAPI.insertComment(liveChatID, message); 
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
    var gameSettings = store.state.settings.game_settings;
    var bets = JSON.parse(JSON.stringify(store.state.bets));
    var nowDate = moment().toISOString();

    var rate = Math.abs(landingRate);
    if (gameSettings.rounded_rate) {
      rate = Math.round(rate);
    }

    var results = bets.map(bet => {
      var diff = bet.value - rate;
      bet.diff = Math.abs(diff);
      bet.diffReal = diff;
      return bet;
    }).sort((a, b) => {
      return ((a.diff < b.diff) ? -1 : ((a.diff > b.diff) ? 1 : 0));
    });

    // Calculate rank ...
    // Flags to handle equal rank
    var lastRank = null;
    var lastDiff = null;

    for (var i = 0; i < results.length; i++) {
      var rank = i+1;
      var result = results[i];
      var diffValue = result.diff;

      if (diffValue == lastDiff) rank = lastRank;
      result.rank = rank;

      lastRank = rank;
      lastDiff = diffValue;

      try {
        // Save result to local database
        store.dispatch('saveResultLeaderboard', {
          id: result.comment.id,
          precision: diffValue,
          message: result.comment.snippet.textMessageDetails.messageText,
          date: nowDate,
          isMedal: (rank <= 3 && i < 3),
          rank: rank,
          user: {
            channelId: result.comment.authorDetails.channelId,
            profileImageUrl: result.comment.authorDetails.profileImageUrl,
            displayName: result.comment.authorDetails.displayName
          }
        });
      } catch (e) {
        console.log(e);
      }
    }

    // Save results and context
    store.commit('setFinalLandingRate', rate);
    store.commit('setResetIndex', store.state.messages.length);
    store.commit('setResults', results);

    // This will trigger a refresh of the leaderboard page
    store.commit('setLeaderboardUpToDate', false);
  },
  /*
   * Reset results 
   * @param {String} reset    Wether we set a reset index or not
   */
  resetGame(reset=true) {
    store.commit('clearGame', reset);
  },
  /**
   * Get a reprensation of the winners to post in chat.
   * @return {String} Top 3 results in text format.
   */
  resultsToText() {
    var results = store.state.results;
    var rate = store.state.finalLandingRate;
    var rateShow = (rate % 1 != 0) ? rate.toFixed(2) : rate;

    if (results && rate) {
      var winnerTextArr = [`FINAL RATE -${rateShow} FPM`];
      var medalEmojis = ['🥇','🥈','🥉'];

      // Display util
      function diffText (diff) {
        if (diff == 0) return 'Exact value!';
        else if (Math.abs(diff) <= 0.1) return 'Very close!';
        else {
          var diffFixed = (diff % 1 != 0) ? diff.toFixed(1) : diff;
          return (diff>0) ? '+'+diffFixed : diffFixed;
        }
      }

      // Construct results string
      for (var i = 0; (i < results.length && i < 3); i++) {
        var result = results[i];
        var medal = medalEmojis[result.rank-1];
        winnerTextArr.push(`${medal} ${result.comment.authorDetails.displayName}, -${result.value} fpm `+
          `(${diffText(result.diffReal)})`)
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
      YoutubeAPI.insertComment(liveChatID, Game.resultsToText()); 
    }
  },
  /**
   * Receives messages from external API (Dan Berry's plugin)
   */
  receiveExternalMessage(rate) {
    if (rate == 'reset') {
      console.log("Rate: Reset");
      Game.resetGame();
    }
    else {
      console.log("Rate: " + rate);
      var token = store.state.oauthElevatedToken;
      var liveChatID = store.state.liveChatID;

      if (token && liveChatID && !isNaN(parseFloat(rate)) && isFinite(rate)) {
        Game.setLandingTime(new Date());
        Game.compileResults(rate);

        if (store.state.results.length > 0) {
          var resultText = Game.resultsToText();

          // Post results to chat but wait for stream delay
          var gameSettings = store.state.settings.game_settings;
          var secondsDelay = gameSettings.stream_delay_sec || 15;
          console.log("Wait " + secondsDelay + " seconds and post results...");

          setTimeout(function () {
            console.log("=> Post results");
            YoutubeAPI.insertComment(liveChatID, resultText); 
          }, (secondsDelay * 1000));
        } else {
          console.log("No results to show.");
        }
      } else {
        // console.log(token);
        // console.log(rate);
      }
    }
  },
  /*
   * Express server fallback.
   */
  createEndpointListeners() {
    // (External endpoint) Reset results 
    // See: src/express/server.js
    ipcRenderer.on('external-clear-results', function(event) {
      Game.receiveExternalMessage("reset");
    });

    // (External endpoint) Set a final landing rate
    // See: src/express/server.js
    ipcRenderer.on('external-compile-results', function(event, { rate }) {
      Game.receiveExternalMessage(rate);
    });
  }
};

export default Game;