<template>
  <div class="sidebar" data-image="static/img/sidebar.jpg">
		<div class="sidebar-wrapper">
			<div class="logo">
				<router-link :to="{name:'LandingGame'}" class="simple-text">
				 FS Chat
				</router-link>
			</div>

			<ul class="nav">
				<router-link :to="{name:'LandingGame'}" tag="li" active-class="active">	
					<a>
						<i class="pe-7s-medal"></i>
						<p>Landing game</p>
					</a>
				</router-link>
				<router-link :to="{name:'Leaderboard'}" tag="li" active-class="active">	
					<a>
						<i class="pe-7s-graph"></i>
						<p>Leaderboard</p>
					</a>
				</router-link>
				<router-link :to="{name:'TestUdp'}" tag="li" active-class="active" v-if="showUdp">	
					<a>
						<i class="pe-7s-repeat"></i>
						<p>Test UDP</p>
					</a>
				</router-link>
				<router-link to="/settings" tag="li" active-class="active">	
					<a>
						<i class="pe-7s-config"></i>
						<p>Settings</p>
					</a>
				</router-link>
			</ul>
		</div>
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
