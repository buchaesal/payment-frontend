<script setup lang="ts">

const goodsList = useGoods();

// const handleBack = (event: any) => {
//   // event.state에 scroll position이 있음
//   console.log('뒤로 가기 버튼을 눌렀습니다.', event);
//   window.removeEventListener('popstate', handleBack);
// }
//
// onMounted(() => {
//   console.log('mounted goodsList')
//   window.removeEventListener('popstate', handleBack);
//   window.addEventListener('popstate', handleBack);
// });

</script>

<template>
  <q-page padding>
    <div class="q-my-xl text-center">
      <div class="text-h4">상품 목록</div>
      <p class="q-mt-sm text-grey-8">상품 목록 화면입니다.</p>
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