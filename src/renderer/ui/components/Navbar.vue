<template>
	<nav class="navbar navbar-default navbar-fixed">
    <div class="container-fluid">
      <div class="navbar-header">
        <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#navigation-example-2">
          <span class="sr-only">Toggle navigation</span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
        </button>
        <h1 class="navbar-brand">{{ title }}</h1>
      </div>
      <div class="collapse navbar-collapse">
        <ul class="nav navbar-nav navbar-right">
          <!-- Change icon color when there is an update -->
          <li class="">
            <router-link to="/about" title="À propos" v-bind:class="{ 'has-update': hasUpdate }">  
              <i class="fa fa-info-circle"></i> <p class="hidden-lg hidden-md"></p>
            </router-link>
          </li>
          <li class="account-image" v-if="elevatedChannelInfo">
            <router-link to="/settings" title="Settings" v-bind:class="{ 'has-update': hasUpdate }">  
              <div class="inset">
                <img :src="channelPictureUrl(elevatedChannelInfo)">
              </div>
            </router-link>
          </li>
        </ul>
      </div>
    </div>
	</nav>
</template>

<script>
  import { Session } from '../../main'
  import { mapState, mapGetters } from 'vuex'
  import { remote } from 'electron'

  export default {
    data() {
      return {
        // ...
      };
    },
    methods: {
      channelPictureUrl(channelInfo) {
        return channelInfo.snippet.thumbnails.default.url;
      }
    },
    computed: {
      ...mapState([
        'title',
        'elevatedChannelInfo'
      ]),
      hasUpdate () {
        return !!this.$store.state.updateAvailable;
      },
    }
  };
</script>
