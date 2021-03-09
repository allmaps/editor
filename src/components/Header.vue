<template>
  <header class="padding">
    <h1 class="menu-icon">
      <a href="https://allmaps.org/">
        <img alt="Allmaps"
          src="https://raw.githubusercontent.com/allmaps/style/master/images/allmaps-logo.svg" />
      </a>
    </h1>
    <ol>
      <li>
        <router-link class="collection" :to="{name: 'home', query}">Collection</router-link>
      </li>
      <li>
        <router-link class="mask" :to="{name: 'mask', query}">Mask</router-link>
      </li>
      <li>
        <router-link class="georeference" :to="{name: 'georeference', query}">Georeference</router-link>
      </li>
      <li>
        <router-link class="results" :to="{name: 'results', query}">Results</router-link>
      </li>
    </ol>
    <div class="menu-icon">
    </div>
  </header>
</template>

<script>
export default {
  name: 'Header',
  computed: {
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
  z-index: 999;
  width: 100%;

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

.menu-icon {
  width: 50px;
}

h1 {
  font-size: 100%;
  font-weight: bold;
  margin: 0;
  display: inline;
  line-height: 0;
}

h1 img {
  width: 1.8em;
}

h1 a {
  display: flex;
  flex-direction: row;
  align-items: center;
}

h1 span {
  margin-left: 0.5em;
}

ol {
  list-style: none;
  line-height: 0;
}

ol, ol li {
  display: inline;
  margin: 0;
  padding: 0;
}

ol li a {
  width: 160px;
  display: inline-block;
  background-color: white;

  border-color: rgb(221, 221, 221);
  border-width: 3px;
  border-style: solid;

  padding: 0.8em 0.5em;
  text-align: center;
}

ol li:first-child a {
  border-radius: 999px 0 0 999px;
}

ol li:last-child a {
  border-radius: 0 999px 999px 0;
}

h1 a, ol li a, ol li a:visited {
  text-decoration: none;
}

a.router-link-exact-active  {
  /* text-decoration: underline; */
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
