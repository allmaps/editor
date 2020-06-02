<template>
  <header class="padding">
    <div class="menu">
      <h1>
        <router-link :to="{name: 'home', query: {url: $route.query.url}}">
          IIIF + Maps
        </router-link>
      </h1>
      <ol>
        <li>
          <router-link :to="{name: 'georeference', query: {url: $route.query.url}}">Georeference</router-link>
        </li>
        <li>
          <router-link :to="{name: 'mask', query: {url: $route.query.url}}">Mask</router-link>
        </li>
      </ol>
    </div>
    <form @submit.prevent="handleSubmit">
      <label>
        <input type="text" placeholder="IIIF manifest or image URL"
          v-model="inputManifestUrl" />
      </label>
    </form>
  </header>
</template>

<script>
export default {
  name: 'Header',
  data () {
    return {
      inputManifestUrl: this.$route.query.url
    }
  },
  watch: {
    '$route.query.url': function () {
      this.inputManifestUrl = this.$route.query.url
    }
    // manifestUrl () {
    //   this.inputManifestUrl = this.manifestUrl
    // }
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
  align-items: center;
  justify-content: space-between;
}

.menu {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

h1 {
  font-size: 100%;
  font-weight: bold;
  margin: 0;
  display: inline;
  line-height: 0;
}

ol {
  list-style: none;
}

ol, ol li {
  display: inline;
  margin: 0;
  padding: 0;
}

ol li, form {
  padding-left: 1em;
}

h1 a, ol li a, ol li a:visited {
  text-decoration: none;
}

a.router-link-exact-active  {
  text-decoration: underline;
}

form, form input {
  width: 100%;
}
</style>
