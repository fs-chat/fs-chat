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
                      <h3 class="panel-title">Streamlabs account</h3>
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

                <!-- Sync -->
                <div class="form-group">
                  <div class="panel panel-default panel-account panel-streamlabs"> 
                    <div class="panel-heading"> 
                      <img src="~@/assets/sync.svg" alt="" class="streamlabs-icon" />
                      <h3 class="panel-title">Leaderboard sync</h3>
                      <template v-if="syncApiToken">
                        <p class="category">Account associated</p>
                        <button type="submit" class="btn btn-md btn-disconnect" v-on:click.prevent="unsetSyncId()">
                         Disconnect
                        </button> 
                      </template>
                      <template v-else>
                        <p class="category">Not configured</p>
                        <button type="submit" class="btn btn-success btn-connect" 
                            v-on:click.prevent="configureSyncId()" v-if="!setSyncId">
                         Configure sync
                        </button>
                      </template>
                    </div>
                    <!-- Panel body -->
                    <template v-if="syncApiToken">
                      <div class="panel-body">
                        <p>Configured using <span style="text-decoration: underline; cursor: help;"
                            :title="syncApiToken">sync id</span>.</p>
                      </div>
                    </template>
                    <template v-if="!syncApiToken && setSyncId">
                      <form v-on:submit.prevent="savePolitique()">
                        <div class="panel-body">
                          <div class="form-group">
                            <label>Synchronisation ID</label>
                            <input type="text" class="form-control" v-model="syncId" id="sync-id-input" 
                              v-validate="'required'" name="sync_id" data-vv-as="Sync ID">
                            <span v-show="errors.has('sync_id')" class="validation-error"> 
                              {{ errors.first('sync_id') }}</span>                    
                          </div>
                          <button type="submit" class="btn btn-primary" v-on:click.prevent="saveSyncId()">
                            Save sync ID
                          </button>
                        </div>
                      </form>
                    </template>
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
import syncUtils from '../sync_utils'
import deepExtend from 'deep-extend'
import { ipcRenderer, remote, shell } from 'electron'
import { 
  signOutGoogleApi, 
  signOutStreamlabsApi,
  exportTokenStorage
} from '../auth'

export default {
  data() {
    return {
      setSyncId: false,
      syncId: '',
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
      'streamlabsAccountInfo',
      'syncApiToken',
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
    },
    configureSyncId() {
      this.setSyncId = true;
      setTimeout(function() {
        $('#sync-id-input').focus();
      }, 100);
    },
    saveSyncId() {
      if (this.syncId.length > 0) {
        // Save token and start sync
        this.$store.commit('setSyncApiToken', this.syncId);
        exportTokenStorage();
        syncUtils.sync_results();
      }
    },
    unsetSyncId() {
      if (confirm("Disconnect from Sync?")) {
        // Unset from store and export
        this.$store.commit('setSyncApiToken', null);
        exportTokenStorage();
      }
    }
  }
};
</script>
