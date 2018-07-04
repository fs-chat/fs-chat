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
          path: 'home',
          name: 'Home',
          component: require('@/ui/Home').default,
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
