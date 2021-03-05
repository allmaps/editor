import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'

import hljs from 'highlight.js'

import App from './App.vue'
import store from './store'

// TODO: New routes??
// ?uri=uri, redirect to /i or /m
// /i/:id
// /m/:id/i/:id
// /m/:id/i/:id/preview
// /m/:id/i/:id/georeference

const router = createRouter({
  history: createWebHashHistory(),
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

const app = createApp(App)

app.use(router).use(store).mount('#app')

app.directive('highlightjs', {
  deep: true,
  beforeMount: function (el, binding) {
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
  updated: function (el, binding) {
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
