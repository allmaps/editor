<template>
  <nav class="padding">
    <div class="buttons field has-addons">
      <p class="control">
        <b-button
          tag="router-link"
          icon-left="layer-group"
          :to="{ name: 'collection', query }"
          type="is-link is-collection"
        >
          Collection
        </b-button>
      </p>

      <p class="control">
        <b-tooltip
          position="is-bottom"
          multilined
          :triggers="maskTooltipTriggers"
          :auto-close="['outside', 'escape']"
        >
          <b-button
            tag="router-link"
            icon-left="draw-polygon"
            :to="{ name: 'mask', query }"
            type="is-link is-mask"
            >Mask</b-button
          >
          <template v-slot:content>
            <b-field>
              <b-switch :value="true" type="is-success">
                This image contains one or more maps.
              </b-switch>
            </b-field>
            <!-- <p></p> -->
          </template>
        </b-tooltip>
      </p>

      <p class="control">
        <b-button
          tag="router-link"
          icon-left="map-pin"
          :to="{ name: 'georeference', query }"
          type="is-link is-georeference"
        >
          Georeference
        </b-button>
      </p>

      <p class="control">
        <b-button
          tag="router-link"
          icon-left="globe"
          :to="{ name: 'results', query }"
          type="is-link is-results"
        >
          Results
        </b-button>
      </p>
    </div>
  </nav>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'

export default {
  name: 'Nav',
  computed: {
    ...mapState({
      activeImageId: (state) => state.ui.activeImageId,
      activeMapId: (state) => state.ui.activeMapId,
      maps: (state) => state.maps.maps
    }),
    ...mapGetters('errors', {
      error: 'error'
    }),
    maskTooltipTriggers: function () {
      return []
      // return Object.keys(this.maps).length ? [] : ['click']
    },
    query: function () {
      return {
        url: this.$route.query.url,
        image: this.$route.query.image,
        map: this.$route.query.map
      }
    }
  },
  watch: {
    '$route.query.url': function () {
      this.inputUrl = this.$route.query.url
    }
  },
  methods: {
    // ...mapActions('ui', ['setSidebarOpen']),

    handleSubmit() {
      this.$router.push({
        name: this.$route.name,
        query: {
          url: this.inputUrl
        }
      })
    }
  }
}
</script>

<style scoped>
nav {
  position: absolute;
  z-index: 35;
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

nav p.control {
  pointer-events: all;
}

nav a.button {
  color: black;
  background: white;
  border-color: #bbb;
}

nav a.button:hover,
nav a.button:active {
  color: black;
}

a.button.router-link-exact-active.is-collection {
  background-color: var(--blue-1);
  border-color: var(--blue-2);
}

a.button.router-link-exact-active.is-mask {
  background-color: var(--purple-1);
  border-color: var(--purple-2);
}

a.button.router-link-exact-active.is-georeference {
  background-color: var(--green-1);
  border-color: var(--green-2);
}

a.button.router-link-exact-active.is-results {
  background-color: var(--yellow-1);
  border-color: var(--yellow-2);
}
</style>
