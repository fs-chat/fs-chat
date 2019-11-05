<template>
  <div>
  	<div class="row">
	    <div class="col-md-12">
        <div class="card">
          <div class="card-header card-header-primary">
            <h4 class="card-title">About</h4>
          </div>
          <div class="card-body">
            <p>
              Version: <b>{{ currentVersion }}</b><br>
              <i>{{ updateStatusText }}</i>
            </p>

            <button type="submit" class="btn btn-info btn-fill" v-on:click.prevent="downloadAndInstall()"
              v-show="updateAvailable && !updateDownloading && !updateDownloaded">
              Download and update
            </button>
            <button type="submit" class="btn btn-info btn-fill" v-on:click.prevent="quitAndInstall()"
              v-show="updateDownloaded">
              Quit and install
            </button>
          </div>
        </div>
	    </div>
	  </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { Session } from '../main'
import { ipcRenderer, remote } from 'electron'
import { autoUpdater } from 'electron-updater'

export default {
  data() {
    return {
      currentVersion: "",
      updateDownloading: false
    };
  },
  created: function() {
    this.$store.commit('setTitle', "App information");
    this.currentVersion = remote.app.getVersion();
    if (!this.$store.state.updateDownloaded && 
        !this.$store.state.updateAvailable) {
      ipcRenderer.send("check-for-updates");
    }
  },
  computed: {
    ...mapState([
      'updateAvailable',
      'updateDownloaded',
      'updateStatusText'
    ]),
  },
  methods: {
    downloadAndInstall() {
      this.updateDownloading = true;
      ipcRenderer.send("download-update");
    },
    quitAndInstall() {
      ipcRenderer.send("quit-and-install");
    }
  }
};
</script>
