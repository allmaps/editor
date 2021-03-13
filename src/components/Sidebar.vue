<template>
  <section>
    <b-sidebar type="is-light" :fullheight="true"
      :overlay="true" :right="true" v-model="open">
      <div class="padding">
        <div class="title">
          <span>Allmaps Editor</span>
          <b-button @click="open = false"
            icon-right="times" />
        </div>
        <ul>
          <li>About</li>
          <li>Keyboard shortcuts</li>
          <li>Open source</li>
          <li>Explore map collections</li>
          <li>Terms of use</li>
        </ul>
      </div>
    </b-sidebar>
  </section>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'Sidebar',
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

</style>
