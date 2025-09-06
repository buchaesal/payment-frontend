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
      
      <!-- 상품 정보 입력 섹션 -->
      <div class="product-input">
        <h3>상품 정보</h3>
        <div class="form-group">
          <label>상품명 <span class="required">*</span></label>
          <input 
            v-model="orderInfo.productName" 
            type="text" 
            placeholder="상품명을 입력하세요"
            maxlength="100"
          >
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>상품 금액 <span class="required">*</span></label>
            <div class="input-with-unit">
              <input 
                v-model.number="orderInfo.amount" 
                type="number" 
                min="100" 
                max="10000000"
                placeholder="100"
                @input="validateProductAmount"
              >
              <span>원</span>
            </div>
            <div v-if="amountError" class="error-message">{{ amountError }}</div>
          </div>
          <div class="form-group">
            <label>수량 <span class="required">*</span></label>
            <div class="quantity-control">
              <button @click="decreaseQuantity" :disabled="orderInfo.quantity <= 1">-</button>
              <input 
                v-model.number="orderInfo.quantity" 
                type="number" 
                min="1" 
                max="99"
                @input="validateQuantity"
              >
              <button @click="increaseQuantity" :disabled="orderInfo.quantity >= 99">+</button>
            </div>
          </div>
        </div>
      </div>

      <div class="order-summary">
        <h3>주문 정보</h3>
        <div class="order-item">
          <span>상품명</span>
          <span>{{ orderInfo.productName || '상품명을 입력하세요' }}</span>
        </div>
        <div class="order-item">
          <span>수량</span>
          <span>{{ orderInfo.quantity }}개</span>
        </div>
        <div class="order-item">
          <span>단가</span>
          <span>{{ formatPrice(orderInfo.amount || 0) }}원</span>
        </div>
        <div class="order-item">
          <span>총 상품 금액</span>
          <span>{{ formatPrice(totalProductAmount) }}원</span>
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
        
        <!-- 결제 방법 요약 섹션 -->
        <div class="payment-method-summary">
          <h4>결제 예정 내역</h4>
          <div class="payment-methods-list">
            <div v-if="usePoints && usePoints > 0" class="payment-method-item points">
              <div class="method-info">
                <span class="method-name">적립금 결제</span>
                <span class="method-icon">💰</span>
              </div>
              <div class="method-amount">{{ formatPrice(usePoints) }}원</div>
            </div>
            <div v-if="finalAmount > 0" class="payment-method-item card">
              <div class="method-info">
                <span class="method-name">카드 결제</span>
                <span class="method-icon">💳</span>
              </div>
              <div class="method-amount">{{ formatPrice(finalAmount) }}원</div>
            </div>
            <div v-if="(!usePoints || usePoints === 0) && finalAmount === 0" class="no-payment">
              결제할 금액이 없습니다.
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
          <span>총 상품 금액</span>
          <span>{{ formatPrice(totalProductAmount) }}원</span>
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

      <!-- 약관 동의 -->
      <div class="terms-section">
        <div class="terms-item">
          <label class="checkbox-label">
            <input 
              v-model="agreements.purchase" 
              type="checkbox" 
              class="agreement-checkbox"
            >
            <span class="checkmark"></span>
            <span class="terms-text">구매 조건 및 결제 진행 동의 <span class="required">*</span></span>
          </label>
        </div>
        <div class="terms-item">
          <label class="checkbox-label">
            <input 
              v-model="agreements.privacy" 
              type="checkbox" 
              class="agreement-checkbox"
            >
            <span class="checkmark"></span>
            <span class="terms-text">개인정보 처리방침 동의 <span class="required">*</span></span>
          </label>
        </div>
        <div class="terms-item">
          <label class="checkbox-label">
            <input 
              v-model="agreements.all" 
              type="checkbox" 
              class="agreement-checkbox"
              @change="toggleAllAgreements"
            >
            <span class="checkmark"></span>
            <span class="terms-text all-agree">전체 동의</span>
          </label>
        </div>
      </div>

      <div class="button-container">
        <button 
          class="payment-button"
          @click="handlePayment"
          :disabled="!isFormValid"
          type="button"
        >
          {{ getPaymentButtonText }}
        </button>
      </div>
    </div>

    <!-- 이니시스 결제를 위한 숨겨진 폼 -->
    <form id="inicis_form" name="inicis_form" method="post" action="https://stgstdpay.inicis.com/ini/payform.php" target="_self">
      <input type="hidden" name="version" id="version" value="1.0" />
      <input type="hidden" name="gopaymethod" id="gopaymethod" />
      <input type="hidden" name="mid" id="mid" />
      <input type="hidden" name="oid" id="oid" />
      <input type="hidden" name="price" id="price" />
      <input type="hidden" name="timestamp" id="timestamp" />
      <input type="hidden" name="use_chkfake" id="use_chkfake" />
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
    </form>
  </div>
</template>

<script setup>
const config = useRuntimeConfig()
const API_BASE_URL = config.public.apiBaseUrl

// 상태 관리
const currentMember = ref(null)
const usePoints = ref(0)
const amountError = ref('')

const orderInfo = ref({
  productName: '아이폰 15 Pro',
  quantity: 1,
  amount: 1590000
})

const customerInfo = ref({
  name: '',
  email: '',
  phone: ''
})

// 약관 동의
const agreements = ref({
  purchase: false,
  privacy: false,
  all: false
})

// 계산된 속성
const totalProductAmount = computed(() => {
  return (orderInfo.value.amount || 0) * (orderInfo.value.quantity || 1)
})

const finalAmount = computed(() => {
  const total = totalProductAmount.value
  const points = usePoints.value || 0
  return Math.max(0, total - points)
})

const isFormValid = computed(() => {
  return customerInfo.value.name && 
         customerInfo.value.email && 
         customerInfo.value.phone &&
         orderInfo.value.productName &&
         orderInfo.value.amount >= 100 &&
         orderInfo.value.quantity >= 1 &&
         agreements.value.purchase &&
         agreements.value.privacy
})

const getPaymentButtonText = computed(() => {
  const totalAmount = orderInfo.value.amount
  const pointsUsed = usePoints.value || 0
  const cardAmount = finalAmount.value
  
  if (totalAmount === 0) {
    return '무료 주문 완료'
  }
  
  // 적립금만 사용하는 경우
  if (pointsUsed > 0 && cardAmount === 0) {
    return `${formatPrice(pointsUsed)}원 적립금 결제`
  }
  
  // 카드만 사용하는 경우
  if (pointsUsed === 0 && cardAmount > 0) {
    return `${formatPrice(cardAmount)}원 카드 결제`
  }
  
  // 복합결제인 경우
  if (pointsUsed > 0 && cardAmount > 0) {
    return `복합결제 (적립금 ${formatPrice(pointsUsed)}원 + 카드 ${formatPrice(cardAmount)}원)`
  }
  
  return '결제하기'
})

// 메서드
const formatPrice = (price) => {
  return price.toLocaleString('ko-KR')
}

// 상품 금액 유효성 검사
const validateProductAmount = () => {
  if (orderInfo.value.amount < 100) {
    amountError.value = '상품 금액은 100원 이상이어야 합니다'
    orderInfo.value.amount = 100
  } else if (orderInfo.value.amount > 10000000) {
    amountError.value = '상품 금액은 1,000만원을 초과할 수 없습니다'
    orderInfo.value.amount = 10000000
  } else {
    amountError.value = ''
  }
}

// 수량 유효성 검사
const validateQuantity = () => {
  if (orderInfo.value.quantity < 1) {
    orderInfo.value.quantity = 1
  } else if (orderInfo.value.quantity > 99) {
    orderInfo.value.quantity = 99
  }
}

// 수량 증가/감소
const increaseQuantity = () => {
  if (orderInfo.value.quantity < 99) {
    orderInfo.value.quantity += 1
  }
}

const decreaseQuantity = () => {
  if (orderInfo.value.quantity > 1) {
    orderInfo.value.quantity -= 1
  }
}

const validatePoints = () => {
  if (currentMember.value) {
    const maxPoints = Math.min(currentMember.value.points, totalProductAmount.value)
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
    const maxUsable = Math.min(currentMember.value.points, totalProductAmount.value)
    usePoints.value = maxUsable
  }
}

// 약관 동의 처리
const toggleAllAgreements = () => {
  if (agreements.value.all) {
    // 전체 동의 체크 시 모든 필수 약관 동의
    agreements.value.purchase = true
    agreements.value.privacy = true
  } else {
    // 전체 동의 해제 시 모든 약관 해제
    agreements.value.purchase = false
    agreements.value.privacy = false
  }
}

// 개별 약관 상태 변경 시 전체 동의 상태 업데이트
watch([() => agreements.value.purchase, () => agreements.value.privacy], () => {
  agreements.value.all = agreements.value.purchase && agreements.value.privacy
})

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
  return Math.random() < 0.5 ? 'TOSS' : 'INICIS'
  // return 'TOSS'
}

const handlePayment = async () => {
  if (!isFormValid.value) {
    alert('모든 정보를 입력해주세요.')
    return
  }

  // 복합결제 구조: paymentItems 배열 구성
  const paymentItems = []
  const totalAmount = orderInfo.value.amount * orderInfo.value.quantity

  // 적립금 사용이 있는 경우
  if (usePoints.value && usePoints.value > 0) {
    paymentItems.push({
      paymentMethod: 'POINTS',
      amount: usePoints.value
    })
  }

  // 카드 결제 금액 (총 금액 - 적립금 사용금액)
  const cardAmount = finalAmount.value
  if (cardAmount > 0) {
    paymentItems.push({
      paymentMethod: 'CARD', 
      amount: cardAmount
    })
  }

  // 결제할 항목이 없는 경우
  if (paymentItems.length === 0) {
    alert('결제할 금액이 없습니다.')
    return
  }

  console.log('복합결제 항목:', paymentItems)
  console.log('총 결제 금액:', totalAmount)

  // 적립금만으로 결제가 완료되는 경우
  if (finalAmount.value === 0 && paymentItems.length === 1 && paymentItems[0].paymentMethod === 'POINTS') {
    try {
      // 새로운 복합결제 API 구조로 적립금 결제 요청
      const orderId = `ORDER_${Date.now()}`
      const requestData = {
        orderId: orderId,
        totalAmount: totalAmount,
        paymentItems: paymentItems,
        customerName: customerInfo.value.name,
        customerEmail: customerInfo.value.email,
        customerPhone: customerInfo.value.phone,
        productName: orderInfo.value.productName,
        quantity: orderInfo.value.quantity,
        memberId: currentMember.value?.memberId
      }

      const response = await fetch(`${API_BASE_URL}/payment/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        alert('결제 처리 실패: ' + errorText)
        return
      }

      const result = await response.json()

      if (result.status === 'SUCCESS') {
        alert('적립금으로 결제가 완료되었습니다!')
        // 회원 정보 업데이트
        await updateMemberInfo()
        // 결제 완료 페이지로 주문번호와 함께 이동
        navigateTo(`/payment/success?orderId=${orderId}`)
      } else {
        alert('결제 처리 중 오류가 발생했습니다: ' + result.message)
      }
    } catch (error) {
      console.error('결제 오류:', error)
      alert('결제 중 오류가 발생했습니다.')
    }
    return
  }

  // 카드 결제가 포함된 경우 - PG사 랜덤 선택
  const selectedPG = selectRandomPG()
  console.log(`선택된 PG: ${selectedPG}`)
  
  // 복합결제 정보를 localStorage에 저장
  const paymentData = {
    orderInfo: orderInfo.value,
    customerInfo: customerInfo.value,
    memberId: currentMember.value?.memberId,
    usePoints: usePoints.value || 0,
    finalAmount: finalAmount.value,
    totalAmount: totalAmount,
    paymentItems: paymentItems,
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
    
    // 토스페이먼츠 클라이언트 키 (환경별로 관리)
    const clientKey = config.public.tossClientKey
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
      acceptmethod: "HPP(1):below1000",
      gopaymethod: "Card",
      // 결제 완료 후 이동할 페이지
      returnUrl: `${window.location.origin}/api/payment`,
      // 결제 창이 닫힐 때 이동할 페이지 (현재 페이지로 돌아감)
      closeUrl: `${window.location.origin}/paymentSheet`,
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
      
      if (!response.ok) {
        console.error('회원 정보 조회 실패:', response.statusText)
        return
      }
      
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

/* 결제 방법 요약 섹션 스타일 */
.payment-method-summary {
  background-color: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
}

.payment-method-summary h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
}

.payment-methods-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-method-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.payment-method-item.points {
  background-color: #fff3cd;
  border-color: #ffc107;
}

.payment-method-item.card {
  background-color: #cce5ff;
  border-color: #0064ff;
}

.method-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.method-name {
  font-weight: 600;
  color: #333;
}

.method-icon {
  font-size: 20px;
}

.method-amount {
  font-weight: bold;
  font-size: 16px;
  color: #333;
}

.no-payment {
  text-align: center;
  color: #6c757d;
  font-style: italic;
  padding: 20px;
}

/* 상품 정보 입력 섹션 */
.product-input {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.product-input h3 {
  margin-bottom: 20px;
  color: #333;
  font-size: 18px;
  border-bottom: 2px solid #eee;
  padding-bottom: 8px;
}

.form-row {
  display: flex;
  gap: 20px;
}

.form-row .form-group {
  flex: 1;
}

.required {
  color: #e74c3c;
}

.input-with-unit {
  display: flex;
  align-items: center;
  position: relative;
}

.input-with-unit input {
  padding-right: 40px;
}

.input-with-unit span {
  position: absolute;
  right: 12px;
  color: #666;
  font-size: 14px;
  pointer-events: none;
}

.error-message {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 5px;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quantity-control button {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  background-color: #f8f9fa;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: background-color 0.3s;
}

.quantity-control button:hover:not(:disabled) {
  background-color: #e9ecef;
}

.quantity-control button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-control input {
  width: 80px;
  text-align: center;
}

/* 약관 동의 섹션 */
.terms-section {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.terms-item {
  margin-bottom: 15px;
}

.terms-item:last-child {
  margin-bottom: 0;
  padding-top: 15px;
  border-top: 1px solid #dee2e6;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
  padding-left: 30px;
  user-select: none;
}

.agreement-checkbox {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.checkmark {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 20px;
  width: 20px;
  background-color: white;
  border: 2px solid #ddd;
  border-radius: 4px;
  transition: all 0.3s;
}

.agreement-checkbox:checked ~ .checkmark {
  background-color: #0064ff;
  border-color: #0064ff;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.agreement-checkbox:checked ~ .checkmark:after {
  display: block;
  left: 6px;
  top: 2px;
  width: 6px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.terms-text {
  margin-left: 10px;
  font-size: 14px;
  color: #333;
}

.terms-text.all-agree {
  font-weight: bold;
  color: #0064ff;
}
</style>