<template>
  <div class="history-container">
    <div class="header">
      <div class="header-top">
        <h1>결제내역</h1>
        <button @click="goHome" class="btn btn-secondary">홈으로</button>
      </div>
      <div v-if="currentMember" class="member-info">
        <p><strong>{{ currentMember.name }}</strong>님의 결제내역</p>
        <p class="member-id">회원ID: {{ memberId }}</p>
      </div>
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
        :class="{ 'cancelled': payment.isCancelled }"
      >
        <div class="payment-header">
          <div class="order-info">
            <span class="order-id">주문번호: {{ payment.orderId }}</span>
            <span class="payment-date">
              {{ formatDate(payment.paymentAt) }}
              <span v-if="payment.isCancelled && payment.cancelledAt" class="cancel-date">
                (취소: {{ formatDate(payment.cancelledAt) }})
              </span>
            </span>
          </div>
          <div class="payment-status">
            <span class="status" :class="payment.isCancelled ? 'cancel' : (payment.payType ? payment.payType.toLowerCase() : 'approve')">
              {{ payment.isCancelled ? '결제취소' : getPayTypeText(payment.payType) }}
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
            v-if="!payment.isCancelled && (payment.payType === 'APPROVE' || !payment.payType)"
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
const memberId = ref(null)
const currentMember = ref(null)
const paymentList = ref([])
const loading = ref(false)
const error = ref(null)

onMounted(() => {
  // 로그인 상태 확인 및 회원 정보 로드
  const savedMember = localStorage.getItem('currentMember')
  if (!savedMember) {
    error.value = '로그인이 필요합니다. 로그인 후 다시 시도해주세요.'
    return
  }

  try {
    currentMember.value = JSON.parse(savedMember)
    memberId.value = currentMember.value.memberId
    
    if (!memberId.value) {
      error.value = '회원 ID를 찾을 수 없습니다.'
      return
    }
    
    loadPaymentHistory()
  } catch (e) {
    console.error('회원 정보 파싱 오류:', e)
    error.value = '회원 정보를 불러오는 중 오류가 발생했습니다.'
  }
})

const loadPaymentHistory = async () => {
  loading.value = true
  error.value = null
  
  try {
    console.log('결제내역 조회 시작:', memberId.value)
    
    const response = await $fetch(`http://localhost:8080/api/payment/history/${memberId.value}`)
    
    console.log('결제내역 조회 응답:', response)
    
    if (response.status === 'SUCCESS') {
      // 백엔드에서 이미 병합 처리된 데이터를 그대로 사용
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

const cancelPayment = async (payment) => {
  console.log('결제취소 버튼 클릭:', payment)
  
  if (!confirm(`정말로 결제를 취소하시겠습니까?\n결제금액: ${formatPrice(payment.paymentAmount)}원`)) {
    return
  }
  
  try {
    console.log('결제취소 요청 시작:', payment.id)
    
    const response = await $fetch(`http://localhost:8080/api/payment/cancel/${payment.id}`, {
      method: 'POST'
    })
    
    console.log('결제취소 응답:', response)
    
    if (response.status === 'SUCCESS') {
      alert('결제가 성공적으로 취소되었습니다.')
      // 결제내역 새로고침
      await loadPaymentHistory()
    } else {
      alert('결제 취소에 실패했습니다: ' + (response.message || '알 수 없는 오류'))
    }
    
  } catch (e) {
    console.error('결제취소 오류:', e)
    alert('결제 취소 중 오류가 발생했습니다: ' + (e.data?.message || e.message || '네트워크 오류'))
  }
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

const getPayTypeText = (payType) => {
  if (!payType) return '결제완료' // 기존 데이터는 승인으로 간주
  const payTypeMap = {
    'APPROVE': '결제완료',
    'CANCEL': '결제취소'
  }
  return payTypeMap[payType] || payType
}

const getStatusText = (status) => {
  const statusMap = {
    'SUCCESS': '결제완료',
    'FAILED': '결제실패',
    'CANCELLED': '결제취소'
  }
  return statusMap[status] || status
}

const goHome = () => {
  navigateTo('/')
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

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.header h1 {
  color: #333;
  margin: 0;
  font-size: 28px;
}

.member-info {
  color: #666;
  font-size: 14px;
}

.member-info p {
  margin: 5px 0;
}

.member-id {
  font-size: 12px;
  color: #999;
}

.btn-secondary {
  background-color: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background-color: #7f8c8d;
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

.cancel-date {
  font-size: 12px;
  color: #e74c3c;
  font-weight: 500;
  display: block;
  margin-top: 2px;
}

.payment-status .status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status.approve {
  background-color: #d4edda;
  color: #155724;
}

.status.cancel {
  background-color: #d1ecf1;
  color: #0c5460;
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