<script setup lang="ts">
import UnstructuredShop from '~/components/shop/UnstructuredShop.vue';

definePageMeta({
  layout: 'shop',
});

const route = useRoute();
const shopNo = computed(() => route.query.shopNo as string);
</script>

<template>
  <UnstructuredShop :shop-no="shopNo" />
</template>

<style scoped></style>
