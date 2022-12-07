<template>
  <div class="drawer-content content">
    <h3 v-if="label">{{ label }}</h3>
    <p v-if="description">{{ description }}</p>
    <dl v-if="metadata">
      <div v-for="(item, index) in metadata" :key="index">
        <dt>{{ item.label }}</dt>
        <dd>{{ item.value }}</dd>
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

.drawer-content.content {
  overflow-y: auto;
}
</style>
