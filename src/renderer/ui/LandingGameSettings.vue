<template>
  <div>
    <div class="row">
      <div class="col-md-12">
        <div class="card">
          <div class="header">
            <h4 class="title">Game settings</h4> 
          </div>
          <div class="content">
            <div class="row">
              <div class="col-md-12">
                <div class="form-group">
                  <label>Game mode</label>
                  <select class="form-control" v-model="gameSettings.game_mode">
                    <option value="last_bet_overwrite">Overwrite last bet</option>
                    <option value="first_bet_standing">First bet standing</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Minutes before landing (vote validity)</label>
                  <input type="number" class="form-control" v-model="gameSettings.minutes_before">
                </div>

                <button type="submit" class="btn btn-primary btn-fill" v-on:click.prevent="saveSettings()">
                  Save settings
                </button>
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
import { Session } from '../main'
import { signOutGoogleApi } from '../auth'
import { ipcRenderer, remote, shell } from 'electron'

import GAME_MODES from '../game'

export default {
  data() {
    return {
      game_modes: [],
      gameSettings: {
        minutes_before: '',
        game_mode: ''
      }
    };
  },
  created: function() {
    this.$store.commit('setTitle', "Landing rate game settings");

    this.settings = deepClone(this.$store.state.settings, {});
    this.gameSettings = this.settings.gameSettings;
  },
  methods: {
    saveSettings(e) {
      this.settings.gameSettings = this.gameSettings;

      // Sauvegarder les parametres dans un fichier local
      this.$store.commit('setSettings', deepExtend(deepClone(this.$store.state.settings), {
        gameSettings: this.gameSettings
      }));

      this.$store.dispatch('saveSettings');

      $.notify({
        icon: "pe-7s-edit",
        message: "Settings saved."
      });

      this.$router.push({ name: 'LandingGame' });
    }
  }
};
</script>
