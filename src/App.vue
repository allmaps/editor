<template>
  <div id="app">
    <Header />
    <main>
      <template v-if="$route.name === 'georectify'">
        <Georectify :iiif="iiif" :connection="connection"
          @update="updateGeorectifyData" />
      </template>
      <template v-else-if="$route.name === 'mask'">
        <EditMask :iiif="iiif" :connection="connection"
          @update="updateMaskData" />
      </template>
      <template v-else>
        <Home class="padding" />
      </template>
      <transition name="slide">
        <template v-if="showAnnotation">
          <Annotation class="annotation"
            :iiif="iiif"
            :maskData="maskData"
            :georectifyData="georectifyData" />
        </template>
      </transition>
    </main>
    <Footer :showAnnotation.sync="showAnnotation" />
  </div>
</template>

<style src='ol/ol.css'></style>
<style src='highlight.js/styles/sunburst.css'></style>

<script>
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import Home from './components/Home.vue'
import Georectify from './components/Georectify.vue'
import EditMask from './components/EditMask.vue'
import Annotation from './components/Annotation.vue'

import {getManifest, getImageInfo} from './lib/iiif'
import connect from './lib/sharedb'

const serverUrl = process.env.VUE_APP_SERVER_URL

export default {
  name: 'app',
  components: {
    Header,
    Footer,
    Home,
    Georectify,
    EditMask,
    Annotation
  },
  data () {
    return {
      iiif: undefined,
      connection: undefined,
      maskData: undefined,
      georectifyData: undefined,
      showAnnotation: false
    }
  },
  methods: {
    updateGeorectifyData: function (data) {
      this.georectifyData = data
    },
    updateMaskData: function (data) {
      this.maskData = data
    },
    updateIiif: async function (manifestUrl) {
      const manifest = await getManifest(manifestUrl)
      const imageInfo = await getImageInfo(manifest)

      this.iiif = {
        url: manifestUrl,
        manifest,
        imageInfo
      }
    }
  },
  mounted: function () {
    if (this.$route.query.url) {
      this.updateIiif(this.$route.query.url)
    }

    this.connection = connect(serverUrl)
  },
  watch: {
    '$route.query.url': function (url) {
      this.updateIiif(url)
    }
  }
}
</script>

<style>
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  position: absolute;
}

main p a, main ul a, main ol a {
  word-break: break-all;
}

.padding {
  padding: 10px;
  box-sizing: border-box;
}

* {
  box-sizing: border-box;
}

#app {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  color: #2c3e50;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

main {
  height: 100%;
  display: flex;
  flex-direction: row;
}

main > * {
	height: 100%;
	width: 100%;
  box-sizing: border-box;
}

.annotation {
  width: calc(100% / 3);
  flex-shrink: 0;
}

header, footer {
  background: linear-gradient(145deg, #46cf75, #3bae62);
}

header, footer,
header a, footer a,
header a:visited, footer a:visited {
  color: black;
}

/* .slide-enter-active, .slide-leave-active {
  transition: width .5s;
}
.slide-enter, .slide-leave-to {
  width: 0;
} */

</style>
