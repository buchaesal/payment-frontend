<template>
  <div class="payment-container">
    <div class="payment-card">
      <div class="payment-header">
        <h1 class="payment-title">결제하기</h1>
        <button @click="logout" class="logout-btn">로그아웃</button>
      </div>
      
      <!-- 로그인된 사용자 정보 -->
      <div v-if="currentMember" class="member-info">
        <div class="member-welcome">
          <h3>{{ currentMember.name }}님, 환영합니다!</h3>
          <div class="points-info">
            <span class="points-label">보유 적립금:</span>
            <span class="points-amount">{{ formatPrice(currentMember.points) }}원</span>
          </div>
        </div>
      </div>
      
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
        <div class="order-item">
          <span>상품 금액</span>
          <span>{{ formatPrice(orderInfo.amount) }}원</span>
        </div>
        
        <!-- 적립금 사용 섹션 -->
        <div class="points-section">
          <div class="order-item points-item">
            <span>적립금 사용</span>
            <div class="points-use">
              <input 
                v-model.number="usePoints" 
                type="number" 
                min="0" 
                :max="currentMember?.points || 0" 
                placeholder="0"
                @input="validatePoints"
              >
              <span>원</span>
              <button @click="useMaxPoints" class="use-max-btn">전액사용</button>
            </div>
          </div>
        </div>
        
        <div class="order-item total">
          <span>카드 결제 금액</span>
          <span class="final-amount">{{ formatPrice(finalAmount) }}원</span>
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

      <!-- 결제 요약 -->
      <div class="payment-summary">
        <div class="summary-row">
          <span>상품 금액</span>
          <span>{{ formatPrice(orderInfo.amount) }}원</span>
        </div>
        <div class="summary-row discount">
          <span>적립금 할인</span>
          <span>-{{ formatPrice(usePoints || 0) }}원</span>
        </div>
        <div class="summary-row final">
          <span>최종 결제 금액</span>
          <span>{{ formatPrice(finalAmount) }}원</span>
        </div>
      </div>

      <div class="button-container">
        <button 
          class="payment-button"
          @click="handlePayment"
          :disabled="!isFormValid || finalAmount < 0"
          type="button"
        >
          {{ finalAmount === 0 ? '무료 결제 완료' : `${formatPrice(finalAmount)}원 카드결제` }}
        </button>
      </div>
    </div>

    <!-- 이니시스 결제를 위한 숨겨진 폼 -->
    <form id="inicis_form" name="inicis_form" method="post" style="display: none;">
      <input type="hidden" name="version" id="version" value="1.0" />
      <input type="hidden" name="gopaymethod" id="gopaymethod" />
      <input type="hidden" name="mid" id="mid" />
      <input type="hidden" name="oid" id="oid" />
      <input type="hidden" name="price" id="price" />
      <input type="hidden" name="timestamp" id="timestamp" />
      <input type="hidden" name="use_chkfake" id="use_chkfake" value="Y" />
      <input type="hidden" name="signature" id="signature" />
      <input type="hidden" name="verification" id="verification" />
      <input type="hidden" name="mKey" id="mKey" />
      <input type="hidden" name="currency" id="currency" />
      <input type="hidden" name="goodname" id="goodname" />
      <input type="hidden" name="buyername" id="buyername" />
      <input type="hidden" name="buyertel" id="buyertel" />
      <input type="hidden" name="buyeremail" id="buyeremail" />
      <input type="hidden" name="returnUrl" id="returnUrl" />
      <input type="hidden" name="closeUrl" id="closeUrl" />
      <input type="hidden" name="acceptmethod" id="acceptmethod" />
      <input type="hidden" name="paymethod" id="paymethod" />
    </form>
  </div>
</template>

<script setup>
const API_BASE_URL = 'http://localhost:8080/api'

// 상태 관리
const currentMember = ref(null)
const usePoints = ref(0)

const orderInfo = ref({
  productName: '샘플 상품',
  quantity: 1,
  amount: 10000
})

const customerInfo = ref({
  name: '',
  email: '',
  phone: ''
})

// 계산된 속성
const isFormValid = computed(() => {
  return customerInfo.value.name && 
         customerInfo.value.email && 
         customerInfo.value.phone
})

const finalAmount = computed(() => {
  const total = orderInfo.value.amount
  const points = usePoints.value || 0
  return Math.max(0, total - points)
})

// 메서드
const formatPrice = (price) => {
  return price.toLocaleString('ko-KR')
}

const validatePoints = () => {
  if (currentMember.value) {
    const maxPoints = Math.min(currentMember.value.points, orderInfo.value.amount)
    if (usePoints.value > maxPoints) {
      usePoints.value = maxPoints
    }
    if (usePoints.value < 0) {
      usePoints.value = 0
    }
  }
}

const useMaxPoints = () => {
  if (currentMember.value) {
    const maxUsable = Math.min(currentMember.value.points, orderInfo.value.amount)
    usePoints.value = maxUsable
  }
}

const logout = () => {
  localStorage.removeItem('currentMember')
  navigateTo('/')
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

// PG사 랜덤 선택 (50:50)
const selectRandomPG = () => {
  // return Math.random() < 0.5 ? 'TOSS' : 'INICIS'
  return 'INICIS'
}

const handlePayment = async () => {
  if (!isFormValid.value) {
    alert('모든 정보를 입력해주세요.')
    return
  }

  // 적립금만으로 결제가 완료되는 경우
  if (finalAmount.value === 0) {
    try {
      // 백엔드에 적립금만 사용한 결제 요청
      const requestData = {
        paymentKey: `POINTS_${Date.now()}`, // 적립금 결제용 가상 paymentKey
        orderId: `ORDER_${Date.now()}`,
        amount: 0, // 카드 결제 금액은 0
        customerName: customerInfo.value.name,
        customerEmail: customerInfo.value.email,
        customerPhone: customerInfo.value.phone,
        productName: orderInfo.value.productName,
        quantity: orderInfo.value.quantity,
        memberId: currentMember.value?.memberId,
        usePoints: usePoints.value
      }

      const response = await fetch(`${API_BASE_URL}/payment/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      const result = await response.json()

      if (response.ok && result.status === 'SUCCESS') {
        alert('적립금으로 결제가 완료되었습니다!')
        // 회원 정보 업데이트
        await updateMemberInfo()
        // 성공 페이지로 이동하거나 메인으로 이동
        navigateTo('/')
      } else {
        alert('결제 처리 중 오류가 발생했습니다: ' + result.message)
      }
    } catch (error) {
      console.error('결제 오류:', error)
      alert('결제 중 오류가 발생했습니다.')
    }
    return
  }

  // 카드 결제가 필요한 경우 - PG사 랜덤 선택
  const selectedPG = selectRandomPG()
  console.log(`선택된 PG: ${selectedPG}`)
  
  // 결제 정보를 localStorage에 저장
  const paymentData = {
    orderInfo: orderInfo.value,
    customerInfo: customerInfo.value,
    memberId: currentMember.value?.memberId,
    usePoints: usePoints.value || 0,
    finalAmount: finalAmount.value,
    selectedPG: selectedPG
  }
  
  localStorage.setItem('paymentData', JSON.stringify(paymentData))

  if (selectedPG === 'TOSS') {
    await handleTossPayment()
  } else {
    await handleInicisPayment()
  }
}

// 토스페이먼츠 결제 처리
const handleTossPayment = async () => {
  try {
    console.log('토스페이먼츠 결제 진행')
    
    const TossPayments = await loadTossPayments()
    
    // 토스페이먼츠 테스트 클라이언트 키
    const clientKey = 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq'
    const tossPayments = TossPayments(clientKey)
    
    const orderId = `ORDER_${Date.now()}`
    
    await tossPayments.requestPayment('카드', {
      amount: finalAmount.value,
      orderId: orderId,
      orderName: orderInfo.value.productName,
      customerName: customerInfo.value.name,
      customerEmail: customerInfo.value.email,
      customerMobilePhone: customerInfo.value.phone,
      successUrl: `${window.location.origin}/payment/processing`,
      failUrl: `${window.location.origin}/payment/fail`,
    })
  } catch (error) {
    console.error('토스페이먼츠 결제 실패:', error)
    alert('토스페이먼츠 결제 중 오류가 발생했습니다.')
  }
}

// 이니시스 실제 결제 처리
const handleInicisPayment = async () => {
  try {
    console.log('이니시스 실제 결제 진행')
    
    // 이니시스 결제 파라미터 설정
    const orderId = `ORDER_${Date.now()}`
    
    // 서버에서 이니시스 결제 정보 조회
    console.log('서버에서 이니시스 결제 정보 조회 중...')
    const payInfoResponse = await fetch(`${API_BASE_URL}/inicis/pc/pay-info?oid=${orderId}&price=${finalAmount.value}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    const payInfoResult = await payInfoResponse.json()
    
    if (!payInfoResponse.ok || payInfoResult.status !== 'SUCCESS') {
      throw new Error(payInfoResult.message || '결제 정보 조회 실패')
    }
    
    const paymentInfo = payInfoResult.paymentInfo
    console.log('서버에서 받아온 이니시스 결제 정보:', paymentInfo)
    
    // 이니시스 스크립트 로드
    await loadInicisScript()
    
    // 이니시스 결제 파라미터
    const inicisParams = {
      oid: orderId,
      price: finalAmount.value.toString(),
      currency: "WON",
      goodname: orderInfo.value.productName,
      buyername: customerInfo.value.name,
      buyertel: customerInfo.value.phone,
      buyeremail: customerInfo.value.email,
      acceptmethod: "below1000",
      paymethod: "Card",
      gopaymethod: "Card",
      // 결제 완료 후 이동할 페이지
      returnUrl: `${window.location.origin}/payment/inicis/processing`,
      // 결제 창이 닫힐 때 이동할 페이지  
      closeUrl: `${window.location.origin}/payment/fail?message=결제창이 닫혔습니다`,
      // 서버에서 받아온 데이터 (HTML 폼 필드명과 정확히 일치시킴)
      mid: paymentInfo.mid,
      mKey: paymentInfo.mkey,
      signature: paymentInfo.signature,
      timestamp: paymentInfo.timestamp,
      verification: paymentInfo.verification,
    }
    
    console.log('최종 이니시스 결제 파라미터:', inicisParams)
    
    // HTML 폼에 파라미터 설정 - 각 필드를 직접 매핑
    document.getElementById('gopaymethod').value = inicisParams.gopaymethod
    document.getElementById('mid').value = inicisParams.mid
    document.getElementById('oid').value = inicisParams.oid
    document.getElementById('price').value = inicisParams.price
    document.getElementById('timestamp').value = inicisParams.timestamp
    document.getElementById('signature').value = inicisParams.signature
    document.getElementById('verification').value = inicisParams.verification
    document.getElementById('mKey').value = inicisParams.mKey
    document.getElementById('currency').value = inicisParams.currency
    document.getElementById('goodname').value = inicisParams.goodname
    document.getElementById('buyername').value = inicisParams.buyername
    document.getElementById('buyertel').value = inicisParams.buyertel
    document.getElementById('buyeremail').value = inicisParams.buyeremail
    document.getElementById('returnUrl').value = inicisParams.returnUrl
    document.getElementById('closeUrl').value = inicisParams.closeUrl
    document.getElementById('acceptmethod').value = inicisParams.acceptmethod
    document.getElementById('paymethod').value = inicisParams.paymethod

    console.log('HTML 폼 필드 설정 완료')
    console.log('mid:', document.getElementById('mid').value)
    console.log('mKey:', document.getElementById('mKey').value)
    console.log('signature:', document.getElementById('signature').value)
    console.log('timestamp:', document.getElementById('timestamp').value)
    
    // INIStdPay 객체 확인
    console.log('INIStdPay 객체:', window.INIStdPay)
    
    // 이니시스 결제창 호출
    if (window.INIStdPay && window.INIStdPay.pay) {
      console.log('INIStdPay.pay() 호출')
      window.INIStdPay.pay('inicis_form')
    } else {
      console.error('INIStdPay.pay 메서드를 찾을 수 없습니다')
      alert('이니시스 결제 모듈 로드에 실패했습니다')
    }
    
  } catch (error) {
    console.error('이니시스 결제 실패:', error)
    alert('이니시스 결제 중 오류가 발생했습니다: ' + error.message)
  }
}

// 이니시스 스크립트 로드
const loadInicisScript = () => {
  return new Promise((resolve, reject) => {
    if (window.INIStdPay) {
      resolve()
      return
    }
    
    const script = document.createElement('script')
    script.src = 'https://stgstdpay.inicis.com/stdjs/INIStdPay.js'  // 테스트 환경
    script.charset = 'UTF-8'
    
    script.onload = () => {
      console.log('이니시스 스크립트 로드 완료')
      resolve()
    }
    
    script.onerror = () => {
      console.error('이니시스 스크립트 로드 실패')
      reject(new Error('이니시스 스크립트 로드 실패'))
    }
    
    document.head.appendChild(script)
  })
}

const updateMemberInfo = async () => {
  if (currentMember.value) {
    try {
      const response = await fetch(`${API_BASE_URL}/member/${currentMember.value.memberId}`)
      const result = await response.json()
      
      if (result.status === 'SUCCESS') {
        currentMember.value = result.member
        localStorage.setItem('currentMember', JSON.stringify(result.member))
      }
    } catch (error) {
      console.error('회원 정보 업데이트 오류:', error)
    }
  }
}

// 초기화
onMounted(async () => {
  // 로그인 상태 확인
  const savedMember = localStorage.getItem('currentMember')
  if (!savedMember) {
    alert('로그인이 필요합니다.')
    await navigateTo('/')
    return
  }

  currentMember.value = JSON.parse(savedMember)
  
  // 주문자 정보 자동 입력
  customerInfo.value.name = currentMember.value.name || ''
  customerInfo.value.email = currentMember.value.email || ''
  customerInfo.value.phone = currentMember.value.phone || ''

  // 최신 회원 정보 조회 (적립금 업데이트를 위해)
  await updateMemberInfo()
})

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
  max-width: 600px;
  width: 100%;
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.payment-title {
  color: #333;
  font-size: 24px;
  font-weight: bold;
  margin: 0;
}

.logout-btn {
  padding: 8px 16px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.logout-btn:hover {
  background-color: #545b62;
}

/* 회원 정보 */
.member-info {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #e7f3ff;
  border-radius: 8px;
}

.member-welcome h3 {
  margin: 0 0 10px 0;
  color: #0056b3;
}

.points-info {
  margin-bottom: 0;
}

.points-label {
  font-weight: bold;
  color: #333;
}

.points-amount {
  color: #e74c3c;
  font-weight: bold;
  font-size: 18px;
  margin-left: 10px;
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
  align-items: center;
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

.points-section {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin: 15px 0;
}

.points-item {
  border-bottom: none;
  padding: 0;
}

.points-use {
  display: flex;
  align-items: center;
  gap: 8px;
}

.points-use input {
  width: 100px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: right;
  font-size: 14px;
}

.use-max-btn {
  padding: 8px 12px;
  background-color: #17a2b8;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.use-max-btn:hover {
  background-color: #138496;
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

.payment-summary {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
}

.summary-row.discount {
  color: #28a745;
  font-weight: 500;
}

.summary-row.final {
  font-weight: bold;
  font-size: 18px;
  color: #e74c3c;
  border-top: 2px solid #ddd;
  padding-top: 10px;
  margin-top: 10px;
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

.final-amount {
  color: #0064ff;
  font-weight: bold;
}
</style>