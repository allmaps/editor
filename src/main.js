import Vue from 'vue'
import VueRouter from 'vue-router'
import hljs from 'highlight.js'

import App from './App.vue'
import store from './store'

Vue.use(VueRouter)

Vue.config.productionTip = false

Vue.directive('highlightjs', {
  deep: true,
  bind: function (el, binding) {
    // on first bind, highlight all targets
    let targets = el.querySelectorAll('code')
    targets.forEach((target) => {
      // if a value is directly assigned to the directive, use this
      // instead of the element content.
      if (binding.value) {
        target.textContent = binding.value
      }
      hljs.highlightBlock(target)
    })
  },
  componentUpdated: function (el, binding) {
    // after an update, re-fill the content and then highlight
    let targets = el.querySelectorAll('code')
    targets.forEach((target) => {
      if (binding.value) {
        target.textContent = binding.value
        hljs.highlightBlock(target)
      }
    })
  }
})

// TODO: New routes??
// ?uri=uri, redirect to /i or /m
// /i/:id
// /m/:id/i/:id
// /m/:id/i/:id/preview
// /m/:id/i/:id/georeference

const router = new VueRouter({
  routes: [
    {
      name: 'home',
      path: '/',
      component: App
    },
    {
      name: 'preview',
      path: '/preview',
      component: App
    },
    {
      name: 'georeference',
      path: '/georeference',
      component: App
    },
    {
      name: 'mask',
      path: '/mask',
      component: App
    },
    {
      name: 'results',
      path: '/results',
      component: App
    }
  ]
})

router.beforeEach((to, from, next) => {
  if (from.query.token && !to.query.token) {
    next({path: to.path,
      query: {
        ...to.query,
        token: from.query.token
      }
    })
  }

  next()
})

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
