<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1 class="auth-title">결제 시스템</h1>
      <p class="auth-subtitle">로그인 또는 회원가입을 해주세요</p>
      
      <div class="auth-buttons">
        <button @click="showLoginModal = true" class="auth-button login-btn">로그인</button>
        <button @click="showSignupModal = true" class="auth-button signup-btn">회원가입</button>
      </div>
      
      <div class="auth-info">
        <p>회원가입 시 1,000원 적립금이 지급됩니다!</p>
        <p>로그인 후 결제 페이지에서 적립금을 사용하실 수 있습니다.</p>
      </div>
    </div>

    <!-- 로그인 모달 -->
    <div v-if="showLoginModal" class="modal-overlay" @click="showLoginModal = false">
      <div class="modal" @click.stop>
        <h2>로그인</h2>
        <div class="form-group">
          <label>회원 ID</label>
          <input v-model="loginData.memberId" type="text" placeholder="회원 ID를 입력하세요" @keyup.enter="login">
        </div>
        <div class="modal-buttons">
          <button @click="login" class="modal-btn primary" :disabled="!loginData.memberId">로그인</button>
          <button @click="showLoginModal = false" class="modal-btn">취소</button>
        </div>
      </div>
    </div>

    <!-- 회원가입 모달 -->
    <div v-if="showSignupModal" class="modal-overlay" @click="showSignupModal = false">
      <div class="modal" @click.stop>
        <h2>회원가입</h2>
        <div class="form-group">
          <label>회원 ID *</label>
          <input v-model="signupData.memberId" type="text" placeholder="회원 ID를 입력하세요">
        </div>
        <div class="form-group">
          <label>이름 *</label>
          <input v-model="signupData.name" type="text" placeholder="이름을 입력하세요">
        </div>
        <div class="form-group">
          <label>이메일</label>
          <input v-model="signupData.email" type="email" placeholder="이메일을 입력하세요">
        </div>
        <div class="form-group">
          <label>연락처</label>
          <input v-model="signupData.phone" type="tel" placeholder="연락처를 입력하세요">
        </div>
        <div class="signup-info">
          <p>* 필수 입력 항목</p>
          <p>회원가입 완료 시 1,000원 적립금이 지급됩니다.</p>
        </div>
        <div class="modal-buttons">
          <button @click="signup" class="modal-btn primary" :disabled="!isSignupValid">회원가입</button>
          <button @click="showSignupModal = false" class="modal-btn">취소</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {navigateTo} from "#app";

const config = useRuntimeConfig()
const API_BASE_URL = config.public.apiBaseUrl

// 상태 관리
const showLoginModal = ref(false)
const showSignupModal = ref(false)

const loginData = ref({
  memberId: ''
})

const signupData = ref({
  memberId: '',
  name: '',
  email: '',
  phone: ''
})

// 계산된 속성
const isSignupValid = computed(() => {
  return signupData.value.memberId && signupData.value.name
})

// 메서드
const login = async () => {
  if (!loginData.value.memberId) {
    alert('회원 ID를 입력해주세요.')
    return
  }

  try {
    const response = await fetch(`${API_BASE_URL}/member/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        memberId: loginData.value.memberId
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      alert('로그인 실패: ' + errorText)
      return
    }

    // JSON 응답을 파싱
    const memberData = await response.json()

    // 로그인 정보 저장
    localStorage.setItem('currentMember', JSON.stringify(memberData))
    alert(`${memberData.name}님, 환영합니다! 결제 페이지로 이동합니다.`)
    // 결제 페이지로 이동
    await navigateTo('/paymentSheet')

  } catch (error) {
    console.error('로그인 오류:', error)
    alert('로그인 중 오류가 발생했습니다.')
  }
}

const signup = async () => {
  if (!isSignupValid.value) {
    alert('필수 정보를 모두 입력해주세요.')
    return
  }

  try {
    const response = await fetch(`${API_BASE_URL}/member/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(signupData.value)
    })

    if (!response.ok) {
      const errorText = await response.text()
      alert('회원가입 실패: ' + errorText)
      return
    }

    const result = await response.json()
    
    if (result.status === 'SUCCESS') {
      alert(result.message + '\n메인 페이지로 이동합니다.')
      showSignupModal.value = false
      
      // 입력 폼 초기화
      signupData.value = {
        memberId: '',
        name: '',
        email: '',
        phone: ''
      }
      
      // 페이지 새로고침하지 않고 상태만 업데이트
    } else {
      alert(result.message)
    }
  } catch (error) {
    console.error('회원가입 오류:', error)
    alert('회원가입 중 오류가 발생했습니다.')
  }
}

// 회원 존재 여부 확인 함수
const verifyMemberExists = async (memberId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/member/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        memberId: memberId
      })
    })

    if (!response.ok) {
      return false
    }

    // 서버가 MemberResponse 객체를 직접 반환하므로 JSON 파싱 후 id 존재 확인
    const memberData = await response.json()
    return memberData && memberData.id
  } catch (error) {
    console.error('회원 확인 오류:', error)
    return false
  }
}

// 초기화 - 이미 로그인되어 있으면 회원 존재 여부 확인 후 결제 페이지로 리다이렉트
onMounted(async () => {
  const savedMember = localStorage.getItem('currentMember')
  if (savedMember) {
    const member = JSON.parse(savedMember)
    
    // 실제로 해당 회원이 존재하는지 확인
    const memberExists = await verifyMemberExists(member.memberId)
    
    if (memberExists) {
      alert(`이미 로그인되어 있습니다. ${member.name}님, 결제 페이지로 이동합니다.`)
      await navigateTo('/paymentSheet')
    } else {
      // 회원이 존재하지 않으면 localStorage 정리
      localStorage.removeItem('currentMember')
      alert('로그인 정보가 유효하지 않습니다. 다시 로그인해주세요.')
    }
  }
})

useHead({
  title: '결제 시스템'
})
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.auth-card {
  background: white;
  border-radius: 16px;
  padding: 50px 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  max-width: 450px;
  width: 100%;
  text-align: center;
}

.auth-title {
  color: #333;
  margin-bottom: 10px;
  font-size: 28px;
  font-weight: bold;
}

.auth-subtitle {
  color: #666;
  margin-bottom: 40px;
  font-size: 16px;
}

.auth-buttons {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
}

.auth-button {
  padding: 15px 30px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-btn {
  background-color: #007bff;
  color: white;
}

.login-btn:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
}

.signup-btn {
  background-color: #28a745;
  color: white;
}

.signup-btn:hover {
  background-color: #1e7e34;
  transform: translateY(-2px);
}

.auth-info {
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.auth-info p {
  margin: 5px 0;
  color: #555;
  font-size: 14px;
}

/* 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 30px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal h2 {
  margin-top: 0;
  margin-bottom: 25px;
  text-align: center;
  color: #333;
  font-size: 22px;
}

.form-group {
  margin-bottom: 20px;
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
}

.signup-info {
  margin: 20px 0;
  padding: 15px;
  background-color: #e7f3ff;
  border-radius: 6px;
  text-align: left;
}

.signup-info p {
  margin: 5px 0;
  color: #0056b3;
  font-size: 13px;
}

.modal-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 25px;
}

.modal-btn {
  padding: 12px 25px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
  flex: 1;
}

.modal-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.modal-btn.primary {
  background-color: #007bff;
  color: white;
}

.modal-btn.primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.modal-btn:not(.primary) {
  background-color: #6c757d;
  color: white;
}

.modal-btn:not(.primary):hover {
  background-color: #545b62;
}
</style>