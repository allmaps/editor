<template>
  <div class="container below-header">
    <p>
      Select a map image by typing its IIIF manifest or image URL in the input box.
    </p>
    <form @submit.prevent="handleSubmit">
      <b-field label="IIIF manifest or image URL">
        <b-input v-model="inputUrl" placeholder="IIIF manifest or image URL"></b-input>
      </b-field>
    </form>
  </div>
</template>

<script>
export default {
  name: 'Home',
  props: {
    images: Object,

  },
  data () {
    return {
      inputUrl: this.$route.query.url
    }
  },
  computed: {
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
.text {
  width: 100%;
  position: relative;
}

.text > *:first-child {
  margin-top: 0;
}

.images {
  margin: 0;
  padding: 0;
  list-style-type: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  grid-gap: 10px;
}

.images li {
  position: relative;
  box-sizing: border-box;
  border-width: 3px;
  border-color: white;
  border-style: solid;
  transition: border-color 0.08s;
}

.images li::before {
  content: "";
  padding-bottom: 100%;
  display: inline-block;
  vertical-align: top;
}

.images li.active {
  border-color: #C552B5;
  border-style: solid;
  border-width: 3px;
}

.images li a {
  width: 100%;
  height: 100%;
}

.images li img.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.icons {
  position: absolute;
  bottom: 0;
  height: 2rem;
  padding: 2px;
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
}

.icons img {
  width: 32px;
  opacity: 0.15;
}

.icons img.present {
  opacity: 1;
}
</style>
