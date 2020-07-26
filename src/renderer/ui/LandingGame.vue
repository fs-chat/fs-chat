<template>
  <div>
    <div class="row">
      <div class="col-md-12">
        <div class="card">
          <div class="header">
            <h4 class="title">Game status</h4>
            <p class="category">Information will show here about the state of the contest.</p>

            <div class="pull-right">
              <a href="#" class="btn btn-simple btn-link btn-icon" tag="button" v-if="streamVideoId" title="Edit channel URL" 
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
                    <label>Paste the full channel or video URL 
                      <a href="#" v-on:click.prevent="useOwnChannelUrl()">(Use own channel)</a></label>
                    <input type="text" class="form-control" placeholder="https://www.youtube.com/channel/[...]" v-model="channelUrlField">
                    <div v-bind:class="{ 'invalid-feedback': urlErrorMsg, 'valid-feedback': !urlErrorMsg }" v-if="urlErrorMsg">{{ urlErrorMsg }}</div>
                  </div>
                  <div class="form-group">
                    <button type="submit" class="btn btn-primary btn-fill" v-on:click.prevent="onSelectChannelUrl()">
                      Select this channel
                    </button>
                  </div>
                </div>
                <!-- Chat ID set, game started -->
                <div v-else>
                  <!-- Before landing -->
                  <div v-if="!finalLandingTime">
                    <!-- Button stop bets (very close to landing) -->
                    <div class="form-group">
                      <b>Current Stream: </b> {{ streamTitle }}
                    </div>

                    <div class="form-group">
                      <button class="btn btn-danger btn-fill btn-stop-bets" v-on:click.prevent="setLandingTimeNow()"
                          data-toggle="tooltip" data-placement="right" title="This is done automatically by   Dan Berry's plugin">
                        Stop accepting bets
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
                          <span class="profile-name">{{ bet.comment.authorDetails.displayName }}</span>
                          <span class="badge badge-secondary badge-pill rate-badge">- {{ bet.value }}</span>
                        </li>
                      </ul>
                    </div>
                    <div v-else>
                      <div class="form-group" v-if="resetIndex != 0">
                        <i>There were no bets in the last {{ settings.game_settings.minutes_before }} minutes or since the last landing.</i>
                          <a href="#" v-on:click.prevent="clearResetIndex()">Click here to disregard reset time.</a><br>
                      </div>
                      <div class="form-group" v-else>
                        <i>There were no bets in the last {{ settings.game_settings.minutes_before }} minutes.</i>
                      </div>

                      <div class="form-group">
                        <button type="submit" class="btn btn-default btn-fill" v-on:click.prevent="unsetLandingTime()">
                          Click here to go back
                        </button>
                      </div>
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
                <i>You must associate a <router-link to="/settings">Youtube account</router-link> to use this functionality.</i>
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

      channelUrlField: '',
      urlErrorMsg: ''
    };
  },
  mounted: function() {
    $('body').tooltip({
      selector: '.btn-stop-bets',
      delay: 0
    });
  },
  created: function() {
    var self = this;
    this.$store.commit('setTitle', "Landing rate betting game");

    // Get saved settings
    var channelUrl = this.$store.state.settings.streamChannelUrl;
    if (channelUrl) self.channelUrlField = channelUrl;

    var finalRate = this.$store.state.finalLandingRate;
    if (finalRate) {
      this.finalLandingRateField = finalRate;
    }
  },
  computed: {
    ...mapState([
      'title',
      'liveChatID',
      'streamTitle',
      'streamVideoId',
      'bets',
      'results',
      'finalLandingTime',
      'finalLandingRate',
      'oauthElevatedToken',
      'resetIndex',
      'settings'
    ]),
    resultsText() {
      var results = Game.resultsToText();
      return (results) ? results.fullMsg : '';
    }
  },
  methods: {
    onSelectChannelUrl () {
      var self = this;
      self.urlErrorMsg = null;
      var parsedUrl = url.parse(this.channelUrlField, true);
      var channelId = null;
      var videoId = null;

      var splitPath = parsedUrl.pathname.split('/');
      if (splitPath.length > 0) {
        var channelIndex = splitPath.indexOf('channel');
        if (channelIndex != -1 && (splitPath.length > channelIndex + 1)) {
          channelId = splitPath[channelIndex + 1];
          console.log("Channel ID parsed: " + channelId);
        }
      }

      var token = this.$store.state.oauthElevatedToken;
      var onResponse = function (err, videoId, liveChatID, videoTitle) {
        if (err) {
          self.urlErrorMsg = err;
        } else {
          // Start listening for chat
          Game.init(liveChatID, token);
          self.$store.commit("setStreamTitle", videoTitle);
          self.$store.commit("setStreamVideoId", videoId);
          self.$store.commit("setStreamChannelUrl", self.channelUrlField);
          self.$store.dispatch("saveSettings");
        }
      }

      if (channelId) {
        // Find active live stream and chat for this channel
        YoutubeAPI.getLiveChatId(channelId, null, onResponse);
      } else if (parsedUrl.query.v) {
        // Alternatively use a video URL
        YoutubeAPI.getLiveChatId(null, parsedUrl.query.v, onResponse);
      } else {
        self.urlErrorMsg = "Invalid channel or video URL format."
      }
    },
    useOwnChannelUrl () {
      var channelInfo = this.$store.state.elevatedChannelInfo;
      this.channelUrlField = `https://www.youtube.com/channel/${channelInfo.id}`;
      this.onSelectChannelUrl();
    },
    deleteBet (bet, index) {
      if (confirm('You are about to delete ' + bet.comment.authorDetails.displayName+"'s bet. Are you sure?")) {
        this.$store.commit('deleteBet', index);
      }
    },
    setLandingTimeNow () {
      Game.setLandingTime(new Date(), false);
    },
    unsetLandingTime () {
      Game.resetGame(false);
      this.finalLandingRateField = '';
    },
    compileResults () {
      var answer = this.finalLandingRateField;
      if (!isNaN(parseFloat(answer)) && isFinite(answer)) {
        Game.compileResults(answer);
      }
    },
    openCommentsModal () {
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
    openVideoUrl () {
      var streamVideoId = this.$store.state.streamVideoId;
      if (streamVideoId) {
        var url = `https://www.youtube.com/watch?v=${streamVideoId}`;
        shell.openExternal(url);
      }
    },
    copyResultTxt () {
      $("#final-results").select();
      document.execCommand('copy');
    },
    postResults () {
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
    clearResults () {
      Game.resetGame();
    },
    clearResetIndex () {
      this.$store.commit('clearResetIndex');
      this.setLandingTimeNow();
    },
    editStreamUrl () {
      if (confirm("Changing the channel url will clear current data. Are-you sure?")) {
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
