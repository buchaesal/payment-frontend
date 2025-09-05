<template>
  <div class="result-container">
    <div class="result-card success">
      <div class="icon">
        ✅
      </div>
      <h1>결제가 완료되었습니다!</h1>
      <p class="message">주문해 주셔서 감사합니다.</p>
      
      <!-- 로딩 중 표시 -->
      <div v-if="loading" class="loading-info">
        <p>결제정보를 불러오는 중...</p>
      </div>
      
      <!-- 에러 발생 시 표시 -->
      <div v-else-if="error && !paymentData" class="error-info">
        <p>{{ error }}</p>
      </div>
      
      <div class="payment-info" v-else-if="paymentData">
        <h3>결제 정보</h3>
        <div class="info-item">
          <span>주문번호</span>
          <span>{{ paymentData.oid || paymentData.orderId || 'N/A' }}</span>
        </div>
        <div class="info-item">
          <span>결제금액</span>
          <span>{{ formatPrice(paymentData.price || paymentData.amount || 0) }}원</span>
        </div>
        <div class="info-item">
          <span>상품명</span>
          <span>{{ paymentData.goodname || 'N/A' }}</span>
        </div>
        <div class="info-item" v-if="paymentData.tid">
          <span>거래ID (TID)</span>
          <span>{{ paymentData.tid }}</span>
        </div>
        <div class="info-item" v-if="paymentData.paymentKey">
          <span>결제키</span>
          <span>{{ paymentData.paymentKey }}</span>
        </div>
      </div>

      <div class="debug-info">
        <h3>전체 응답 데이터 (개발용)</h3>
        <div class="debug-content">
          <pre>{{ JSON.stringify(paymentData, null, 2) }}</pre>
        </div>
      </div>

      <div class="button-group">
        <button @click="goHome" class="btn btn-primary">
          홈으로 가기
        </button>
        <button @click="goBack" class="btn btn-secondary">
          쇼핑 계속하기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const router = useRouter()

const paymentData = ref(null)
const loading = ref(false)
const error = ref(null)

onMounted(async () => {
  // 클라이언트 사이드에서만 실행
  if (process.client) {
    console.log('=== 결제 성공 페이지 로드 (클라이언트) ===')
    console.log('전체 route.query:', route.query)
    
    // 쿼리스트링에서 orderId 확인
    const orderIdFromQuery = route.query.orderId
    
    if (orderIdFromQuery) {
      console.log('쿼리스트링에서 주문번호 발견:', orderIdFromQuery)
      // 주문번호로 결제정보 조회
      await fetchPaymentByOrderId(orderIdFromQuery)
    } else {
      console.log('쿼리스트링에 주문번호가 없음 - 기존 방식 사용')
      // 기존 방식: localStorage 및 URL 파라미터 사용
      handleLegacyPaymentData()
    }
  }
})

// 주문번호로 결제정보 조회
const fetchPaymentByOrderId = async (orderId) => {
  loading.value = true
  error.value = null
  
  try {
    console.log('주문번호로 결제정보 조회 시작:', orderId)
    
    // 백엔드 API 호출 - 주문번호로 결제정보 조회
    const response = await $fetch(`http://localhost:8080/api/payment/order/${orderId}`)
    
    console.log('결제정보 조회 응답:', response)
    
    if (response.status === 'SUCCESS') {
      // 백엔드에서 받은 결제정보를 화면 표시용으로 변환
      paymentData.value = {
        orderId: response.orderId,
        oid: response.orderId,
        amount: response.totalAmount,
        price: response.totalAmount,
        goodname: response.productName || '상품명',
        paymentMethod: 'CARD', // 결제수단 목록에서 첫 번째 것을 사용하거나 기본값
        paymentCount: response.paymentCount,
        paymentList: response.paymentList
      }
      console.log('결제정보 조회 성공:', paymentData.value)
    } else {
      error.value = response.message || '결제정보를 찾을 수 없습니다.'
      console.error('결제정보 조회 실패:', error.value)
      // 결제정보를 찾을 수 없는 경우 기존 방식으로 폴백
      handleLegacyPaymentData()
    }
  } catch (e) {
    console.error('결제정보 조회 중 오류:', e)
    error.value = '결제정보를 불러오는 중 오류가 발생했습니다.'
    // 오류 발생 시 기존 방식으로 폴백
    handleLegacyPaymentData()
  } finally {
    loading.value = false
  }
}

// 기존 방식: localStorage 및 URL 파라미터 사용
const handleLegacyPaymentData = () => {
  console.log('기존 방식으로 결제 데이터 처리')
  
  // localStorage에서 결제 정보 가져오기 (적립금 결제용)
  const paymentDataFromStorage = localStorage.getItem('paymentData')
  let storageData = null
  if (paymentDataFromStorage) {
    try {
      storageData = JSON.parse(paymentDataFromStorage)
      console.log('localStorage의 결제 데이터:', storageData)
    } catch (e) {
      console.error('localStorage 파싱 오류:', e)
    }
  }
  
  // URL 쿼리 파라미터에서 결제 정보 추출
  const urlData = {
    // 이니시스 응답 파라미터
    oid: route.query.oid,
    price: route.query.price,
    goodname: route.query.goodname,
    tid: route.query.tid,
    resultCode: route.query.resultCode,
    resultMsg: route.query.resultMsg,
    
    // 토스페이먼츠 응답 파라미터
    paymentKey: route.query.paymentKey,
    orderId: route.query.orderId,
    amount: route.query.amount,
    
    // 기타 가능한 파라미터들
    ...route.query
  }
  
  // 적립금 결제인 경우 localStorage 데이터 활용, 그 외엔 URL 데이터 활용
  if (storageData && (!urlData.paymentKey && !urlData.tid)) {
    // 적립금 전액 결제 케이스
    const calculatedAmount = storageData.totalAmount || (storageData.orderInfo?.amount * storageData.orderInfo?.quantity) || 0
    paymentData.value = {
      orderId: storageData.orderId || `ORDER_${Date.now()}`,
      oid: storageData.orderId || `ORDER_${Date.now()}`,
      price: calculatedAmount,
      amount: calculatedAmount,
      goodname: storageData.orderInfo?.productName || storageData.productName || '샘플 상품',
      paymentMethod: 'POINTS',
      resultCode: '0000',
      resultMsg: '결제 완료',
      ...urlData
    }
    console.log('적립금 결제 - localStorage 데이터 사용')
  } else if (urlData && (urlData.paymentKey || urlData.tid || Object.keys(urlData).some(key => urlData[key]))) {
    // 카드 결제 또는 복합결제 케이스 - URL에 실제 데이터가 있는 경우만
    paymentData.value = {
      ...urlData,
      // 누락된 필드들 기본값 설정
      price: urlData.price || urlData.amount,
      amount: urlData.amount || urlData.price,
      goodname: urlData.goodname || '상품명',
    }
    console.log('카드 결제 - URL 파라미터 데이터 사용')
  } else {
    // 데이터가 없는 경우 기본값 설정
    paymentData.value = {
      orderId: 'N/A',
      oid: 'N/A',
      price: 0,
      amount: 0,
      goodname: '상품명을 찾을 수 없습니다',
      paymentMethod: 'UNKNOWN'
    }
    console.log('결제 데이터를 찾을 수 없음 - 기본값 사용')
  }
  
  console.log('최종 결제 데이터:', paymentData.value)
  
  // 결제 방식 판별
  if (route.query.paymentKey) {
    console.log('토스페이먼츠 결제 응답')
  } else if (route.query.tid) {
    console.log('이니시스 결제 응답')
  } else if (paymentData.value.paymentMethod === 'POINTS') {
    console.log('적립금 결제')
  } else {
    console.log('알 수 없는 결제 방식')
  }
}

const formatPrice = (price) => {
  if (!price) return '0'
  return parseInt(price).toLocaleString('ko-KR')
}

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  router.push('/goodsList')
}

useHead({
  title: '결제 완료'
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

.success {
  border-top: 4px solid #27ae60;
}

.icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.result-card h1 {
  color: #27ae60;
  margin-bottom: 10px;
  font-size: 24px;
}

.message {
  color: #666;
  margin-bottom: 30px;
  font-size: 16px;
}

.loading-info, .error-info {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  border-radius: 8px;
}

.loading-info {
  background-color: #e7f3ff;
  color: #0056b3;
  border: 1px solid #b3d9ff;
}

.error-info {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c2c7;
}

.payment-info {
  text-align: left;
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.payment-info h3 {
  margin-bottom: 15px;
  color: #333;
  font-size: 18px;
  text-align: center;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.info-item:last-child {
  border-bottom: none;
}

.debug-info {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.debug-info h3 {
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