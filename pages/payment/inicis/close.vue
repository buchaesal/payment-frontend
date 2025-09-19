<template>
  <ClientOnly>
    <div class="close-container">
      <div class="close-message">
        <h2>결제창이 닫혔습니다.</h2>
        <p>잠시 후 이 창이 자동으로 닫힙니다.</p>
      </div>
    </div>
    <template #fallback>
      <div class="loading-fallback">
        <p>닫는 중...</p>
      </div>
    </template>
  </ClientOnly>
</template>

<script setup>
onMounted(() => {
  // 클라이언트에서만 실행
  if (!process.client) return

  console.log('이니시스 close 페이지 로드됨')

  // 1초 후 팝업 창 닫기
  setTimeout(() => {
    window.close()
  }, 1000)
})

useHead({
  title: '결제창 닫음'
})
</script>

<style scoped>
.close-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.close-message {
  background: white;
  border-radius: 15px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  text-align: center;
  min-width: 300px;
}

.close-message h2 {
  color: #333;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 15px 0;
}

.close-message p {
  color: #666;
  font-size: 14px;
  margin: 0;
}
</style>