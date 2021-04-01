<template>
  <section>
    <b-sidebar type="is-light" :fullheight="true"
      :overlay="true" :right="true" v-model="open">
      <div class="padding">
        <div class="title">
          <div>
            <img alt="Allmaps"
              src="https://raw.githubusercontent.com/allmaps/style/master/images/allmaps-logo.svg" />
            <span>Allmaps Editor</span>
          </div>
          <b-button @click="open = false"
            class="is-light" icon-right="times" />
        </div>
        <div class="container content">
          <p>
           <router-link :to="{ name: 'home' }">Open new IIIF URL</router-link>
          </p>
          <h4>Keyboard shortcuts</h4>

          <dl class="shortcuts">
            <div v-for="(shortcut, index) of shortcuts" :key="index" class="shortcut block">
              <dt>{{ shortcut.label }}</dt>
              <dd class="key">{{ shortcut.key }}</dd>
            </div>
          </dl>
        </div>
        <!-- <ul>
          <li>About</li>
          <li>Open source</li>
          <li>Explore map collections</li>
          <li>Terms of use</li>
        </ul> -->
      </div>
    </b-sidebar>
  </section>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'Sidebar',
  data: function () {
    return {
      shortcuts: [
        { label: 'Previous image', key: '[' },
        { label: 'Next image', key: ']' },

        { label: 'Open new IIIF URL', key: '0' },
        { label: 'Collection view', key: '1' },
        { label: 'Mask view', key: '2' },
        { label: 'Georeference view', key: '3' },
        { label: 'Results view', key: '4' },

        { label: 'Open metadata drawer', key: 'I' },
        { label: 'Open maps & GCP drawer', key: 'M' },
        { label: 'Open annotation drawer', key: 'A' },

        { label: 'Close dialog or sidebar', key: 'esc' }
      ]
    }
  },
  methods: {
    ...mapActions('ui', [
      'setSidebarOpen'
    ])
  },
  computed: {
    open: {
      get () {
        return this.$store.state.ui.sidebarOpen
      },
      set (open) {
        this.setSidebarOpen({ open })
      },
    }
  }
}
</script>

<style scoped>
.title {
  display: flex;
}

.title img {
  width: 1em;
}

.shortcuts {
  font-size: 75%;
}

.shortcut {
  display: flex;
  justify-content: space-between;
}

.key {
  font-family: monospace;
  box-shadow: 0 0 0 1px #dedede,1px 1px 0 1px #e8e8e8;
  padding: 0 0.25em;
  min-width: 1.5em;
  font-weight: bold;
  text-align: center;
  margin-left: 1em;
  display: inline-block;
  border-radius: 2px;
  white-space: nowrap;
}
</style>
