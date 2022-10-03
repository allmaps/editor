<template>
  <header class="padding">
    <h1>
      <span v-if="referer" class="link">
        <img
          alt="Allmaps"
          src="https://raw.githubusercontent.com/allmaps/style/master/images/allmaps-logo.svg"
        />
        <span class="padding">Allmaps Editor</span>
      </span>
      <router-link v-else class="link" :to="{ name: 'home' }">
        <img
          alt="Allmaps"
          src="https://raw.githubusercontent.com/allmaps/style/master/images/allmaps-logo.svg"
        />
        <span class="padding">Allmaps Editor</span>
      </router-link>
    </h1>

    <div>
      <template v-if="iiifUrl">
        <div v-if="refererProject" class="referer">
          <span class="padding"
            >You’re editing a map from
            <strong>{{ refererProject }}</strong></span
          >
          <a
            v-if="referer"
            :href="referer"
            class="button is-link is-success"
            type="button"
          >
            <span class="icon is-small">
              <i class="fas fa-external-link-alt"></i>
            </span>
            <span>Return</span>
          </a>
        </div>
        <b-field v-else class="header-url">
          <b-input
            ref="input"
            placeholder="IIIF manifest or image URL"
            expanded
            type="search"
            v-model="inputUrl"
            @focus="focusInput"
          />
          <p class="control">
            <b-button
              native-type="submit"
              type="is-primary"
              @click="handleSubmit"
              label="Load"
            />
          </p>
        </b-field>
      </template>
    </div>

    <div class="menu">
      <span v-if="$route.name !== 'home'" class="padding"
        >All edits are automatically saved</span
      >

      <b-button
        class="is-light"
        @click="setSidebarOpen({ open: true })"
        pack="fas"
        icon-right="question"
      />
    </div>
  </header>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'

// TODO: add:
// 'You’re editing a new map.'
// 'Someone has started georeferencing this map, you can continue editing to improve their work.'
// 'All edits are automatically saved in the Allmaps database.'

export default {
  name: 'Header',
  data: function () {
    return {
      inputUrl: this.$route.query.url
    }
  },
  watch: {
    '$route.query.url': function () {
      this.inputUrl = this.$route.query.url
    }
  },
  computed: {
    ...mapState({
      activeImageId: (state) => state.ui.activeImageId,
      iiifUrl: (state) => state.iiif.url,
      referer: (state) => state.ui.referer
    }),
    ...mapGetters('errors', {
      error: 'error'
    }),
    ...mapGetters('ui', {
      refererProject: 'refererProject'
    })
  },
  methods: {
    ...mapActions('ui', ['setSidebarOpen']),
    focusInput () {
      const inputElement = this.$refs.input.$el.querySelector('input')
      // inputElement.setSelectionRange(0, inputElement.value.length);
      inputElement.select()
    },
    handleSubmit() {
      if (this.$route.query.url !== this.inputUrl) {
        this.$router.push({
          name: 'collection',
          query: {
            url: this.inputUrl
          }
        })
      }
    }
  }
}
</script>

<style scoped>
header {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr minmax(200px, 1fr) 1fr;

  box-shadow: 0 0 6px 0px rgb(0 0 0 / 20%);
  z-index: 30;
}

h1 {
  font-weight: bold;
  flex-shrink: 0;
}

h1 .link {
  line-height: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
}

h1 .link img {
  width: 40px;
  display: inline-block;
  line-height: 1;
}

.header-url {
  width: 100%;
  margin-bottom: 0;
  max-width: 800px;
}

.referer {
  display: flex;
  align-items: center;
}

.menu {
  display: flex;
  flex-shrink: 0;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
}
</style>
