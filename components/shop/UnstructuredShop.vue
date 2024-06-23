<script setup lang="ts">
withDefaults(defineProps<{ shopNo: string }>(), { shopNo: '1' });
</script>

<template>
  <div>
    <h1>shopNo: {{ shopNo }}</h1>
  </div>
</template>

<style scoped></style>
