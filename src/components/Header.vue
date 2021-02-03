<template>
  <header class="padding">
    <div class="menu">
      <h1>
        <router-link :to="{name: 'home', query}">
          <img alt="Allmaps"
            src="https://raw.githubusercontent.com/allmaps/style/master/images/allmaps-logo.svg" />
          <span>
            Allmaps
          </span>
        </router-link>
      </h1>
      <ol>
        <li>
          <router-link :to="{name: 'preview', query}">preview</router-link>
        </li>
        <li>
          <router-link :to="{name: 'mask', query}">select &amp; mask</router-link>
        </li>
        <li>
          <router-link :to="{name: 'georeference', query}">georeference</router-link>
        </li>
        <li>
          <router-link :to="{name: 'results', query}">results</router-link>
        </li>
      </ol>
    </div>
    <form @submit.prevent="handleSubmit">
      <label>
        <input type="text" placeholder="IIIF manifest or image URL"
          v-model="inputUrl" />
      </label>
    </form>
  </header>
</template>

<script>
export default {
  name: 'Header',
  data () {
    return {
      inputUrl: this.$route.query.url
    }
  },
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
