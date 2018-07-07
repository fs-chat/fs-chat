<template>
  <div>
    <div class="row">
      <div class="col-md-12">
        <div class="card">
          <div class="header">
            <h4 class="title">Game status</h4>
            <p class="category">Information will show here about the state of the contest.</p>

            <div class="pull-right">
              <a href="#" class="btn btn-simple btn-link btn-icon" tag="button" v-if="streamVideoId" title="Edit stream URL" 
                  v-on:click.prevent="editStreamUrl()">  
                <i class="fa fa-pencil-square-o"></i>
              </a>
              <a href="#" class="btn btn-simple btn-link btn-icon" tag="button" v-if="streamVideoId" title="Open live stream in browser" 
                  v-on:click.prevent="openVideoUrl()">  
                <i class="fa fa-youtube-play"></i>
              </a>
              <a href="#" class="btn btn-simple btn-link btn-icon" tag="button" v-if="liveChatID" title="Live chat popup" 
                  v-on:click.prevent="openCommentsModal()">  
                <i class="fa fa-comments-o"></i>
              </a>
              <router-link :to="{name:'LandingGameSettings'}" class="btn btn-simple btn-link btn-icon" tag="button" title="Game settings">  
                <i class="fa fa-cog"></i>
              </router-link>
            </div>
          </div>
          <!-- Needs to be logged in to the API -->
          <div class="content" v-if="oauthElevatedToken">
            <div class="row">
              <div class="col-md-12" >
                <!-- No stream selected -->
                <div v-if="!liveChatID">
                  <div class="form-group">
                    <label>Paste the full video URL (or Youtube gaming)</label>
                    <input type="text" class="form-control" placeholder="https://www.youtube.com/watch?v=[...]" v-model="videoUrlField">
                    <div v-bind:class="{ 'invalid-feedback': urlErrorMsg, 'valid-feedback': !urlErrorMsg }" v-if="urlErrorMsg">{{ urlErrorMsg }}</div>
                  </div>
                  <div class="form-group">
                    <button type="submit" class="btn btn-primary btn-fill" v-on:click.prevent="onSelectVideoUrl()">
                      Select this stream
                    </button>
                  </div>
                </div>
                <!-- Chat ID set, game started -->
                <div v-else>
                  <!-- Before landing -->
                  <div v-if="!finalLandingTime">
                    <!-- Button stop bets (very close to landing) -->
                    <div class="form-group">
                      <button class="btn btn-default btn-fill" v-on:click.prevent="setLandingTimeNow()">
                        Stop registering bets
                      </button>
                    </div>
                  </div>
                  
                  <!-- After landing -->
                  <div v-if="finalLandingTime">
                    <div v-if="bets.length > 0">
                      <div v-if="results.length > 0">
                        <!-- Game results  -->
                        <textarea rows="2" id="final-results" class="form-control" v-model="resultsText"></textarea>

                        <!-- Button to clear/post results -->
                        <div class="form-group">
                          <button type="submit" class="btn btn-danger btn-fill" v-on:click.prevent="clearResults()">
                            Clear results
                          </button>
                          <button type="submit" class="btn btn-default btn-fill" v-on:click.prevent="copyResultTxt()">
                            Copy to clipboard
                          </button>
                          <button type="submit" class="btn btn-default btn-fill" v-on:click.prevent="postResults()">
                            Post results
                          </button>
                        </div><br>
                      </div>
                      <div>
                        <div class="form-group">
                          <label>Final landing rate (actual value)</label>
                          <input type="text" class="form-control" v-model="finalLandingRateField">
                        </div>
                        <div class="form-group">
                          <button type="submit" class="btn btn-primary btn-fill" v-on:click.prevent="compileResults()">
                            <span>Compile results</span>
                          </button>
                          <button type="submit" class="btn btn-default btn-fill" v-on:click.prevent="unsetLandingTime()">
                            Re-open bets
                          </button>
                        </div>
                      </div>

                      <!-- List of bets un-ordred bets -->
                      <ul class="list-group landing-bets-list">
                        <li class="list-group-item d-flex justify-content-between align-items-center" v-for="(bet, index) in bets"
                            v-on:click.prevent="deleteBet(bet,index)">
                          <img :src="bet.comment.authorDetails.profileImageUrl" alt="" class="profile-image">
                          <span class="profile-name">{{ bet.comment.authorDetails.displayName }}</span>
                          <span class="badge badge-secondary badge-pill rate-badge">- {{ bet.value }}</span>
                        </li>
                      </ul>
                    </div>
                    <div v-else>
                      <i>There were bets no in the last few minutes, <a href="#" v-on:click.prevent="unsetLandingTime()">click here to reset</a>.</i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- Not logged in -->
          <div class="content" v-else>
            <div class="row">
              <div class="col-md-12" >
                <i>You must be <router-link to="/settings"> logged in </router-link> to use this functionality.</i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import url from 'url'
import { mapState } from 'vuex'
import { ipcRenderer, shell } from 'electron'

import { Session } from '../main'
import YoutubeAPI from '../youtube_api'
import Game from '../game'
  
import storage from 'electron-json-storage'

export default {
  data() {
    return {
      finalLandingRateField: '',
      finalResultText: '',

      videoUrlField: '',
      urlErrorMsg: ''
    };
  },
  created: function() {
    var self = this;
    this.$store.commit('setTitle', "Landing rate betting game");

    // Get saved settings
    var videoURL = this.$store.state.settings.streamVideoUrl;
    if (videoURL) self.videoUrlField = videoURL;

    var finalRate = this.$store.state.finalLandingRate;
    if (finalRate) {
      this.finalLandingRateField = finalRate;
      this.compileResults();
    }

  },
  computed: {
    ...mapState([
      'title',
      'liveChatID',
      'streamVideoId',
      'bets',
      'results',
      'finalLandingTime',
      'finalLandingRate',
      'oauthElevatedToken'
    ]),
    resultsText() {
      return Game.resultsToText();
    }
  },
  methods: {
    onSelectVideoUrl (request) {
      var self = this;
      self.urlErrorMsg = null;
      var parsedUrl = url.parse(this.videoUrlField, true);

      if (parsedUrl.query.v) {
        var videoId = parsedUrl.query.v;
        var token = this.$store.state.oauthElevatedToken;
        YoutubeAPI.getLiveChatId(token, videoId, (err, liveChatID) => {
          if (err) {
            self.urlErrorMsg = err;
          } else {
            // Start listening for chat
            Game.init(liveChatID, token);
            self.$store.commit("setStreamVideoId", videoId);
            self.$store.commit("setStreamVideoUrl", this.videoUrlField);
            self.$store.dispatch("saveSettings");
          }
        });
      } else {
        self.urlErrorMsg = "Invalid video url format."
      }
    },
    deleteBet (bet, index) {
      if (confirm('You are about to delete ' + bet.comment.authorDetails.displayName+"'s bet. Are you sure?")) {
        this.$store.commit('deleteBet', index);
      }
    },
    setLandingTimeNow (request) {
      Game.setLandingTime(new Date());
    },
    unsetLandingTime (request) {
      Game.resetGame();
      this.finalLandingRateField = '';
    },
    compileResults (request) {
      var answer = this.finalLandingRateField;
      if (!isNaN(parseFloat(answer)) && isFinite(answer)) {
        Game.compileResults(answer);
      }
    },
    openCommentsModal (request) {
      var streamVideoId = this.$store.state.streamVideoId;
      if (streamVideoId) {
        var liveChatUrl = `https://www.youtube.com/live_chat?v=${streamVideoId}&is_popout=1`;
        console.log(liveChatUrl);
        ipcRenderer.send("open-modal-external-url", { 
          title: "Live chat",
          url: liveChatUrl
        });
      }
    },
    openVideoUrl (request) {
      var streamVideoId = this.$store.state.streamVideoId;
      if (streamVideoId) {
        var url = `https://www.youtube.com/watch?v=${streamVideoId}`;
        shell.openExternal(url);
      }
    },
    copyResultTxt (request) {
      $("#final-results").select();
      document.execCommand('copy');
    },
    postResults (request) {
      if (confirm("Post results to chat?")) {
        Game.postResultsChat(this.$store.state.oauthElevatedToken);
      }
    },
    diffLanding (value, actual) {
      var diff = value - actual;
      if (diff == 0) return 'Exact value!';
      else {
        var diffFixed = (diff % 1 != 0) ? diff.toFixed(1) : diff;
        return (diff>0) ? '+'+diffFixed : diffFixed;
      }
    },
    clearResults (request) {
      if (confirm("Clearing results, Are-you sure?")) {
        Game.resetGame();
      }
    },
    editStreamUrl (request) {
      if (confirm("Changing the stream url will clear current data. Are-you sure?")) {
        Game.resetGame();
        this.$store.commit('clearStream');
      }
    },
  },
  watch: {
    // External value change
    finalLandingRate(value) {
      this.finalLandingRateField = value;
    }
  }
};
</script>
