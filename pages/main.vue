<script setup lang="ts">
import UnstructuredShop from '~/components/shop/UnstructuredShop.vue';
const route = useRoute();
const isMain = computed(() => route.path === '/main');

definePageMeta({
  layout: 'shop',
});
</script>

<template>
  <div>
    <template v-if="isMain">
      <UnstructuredShop />
    </template>
    <template v-else>
      <h1>main</h1>
    </template>
  </div>
</template>

<style scoped></style>
