<template>
  <ClientOnly>
    <div class="inicis-popup-container">
      <div class="popup-header">
        <h2>이니시스 결제 진행 중...</h2>
      </div>
      <div class="popup-content">
        <div class="loading-indicator">
          <div class="spinner"></div>
          <p>결제창을 준비하고 있습니다.</p>
        </div>
      </div>

      <!-- 이니시스 결제를 위한 숨겨진 폼 -->
      <form id="inicis_form" name="inicis_form" method="post" :action="`${config.public.inicisUrl}/ini/payform.php`" target="_self">
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
    <template #fallback>
      <div class="loading-fallback">
        <div class="spinner"></div>
        <p>로딩 중...</p>
      </div>
    </template>
  </ClientOnly>
</template>

<script setup>
const config = useRuntimeConfig()
const API_BASE_URL = config.public.apiBaseUrl

// URL 파라미터로부터 결제 정보 받기
const route = useRoute()
const {
  orderId,
  amount,
  productName,
  customerName,
  customerPhone,
  customerEmail,
  closeYn,
} = route.query

onMounted(async () => {
  if (closeYn === 'Y') window.close()
  // 클라이언트에서만 실행
  if (!process.client) return

  try {
    console.log('이니시스 팝업 페이지 로드됨')
    console.log('결제 정보:', { orderId, amount, productName, customerName, customerPhone, customerEmail })

    // 결제 정보가 없으면 에러 처리
    if (!orderId || !amount || !productName || !customerName) {
      throw new Error('필수 결제 정보가 누락되었습니다.')
    }

    // 서버에서 이니시스 결제 정보 조회
    console.log('서버에서 이니시스 결제 정보 조회 중...')
    const payInfoResponse = await fetch(`${API_BASE_URL}/inicis/pc/pay-info?oid=${orderId}&price=${amount}`, {
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
      price: amount.toString(),
      currency: "WON",
      goodname: productName,
      buyername: customerName,
      buyertel: customerPhone,
      buyeremail: customerEmail,
      acceptmethod: "HPP(1):below1000",
      gopaymethod: "Card",
      // 결제 완료 후 이동할 페이지
      returnUrl: `${window.location.origin}/api/payment`,
      // 결제 창이 닫힐 때 현재 팝업 창을 닫음
      closeUrl: `${window.location.origin}/payment/inicis/close`,
      // 서버에서 받아온 데이터
      mid: paymentInfo.mid,
      mKey: paymentInfo.mkey,
      signature: paymentInfo.signature,
      timestamp: paymentInfo.timestamp,
      verification: paymentInfo.verification,
    }

    console.log('최종 이니시스 결제 파라미터:', inicisParams)

    // HTML 폼에 파라미터 설정
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

    // 잠시 후 이니시스 결제창 호출
    setTimeout(() => {
      if (window.INIStdPay && window.INIStdPay.pay) {
        console.log('INIStdPay.pay() 호출')
        window.INIStdPay.pay('inicis_form')
      } else {
        console.error('INIStdPay.pay 메서드를 찾을 수 없습니다')
        alert('이니시스 결제 모듈 로드에 실패했습니다')
      }
    }, 1000)

  } catch (error) {
    console.error('이니시스 팝업 초기화 실패:', error)
    alert('결제 초기화 중 오류가 발생했습니다: ' + error.message)
    window.close()
  }
})

// 이니시스 스크립트 로드
const loadInicisScript = () => {
  return new Promise((resolve, reject) => {
    if (window.INIStdPay) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = config.public.inicisScriptUrl
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

useHead({
  title: '이니시스 결제'
})
</script>

<style scoped>
.inicis-popup-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.popup-header {
  text-align: center;
  margin-bottom: 30px;
}

.popup-header h2 {
  color: white;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.popup-content {
  background: white;
  border-radius: 15px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  text-align: center;
  min-width: 300px;
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-indicator p {
  margin: 0;
  color: #666;
  font-size: 16px;
  font-weight: 500;
}

.loading-fallback {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  gap: 20px;
}

.loading-fallback .spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-fallback p {
  color: white;
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}
</style>