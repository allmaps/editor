<template>
  <header class="padding">
    <div class="menu">
      <h1>
        <a href="https://allmaps.org/">
          <img alt="Allmaps"
            src="https://raw.githubusercontent.com/allmaps/style/master/images/allmaps-logo.svg" />
          <span>
            Allmaps
          </span>
        </a>
      </h1>
      <ol>
        <li>
          <router-link :to="{name: 'home', query}">Collection</router-link>
        </li>
        <li>
          <router-link :to="{name: 'mask', query}">Mask</router-link>
        </li>
        <li>
          <router-link :to="{name: 'georeference', query}">Georeference</router-link>
        </li>
      </ol>
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
  /* position: absolute;
  z-index: 999; */

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
