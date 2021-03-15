<template>
  <footer class="padding">
    <div class="drawer box column is-three-quarters-mobile is-two-thirds-tablet is-half-desktop is-one-third-widescreen">
      <template v-if="drawerOpen">
        <Metadata v-if="drawerOpen === 'metadata'" />
        <Maps v-else-if="drawerOpen === 'maps'" />
        <Annotation v-else-if="drawerOpen === 'annotation'" />
        <hr />
      </template>

      <div class="base">
        <h3 class="label">{{ label }}</h3>
        <div class="controls">
          <div class="select-image">
            <template v-if="activeImage">
              <span>
                Editing image {{ activeImage.index + 1 }}/{{ imageCount }}
              </span>
              <div class="buttons prev-next-buttons">
                <b-button size="is-small" icon-left="arrow-left"
                  :disabled="!activeImage.previousImageId"
                  tag="router-link" type="is-link" :to="{
                  name: $route.name,
                  query: {
                    url: $route.query.url,
                    image: activeImage.previousImageId
                  }}" />
                <b-button size="is-small" icon-left="arrow-right"
                  :disabled="!activeImage.nextImageId"
                  tag="router-link" type="is-link" :to="{
                  name: $route.name,
                  query: {
                    url: $route.query.url,
                    image: activeImage.nextImageId
                  }}" />
              </div>
            </template>
          </div>

          <div class="buttons drawer-buttons">
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
    </div>
  </footer>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex'

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
  methods: {
    ...mapActions('ui', [
      'toggleDrawer'
    ]),
    ...mapActions('maps', [
      'undo',
      'redo'
    ])
  },
  computed: {
    ...mapGetters('iiif', {
      label: 'label',
      imageCount: 'imageCount'
    }),
    ...mapGetters('ui', {
      activeImage: 'activeImage'
    }),
    ...mapState({
      drawerOpen: (state) => state.ui.drawerOpen
    })
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
  align-items: center;
}

.prev-next-buttons {
  display: inline-block;
}

.drawer-buttons {
  flex-wrap: nowrap;
}

.drawer-buttons button {
  border-radius: 999px;
}

.label {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.drawer-content {
  max-height: 300px;
  overflow-y: auto;
}
</style>
