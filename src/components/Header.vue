<template>
  <header class="padding">
    <h1 class="grid-item-logo">
      <span v-if="callback" class="link">
        <img
          alt="Allmaps"
          src="https://raw.githubusercontent.com/allmaps/style/master/images/allmaps-logo.svg"
        />
        <span>Allmaps Editor</span>
      </span>
      <router-link v-else class="link" :to="{ name: 'home' }">
        <img
          alt="Allmaps"
          src="https://raw.githubusercontent.com/allmaps/style/master/images/allmaps-logo.svg"
        />
        <span>Allmaps Editor</span>
      </router-link>
    </h1>

    <div class="grid-item-input">
      <template v-if="$route.query.url">
        <div v-if="callbackProject" class="callback smaller">
          <span
            >You’re georeferencing {{ imageText }} from
            <span v-html="callbackProject"
          /></span>
          <a
            v-if="callback"
            :href="callback"
            class="button is-link is-success"
            type="button"
          >
            <span class="icon is-small">
              <i class="fas fa-external-link-alt"></i>
            </span>
            <span>Return</span>
          </a>
        </div>
        <form v-else class="header-url">
          <b-field>
            <b-input
              ref="input"
              placeholder="IIIF Manifest or Image URL"
              expanded
              type="search"
              v-model="inputUrl"
              @focus="onInputFocus"
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
        </form>
      </template>
    </div>

    <div class="grid-item-menu smaller">
      <span v-if="$route.name !== 'home'"
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
      inputUrl: this.$route.query.url,
      imageText: 'an image'
    }
  },
  watch: {
    '$route.query.url': function () {
      this.inputUrl = this.$route.query.url
    },
    imageCount: function () {
      this.imageText = this.imageCount === 1 ? 'an image' : 'images'
    }
  },
  computed: {
    ...mapState({
      activeImageId: (state) => state.ui.activeImageId,
      iiifUrl: (state) => state.iiif.url,
      callback: (state) => state.ui.callback
    }),
    ...mapGetters('errors', {
      error: 'error'
    }),
    ...mapGetters('ui', {
      callbackProject: 'callbackProject'
    }),
    ...mapGetters('iiif', {
      imageCount: 'imageCount'
    })
  },
  methods: {
    ...mapActions('ui', ['setSidebarOpen']),
    onInputFocus() {
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
  grid-template-rows: auto;
  grid-template-columns: max-content 1fr max-content;
  gap: 1rem;
  grid-template-areas: 'logo input menu';
  box-shadow: 0 0 6px 0px rgb(0 0 0 / 20%);
  z-index: 30;
}

h1 .link,
.callback,
.link,
.grid-item-menu {
  display: grid;
  /* grid-template-rows: auto; */
  gap: 5px;
  grid-template-columns: auto auto;
  justify-items: center;
  align-items: center;
}

@media (max-width: 1200px) {
  header .smaller {
    font-size: 75%;
  }
}

@media (max-width: 700px) {
  header {
    grid-template-columns: auto auto;
    grid-template-rows: auto auto;
    grid-template-areas:
      'logo menu'
      'input input';
  }
}

.grid-item-logo {
  grid-area: logo;
  font-weight: bold;
  flex-shrink: 0;
  display: flex;
}

.grid-item-input {
  grid-area: input;
  place-self: center;
  width: 100%;
}

h1 .link {
  font-weight: bold;
  line-height: 1;
  grid-template-columns: 40px auto;
}

h1 .link img {
  width: 40px;
  display: inline-block;
  line-height: 1;
}

.header-url {
  width: 100%;
  margin-bottom: 0;
}

.callback > :first-child {
  place-self: center end;
}

.callback > :last-child {
  place-self: center start;
}

.callback > span {
  text-align: right;
}

.grid-item-menu {
  grid-area: menu;
  display: flex;
  flex-shrink: 0;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
}

.grid-item-menu > span {
  text-align: right;
}
</style>
