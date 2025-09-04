<template>
  <div class="history-container">
    <div class="header">
      <h1>결제내역</h1>
      <p class="member-info">회원ID: {{ memberId }}</p>
    </div>
    
    <div v-if="loading" class="loading">
      결제내역을 불러오는 중...
    </div>
    
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="loadPaymentHistory" class="btn btn-primary">다시 시도</button>
    </div>
    
    <div v-else-if="paymentList.length === 0" class="no-data">
      <p>결제내역이 없습니다.</p>
    </div>
    
    <div v-else class="payment-list">
      <div 
        v-for="payment in paymentList" 
        :key="payment.id"
        class="payment-item"
        :class="{ 'cancelled': payment.paymentStatus === 'CANCELLED' }"
      >
        <div class="payment-header">
          <div class="order-info">
            <span class="order-id">주문번호: {{ payment.orderId }}</span>
            <span class="payment-date">{{ formatDate(payment.paymentAt) }}</span>
          </div>
          <div class="payment-status">
            <span class="status" :class="payment.paymentStatus.toLowerCase()">
              {{ getStatusText(payment.paymentStatus) }}
            </span>
          </div>
        </div>
        
        <div class="payment-details">
          <div class="detail-item">
            <span class="label">결제수단</span>
            <span class="value">{{ getPaymentMethodText(payment.paymentMethod) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">결제금액</span>
            <span class="value amount">{{ formatPrice(payment.paymentAmount) }}원</span>
          </div>
        </div>
        
        <div class="payment-actions">
          <button 
            v-if="payment.paymentStatus === 'SUCCESS'"
            @click="cancelPayment(payment)"
            class="btn btn-cancel"
          >
            결제취소
          </button>
        </div>
      </div>
    </div>
    
    <div class="summary" v-if="paymentList.length > 0">
      <p>총 {{ paymentList.length }}건의 결제내역</p>
    </div>
  </div>
</template>

<script setup>
const memberId = ref('user123') // 실제로는 로그인된 사용자 정보에서 가져와야 함
const paymentList = ref([])
const loading = ref(false)
const error = ref(null)

onMounted(() => {
  loadPaymentHistory()
})

const loadPaymentHistory = async () => {
  loading.value = true
  error.value = null
  
  try {
    console.log('결제내역 조회 시작:', memberId.value)
    
    const response = await $fetch(`http://localhost:8080/api/payment/history/${memberId.value}`)
    
    console.log('결제내역 조회 응답:', response)
    
    if (response.status === 'SUCCESS') {
      paymentList.value = response.paymentList || []
    } else {
      error.value = response.message || '결제내역 조회에 실패했습니다.'
    }
    
  } catch (e) {
    console.error('결제내역 조회 오류:', e)
    error.value = '결제내역을 불러오는 중 오류가 발생했습니다.'
  } finally {
    loading.value = false
  }
}

const cancelPayment = (payment) => {
  // 현재는 기능 없음 (사용자 요청에 따라)
  console.log('결제취소 버튼 클릭:', payment.orderId)
  alert('결제취소 기능은 준비중입니다.')
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatPrice = (price) => {
  if (!price) return '0'
  return parseInt(price).toLocaleString('ko-KR')
}

const getPaymentMethodText = (method) => {
  const methodMap = {
    'CARD': '카드결제',
    'POINTS': '적립금결제',
    'BANK_TRANSFER': '계좌이체',
    'VIRTUAL_ACCOUNT': '가상계좌'
  }
  return methodMap[method] || method
}

const getStatusText = (status) => {
  const statusMap = {
    'SUCCESS': '결제완료',
    'FAILED': '결제실패',
    'CANCELLED': '결제취소'
  }
  return statusMap[status] || status
}

useHead({
  title: '결제내역'
})
</script>

<style scoped>
.history-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  color: #333;
  margin-bottom: 10px;
  font-size: 28px;
}

.member-info {
  color: #666;
  font-size: 14px;
}

.loading, .error, .no-data {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.error {
  color: #e74c3c;
}

.no-data {
  color: #666;
}

.payment-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.payment-item {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-left: 4px solid #27ae60;
  transition: transform 0.2s ease;
}

.payment-item:hover {
  transform: translateY(-2px);
}

.payment-item.cancelled {
  border-left-color: #e74c3c;
  opacity: 0.8;
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.order-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.order-id {
  font-weight: 600;
  font-size: 16px;
  color: #333;
}

.payment-date {
  font-size: 14px;
  color: #666;
}

.payment-status .status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status.success {
  background-color: #d4edda;
  color: #155724;
}

.status.failed {
  background-color: #f8d7da;
  color: #721c24;
}

.status.cancelled {
  background-color: #d1ecf1;
  color: #0c5460;
}

.payment-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
}

.detail-item .label {
  color: #666;
  font-size: 14px;
}

.detail-item .value {
  font-weight: 500;
  color: #333;
}

.detail-item .amount {
  color: #e74c3c;
  font-weight: 600;
}

.payment-actions {
  display: flex;
  justify-content: flex-end;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
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

.btn-cancel {
  background-color: #e74c3c;
  color: white;
}

.btn-cancel:hover {
  background-color: #c0392b;
}

.summary {
  text-align: center;
  margin-top: 30px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  color: #666;
}

@media (max-width: 768px) {
  .history-container {
    padding: 15px;
  }
  
  .payment-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .payment-details {
    padding: 10px;
  }
}
</style>