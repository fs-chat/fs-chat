<template>
  <div>
  	<div class="row">
	    <div class="col-md-12">
        <div class="card">
          <div class="header">
            <h4 class="title">Application settings</h4> 
          </div>
          <div class="content">
            <div class="row">
              <div class="col-md-12">
                <!-- Logged in -->
                <div class="form-group" v-if="elevatedChannelInfo">
                  <label>Account information</label>
                  <p>Logged in as <b><a href="#" style="font-weight: bold;" 
                    v-on:click.prevent="navigateChannel(elevatedChannelInfo)">{{ channelName(elevatedChannelInfo) }}</a></b></p>
                  <button type="submit" class="btn btn-danger btn-fill" v-on:click.prevent="logout()">
                    Sign out
                  </button>
                </div>
                <!-- Not Logged in -->
                <div v-else>
                  <label>Account information</label>
                  <p>Your account is not currently associated.</b></p>
                  <div class="form-group">
                    <button type="submit" class="btn btn-success btn-fill" v-on:click.prevent="login()">
                      Sign in with Google
                    </button>
                  </div>
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
import { mapState } from 'vuex'
import storage from 'electron-json-storage'
import deepExtend from 'deep-extend'
import { signOutGoogleApi } from '../auth'
import { ipcRenderer, remote, shell } from 'electron'

export default {
  data() {
    return {
      settings: {
        // ...
      }
    };
  },
  mounted: function() {
    var self = this;
    // storage.get('settings', function(error, settings) {
    //   if (!error && settings) {
    //     self.settings = deepExtend(self.settings, settings);   
    //   }
    // });
  },
  created: function() {
    this.$store.commit('setTitle', "Parameters");
  },
  computed: {
    ...mapState([
      'elevatedChannelInfo'
    ]),
    nomUsager () {
    	var nomUsager = "";
    	var usager = this.$store.getters.getObj("users", Session.userId);
    	if (usager) nomUsager = usager.profile.nom;
      return nomUsager;
    }
  },
  methods: {
    login() {
      var self = this;
      ipcRenderer.send("login-google", { 
        type: 'elevated',
        scopes: [
          'https://www.googleapis.com/auth/youtube.force-ssl',
          'profile',
          'email'
        ]
      });
    },
    logout() {
      signOutGoogleApi();
    },
    channelName(channelInfo) {
      return channelInfo.brandingSettings.channel.title;
    },
    navigateChannel(channelInfo) {
      var url = `https://www.youtube.com/channel/${channelInfo.id}`;
      shell.openExternal(url);
    }
  }
};
</script>
