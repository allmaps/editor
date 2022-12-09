<template>
  <div class="below-header">
    <div class="container content section">
      <p class="block">
        Start georeferencing an image by typing the URL of a IIIF Manifest or
        IIIF Image URL in the input box:
      </p>

      <form class="block">
        <b-field>
          <b-input
            placeholder="IIIF Manifest or Image URL"
            expanded
            v-model="inputUrl"
            class="is-link"
            type="search"
            autofocus="autofocus"
          >
          </b-input>
          <p class="control">
            <b-button
              @click="handleSubmit"
              native-type="submit"
              type="is-primary"
              label="Load"
            />
          </p>
        </b-field>
      </form>
      <Examples />
    </div>
  </div>
</template>

<script>
import Examples from './Examples.vue'

export default {
  name: 'Home',
  components: {
    Examples
  },
  props: {
    images: Object
  },
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
  methods: {
    handleSubmit() {
      this.$router.push({
        name: 'collection',
        query: {
          url: this.inputUrl
        }
      })
    }
  }
}
</script>

<style scoped>
.text {
  width: 100%;
  position: relative;
}

.text > *:first-child {
  margin-top: 0;
}

a {
  text-decoration: underline;
}
</style>
