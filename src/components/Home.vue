<template>
  <div>
    <p>
    viewer!
    link naar manifest
    </p>
    <p>
      Annotation store!!!!!!
    </p>
    <p>
      <a :href="`https://iiifmaps.glitch.me/proxy?url=${$route.query.url}`">proxy!</a>
    </p>
    <ul>
      <li v-for="url in exampleManifestUrls" :key="url">
        <router-link :to="{name: 'home', query: {url}}">{{url}}</router-link>
      </li>
    </ul>
  </div>
</template>

<script>

const exampleManifestUrls = [
  'https://purl.stanford.edu/vg994wz9415/iiif/manifest',
  'https://iiif.lib.harvard.edu/manifests/ids:18833859',
  'https://images.iiifhosting.com/iiif/d61510444851fe89a337cc0fcdd58ccca5a3cb164a21089e027f79cba9c7efe1/manifest.json',
  'https://www.davidrumsey.com/luna/servlet/iiif/m/RUMSEY~8~1~319878~90088984/manifest',
  'https://www.davidrumsey.com/luna/servlet/iiif/m/RUMSEY~8~1~239951~5512086/manifest'
]

export default {
  name: 'Home',
  props: {

  },
  data: function () {
    return {
      exampleManifestUrls
    }
  }
}
</script>

<style scoped>

</style>
