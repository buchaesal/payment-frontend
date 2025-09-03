<template>
  <div class="result-container">
    <div class="result-card fail">
      <div class="icon">
        ❌
      </div>
      <h1>결제에 실패했습니다</h1>
      <p class="message" v-if="failReason">{{ failReason }}</p>
      <p class="message" v-else>결제 중 문제가 발생했습니다.</p>
      
      <div class="button-group">
        <button @click="goBack" class="btn btn-primary">
          다시 결제하기
        </button>
        <button @click="goHome" class="btn btn-secondary">
          홈으로 가기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const router = useRouter()

const failReason = ref('')

onMounted(() => {
  console.log('=== 결제 실패 페이지 로드 ===')
  console.log('전체 route.query:', route.query)
  
  failReason.value = route.query.message || route.query.code || route.query.resultMsg || ''
  
  console.log('실패 사유:', failReason.value)
  console.log('모든 실패 파라미터:', {
    message: route.query.message,
    code: route.query.code,
    resultCode: route.query.resultCode,
    resultMsg: route.query.resultMsg,
    errorCode: route.query.errorCode,
    errorMessage: route.query.errorMessage
  })
})

const goBack = () => {
  router.push('/payment')
}

const goHome = () => {
  router.push('/')
}

useHead({
  title: '결제 실패'
})
</script>

<style scoped>
.result-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.result-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
  text-align: center;
}

.fail {
  border-top: 4px solid #e74c3c;
}

.icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.result-card h1 {
  color: #e74c3c;
  margin-bottom: 10px;
  font-size: 24px;
}

.message {
  color: #666;
  margin-bottom: 30px;
  font-size: 16px;
}

.button-group {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover {
  background-color: #2980b9;
}

.btn-secondary {
  background-color: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background-color: #7f8c8d;
}
</style>