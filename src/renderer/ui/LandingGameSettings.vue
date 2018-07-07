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
                  <select class="form-control" v-model="game_settings.game_mode">
                    <option value="last_bet_overwrite">Overwrite last bet</option>
                    <option value="first_bet_standing">First bet standing</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Minutes before landing to accept votes</label>
                  <input type="number" class="form-control" v-model="game_settings.minutes_before">
                </div>

                <div class="form-group">
                  <label>Rounded final rate value?</label><br>
                  <label class="switch">
                    <input type="checkbox" v-model="game_settings.rounded_rate">
                    <span class="slider round"></span>
                  </label>
                </div>

                <button type="submit" class="btn btn-primary btn-fill" v-on:click.prevent="saveSettings()">
                  Save settings
                </button>
                <router-link :to="{name:'LandingGame'}" class="btn btn-default" tag="button">  
                  Cancel
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import deepExtend from 'deep-extend'
import deepClone from 'clone-deep'

import GAME_MODES from '../game'

export default {
  data() {
    return {
      game_modes: [],
      game_settings: {
        minutes_before: '',
        game_mode: '',
        rounded_rate: false
      }
    };
  },
  created: function() {
    this.$store.commit('setTitle', "Landing rate betting game");

    this.settings = deepClone(this.$store.state.settings, {});
    this.game_settings = this.settings.game_settings;
  },
  methods: {
    saveSettings(e) {
      this.settings.game_settings = this.game_settings;

      // Sauvegarder les parametres dans un fichier local
      this.$store.commit('setSettings', deepExtend(deepClone(this.$store.state.settings), {
        game_settings: this.game_settings
      }));

      this.$store.dispatch('saveSettings').then(() => {
        $.notify({
          icon: "pe-7s-edit",
          message: "Settings saved."
        });
      });

      this.$router.push({ name: 'LandingGame' });
    }
  }
};
</script>
