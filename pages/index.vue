<template>
  <div class="payment-container">
    <div class="payment-card">
      <h1 class="payment-title">결제하기</h1>
      
      <div class="order-summary">
        <h3>주문 정보</h3>
        <div class="order-item">
          <span>상품명</span>
          <span>{{ orderInfo.productName }}</span>
        </div>
        <div class="order-item">
          <span>수량</span>
          <span>{{ orderInfo.quantity }}개</span>
        </div>
        <div class="order-item total">
          <span>총 금액</span>
          <span>{{ formatPrice(orderInfo.amount) }}원</span>
        </div>
      </div>

      <div class="customer-info">
        <h3>주문자 정보</h3>
        <div class="form-group">
          <label>이름</label>
          <input v-model="customerInfo.name" type="text" placeholder="이름을 입력하세요">
        </div>
        <div class="form-group">
          <label>이메일</label>
          <input v-model="customerInfo.email" type="email" placeholder="이메일을 입력하세요">
        </div>
        <div class="form-group">
          <label>연락처</label>
          <input v-model="customerInfo.phone" type="tel" placeholder="연락처를 입력하세요">
        </div>
      </div>

      <div class="button-container">
        <button 
          class="payment-button"
          @click="handlePayment"
          :disabled="!isFormValid"
          type="button"
        >
          {{ formatPrice(orderInfo.amount) }}원 결제하기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const orderInfo = ref({
  productName: '샘플 상품',
  quantity: 1,
  amount: 10000
})

const customerInfo = ref({
  name: '홍길동',
  email: 'test@example.com',
  phone: '01012345678'
})

const isFormValid = computed(() => {
  return customerInfo.value.name && 
         customerInfo.value.email && 
         customerInfo.value.phone
})

const formatPrice = (price) => {
  return price.toLocaleString('ko-KR')
}

const loadTossPayments = async () => {
  if (window.TossPayments) {
    return window.TossPayments
  }
  
  const script = document.createElement('script')
  script.src = 'https://js.tosspayments.com/v1/payment'
  
  return new Promise((resolve, reject) => {
    script.onload = () => {
      resolve(window.TossPayments)
    }
    script.onerror = reject
    document.head.appendChild(script)
  })
}

const handlePayment = async () => {
  if (!isFormValid.value) {
    alert('모든 정보를 입력해주세요.')
    return
  }

  try {
    console.log('토스페이먼츠 로드 중...')
    
    // 주문 정보와 고객 정보를 localStorage에 저장 (processing.vue에서 사용)
    localStorage.setItem('orderInfo', JSON.stringify(orderInfo.value))
    localStorage.setItem('customerInfo', JSON.stringify(customerInfo.value))
    
    console.log('주문 정보 localStorage 저장:', orderInfo.value)
    console.log('고객 정보 localStorage 저장:', customerInfo.value)
    
    const TossPayments = await loadTossPayments()
    
    // 토스페이먼츠 테스트 클라이언트 키
    const clientKey = 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq'
    const tossPayments = TossPayments(clientKey)
    
    const orderId = `ORDER_${Date.now()}`
    
    console.log('결제 요청 중...')
    
    await tossPayments.requestPayment('카드', {
      amount: orderInfo.value.amount,
      orderId: orderId,
      orderName: orderInfo.value.productName,
      customerName: customerInfo.value.name,
      customerEmail: customerInfo.value.email,
      customerMobilePhone: customerInfo.value.phone,
      successUrl: `${window.location.origin}/payment/processing`,
      failUrl: `${window.location.origin}/payment/fail`,
    })
  } catch (error) {
    console.error('결제 실패:', error)
    alert('결제 중 오류가 발생했습니다.')
  }
}

useHead({
  title: '결제하기'
})
</script>

<style scoped>
.payment-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.payment-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
}

.payment-title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 24px;
  font-weight: bold;
}

.order-summary, .customer-info {
  margin-bottom: 30px;
}

.order-summary h3, .customer-info h3 {
  margin-bottom: 15px;
  color: #333;
  font-size: 18px;
  border-bottom: 2px solid #eee;
  padding-bottom: 8px;
}

.order-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.order-item.total {
  font-weight: bold;
  font-size: 18px;
  color: #e74c3c;
  border-bottom: none;
  margin-top: 10px;
  padding-top: 15px;
  border-top: 2px solid #eee;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #555;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #3498db;
}

.button-container {
  margin-top: 20px;
}

.payment-button {
  width: 100%;
  background-color: #0064ff;
  color: white;
  border: none;
  padding: 18px;
  border-radius: 6px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

.payment-button:hover:not(:disabled) {
  background-color: #0052d9;
}

.payment-button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}
</style>