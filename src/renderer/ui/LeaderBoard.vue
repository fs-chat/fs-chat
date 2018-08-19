<template>
  <div class="leaderboard">
  	<div class="row">
	    <div class="col-md-12">
        <div class="card">
          <div class="header">
            <h4 class="title">Leaderboard</h4> 
            <p class="category">Sort users by their stats.</p>

            <div class="pull-right">
              <div class="input-group" style="width: 250px; margin-top: 10px;">
                <span class="input-group-btn">
                  <button href="#" class="btn btn-default" tag="button" title="Clear resutls" 
                      v-on:click.prevent="clearResults()">  
                    <i class="fa fa-trash-o"></i>
                  </button>
                  <button href="#" class="btn btn-default" tag="button" title="Refresh leaderboard" 
                      v-on:click.prevent="updateLeaderboard()">  
                    <i class="fa fa-refresh"></i>
                  </button>
                </span>
                <select class="form-control" v-model="time_since">
                  <option value="today">Today</option>
                  <option value="1M">Last 1 month</option>
                  <option value="2M">Last 2 months</option>
                  <option value="3M">Last 3 months</option>
                  <option value="6M">Last 6 months</option>
                  <option value="year">Last year</option>
                  <option value="year">All time</option>
                </select>
              </div>
            </div>
          </div>
          <div class="content">
            <div class="row">
              <div class="col-md-12">
                <div v-if="liveChatID">
                  <!-- Bouton pour mettre à jour le tableau -->
                  <div class="form-group" v-if="leaderboardInterval == null">
                    <button type="submit" class="btn btn-primary btn-fill" v-on:click.prevent="startRead()">
                      Start keeping stats
                    </button>
                  </div>
                  <div class="form-group" v-else>
                    <button type="submit" class="btn btn-danger btn-fill" v-on:click.prevent="stopRead()">
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
                      <!-- <th class="sortable" v-bind:class="{ 'desc': (leaderboardSort == 'nbCharacters') }"
                          v-on:click.prevent="sortBy('nbCharacters')">
                        Nb. characters
                      </th> -->
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
                    <template v-if="loading">
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
                          <!-- <td>{{ result.nbCharacters }}</td> -->
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

import { db, randomId } from '../database'

export default {
  data() {
    return {
      loading: true,
      limitShow: 30,
      time_since: 'today'
    };
  },
  created: function() {
    this.$store.commit('setTitle', "Leaderboad");

    // Loader la database et mettre à jour le tableau
    setTimeout(this.updateLeaderboard, 50);
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
      // console.log(sorted);
      return sorted;
    }
  },
  methods: {
    /**
     * Commencer l'intervale de lecture des commentaires.
     */
    startRead() {
      var self = this;

      function getNewComments() {
        // Diviser les commentaires pour obtenir les plus récents seulement.
        var newComments = deepClone(self.messages).slice(self.latestLeaderboardIndex);
        self.$store.commit('setLatestLeaderboardIndex', self.messages.length);

        // Pour chaque commentaire, ajouter une ligne dans la table.
        var resultsDb = db.getCollection("comments");

        for (var i = 0; i < newComments.length; i++) {
          var comment = newComments[i];
          var precision = ((Math.random() * 150) + Math.random()).toFixed(2);

          // console.log(comment);

          var medal = null;
          var rank = (Math.floor(Math.random() * 25) + 1);

          var exists = resultsDb.find({ id: comment.id });
          if (exists.length == 0 && comment.snippet.textMessageDetails) {
            resultsDb.insert({
              id: comment.id,
              precision: precision,
              user: comment.authorDetails,
              message: comment.snippet.textMessageDetails.messageText,
              rank: rank
            });
          }
        }

        console.log(resultsDb.find({}).length);
      }

      getNewComments();
      var interval = setInterval(getNewComments, 5000);
      this.$store.commit("setLeaderboardInterval", interval);
    },
    stopRead() {
      if (this.leaderboardInterval != null) {
        clearInterval(this.leaderboardInterval);
        this.$store.commit("setLeaderboardInterval", null);
      }
    },
    sortBy(keyword, reverse) {
      this.$store.commit('setLeaderboardSortBy', { keyword, reverse });
    },
    clearResults() {
      if (confirm('Clear results')) {
        var resultsDb = db.getCollection("comments");
        resultsDb.chain().remove();
        this.$store.commit('setLeaderboardData', []);
        this.$store.commit('setLatestLeaderboardIndex', 0);
      }
    },
    updateLeaderboard() {
      // Éxécuter la requête dans la base de donnée si loadée (pour la date)
      var resultsDb = db.getCollection("comments");
      var results = resultsDb.find({});

      // Grouper par usager avec map reduce
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

      var medalEmojis = ['🥇','🥈','🥉'];

      // Calculer les statistiques pour chaque commentaire
      var resultsData = Object.keys(grouped).map(key => {
        var user = grouped[key];
        var nbComments = user.results.length;
        var medalsText = "";

        var precisionSum = 0;
        var average = null;
        var nbCharacters = 0;
        var medalValue = 0;

        for (var i = 0; i < user.results.length; i++) {
          var result = user.results[i];
          var rank = result.rank;

          if (rank <= 3) {
            medalsText += medalEmojis[rank-1] + ' ';
            if (rank == 1) medalValue += 4;
            if (rank == 2) medalValue += 3;
            if (rank == 3) medalValue += 2;
          }

          precisionSum += parseFloat(result.precision);
          nbCharacters += result.message.length;
        }

        if (precisionSum > 0) {
          average = parseFloat((precisionSum / nbComments).toFixed(2));
        }

        return { 
          user: user.user, 
          nbComments: nbComments,
          average: average,
          nbCharacters: nbCharacters,
          medalsText: medalsText,
          medalValue: medalValue
        };
      });

      // console.log(resultsData);

      // Mettre à jour le tableau (leaderboardData) avec les données de la requête
      this.$store.commit('setLeaderboardData', resultsData);
      this.loading = false;
    }
  }
};
</script>
