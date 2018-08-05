import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      component: require('@/ui/layout/DashView').default,
      children: [
        {
          path: 'landing-game',
          name: 'LandingGame',
          component: require('@/ui/LandingGame').default,
        },
        {
          path: 'landing-game-settings',
          name: 'LandingGameSettings',
          component: require('@/ui/LandingGameSettings').default,
        },
        {
          path: 'Leaderboard',
          name: 'Leaderboard',
          component: require('@/ui/Leaderboard').default,
        },
        {
          path: 'settings',
          name: 'Settings',
          component: require('@/ui/Settings').default,
        },
        {
          path: 'about',
          name: 'About',
          component: require('@/ui/About').default,
        }
      ]
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
