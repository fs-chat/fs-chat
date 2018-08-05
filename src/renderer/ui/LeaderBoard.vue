<template>
  <div>
  	<div class="row">
	    <div class="col-md-12">
        <div class="card">
          <div class="header">
            <h4 class="title">Leaderboard</h4> 
            <p class="category">Sort user by their stats.</p>
          </div>
          <div class="content">
            <div class="row">
              <div class="col-md-12">
                <!-- Bouton pour mettre à jour le tableau -->
                <div class="form-group">
                  <button type="submit" class="btn btn-default btn-fill" v-on:click.prevent="insertNewData()">
                    Insert new data
                  </button>
                </div>

                <!-- Leaderboard sorted table -->
  
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
      var newComments


      // Pour chaque commentaire, ajouter une ligne dans la table.
    },
    updateLeaderboard() {
      // Éxécuter la requête dans la base de donnée si loadée

      // Mettre à jour le tableau (store) avec les données de la requête
    }
  }
};
</script>
