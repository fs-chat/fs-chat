<template>
  <div>
  	<div class="row">
	    <div class="col-md-12">
        <div class="card">
          <div class="header">
            <h4 class="title">Application settings</h4> 
            <p class="category">Associate external accounts</p>
          </div>
          <div class="content">
            <div class="row">
              <!-- Google API -->
              <div class="col-md-12">

                <div class="form-group">
                  <div class="panel panel-default panel-account panel-google"> 
                    <div class="panel-heading"> 
                      <img src="~@/assets/youtube.svg" alt="" class="youtube-icon" />
                      <h3 class="panel-title">Youtube account</h3>
                      <template v-if="elevatedChannelInfo">
                        <p class="category">Account associated</p>
                        <button type="submit" class="btn btn-md btn-disconnect" v-on:click.prevent="logout()">
                          Disconnect  
                        </button>
                      </template>
                      <template v-else>
                        <p class="category">Not associated</p>
                        <button type="submit" class="btn btn-success btn-connect" v-on:click.prevent="login()">
                         Associate account
                        </button>
                      </template>
                    </div>
                    <!-- Logged in -->
                    <div class="panel-body" v-if="elevatedChannelInfo">
                      <p>Logged in as <b><a href="#" style="font-weight: bold;" 
                        v-on:click.prevent="navigateChannel(elevatedChannelInfo)">{{ channelName(elevatedChannelInfo) }}</a></b></p>
                    </div>
                  </div>
                </div>

                <!-- Streamlabs -->
                <div class="form-group">
                  <div class="panel panel-default panel-account panel-streamlabs"> 
                    <div class="panel-heading"> 
                      <img src="~@/assets/streamlabs.svg" alt="" class="streamlabs-icon" />
                      <h3 class="panel-title">Steamlabs account</h3>
                      <template v-if="oauthStreamlabsToken">
                        <p class="category">Account associated</p>
                        <button type="submit" class="btn btn-md btn-disconnect" v-on:click.prevent="logoutStreamlabs()">
                         Disconnect
                        </button> 
                      </template>
                      <template v-else>
                        <p class="category">Not associated</p>
                        <button type="submit" class="btn btn-success btn-connect" v-on:click.prevent="loginStreamlabs()">
                         Associate account
                        </button>
                      </template>
                    </div>
                    <!-- Logged in -->
                    <div class="panel-body" v-if="oauthStreamlabsToken">
                      <p v-if="streamlabsAccountInfo">Logged in as <b>{{ streamLabsName(streamlabsAccountInfo) }}</b></p>
                    </div>
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
import { signOutGoogleApi, signOutStreamlabsApi } from '../auth'
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
      'elevatedChannelInfo',
      'oauthStreamlabsToken',
      'streamlabsAccountInfo'
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
    loginStreamlabs() {
      var self = this;
      ipcRenderer.send("login-streamlabs", { 
        scope: "" // space separated scopes
      });
    },
    logout() {
      if (confirm("Disconnect Youtube account?")) {
        signOutGoogleApi();
      }
    },
    channelName(channelInfo) {
      return channelInfo.brandingSettings.channel.title;
    },
    streamLabsName(account) {
      return account.streamlabs.display_name;
    },
    logoutStreamlabs() {
      if (confirm("Disconnect Streamlabs account?")) {
        signOutStreamlabsApi();
      }
    },
    navigateChannel(channelInfo) {
      var url = `https://www.youtube.com/channel/${channelInfo.id}`;
      shell.openExternal(url);
    }
  }
};
</script>
