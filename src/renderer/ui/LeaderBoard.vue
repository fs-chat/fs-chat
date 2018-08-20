<template>
  <div class="leaderboard">
  	<div class="row">
	    <div class="col-md-12">
        <div class="card">
          <div class="header">
            <h4 class="title">Leaderboard</h4> 
            <p class="category">Sort users by their stats.</p>

            <div class="pull-right">
              <div class="input-group" style="margin-top: 10px;" v-bind:style="{ width: (debug ? 370 : 270) + 'px' }">
                <!-- Debug utils, flush and update manually -->
                <span class="input-group-btn" v-if="debug">
                  <button href="#" class="btn btn-default" tag="button" title="Clear resutls" 
                      v-on:click.prevent="clearResults()">  
                    <i class="fa fa-trash-o"></i>
                  </button>
                  <button href="#" class="btn btn-default" tag="button" title="Refresh leaderboard" 
                      v-on:click.prevent="updateLeaderboard()">  
                    <i class="fa fa-refresh"></i>
                  </button>
                </span>
                <span class="input-group-addon">Results from</span>
                <select class="form-control no-focus" v-model="time_since">
                  <option value="all">All time</option>
                  <option value="today">Today</option>
                  <option value="1W">Last 7 days</option>
                  <option value="1M">Last 1 month</option>
                  <option value="2M">Last 2 months</option>
                  <option value="3M">Last 3 months</option>
                  <option value="6M">Last 6 months</option>
                  <option value="year">Last year</option>
                </select>
              </div>
            </div>
          </div>
          <div class="content">
            <div class="row">
              <div class="col-md-12">
                <!-- Test utils to generate data -->
                <div v-if="debug && liveChatID">
                  <div class="form-group" v-if="leaderboardInterval == null">
                    <button type="submit" class="btn btn-primary btn-fill" v-on:click.prevent="startDebugRead()">
                      Start keeping stats
                    </button>
                  </div>
                  <div class="form-group" v-else>
                    <button type="submit" class="btn btn-danger btn-fill" v-on:click.prevent="stopDebugRead()">
                      Stop keeping stats
                    </button>
                  </div>
                  <hr>
                </div>

                <!-- Leaderboard sorted table -->
                <table class="table table-bordered table-sortable">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th style="width: 40px;">
                        <!-- Profile picture -->
                        <i class="fa fa-user-circle"></i>
                      </th>
                      <th>UserName</th>
                      <th class="sortable" v-bind:class="{ 'desc': (leaderboardSort == 'nbComments') }"
                          v-on:click.prevent="sortBy('nbComments', true)">
                        Participations
                      </th>
                      <th class="sortable" v-bind:class="{ 'asc': (leaderboardSort == 'average') }"
                          v-on:click.prevent="sortBy('average', false)">
                        Avg. precision
                      </th>
                      <th class="sortable" v-bind:class="{ 'desc': (leaderboardSort == 'medalValue') }"
                          v-on:click.prevent="sortBy('medalValue', true)">
                        Medals
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-if="loaderboardLoading">
                      <tr>
                        <td colspan="6"><i>Loading results...</i></td>
                      </tr>
                    </template>
                    <template v-else>
                      <template v-if="dataSorted.length > 0">
                        <tr v-for="(result, index) in dataSorted.slice(0, limitShow)">
                          <th scope="row">{{ index + 1 }}</th>
                          <td><img :src="result.user.profileImageUrl" class="profile-image"></td>
                          <td>{{ result.user.displayName }}</td>
                          <td>{{ result.nbComments }}</td>
                          <td>{{ result.average }}</td>
                          <td>{{ result.medalsText }}</td>
                        </tr>
                      </template>
                      <template v-else>
                        <tr>
                          <td colspan="6"><i>No results to show.</i></td>
                        </tr>
                      </template>
                    </template>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
	    </div>
	  </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import storage from 'electron-json-storage'
import deepExtend from 'deep-extend'
import deepClone from 'clone-deep'
import arraySort from 'array-sort'
import moment from 'moment'

import { resultsDb } from '../database'

export default {
  data() {
    return {
      inited: false,
      limitShow: 30,
      time_since: 'all',
      debug: false
    };
  },
  created: function() {
    var self = this;
    this.$store.commit('setTitle', "Leaderboad");
    this.debug = (process.env.NODE_ENV == 'development');
    this.time_since = this.$store.state.leaderboardTimeSince;
    setTimeout(function () { self.inited = true; }, 100);

    // Loader la database et mettre à jour le tableau
    if (this.leaderboardData.length == 0 || 
          this.$store.state.loaderboardUpToDate == false) {
      this.updateLeaderboard();
    }
  },
  mounted: function() {
    var self = this;
    // Infinite scroll
    $('.content').on('scroll', function() {
      if(($(this).scrollTop() + $(this).innerHeight() + 10) 
          >= $(this)[0].scrollHeight) {
        self.limitShow += 30;
      }
    })
  },
  destroyed: function() {
    $('.content').off('scroll');
  },
  computed: {
    ...mapState([
      'leaderboardInterval',
      'elevatedChannelInfo',
      'liveChatID',
      'databaseLoaded',
      'loaderboardLoading',
      'loaderboardUpToDate',
      'leaderboardData',
      'leaderboardSort',
      'leaderboardSortReverse',
      'latestLeaderboardIndex',
      'messages',
    ]),

    dataSorted() {
      var sortBy = this.leaderboardSort;
      var reverse = this.leaderboardSortReverse;
      var sorted = arraySort(deepClone(this.leaderboardData), sortBy, { reverse });
      return sorted;
    }
  },
  methods: {
    /*
     * Update the sort keyword and order.
     */
    sortBy(keyword, reverse) {
      this.$store.commit('setLeaderboardSortBy', { keyword, reverse });
    },
    /**
     * Start comment reading interval for foobar data (debug only)
     */
    startDebugRead() {
      var self = this;
      if (!self.debug) return;

      function getNewComments() {
        // Fetch recent comments
        var newComments = deepClone(self.messages).slice(self.latestLeaderboardIndex);
        self.$store.commit('setLatestLeaderboardIndex', self.messages.length);

        // Each comment is a fake result with random data for tests
        for (var i = 0; i < newComments.length; i++) {
          var comment = newComments[i];
          var precision = ((Math.random() * 150) + Math.random()).toFixed(2);

          var medal = null;
          var rank = (Math.floor(Math.random() * 25) + 1);
          var daysAgo = (Math.floor(Math.random() * 60) + 1);

          if (comment.snippet.textMessageDetails) {
            self.$store.dispatch('saveResultLeaderboard', {
              id: comment.id,
              precision: precision,
              message: comment.snippet.textMessageDetails.messageText,
              date: moment().subtract(daysAgo,'d').toISOString(),
              isMedal: (rank <= 3),
              rank: rank,
              user: {
                channelId: comment.authorDetails.channelId,
                profileImageUrl: comment.authorDetails.profileImageUrl,
                displayName: comment.authorDetails.displayName
              }
            });
          }

          // Update table inserting last result
          if (i == newComments.length-1) {
            setTimeout(function(){
              self.updateLeaderboard();
            }, 100);
          }
        }
      }

      getNewComments();
      var interval = setInterval(getNewComments, 5000);
      this.$store.commit("setLeaderboardInterval", interval);
    },
    stopDebugRead() {
      if (this.leaderboardInterval != null) {
        clearInterval(this.leaderboardInterval);
        this.$store.commit("setLeaderboardInterval", null);
      }
    },
    clearResults() {
      if (confirm('Clear results')) {
        resultsDb.remove({}, { multi: true });
        this.$store.commit('setLeaderboardData', []);
        this.$store.commit('setLatestLeaderboardIndex', 0);
      }
    },
    updateLeaderboard() {
      var self = this;
      this.$store.dispatch('updateLeaderboardData');
    }
  },
  watch: {
    // Update time since
    time_since(value) {
      if (this.inited) {
        this.$store.commit('setLeaderboardTimeSince', value);
        this.$store.dispatch('updateLeaderboardData');
      }
    }
  }
};
</script>
