<template>
  <div class="sidebar" data-color="purple" data-background-color="black">
    <div class="logo">
      <router-link :to="{name:'LandingGame'}" class="simple-text logo-normal">
       FS Chat
      </router-link>
    </div>
    <div class="sidebar-wrapper">
      <ul class="nav">
        <router-link :to="{name:'LandingGame'}" tag="li" active-class="active" class="nav-item">	
        	<a class="nav-link">
        		<i class="pe-7s-medal"></i>
        		<p>Landing game</p>
        	</a>
        </router-link>
        <router-link :to="{name:'Leaderboard'}" tag="li" active-class="active" class="nav-item">	
        	<a class="nav-link">
        		<i class="pe-7s-graph"></i>
        		<p>Leaderboard</p>
        	</a>
        </router-link>
        <router-link :to="{name:'TestUdp'}" tag="li" active-class="active" v-if="showUdp" class="nav-item">
        	<a class="nav-link">
        		<i class="pe-7s-repeat"></i>
        		<p>Test UDP</p>
        	</a>
        </router-link>
        <router-link to="/settings" tag="li" active-class="active" class="nav-item">	
        	<a class="nav-link">
        		<i class="pe-7s-config"></i>
        		<p>Settings</p>
        	</a>
        </router-link>
        <!-- your sidebar here -->
      </ul>
    </div>
    <div class="sidebar-background" style="background-image: url(static/img/sidebar.jpg) "></div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  computed: {
    showUdp() {
    	return global.__settings.show_udp_dev==true;
    }
  }
};
</script>
