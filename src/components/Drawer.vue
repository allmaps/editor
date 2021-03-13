<template>
  <footer class="padding">
    <div class="drawer box column is-three-quarters-mobile is-two-thirds-tablet is-half-desktop is-one-third-widescreen">
      <template v-if="drawerOpen">
        <Metadata v-if="drawerOpen === 'metadata'" />
        <Maps v-else-if="drawerOpen === 'maps'" />
        <Annotation v-else-if="drawerOpen === 'annotation'" />
        <hr />
      </template>

      <!-- <div v-if="activeImage && imageCount > 1" class="menu">
        <template v-if="activeImage.previousImageId">
          <router-link :to="{
            name: $route.name,
            query: {
              url: $route.query.url,
              image: activeImage.previousImageId
            }}">Previous</router-link>
        </template>
        <template v-else>
          <span>Previous</span>
        </template>
        <span>
          <router-link :to="{
          name: 'home',
          query: {
            url: $route.query.url,
            image: $route.query.image
          }}">Image {{ activeImage.index + 1}}/{{ imageCount }}</router-link>
        </span>
        <template v-if="activeImage.nextImageId">
          <router-link :to="{
            name: $route.name,
            query: {
              url: $route.query.url,
              image: activeImage.nextImageId
            }}">Next</router-link>
        </template>
        <template v-else>
          <span>Next</span>
        </template>
      </div> -->


      <div class="controls">
        <div class="text">
          <div>
            Editing image {{ activeImage.index + 1}}/{{ imageCount }}

           <b-button size="is-small"
              icon-left="arrow-left" />
            <b-button size="is-small"
              icon-left="arrow-right" />

          </div>
          <h3 class="label">{{ label }}</h3>
        </div>
        <div class="buttons">
          <b-button @click="toggleDrawer('metadata')"
            :active="drawerOpen === 'metadata'" icon-right="info" />
          <b-button @click="toggleDrawer('maps')"
            :active="drawerOpen === 'maps'" icon-right="list" />
          <b-button @click="toggleDrawer('annotation')"
            :active="drawerOpen === 'annotation'" icon-right="code" />
          <!-- <b-button
            icon-right="undo" @click="undo" />
          <b-button
            icon-right="redo" @click="redo" /> -->
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'

import Metadata from './drawer/Metadata.vue'
import Maps from './drawer/Maps.vue'
import Annotation from './drawer/Annotation.vue'

export default {
  name: 'Drawer',
  components: {
    Metadata,
    Maps,
    Annotation
  },
  props: {
    images: Object,
    activeImageId: String,
  },
  methods: {
    ...mapActions('ui', [
      'setDrawerOpen'
    ]),
    ...mapActions('maps', [
      'undo',
      'redo'
    ]),
    toggleDrawer: function (drawer) {
      this.drawerOpen = this.drawerOpen === drawer ? undefined : drawer
    }
  },
  computed: {
    ...mapGetters('iiif', {
      label: 'label'
    }),
    drawerOpen: {
      get () {
        return this.$store.state.ui.drawerOpen
      },
      set (drawer) {
        this.setDrawerOpen({ drawer })
      },
    },
    imageCount: function () {
      return Object.keys(this.images).length
    },
    activeImage: function () {
      return this.images[this.activeImageId]
    }
  }
}
</script>

<style scoped>
footer {
  position: absolute;
  z-index: 35;
  bottom: 0;
  width: 100%;

  display: flex;
  justify-content: center;

  pointer-events: none;
}

.drawer {
  pointer-events: all;
  background-color: white;
}

.controls {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.buttons {
  flex-wrap: nowrap;
}

.buttons button {
  border-radius: 999px;
}

.label {
  text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    width: 300px;
}

.menu > * {
  margin-right: .5em;
}

.menu button {
  padding: .5em;
  margin: 0;
}
</style>
