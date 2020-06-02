<template>
  <div class="text">
    <p>
      This is a prototype of a IIIF-based map georeferencing tool. Lorem ipsum dolor sit amet consectetur adipisicing elit. Repellat fugit non et rem sed necessitatibus sunt sint nemo saepe, veritatis ducimus enim quis? Nihil ad obcaecati dignissimos delectus. Voluptate, ratione! Lorem, ipsum dolor sit amet consectetur adipisicing elit. Consequatur obcaecati ducimus suscipit repellat maiores minima. Delectus, tempora vel tenetur eligendi nulla illo architecto repudiandae accusantium iure, cum, eaque sit nemo. Lorem ipsum dolor sit amet consectetur adipisicing elit. Cum itaque quaerat minus et laboriosam quam veniam nihil harum ex sunt asperiores recusandae, rem possimus esse ullam fugiat placeat odit! Ut. Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolores illo eos labore! Eum excepturi accusantium tenetur aspernatur repellendus mollitia recusandae facilis dolore, porro, adipisci nobis, eaque aperiam cumque. Dolorem, similique. Lorem ipsum dolor sit amet consectetur adipisicing elit. Reprehenderit, reiciendis, maxime quaerat illum inventore non qui omnis, vero quas eaque ea sed eius nisi aliquam quisquam ratione hic. Odio, qui? Lorem ipsum dolor sit, amet consectetur adipisicing elit. Obcaecati ex numquam impedit ipsam nihil nesciunt illum quidem illo mollitia. Eos atque dolore aspernatur esse maiores consequuntur expedita corrupti ipsum ad.
    </p>
    <div v-if="exampleManifests">
      <p>
        Some example IIIF manifests:
      </p>
      <ul>
        <li v-for="{label, url} in exampleManifests" :key="url">
          <router-link :to="{name: 'home', query: {url}}">
            {{ label }}
          </router-link>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>

export default {
  name: 'Home',
  props: {
    exampleManifests: Array
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
</style>
