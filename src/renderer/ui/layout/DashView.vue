<template>
  <div class="wrapper">
    <side-bar></side-bar>

    <div class="main-panel">
      <nav-bar></nav-bar>

      <div class="content">
        <div class="container-fluid">
          <router-view></router-view>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import NavBar from '../components/NavBar'
import SideBar from '../components/SideBar'

export default {
  components: {
    'nav-bar': NavBar,
    'side-bar': SideBar
  },
  mounted: function() {
    $('.sidebar .sidebar-wrapper, .main-panel, .content').perfectScrollbar();
  }
};
</script>
