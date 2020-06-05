import Vue from 'vue'
import App from './App.vue'
import VueRouter from 'vue-router'
import hljs from 'highlight.js'

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

const router = new VueRouter({
  routes: [
    {
      name: 'home',
      path: '/',
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
      name: 'map',
      path: '/map',
      component: App
    }
  ]
})

new Vue({
  render: h => h(App),
  router
}).$mount('#app')
