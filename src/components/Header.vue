<template>
  <header class="padding">
    <div class="menu">
      <h1>
        <img src="https://iiif.io/img/logo-iiif-34x30.png" /> + 🗺️
      </h1>
      <ol>
        <li>
          <router-link :to="{name: 'home', query: {url: $route.query.url}}">Home</router-link>
        </li>
        <li>
          <router-link :to="{name: 'georectify', query: {url: $route.query.url}}">Georectify</router-link>
        </li>
        <li>
          <router-link :to="{name: 'mask', query: {url: $route.query.url}}">Mask</router-link>
        </li>
      </ol>
    </div>
    <div>
      <form @submit.prevent="handleSubmit">
        <label>
          Manifest URL:
          <input type="text" v-model="inputManifestUrl"/>
        </label>
      </form>
    </div>
  </header>
</template>

<script>
export default {
  name: 'Header',
  props: {

  },
  data () {
    return {
      inputManifestUrl: this.$route.query.url
    }
  },
  watch: {
    manifestUrl () {
      this.inputManifestUrl = this.manifestUrl
    }
  },
  methods: {
    handleSubmit () {
      this.$router.push({ name: this.$route.name, query: {
        url: this.inputManifestUrl
      }})
    }
  }
}
</script>

<style scoped>
header {
  display: flex;
  flex-direction: row;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
}

.menu {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

h1 {
  margin: 0;
  display: inline;
  line-height: 0;
}

ol {
  list-style: none;
  font-weight: bold;
}

ol, ol li {
  display: inline;
  margin: 0;
  padding: 0;
}

ol li {
  padding-left: 1em;
}

ol li a, ol li a:visited {
  text-decoration: none;
}

ol li a.router-link-exact-active  {
  text-decoration: underline;
}
</style>
