<template>
  <div id="app">
    <div v-if="loading">
      <div class="splash-screen">
        <div class="v-container">
          <div class="v-center">...</div>
        </div>
      </div>
    </div>
    <div v-else>
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
  import deepExtend from 'deep-extend'
  import storage from 'electron-json-storage'

 	import './assets/js/jquery-3.2.1.min.js';
  import './assets/js/bootstrap.min.js';
 	import './assets/js/bootstrap-notify.js';
  import './assets/js/chartist.min.js';
  import './assets/js/light-bootstrap-dashboard.js'; 
  import './assets/js/jquery.contextmenu.js'; 

  export default {
    name: 'cloud-desktop',
    data() {
      return {
        loading: true
      };
    },
    mounted: function() {
      var self = this;

      // Load initial settings
      this.$store.dispatch('getSettings').then(() => {
        self.loading = false;
        self.$router.push({ name: 'LandingGame' });
      });
    }
  }
</script>

<style>
  @import 'assets/css/bootstrap.min.css';
  @import 'assets/css/animate.min.css';
  @import 'assets/css/light-bootstrap-dashboard.css';
  @import 'assets/css/font-awesome.min.css';
  @import 'assets/css/pe-icon-7-stroke.css';
  @import 'assets/css/jquery.contextmenu.css';
  @import 'assets/css/fileicon.css';
  @import 'assets/css/demo.css';

  @import 'assets/styles.css';
</style>
