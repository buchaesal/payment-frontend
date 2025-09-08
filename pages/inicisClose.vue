<script setup lang="ts">

onMounted(() => {
  if ((window as any).INIStdPay) {
    (window as any).INIStdPay.viewOff();
  }
})

</script>

<template>

</template>

<style scoped>

</style>