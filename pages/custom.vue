<script setup lang="ts">
  import {definePageMeta} from "#imports";

  definePageMeta({
    layout: false
  })
</script>

<template>
  <div>
    <NuxtLayout name="custom">
      custom
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style scoped>

</style>