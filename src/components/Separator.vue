<template>
  <div :class="{ padding: true, top, bottom: !top }">
    <div class="separator" />
  </div>
</template>

<script>
export default {
  name: 'Separator',
  props: {
    top: {
      default: true,
      type: Boolean
    }
  }
}
</script>

<style scoped>
  .separator {
    border-bottom-color: #e10800;
    border-bottom-width: 5px;
    border-bottom-style: solid;
  }

  .top {
    padding-top: 0;
    padding-bottom: 2px;
  }

  .bottom {
    padding-top: 2px;
    padding-bottom: 0;
  }
</style>
