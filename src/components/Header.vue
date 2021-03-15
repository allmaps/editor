<template>
  <header class="padding">
    <h1>
      <router-link :to="{ name: 'home', query }">
        <img alt="Allmaps"
          src="https://raw.githubusercontent.com/allmaps/style/master/images/allmaps-logo.svg" />
      </router-link>
    </h1>

    <nav>
      <div class="buttons field has-addons">
        <p class="control">
          <b-button tag="router-link"
            icon-left="layer-group"
            :to="{ name: 'collection', query }"
            type="is-link is-collection">
            Collection
          </b-button>
        </p>

        <p class="control">
          <b-tooltip position="is-bottom" multilined
            :triggers="maskTooltipTriggers" :auto-close="['outside', 'escape']">
            <b-button tag="router-link"
              icon-left="draw-polygon"
              :to="{name: 'mask', query}"
              type="is-link is-mask">Mask</b-button>
              <template v-slot:content>
                <b-field>
                  <b-switch :value="true"
                    type="is-success">
                    This image contains one or more maps.
                  </b-switch>
                </b-field>
                <!-- <p></p> -->
            </template>
          </b-tooltip>
        </p>

        <p class="control">
          <b-button tag="router-link"
            icon-left="map-pin"
            :to="{ name: 'georeference', query }"
            type="is-link is-georeference">
            Georeference
          </b-button>
        </p>

        <p class="control">
          <b-button tag="router-link"
            icon-left="globe"
            :to="{ name: 'results', query }"
            type="is-link is-results">
            Results
          </b-button>
        </p>
      </div>
    </nav>

    <b-button class="is-light" @click="setSidebarOpen({ open: true })"
      pack="fas" icon-right="bars" />
  </header>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  name: 'Header',
  computed: {
    ...mapState({
      activeImageId: (state) => state.ui.activeImageId,
      maps: (state) => state.maps.maps
    }),
    maskTooltipTriggers: function () {
      return []
      // return Object.keys(this.maps).length ? [] : ['click']
    },
    query: function () {
      return {
        url: this.$route.query.url,
        image: this.$route.query.image
      }
    }
  },
  watch: {
    '$route.query.url': function () {
      this.inputUrl = this.$route.query.url
    }
  },
  methods: {
    ...mapActions('ui', [
      'setSidebarOpen'
    ]),

    handleSubmit () {
      this.$router.push({ name: this.$route.name, query: {
        url: this.inputUrl
      }})
    }
  }
}
</script>

<style scoped>
header {
  position: absolute;

  z-index: 35;
  width: 100%;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;
}

header > * {
  pointer-events: all;
}

h1 img {
  width: 40px;
}

nav a[type=button] {
  width: 150px;
  color: black;
  background: white;
}

nav a[type=button]:hover {
  color: black;
}

a.router-link-exact-active.collection {
  background-color: var(--blue-1);
  border-color: var(--blue-2);
}

a.router-link-exact-active.mask {
  background-color: var(--purple-1);
  border-color: var(--purple-2);
}

a.router-link-exact-active.georeference {
  background-color: var(--green-1);
  border-color: var(--green-2);
}

a.router-link-exact-active.results {
  background-color: var(--yellow-1);
  border-color: var(--yellow-2);
}

</style>
