<template>
  <div>
  	<div class="row">
	    <div class="col-md-12">
        <div class="card">
          <div class="header">
            <h4 class="title">Leaderboard</h4> 
            <p class="category">Sort user by their stats.</p>
          </div>
          <div class="content" v-if="liveChatID">
            <div class="row">
              <div class="col-md-12">
                <!-- Bouton pour mettre à jour le tableau -->
                <div class="form-group">
                  <button type="submit" class="btn btn-default btn-fill" v-on:click.prevent="insertNewData()">
                    Load new comments
                  </button>
                </div>

                <!-- Leaderboard sorted table -->
  
              </div>
            </div>
          </div>
          <div class="content" v-else>
            <i>You must <router-link :to="{name:'LandingGame'}">select a stream</router-link></i>
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

import { db, randomId } from '../database'

export default {
  data() {
    return {
      loaded: false
    };
  },
  created: function() {
    this.$store.commit('setTitle', "Leaderboad");

    // Loader la database et mettre à jour le tableau

  },
  computed: {
    ...mapState([
      'elevatedChannelInfo',
      'liveChatID',
      'databaseLoaded',
      'leaderboardData',
      'latestLeaderboardIndex',
      'leaderboardSort',
      'messages',
    ]),
  },
  methods: {
    /**
     * Insérer les nouvelles données dans la table de test.
     * Mettre à jour le tableau en analysant les données
     */
    insertNewData() {
      // Diviser les commentaires pour obtenir les plus récents seulement.
      var newComments = deepClone(this.messages).slice(this.latestLeaderboardIndex);
      this.$store.commit('setLatestLeaderboardIndex', this.messages.length);

      // Pour chaque commentaire, ajouter une ligne dans la table.
      var resultsDb = db.getCollection("results");

      for (var i = 0; i < newComments.length; i++) {
        var comment = newComments[i];
        var precision = ((Math.random() * 150) + Math.random()).toFixed(2);

        resultsDb.insert({
          id: comment.id,
          precision: precision,
          user: comment.authorDetails
          // medal: '' // "gold", "silver", "bronze"
        });
      }

      console.log(resultsDb.find({}));
    },
    updateLeaderboard() {
      // Éxécuter la requête dans la base de donnée si loadée (pour la date)

      // Grouper par usager avec map reduce

      // Traiter les données avec Map (medalSort, numberParticipations)

      // Mettre à jour le tableau (store) avec les données de la requête
    }
  }
};
</script>
