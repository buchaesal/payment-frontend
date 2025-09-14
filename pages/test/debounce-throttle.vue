<template>
  <div class="debounce-throttle-test">
    <h1>useDebounce vs useThrottle 테스트</h1>
    <p>각 버튼을 빠르게 연속으로 클릭해서 중복호출 방지 동작을 확인해보세요.</p>
    
    <!-- 회원 선택 섹션 -->
    <div class="member-selection">
      <h2>테스트용 회원 선택</h2>
      <div class="member-buttons">
        <button 
          v-for="member in members" 
          :key="member.id"
          @click="selectMember(member)"
          :class="['member-btn', { active: selectedMember?.id === member.id }]"
        >
          {{ member.name }} (ID: {{ member.id }})
          <span v-if="member.couponIssued" class="issued-badge">발급완료</span>
        </button>
      </div>
      <div v-if="selectedMember" class="selected-member">
        <strong>선택된 회원:</strong> {{ selectedMember.name }} 
        <span :class="['status', selectedMember.couponIssued ? 'issued' : 'available']">
          {{ selectedMember.couponIssued ? '(이미 발급됨)' : '(발급 가능)' }}
        </span>
      </div>
    </div>
    
    <div class="test-container">
      <!-- Debounce 테스트 섹션 -->
      <div class="test-section">
        <h2>useDebounce (300ms)</h2>
        <p>마지막 클릭 후 300ms 후에 실행</p>
        <button 
          @click="downloadCouponWithDebounce" 
          class="coupon-btn debounce-btn"
        >
          Debounce 쿠폰 다운로드
        </button>
        <div class="log-section">
          <h3>Debounce 로그:</h3>
          <div class="log-container">
            <div v-for="(log, index) in debounceLogs" :key="index" class="log-item">
              {{ log }}
            </div>
          </div>
        </div>
      </div>

      <!-- Throttle 테스트 섹션 -->
      <div class="test-section">
        <h2>useThrottle (300ms)</h2>
        <p>첫 클릭 후 300ms 동안 추가 실행 차단</p>
        <button 
          @click="downloadCouponWithThrottle" 
          class="coupon-btn throttle-btn"
        >
          Throttle 쿠폰 다운로드
        </button>
        <div class="log-section">
          <h3>Throttle 로그:</h3>
          <div class="log-container">
            <div v-for="(log, index) in throttleLogs" :key="index" class="log-item">
              {{ log }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="test-instructions">
      <h3>테스트 방법 (회원당 1장 제한 쿠폰):</h3>
      <ol>
        <li><strong>회원 선택:</strong> 위에서 테스트할 회원을 선택하세요</li>
        <li><strong>중복발급 테스트:</strong> 같은 회원으로 여러번 빠르게 클릭해보세요</li>
        <li><strong>Debounce vs Throttle:</strong> 각각의 중복호출 방지 동작을 비교해보세요</li>
        <li><strong>이미 발급받은 회원:</strong> 박민수 회원으로 테스트해서 중복발급 체크를 확인하세요</li>
        <li><strong>서버 측 체크:</strong> 클라이언트 체크를 우회해도 서버에서 중복발급을 방지합니다</li>
      </ol>
      <div class="control-buttons">
        <button @click="clearLogs" class="clear-btn">로그 초기화</button>
        <button @click="resetCoupons" class="reset-btn">쿠폰 발급상태 초기화</button>
      </div>
      
      <!-- 자동 테스트 버튼들 -->
      <div class="auto-test-section">
        <h4>🤖 자동 중복호출 테스트</h4>
        <p>정확한 타이밍으로 중복호출 시나리오를 자동으로 실행합니다</p>
        <div class="auto-test-buttons">
          <button @click="testDebounceRaceCondition" class="test-btn race-btn" :disabled="isAutoTesting">
            {{ isAutoTesting ? '테스트 진행중...' : 'Debounce Race Condition 테스트' }}
          </button>
          <button @click="testDebounceTimingAttack" class="test-btn timing-btn" :disabled="isAutoTesting">
            {{ isAutoTesting ? '테스트 진행중...' : 'Debounce 타이밍 어택 테스트' }}
          </button>
          <button @click="testThrottleComparison" class="test-btn compare-btn" :disabled="isAutoTesting">
            {{ isAutoTesting ? '테스트 진행중...' : 'Throttle 안전성 비교 테스트' }}
          </button>
        </div>
        <div v-if="testDescription" class="test-description">
          <strong>현재 실행 중:</strong> {{ testDescription }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 로그 저장용 반응형 변수들
const debounceLogs = ref([])
const throttleLogs = ref([])

// 중복 호출 방지 플래그들
const debounceApiFlag = ref(false)
const throttleApiFlag = ref(false)

// 회원 데이터 및 선택된 회원
const members = ref([
  { id: 1, name: '홍길동', couponIssued: false },
  { id: 2, name: '김철수', couponIssued: false },
  { id: 3, name: '이영희', couponIssued: false },
  { id: 4, name: '박민수', couponIssued: true }, // 이미 발급받은 회원
  { id: 5, name: '최지혜', couponIssued: false }
])
const selectedMember = ref(null)

// 자동 테스트 관련 변수들
const isAutoTesting = ref(false)
const testDescription = ref('')

// 유틸리티 함수들
const useDebounce = (func, delay) => {
  let timeoutId
  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
}

const useThrottle = (func, delay) => {
  let timeoutId
  let lastExecTime = 0
  return function (...args) {
    const currentTime = Date.now()
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args)
      lastExecTime = currentTime
    }
  }
}

// 회원 선택 함수
const selectMember = (member) => {
  selectedMember.value = member
  // 선택 로그 추가
  const timestamp = new Date().toLocaleTimeString()
  const message = `👤 [${timestamp}] ${member.name} (ID: ${member.id}) 선택됨 ${member.couponIssued ? '(이미 발급됨)' : '(발급 가능)'}`
  debounceLogs.value.push(message)
  throttleLogs.value.push(message)
}

// 쿠폰 발급 가능 여부 체크
const checkCouponEligibility = (memberId, type) => {
  if (!selectedMember.value) {
    return { eligible: false, reason: '회원을 먼저 선택해주세요' }
  }
  
  if (selectedMember.value.couponIssued) {
    return { eligible: false, reason: '이미 쿠폰을 발급받은 회원입니다 (중복발급 불가)' }
  }
  
  return { eligible: true, reason: '쿠폰 발급 가능' }
}

// 쿠폰 다운로드 API 시뮬레이션 함수 (회원별 중복발급 체크 포함)
const couponDownloadApi = async (type, memberId) => {
  const timestamp = new Date().toLocaleTimeString()
  console.log(`[${type}] 쿠폰 다운로드 API 호출 시작 - 회원ID: ${memberId}, 시간: ${timestamp}`)
  
  // 서버에서 중복발급 체크 시뮬레이션
  const member = members.value.find(m => m.id === memberId)
  if (member && member.couponIssued) {
    console.log(`[${type}] 서버 측 중복발급 체크 - 이미 발급된 회원`)
    throw new Error(`회원 ${member.name}은 이미 쿠폰을 발급받았습니다`)
  }
  
  // API 호출 시뮬레이션 (1초 대기)
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 성공 시 회원의 쿠폰 발급 상태 업데이트
  if (member) {
    member.couponIssued = true
  }
  
  const endTimestamp = new Date().toLocaleTimeString()
  console.log(`[${type}] 쿠폰 다운로드 API 호출 완료 - ${endTimestamp}`)
  
  return { success: true, message: `쿠폰 발급 성공! (${member?.name})`, timestamp: endTimestamp }
}

// Debounce를 사용한 쿠폰 다운로드 핵심 함수
const downloadCouponWithDebounceCore = async () => {
  const clickTime = new Date().toLocaleTimeString()
  debounceLogs.value.push(`🔄 [${clickTime}] Debounce 함수 실행 - API 호출 시작`)
  
  // 회원 선택 체크
  if (!selectedMember.value) {
    debounceLogs.value.push(`❌ [${clickTime}] 회원을 먼저 선택해주세요`)
    return
  }
  
  // 발급 가능성 체크
  const eligibilityCheck = checkCouponEligibility(selectedMember.value.id, 'DEBOUNCE')
  if (!eligibilityCheck.eligible) {
    debounceLogs.value.push(`❌ [${clickTime}] ${eligibilityCheck.reason}`)
    return
  }
  
  // 중복 호출 방지 플래그 체크
  if (debounceApiFlag.value) {
    debounceLogs.value.push(`⚠️ [${clickTime}] 이미 처리 중입니다. 중복 호출 방지됨`)
    return
  }
  
  debounceApiFlag.value = true
  
  try {
    const result = await couponDownloadApi('DEBOUNCE', selectedMember.value.id)
    debounceLogs.value.push(`✅ [${result.timestamp}] ${result.message}`)
  } catch (error) {
    debounceLogs.value.push(`❌ [${clickTime}] 오류 발생: ${error.message}`)
  } finally {
    debounceApiFlag.value = false
  }
}

// Throttle을 사용한 쿠폰 다운로드 핵심 함수
const downloadCouponWithThrottleCore = async () => {
  const clickTime = new Date().toLocaleTimeString()
  throttleLogs.value.push(`🔄 [${clickTime}] Throttle 함수 실행 - API 호출 시작`)
  
  // 회원 선택 체크
  if (!selectedMember.value) {
    throttleLogs.value.push(`❌ [${clickTime}] 회원을 먼저 선택해주세요`)
    return
  }
  
  // 발급 가능성 체크
  const eligibilityCheck = checkCouponEligibility(selectedMember.value.id, 'THROTTLE')
  if (!eligibilityCheck.eligible) {
    throttleLogs.value.push(`❌ [${clickTime}] ${eligibilityCheck.reason}`)
    return
  }
  
  // 중복 호출 방지 플래그 체크
  if (throttleApiFlag.value) {
    throttleLogs.value.push(`⚠️ [${clickTime}] 이미 처리 중입니다. 중복 호출 방지됨`)
    return
  }
  
  throttleApiFlag.value = true
  
  try {
    const result = await couponDownloadApi('THROTTLE', selectedMember.value.id)
    throttleLogs.value.push(`✅ [${result.timestamp}] ${result.message}`)
  } catch (error) {
    throttleLogs.value.push(`❌ [${clickTime}] 오류 발생: ${error.message}`)
  } finally {
    throttleApiFlag.value = false
  }
}

// Debounce와 Throttle 래핑된 함수들
const debouncedDownload = useDebounce(() => {
  const clickTime = new Date().toLocaleTimeString()
  debounceLogs.value.push(`🖱️ [${clickTime}] Debounce 실행됨 - API 호출`)
  downloadCouponWithDebounceCore()
}, 300)

const throttledDownload = useThrottle(() => {
  const clickTime = new Date().toLocaleTimeString()
  throttleLogs.value.push(`🖱️ [${clickTime}] Throttle 실행됨 - API 호출`)
  downloadCouponWithThrottleCore()
}, 300)

// 실제 버튼 클릭 핸들러들
const downloadCouponWithDebounce = () => {
  const clickTime = new Date().toLocaleTimeString()
  debounceLogs.value.push(`👆 [${clickTime}] Debounce 버튼 클릭됨`)
  debouncedDownload()
}

const downloadCouponWithThrottle = () => {
  const clickTime = new Date().toLocaleTimeString()
  throttleLogs.value.push(`👆 [${clickTime}] Throttle 버튼 클릭됨`)
  throttledDownload()
}

// 로그 초기화
const clearLogs = () => {
  debounceLogs.value = []
  throttleLogs.value = []
}

// 쿠폰 발급상태 초기화 (테스트용)
const resetCoupons = () => {
  members.value.forEach(member => {
    if (member.id !== 4) { // 박민수는 기본으로 발급된 상태 유지
      member.couponIssued = false
    } else {
      member.couponIssued = true // 박민수는 다시 발급된 상태로
    }
  })
  
  const timestamp = new Date().toLocaleTimeString()
  const message = `🔄 [${timestamp}] 쿠폰 발급상태가 초기화되었습니다 (박민수 제외)`
  debounceLogs.value.push(message)
  throttleLogs.value.push(message)
}

// 🤖 자동 테스트 함수들
const testDebounceRaceCondition = async () => {
  if (!selectedMember.value) {
    alert('먼저 회원을 선택해주세요!')
    return
  }
  
  isAutoTesting.value = true
  testDescription.value = '여러 클릭 후 정확히 300ms 뒤에 추가 클릭하여 Race Condition 테스트 중...'
  clearLogs()
  
  try {
    // 1단계: 빠른 연속 클릭 (200ms 간격으로 3번)
    debounceLogs.value.push('🤖 [자동테스트] 1단계: 200ms 간격으로 3번 빠르게 클릭 시작')
    downloadCouponWithDebounce()
    
    await new Promise(resolve => setTimeout(resolve, 200))
    downloadCouponWithDebounce()
    
    await new Promise(resolve => setTimeout(resolve, 200))
    downloadCouponWithDebounce()
    
    // 2단계: 마지막 클릭 후 정확히 250ms 후에 추가 클릭 (Race Condition 유발)
    debounceLogs.value.push('🤖 [자동테스트] 2단계: 250ms 후 Race Condition 클릭 예정')
    await new Promise(resolve => setTimeout(resolve, 250))
    downloadCouponWithDebounce()
    
    debounceLogs.value.push('🤖 [자동테스트] Race Condition 테스트 완료! 로그를 확인하세요')
    
  } catch (error) {
    debounceLogs.value.push(`🤖 [자동테스트] 오류: ${error.message}`)
  } finally {
    isAutoTesting.value = false
    testDescription.value = ''
  }
}

const testDebounceTimingAttack = async () => {
  if (!selectedMember.value) {
    alert('먼저 회원을 선택해주세요!')
    return
  }
  
  isAutoTesting.value = true
  testDescription.value = 'Debounce 타이밍 어택: API 실행 중에 추가 클릭하여 중복 실행 시도 중...'
  clearLogs()
  
  try {
    // 1단계: 첫 번째 API 실행 시작
    debounceLogs.value.push('🤖 [타이밍어택] 1단계: 첫 번째 API 실행 시작')
    downloadCouponWithDebounce()
    
    // 2단계: 300ms 후 API가 실행되면서 700ms 대기하는 동안 추가 클릭
    await new Promise(resolve => setTimeout(resolve, 400)) // debounce 실행 후
    debounceLogs.value.push('🤖 [타이밍어택] 2단계: API 처리 중에 추가 클릭 (타이밍 어택)')
    
    // API 실행 중에 연속으로 여러번 클릭
    for (let i = 0; i < 3; i++) {
      downloadCouponWithDebounce()
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    
    debounceLogs.value.push('🤖 [타이밍어택] 테스트 완료! 플래그가 중복 실행을 막았는지 확인하세요')
    
  } catch (error) {
    debounceLogs.value.push(`🤖 [타이밍어택] 오류: ${error.message}`)
  } finally {
    isAutoTesting.value = false
    testDescription.value = ''
  }
}

const testThrottleComparison = async () => {
  if (!selectedMember.value) {
    alert('먼저 회원을 선택해주세요!')
    return
  }
  
  isAutoTesting.value = true
  testDescription.value = 'Throttle vs Debounce 안전성 비교: 동일한 시나리오로 양쪽 테스트 중...'
  clearLogs()
  
  try {
    // Debounce 테스트
    debounceLogs.value.push('🤖 [비교테스트] Debounce 테스트 시작')
    downloadCouponWithDebounce()
    await new Promise(resolve => setTimeout(resolve, 100))
    downloadCouponWithDebounce()
    await new Promise(resolve => setTimeout(resolve, 100))
    downloadCouponWithDebounce()
    await new Promise(resolve => setTimeout(resolve, 250)) // 중간에 클릭
    downloadCouponWithDebounce()
    
    // 잠시 대기 후 Throttle 테스트
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    throttleLogs.value.push('🤖 [비교테스트] Throttle 테스트 시작 (동일한 패턴)')
    downloadCouponWithThrottle()
    await new Promise(resolve => setTimeout(resolve, 100))
    downloadCouponWithThrottle()
    await new Promise(resolve => setTimeout(resolve, 100))
    downloadCouponWithThrottle()
    await new Promise(resolve => setTimeout(resolve, 250))
    downloadCouponWithThrottle()
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    debounceLogs.value.push('🤖 [비교테스트] 완료! Debounce vs Throttle 동작 차이를 비교해보세요')
    throttleLogs.value.push('🤖 [비교테스트] 완료! Debounce vs Throttle 동작 차이를 비교해보세요')
    
  } catch (error) {
    debounceLogs.value.push(`🤖 [비교테스트] 오류: ${error.message}`)
  } finally {
    isAutoTesting.value = false
    testDescription.value = ''
  }
}
</script>

<style scoped>
.debounce-throttle-test {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.test-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin: 30px 0;
}

.test-section {
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  padding: 20px;
  background-color: #f9f9f9;
}

.test-section h2 {
  color: #333;
  margin-bottom: 10px;
}

.test-section p {
  color: #666;
  margin-bottom: 20px;
  font-size: 14px;
}

.coupon-btn {
  width: 100%;
  padding: 15px 20px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.debounce-btn {
  background-color: #4CAF50;
  color: white;
}

.debounce-btn:hover {
  background-color: #45a049;
}

.throttle-btn {
  background-color: #2196F3;
  color: white;
}

.throttle-btn:hover {
  background-color: #1976D2;
}

.log-section h3 {
  color: #333;
  margin-bottom: 10px;
  font-size: 16px;
}

.log-container {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 15px;
  height: 300px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 12px;
}

.log-item {
  margin-bottom: 5px;
  padding: 3px 0;
  border-bottom: 1px solid #f0f0f0;
}

.test-instructions {
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 10px;
  padding: 20px;
  margin-top: 30px;
}

.test-instructions h3 {
  color: #856404;
  margin-bottom: 15px;
}

.test-instructions ol {
  color: #856404;
  margin-bottom: 20px;
}

.test-instructions li {
  margin-bottom: 8px;
}

.clear-btn {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.clear-btn:hover {
  background-color: #d32f2f;
}

/* 회원 선택 관련 스타일 */
.member-selection {
  background-color: #f0f8ff;
  border: 2px solid #b3d9ff;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
}

.member-selection h2 {
  color: #2c5aa0;
  margin-bottom: 15px;
}

.member-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.member-btn {
  position: relative;
  padding: 10px 15px;
  border: 2px solid #ccc;
  border-radius: 8px;
  background-color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.member-btn:hover {
  border-color: #4CAF50;
  background-color: #f0fff0;
}

.member-btn.active {
  border-color: #4CAF50;
  background-color: #4CAF50;
  color: white;
}

.issued-badge {
  display: inline-block;
  background-color: #ff6b6b;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  margin-left: 5px;
}

.member-btn.active .issued-badge {
  background-color: #ff4757;
}

.selected-member {
  padding: 12px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.status.available {
  color: #2ecc71;
  font-weight: bold;
}

.status.issued {
  color: #e74c3c;
  font-weight: bold;
}

.control-buttons {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.reset-btn {
  background-color: #ff9800;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.reset-btn:hover {
  background-color: #f57c00;
}

/* 자동 테스트 섹션 스타일 */
.auto-test-section {
  background-color: #e8f5e8;
  border: 2px solid #81c784;
  border-radius: 10px;
  padding: 20px;
  margin-top: 20px;
}

.auto-test-section h4 {
  color: #2e7d32;
  margin-bottom: 10px;
  font-size: 18px;
}

.auto-test-section p {
  color: #4caf50;
  margin-bottom: 15px;
  font-size: 14px;
}

.auto-test-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.test-btn {
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
}

.race-btn {
  background-color: #e91e63;
}

.race-btn:hover:not(:disabled) {
  background-color: #c2185b;
}

.timing-btn {
  background-color: #9c27b0;
}

.timing-btn:hover:not(:disabled) {
  background-color: #7b1fa2;
}

.compare-btn {
  background-color: #ff5722;
}

.compare-btn:hover:not(:disabled) {
  background-color: #e64a19;
}

.test-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.test-description {
  background-color: white;
  border: 1px solid #81c784;
  border-radius: 6px;
  padding: 12px;
  font-size: 14px;
  color: #2e7d32;
  font-style: italic;
}

@media (max-width: 768px) {
  .test-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .member-buttons {
    flex-direction: column;
  }
  
  .control-buttons {
    flex-direction: column;
  }
  
  .auto-test-buttons {
    flex-direction: column;
  }
}
</style>