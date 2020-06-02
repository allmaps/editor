<template>
  <footer class="padding">
    <div>
    </div>
    <div>
      <a>Copy Annotation to clipboard</a>
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
  },
  methods: {
    copyToClipboard: function (str) {
      const textArea = document.createElement('textarea')
      textArea.value = str
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }
}
</script>

<style scoped>
footer {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

footer button {
  margin-left: 1em;
}
</style>
