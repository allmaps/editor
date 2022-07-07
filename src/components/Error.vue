<template>
  <div class="container">
    <div v-if="error.type === 'iiif'">
      <div class="title">Error parsing IIIF data</div>
      <p class="description">
        The URL you entered does not seem to point to a valid
        <a href="https://iiif.io/api/presentation/3.0/#52-manifest"
          >IIIF Manifest</a
        >
        or
        <a href="https://iiif.io/api/image/3.0/#5-image-information"
          >IIIF Image</a
        >. Allmaps Editor supports IIIF APIs version 2 and 3.
      </p>
      <p>
        If the URL does point to a IIIF Manifest or IIIF Image the data returned
        by the server might be incorrect or there might be a bug in the
        <a href="https://github.com/allmaps/iiif-parser">IIIF parser</a> used by
        Allmaps Editor.
      </p>
      <p>
        Contact the owner of the IIIF server, or
        <a href="https://github.com/allmaps/iiif-map-collections/issues"
          >open an issue</a
        >
        in the GitHub repo used by Allmaps to track problems like this.
      </p>
    </div>

    <div v-else-if="error.type === 'json'">
      <div class="title">Error parsing JSON</div>
      <p class="description">
        The URL you entered does not point to a valid JSON file. Please check
        the URL and try again.
      </p>
    </div>

    <div v-else-if="error.type === 'fetch'">
      <div class="title">Error downloading URL</div>
      <p class="description">
        Allmaps Editor cannot access the URL you entered.
      </p>
    </div>

    <div v-else-if="error.type === 'imageIDs'">
      <div class="title">Error comparing Image IDs</div>
      <p class="description">
        The Image IDs in the IIIF Manifest do not match the IDs in the
        <a href="https://iiif.io/api/image/3.0/#5-image-information"
          >Image Information</a
        >
        (the <code>info.json</code> file) of the IIIF Images linked to in the
        Manifest.
      </p>
      <p>This error was caused by a the following IIIF Image IDs:</p>

      <table>
        <tr>
          <td>Manifest:</td>
          <td class="url">
            <a :href="error.details.embeddedImageUri">{{
              error.details.embeddedImageUri
            }}</a>
          </td>
        </tr>
        <tr>
          <td><code>info.json</code>:</td>
          <td class="url">
            <a :href="error.details.imageUri">{{ error.details.imageUri }}</a>
          </td>
        </tr>
      </table>

      <p>
        Contact the owner of the IIIF server, or
        <a href="https://github.com/allmaps/iiif-map-collections/issues"
          >open an issue</a
        >
        in the GitHub repo used by Allmaps to track problems like this.
      </p>
    </div>

    <div v-else>
      <div class="title">Unknown error</div>
    </div>

    <table>
      <tr>
        <td>URL:</td>
        <td class="url">
          <a :href="url">{{ url }}</a>
        </td>
      </tr>
      <tr>
        <td>Error:</td>
        <td class="error-message">{{ error.message }}</td>
      </tr>
    </table>
    <b-button @click="$router.push({ name: 'home' })">Start over</b-button>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'Error',
  computed: {
    ...mapGetters('errors', {
      error: 'error'
    }),
    url: function () {
      return this.$route.query.url
    }
  }
}
</script>

<style scoped>
.container {
  padding: 1em;
  display: flex;
  flex-direction: column;
  /* justify-content: center; */
  align-items: center;
  height: 100%;
  width: 700px;
  max-width: 100%;
}

a {
  text-decoration: underline;
}

p,
table {
  margin-bottom: 1em;
}

.container > div,
.container > table {
  width: 100%;
}

.url a {
  overflow-wrap: break-word;
}

.error-message {
  font-family: monospace;
  max-height: ;
}

table tr td:first-child {
  width: 120px;
}

table td {
  word-break: break-all;
}
</style>
