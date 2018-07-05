import { ipcRenderer } from 'electron'

import store from './store'
import YoutubeAPI from './youtube_api';

let nextPageToken = null;

var Game = {
  init(liveChatId, token) {
    nextPageToken = null;
    store.commit('setLiveChatID', liveChatId);

    function processNewComments(items) {
      var newComments = items;
      if (newComments.length > 1) {
        store.commit('pushMessages', newComments);
        // console.log(newComments);
      }

      if (store.state.registeringBets) {
        for (var i = 0; i < newComments.length; i++) {
          var newComment = newComments[i];
          var channelId = newComment.snippet.authorChannelId;
          var message = newComment.snippet.textMessageDetails.messageText;

          // Check eligibility for placing bets
          // Must be a string up to 20 characters containing a number
          // Must be the first time the user participates (unique)

          var alreadyBet = false;
          if (global.__settings.uniqueBets) {
            alreadyBet = store.state.bets.find(bet => {
              return bet.comment.snippet.authorChannelId == newComment.snippet.authorChannelId;
            });
          }

          if (alreadyBet) {
            console.log(newComment.authorDetails.displayName + ' as already bet.');
          } else {
            var numberParse = message.match(/[\d\.]+/g);
            if (numberParse && message.length <= 20) {
              var numbers = numberParse.map(Number);
              if (numbers.length == 1 && !isNaN(numbers[0])) {
                var newBet = {
                  value: numbers[0],
                  comment: newComment
                };
                store.commit('placeBet', newBet);
                // console.log(newBet);
              }
            }
          }
        }
      }
    }
    
    function fetchNewComments() {
      if (liveChatId == store.state.liveChatID) {
        YoutubeAPI.getNewComments(token, liveChatId, nextPageToken, (res) => {
          // Update next page token
          nextPageToken = res.nextPageToken;

          // Process comments
          processNewComments(res.items);

          // Wait till API is ready to receive next call..
          console.log('Timeout: ' + res.pollingIntervalMillis);
          setTimeout(fetchNewComments, res.pollingIntervalMillis);
        });
      }
    }

    fetchNewComments();
  },
  startBets() {
    store.commit('setRegisteringBets', true);
  },
  stopBets() {
    store.commit('setRegisteringBets', false);
  },
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
  stopGame() {
    store.commit('clearGame');
  },
  resultsToText() {
    var results = store.state.results;
    var rate = store.state.finalLandingRate;
    if (results && rate) {
      var winnerTextArr = [];
      var medalEmojis = ['🥇','🥈','🥉'];
      // var medalEmojis = [':first_place:',':second_place:',':third_place:']; /* ['🥇','🥈','🥉'] */
      // var resultText = `Final landing rate: -${this.finalLandingRate} fpm`;

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
  postResultsChat() {
    var token = store.state.oauthElevatedToken;
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
  console.log("rest");
  Game.stopGame();
});

// (External endpoint) Set a final landing rate
// See: src/express/routes.js
ipcRenderer.on('external-compile-results', function(event, { rate }) {
  console.log("Rate: " + rate);
  if (!isNaN(parseFloat(rate)) && isFinite(rate)) {
    Game.stopBets(rate);
    Game.compileResults(rate);
    Game.postResultsChat();
  }
});

export default Game;