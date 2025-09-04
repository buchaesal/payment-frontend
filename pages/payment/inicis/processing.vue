]<template>
  <div class="processing-container">
    <div class="processing-card">
      <div class="spinner">
        <div class="spinner-ring"></div>
      </div>
      
      <h1 class="processing-title">이니시스 결제 처리 중입니다</h1>
      <p class="processing-message">잠시만 기다려주세요...</p>
      
      <div class="status-info">
        <div class="status-item">
          <span class="status-label">상태:</span>
          <span class="status-value">{{ currentStatus }}</span>
        </div>
      </div>

      <div class="debug-section" v-if="paymentData">
        <h3>이니시스 인증 응답 데이터</h3>
        <div class="debug-content">
          <pre>{{ JSON.stringify(paymentData, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const router = useRouter()

const currentStatus = ref('인증 응답 처리 중...')
const paymentData = ref(null)

// 페이지 로드 즉시 실행
// if (process.client) {
//   console.log('=== 이니시스 클라이언트 사이드 실행 ===')
//   console.log('현재 URL:', window.location.href)
//
//   // URL에서 쿼리 파라미터 직접 파싱
//   const urlParams = new URLSearchParams(window.location.search)
//   const queryData = {}
//   for (const [key, value] of urlParams.entries()) {
//     queryData[key] = value
//   }
//
//   console.log('URL에서 직접 파싱한 쿼리:', queryData)
//   console.log('URL에서 직접 파싱한 쿼리 (JSON):', JSON.stringify(queryData, null, 2))
// }

onMounted(async () => {
  console.log('route.query:', route.query)

  const resultBody = JSON.parse(route.query.resultBody)
  // 인증 응답 데이터 저장
  paymentData.value = resultBody
  
  console.log('최종 이니시스 결제 데이터:', paymentData.value)

  if (Object.keys(resultBody).length === 0) {
    console.log('쿼리 파라미터가 없음 - 직접 접근으로 추정')
    currentStatus.value = '잘못된 접근'
    setTimeout(() => {
      // window.location.href = '/paymentSheet'
    }, 2000)
    return
  }
  
  // 이니시스 결제 처리 - tid 또는 P_TID 확인
  if (resultBody.resultCode === '0000') {
    console.log('이니시스 인증 완료')
    currentStatus.value = '이니시스 승인 요청 중...'
    await processInicisPayment()
  } else {
    console.log('결제 응답 오류 또는 잘못된 접근')
    currentStatus.value = '결제 응답 오류'
    setTimeout(() => {
      // window.location.href = '/payment/fail?message=잘못된 결제 응답'
    }, 2000)
  }
})

const processInicisPayment = async () => {
  try {
    console.log('이니시스 승인 프로세스 시작')
    currentStatus.value = '서버 승인 요청 중...'
    
    // 결제 정보를 localStorage에서 가져오기 (payment.vue에서 저장된 정보)
    const paymentDataFromStorage = JSON.parse(localStorage.getItem('paymentData') || '{}')
    const orderInfo = paymentDataFromStorage.orderInfo || {}
    const customerInfo = paymentDataFromStorage.customerInfo || {}
    const memberId = paymentDataFromStorage.memberId
    const usePoints = paymentDataFromStorage.usePoints || 0
    
    console.log('저장된 주문 정보:', orderInfo)
    console.log('저장된 고객 정보:', customerInfo)
    
    // Spring Boot API 서버로 승인 요청 (주문정보 + 인증응답값)
    const requestData = {
      // 주문 정보
      customerName: customerInfo.name || '테스트 고객',
      customerEmail: customerInfo.email || 'test@example.com',
      customerPhone: customerInfo.phone || '010-1234-5678',
      productName: orderInfo.productName || '테스트 상품',
      quantity: orderInfo.quantity || 1,
      // 회원 정보 및 적립금 사용
      memberId: memberId,
      usePoints: usePoints,
      authResultMap: paymentData.value,
    }
    
    console.log('=== 이니시스 Spring Boot API 요청 데이터 ===')
    console.log(JSON.stringify(requestData, null, 2))
    
    const response = await fetch('http://localhost:8080/api/payment/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    })
    
    const result = await response.json()
    
    console.log('=== 이니시스 Spring Boot API 서버 응답 ===')
    console.log('Status:', response.status)
    console.log('Response:', result)
    
    if (response.ok && result.status === 'SUCCESS') {
      console.log('이니시스 Spring Boot API 결제 승인 완료!')
      console.log('승인 결과:', result)
      currentStatus.value = '결제 완료'
      
      // 승인 결과를 paymentData에 추가
      paymentData.value = {
        ...paymentData.value,
        approvalResult: result,
        orderInfo: orderInfo,
        customerInfo: customerInfo
      }
      
      // 성공 페이지로 이동
      setTimeout(() => {
        const successUrl = new URL('/payment/success', window.location.origin)
        Object.entries(paymentData.value).forEach(([key, value]) => {
          if (typeof value === 'object') {
            successUrl.searchParams.set(key, JSON.stringify(value))
          } else {
            successUrl.searchParams.set(key, value)
          }
        })
        // window.location.href = successUrl.toString()
      }, 1000)
    } else {
      throw new Error(result.message || '승인 실패')
    }
    
  } catch (error) {
    console.error('이니시스 Spring Boot API 호출 오류:', error)
    currentStatus.value = '승인 실패'
    // window.location.href = `/payment/fail?message=${encodeURIComponent(error.message)}`
  }
}

useHead({
  title: '이니시스 결제 처리 중'
})
</script>

<style scoped>
.processing-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.processing-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
  text-align: center;
}

.spinner {
  margin-bottom: 30px;
}

.spinner-ring {
  display: inline-block;
  width: 64px;
  height: 64px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #ff6b35;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.processing-title {
  color: #333;
  margin-bottom: 10px;
  font-size: 24px;
  font-weight: bold;
}

.processing-message {
  color: #666;
  margin-bottom: 30px;
  font-size: 16px;
}

.status-info {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.status-item {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.status-label {
  font-weight: 500;
  color: #555;
}

.status-value {
  color: #ff6b35;
  font-weight: bold;
}

.debug-section {
  text-align: left;
  margin-top: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.debug-section h3 {
  margin-bottom: 15px;
  color: #333;
  font-size: 16px;
  text-align: center;
}

.debug-content {
  background-color: #2d3748;
  color: #e2e8f0;
  padding: 15px;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;
}

.debug-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>