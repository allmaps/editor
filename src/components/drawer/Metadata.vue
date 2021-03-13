<template>
  <div class="metadata">
    <h3>{{ label }}</h3>
    <p>{{ description }}</p>
    <dl>
      <div v-for="(item, index) in metadata" :key="index">
        <!-- <dt>{{ label }} </dt> -->
        <dd>{{ item }} </dd>
      </div>

      <!-- <dt>Morgawr</dt>
      <dd>A sea serpent.</dd>

      <dt>Owlman</dt>
      <dd>A giant owl-like creature.</dd> -->
    </dl>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'Metadata',
  computed: {
    ...mapGetters('iiif', {
      label: 'label',
      description: 'description',
      metadata: 'metadata'
    })
  }
}
</script>

<style scoped>
.metadata {
  max-height: 300px;
  overflow-y: auto;
}
</style>
