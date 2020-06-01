<template>
  <footer class="padding">
    <div>
    </div>
    <div>
      <button @click="$emit('update:showAnnotation', !showAnnotation)">
        {{ showAnnotation ? 'Hide Annotation' : 'Show Annotation' }}
      </button>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'Footer',
  props: {
    showAnnotation: Boolean
  }
}
</script>

<style scoped>
footer {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  flex-shrink: 0;
}
</style>
