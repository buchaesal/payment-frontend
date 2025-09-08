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
        v-for="orderGroup in groupedPaymentList" 
        :key="orderGroup.orderId"
        class="order-group"
      >
        <!-- 주문 헤더 -->
        <div class="order-header">
          <div class="order-info">
            <span class="order-id">주문번호: {{ orderGroup.orderId }}</span>
            <span class="order-date">{{ formatDate(orderGroup.orderDate) }}</span>
          </div>
          <div class="order-summary">
            <span class="total-amount">총 {{ formatPrice(orderGroup.totalAmount) }}원</span>
            <span class="payment-count">{{ orderGroup.payments.length }}개 결제수단</span>
          </div>
        </div>
        
        <!-- 결제수단별 상세내역 -->
        <div class="payment-methods">
          <div 
            v-for="payment in orderGroup.payments" 
            :key="payment.id"
            class="payment-method"
            :class="{ 'cancelled': payment.isCancelled }"
          >
            <div class="method-header">
              <div class="method-info">
                <span class="method-name">{{ getPaymentMethodText(payment.paymentMethod) }}</span>
                <span class="method-status" :class="payment.isCancelled ? 'cancel' : 'approve'">
                  {{ payment.isCancelled ? '취소완료' : '결제완료' }}
                </span>
              </div>
              <div class="method-amount">
                <span class="amount">{{ formatPrice(payment.paymentAmount) }}원</span>
              </div>
            </div>
            
            <div class="method-details">
              <div v-if="payment.pgProvider" class="method-detail">
                <span class="detail-label">PG사:</span>
                <span class="detail-value">{{ payment.pgProvider }}</span>
              </div>
              <div v-if="payment.tid" class="method-detail">
                <span class="detail-label">거래ID:</span>
                <span class="detail-value">{{ payment.tid }}</span>
              </div>
              <div v-if="payment.isCancelled && payment.cancelledAt" class="method-detail cancel-info">
                <span class="detail-label">취소일:</span>
                <span class="detail-value">{{ formatDate(payment.cancelledAt) }}</span>
              </div>
            </div>
            
            <div class="method-actions">
              <button 
                v-if="!payment.isCancelled && (payment.payType === 'APPROVE' || !payment.payType)"
                @click="cancelPayment(payment)"
                class="btn btn-cancel-small"
              >
                이 결제수단 취소
              </button>
              <span v-else-if="payment.isCancelled" class="cancelled-label">
                취소됨
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="summary" v-if="paymentList.length > 0">
      <p>총 {{ groupedPaymentList.length }}개 주문, {{ paymentList.length }}건의 결제내역</p>
    </div>
  </div>
</template>

<script setup>
const memberId = ref(null)
const currentMember = ref(null)
const paymentList = ref([])
const loading = ref(false)
const error = ref(null)

// 주문번호별로 그룹화된 결제내역
const groupedPaymentList = computed(() => {
  if (!paymentList.value || paymentList.value.length === 0) {
    return []
  }
  
  // 주문번호별로 그룹화
  const groupedMap = new Map()
  
  paymentList.value.forEach(payment => {
    const orderId = payment.orderId
    
    if (!groupedMap.has(orderId)) {
      groupedMap.set(orderId, {
        orderId: orderId,
        orderDate: payment.paymentAt, // 첫 번째 결제 시간을 주문 시간으로 사용
        totalAmount: 0,
        payments: []
      })
    }
    
    const group = groupedMap.get(orderId)
    group.payments.push(payment)
    
    // 취소되지 않은 결제만 총액에 포함
    if (!payment.isCancelled) {
      group.totalAmount += payment.paymentAmount
    }
    
    // 더 이른 시간을 주문 시간으로 업데이트
    if (new Date(payment.paymentAt) < new Date(group.orderDate)) {
      group.orderDate = payment.paymentAt
    }
  })
  
  // Map을 배열로 변환하고 최신 주문 순으로 정렬
  return Array.from(groupedMap.values())
    .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
    .map(group => ({
      ...group,
      // 각 그룹 내에서 결제수단별로 정렬 (결제완료 -> 취소완료 순)
      payments: group.payments.sort((a, b) => {
        // 취소 상태 기준 정렬 (결제완료가 먼저)
        if (a.isCancelled !== b.isCancelled) {
          return a.isCancelled ? 1 : -1
        }
        // 결제수단 이름순 정렬
        return a.paymentMethod.localeCompare(b.paymentMethod)
      })
    }))
})

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
  gap: 20px;
}

.order-group {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
  border: 1px solid #e9ecef;
}

.order-header {
  background: #f8f9fa;
  padding: 15px 20px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.order-date {
  font-size: 14px;
  color: #666;
}

.order-summary {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
}

.total-amount {
  font-weight: 700;
  font-size: 18px;
  color: #e74c3c;
}

.payment-count {
  font-size: 12px;
  color: #666;
  background: #e9ecef;
  padding: 2px 8px;
  border-radius: 12px;
}

.payment-methods {
  padding: 0;
}

.payment-method {
  padding: 15px 20px;
  border-bottom: 1px solid #f1f3f4;
  border-left: 4px solid #28a745;
  transition: background-color 0.2s ease;
}

.payment-method:last-child {
  border-bottom: none;
}

.payment-method:hover {
  background-color: #f8f9fa;
}

.payment-method.cancelled {
  border-left-color: #e74c3c;
  background-color: #faf6f6;
}

.method-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.method-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.method-name {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.method-status {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.method-status.approve {
  background-color: #d4edda;
  color: #155724;
}

.method-status.cancel {
  background-color: #f8d7da;
  color: #721c24;
}

.method-amount {
  display: flex;
  align-items: center;
}

.method-amount .amount {
  font-weight: 700;
  font-size: 16px;
  color: #28a745;
}

.method-details {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 10px;
  padding-left: 10px;
  font-size: 13px;
  color: #666;
}

.method-detail {
  display: flex;
  gap: 5px;
}

.method-detail.cancel-info {
  color: #e74c3c;
}

.detail-label {
  font-weight: 500;
}

.detail-value {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.method-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.btn-cancel-small {
  background-color: #dc3545;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.btn-cancel-small:hover {
  background-color: #c82333;
}

.cancelled-label {
  font-size: 12px;
  color: #6c757d;
  padding: 6px 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #dee2e6;
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
  
  .order-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 15px;
  }
  
  .order-summary {
    align-items: flex-start;
  }
  
  .payment-method {
    padding: 12px 15px;
  }
  
  .method-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .method-details {
    flex-direction: column;
    gap: 8px;
    padding-left: 0;
  }
  
  .method-actions {
    justify-content: flex-start;
  }
  
  .total-amount {
    font-size: 16px;
  }
  
  .method-amount .amount {
    font-size: 14px;
  }
}
</style>