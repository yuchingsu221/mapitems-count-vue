import Vue from 'vue'
import Router from 'vue-router'
import lotterystations from './views/lotterystations.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'lotterystations',
      component: lotterystations
    }
  ]
})
