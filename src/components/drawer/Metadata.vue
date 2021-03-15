<template>
  <div class="drawer-content content">
    <h3>{{ label }}</h3>
    <p>{{ description }}</p>
    <dl>
      <div v-for="(item, index) in metadata" :key="index">
        <dt>{{ item.label }} </dt>
        <dd>{{ item.value }} </dd>
      </div>
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
.drawer-content {
  margin-bottom: 1rem;
}
</style>
