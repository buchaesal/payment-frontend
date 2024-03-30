<script setup lang="ts">
const goodsList = useGoods();
</script>

<template>
  <q-page padding>
    <div class="q-my-xl text-center">
      <div class="text-h4">상품 목록2</div>
      <p class="q-mt-sm text-grey-8">상품 목록2 화면입니다.</p>
    </div>
    <ClientOnly>
      <div class="row q-col-gutter-lg">
        <div
            v-for="(goods, index) in goodsList"
            :key="index"
            class="col-12 col-md-4 col-sm-6"
        >
          <NuxtLink v-slot="{ navigate }" custom to="/goodsDetail">
            <CourseCard
                :thumbnail="goods.imageUrl"
                :title="goods.name"
                :subtitle="goods.name"
                @click="navigate"
            />
          </NuxtLink>
        </div>
      </div>
    </ClientOnly>
  </q-page>
</template>

<style scoped>

</style>