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
    var navbar_initialized = false;

    var debounce = function (func, wait, immediate) {
      var timeout;
      return function() {
        var context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
          timeout = null;
          if (!immediate) func.apply(context, args);
        }, wait);
        if (immediate && !timeout) func.apply(context, args);
      };
    };

    lbd = {
      misc:{
        navbar_menu_visible: 0
      },

      checkSidebarImage: function(){
        var $sidebar = $('.sidebar');
        var image_src = $sidebar.data('image');

        if(image_src !== undefined){
            var sidebar_container = '<div class="sidebar-background" style="background-image: url(' + image_src + ') "/>'
            $sidebar.append(sidebar_container);
        }
      },

      initRightMenu: debounce(function(){
        if(!navbar_initialized){
          var $sidebar_wrapper = $('.sidebar-wrapper');
          var $navbar = $('nav').find('.navbar-collapse').html();

          var mobile_menu_content = '';

          var nav_content = $navbar;

          var nav_content = '<ul class="nav nav-mobile-menu">' + nav_content + '</ul>';

          // navbar_form = $('nav').find('.navbar-form').get(0).outerHTML;

          var $sidebar_nav = $sidebar_wrapper.find(' > .nav');

          // insert the navbar form before the sidebar list
          var $nav_content = $(nav_content);
          // $navbar_form = $(navbar_form);
          $nav_content.insertBefore($sidebar_nav);
          // $navbar_form.insertBefore($nav_content);

          $(".sidebar-wrapper .dropdown .dropdown-menu > li > a").click(function(event) {
              event.stopPropagation();
          });

          var mobile_menu_initialized = true;
        } else {
          if($(window).width() > 991){
            // reset all the additions that we made for the sidebar wrapper only if the screen is bigger than 991px
            // $sidebar_wrapper.find('.navbar-form').remove();
            $sidebar_wrapper.find('.nav-mobile-menu').remove();

            var mobile_menu_initialized = false;
          }
        }
      },200)
    }

    var window_width = $(window).width();

    // check if there is an image set for the sidebar's background
    lbd.checkSidebarImage();

    // Init navigation toggle for small screens
    lbd.initRightMenu();
    $( "body" ).on( "click", ".sidebar ul li", function() {
      $('html').removeClass('nav-open');
      $('.navbar-header button').removeClass('toggled');
      $('#bodyClick').remove();
    });

    //  Activate the tooltips
    $('[rel="tooltip"]').tooltip();

    $('.form-control').on("focus", function(){
        $(this).parent('.input-group').addClass("input-group-focus");
    }).on("blur", function(){
        $(this).parent(".input-group").removeClass("input-group-focus");
    });

    $(window).on('resize', function(){
      if(navbar_initialized){
          lbd.initRightMenu();
          navbar_initialized = true;
      }
    });
  }
};
</script>
