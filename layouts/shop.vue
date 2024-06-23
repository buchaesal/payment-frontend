<script setup lang="ts">
import DefaultLayout from '~/layouts/default.vue';
</script>

<template>
  <default-layout>
    <q-layout view="hHh lpR fFf" class="bg-grey-2">
      <PageTitle title="gnb" />
      <slot></slot>
    </q-layout>
  </default-layout>
</template>

<style scoped>

</style>