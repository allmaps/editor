import Vue from 'vue'
import VueRouter from 'vue-router'
import Buefy from 'buefy'

import 'buefy/dist/buefy.css'
import './assets/base.scss'

import hljs from 'highlight.js'

import App from './App.vue'
import store from './store'

Vue.use(VueRouter)
Vue.use(Buefy, {
  defaultIconPack: 'fas',
  defaultContainerElement: '#content'
})

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
      hljs.highlightElement(target)
    })
  },
  componentUpdated: function (el, binding) {
    // after an update, re-fill the content and then highlight
    let targets = el.querySelectorAll('code')
    targets.forEach((target) => {
      if (binding.value) {
        target.textContent = binding.value
        hljs.highlightElement(target)
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

export const router = new VueRouter({
  routes: [
    {
      name: 'home',
      path: '/',
      component: App
    },
    {
      name: 'collection',
      path: '/collection',
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
  if (to.name !== 'home') {
    // TODO: also include other query parameters?
    //  or maybe all query parameters?
    if (from.query.bbox && !to.query.bbox) {
      console.log('copy bbox')
      next({
        path: to.path,
        query: {
          ...to.query,
          bbox: from.query.bbox
        }
      })

      return
    }
  }

  next()
})

new Vue({
  router,
  store,
  render: (h) => h(App)
}).$mount('#app')
