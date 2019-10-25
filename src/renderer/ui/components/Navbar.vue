<template>
	<nav class="navbar navbar-expand-lg navbar-transparent navbar-absolute fixed-top">
    <div class="container-fluid">
      <div class="navbar-wrapper">
        <a class="navbar-brand" href="javascript:void(0)">{{ title }}</a>
      </div>
      <button class="navbar-toggler" type="button" data-toggle="collapse" aria-controls="navigation-index" aria-expanded="false" aria-label="Toggle navigation">
        <span class="sr-only">Toggle navigation</span>
        <span class="navbar-toggler-icon icon-bar"></span>
        <span class="navbar-toggler-icon icon-bar"></span>
        <span class="navbar-toggler-icon icon-bar"></span>
      </button>

      <div class="collapse navbar-collapse justify-content-end">
        <ul class="navbar-nav">
          <li class="nav-item">
            <a class="nav-link" href="javascript:void(0)">
              <i class="fa fa-info-circle"></i>
              <p class="d-lg-none d-md-block">
                Notifications
              </p>
            </a>
          </li>

          <!-- <li class="">
            <router-link to="/about" title="About" v-bind:class="{ 'has-update': hasUpdate }">  
              <i class="fa fa-info-circle"></i> <p class="hidden-lg hidden-md"></p>
            </router-link>
          </li>
          <li class="account-image" v-if="elevatedChannelInfo">
            <router-link to="/settings" title="Settings" v-bind:class="{ 'has-update': hasUpdate }">  
              <div class="inset">
                <img :src="channelPictureUrl(elevatedChannelInfo)">
              </div>
            </router-link>
          </li> -->
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
