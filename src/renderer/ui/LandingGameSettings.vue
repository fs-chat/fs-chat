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
                    <option value="last_bet_overwrite">Each bet replaces the last</option>
                    <option value="first_bet_standing">First bet is the standing bet </option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Minutes before landing to accept votes</label>

                  <div class="input-group">
                  <input type="number" class="form-control" v-model="game_settings.minutes_before"
                    v-validate="'required'" name="minutes_before" data-vv-as="Minutes">
                    <span class="input-group-addon">minutes</span>
                    <span v-show="errors.has('minutes_before')" class="validation-error">{{ errors.first('minutes_before') }}</span>
                  </div>
                </div>

                <div class="form-group">
                  <label>Stream delay in seconds</label>
                  <div class="input-group">
                    <input type="number" class="form-control" v-model="game_settings.stream_delay_sec"
                    v-validate="'required'" name="stream_delay_sec" data-vv-as="Stream delay">
                    <span class="input-group-addon">seconds</span>
                    <span v-show="errors.has('stream_delay_sec')" class="validation-error">{{ errors.first('stream_delay_sec') }}</span>                    
                  </div>
                </div>

                <div class="form-group">
                  <label>Rounded final rate value?</label><br>
                  <label class="switch">
                    <input type="checkbox" v-model="game_settings.rounded_rate">
                    <span class="slider round"></span>
                  </label>
                </div>

                <div class="form-group">
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
      var self = this;
      this.$validator.validateAll().then((result) => {
        if(result) {
          self.settings.game_settings = self.game_settings;

          // Sauvegarder les parametres dans un fichier local
          self.$store.commit('setSettings', deepExtend(deepClone(self.$store.state.settings), {
            game_settings: self.game_settings
          }));

          self.$store.dispatch('saveSettings').then(() => {
            $.notify({
              icon: "pe-7s-edit",
              message: "Settings saved."
            });
          });

          self.$router.push({ name: 'LandingGame' });
        }
      });
    }
  }
};
</script>
