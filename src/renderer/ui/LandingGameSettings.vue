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
                  </div>
                  <span v-show="errors.has('minutes_before')" class="validation-error">{{ errors.first('minutes_before') }}</span>
                </div>

                <div class="form-group">
                  <label>Bets starting message</label>
                  <input type="text" class="form-control" v-model="game_settings.open_bets_messages"
                    v-validate="'required'" name="open_bets_messages" data-vv-as="Stream delay">
                  <span v-show="errors.has('open_bets_messages')" class="validation-error">
                    {{ errors.first('open_bets_messages') }}
                  </span>                    
                </div>

                <div class="form-group">
                  <label>Vote ending messages <a href="#" v-on:click.prevent="addEndMessage()">(Add)</a></label>
                  <div class="input-group vote-ending-messages">
                    <table class="table table-bordered"> 
                      <tbody> 
                        <tr v-for="(message, i) in game_settings.vote_end_messages"> 
                          <td><input type="text" class="form-control" v-model="game_settings.vote_end_messages[i]"></td>
                          <td width="78px;" class="text-center">
                            <a href="#" v-on:click.prevent="deleteEndMessage(i)">Delete</a>
                          </td>
                        </tr> 
                      </tbody>
                    </table>
                    <div class="invalid-feedback" v-if="endMessagesError">{{ endMessagesError }}</div>
                    <i v-show="game_settings.vote_end_messages.length == 0">Add at least one message to enable this feature.</i>     
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
        stream_delay_sec: '',
        vote_end_messages: [],
        game_mode: '',
        rounded_rate: false
      },
      // Errors
      endMessagesError: null
    };
  },
  created: function() {
    this.$store.commit('setTitle', "Landing rate betting game");

    this.settings = deepClone(this.$store.state.settings, {});
    this.game_settings = this.settings.game_settings;
  },
  methods: {
    addEndMessage() {
      this.game_settings.vote_end_messages.push('');
      setTimeout(function() {$('.vote-ending-messages input').last().focus();}, 50);
    },
    deleteEndMessage(index) {
      this.game_settings.vote_end_messages.splice(index, 1);
    },
    saveSettings(e) {
      var self = this;
      self.endMessagesError = "";

      this.$validator.validateAll().then((result) => {
        if(result) {
          // Validate vote ending messages
          var messages = self.game_settings.vote_end_messages;
          for (var i=0; i < messages.length; i++) {
            var message = messages[i];
            if (message.length == 0) {
              return self.endMessagesError = "Empty messages aren't allowed.";
            }
          }

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
