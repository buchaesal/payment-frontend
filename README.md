# Payment Frontend

토스페이먼츠와 이니시스를 지원하는 Nuxt 3 기반 결제 시스템 프론트엔드입니다.

## 📋 프로젝트 개요

Spring Boot API 서버와 연동되는 완전한 결제 시스템의 프론트엔드로, 현대적인 사용자 경험을 제공합니다.

### 주요 특징
- **멀티 PG 지원**: 토스페이먼츠, 이니시스 통합 UI
- **복합결제**: 카드결제 + 적립금결제 동시 처리
- **반응형 디자인**: 모바일/데스크톱 모두 지원
- **실시간 상태**: 결제 진행 상황 실시간 표시
- **회원 시스템**: 로그인/회원가입 및 적립금 관리
- **결제 내역**: 주문별 그룹핑된 결제 이력 조회

## 🏗️ 프로젝트 구조

```
payment-frontend/
├── pages/                      # Nuxt 3 페이지
│   ├── index.vue              # 로그인/회원가입 메인 페이지
│   ├── paymentSheet.vue       # 결제 시작 페이지
│   ├── payment/
│   │   ├── processing.vue     # 토스페이먼츠 결제 처리 중
│   │   ├── inicis/
│   │   │   └── processing.vue # 이니시스 결제 처리 중
│   │   ├── success.vue        # 결제 완료
│   │   ├── fail.vue           # 결제 실패
│   │   └── history.vue        # 결제 내역 (주문별 그룹핑)
│   ├── inicisClose.vue        # 이니시스 팝업 창 닫기용
│   └── test/
│       └── debounce-throttle.vue # 디바운스/스로틀 테스트 페이지
├── layouts/
│   └── default.vue            # 기본 레이아웃
├── components/                # 재사용 가능한 컴포넌트들
├── public/                    # 정적 파일들
└── nuxt.config.ts            # Nuxt 설정
```

### 핵심 기술 스택
- **Nuxt 3**: Vue 3 기반 SSR/SPA 프레임워크
- **Vue 3 Composition API**: 현대적인 반응형 데이터 관리
- **토스페이먼츠 SDK**: 결제 UI 및 인증 처리
- **이니시스 SDK**: 팝업 기반 결제 처리
- **LocalStorage**: 클라이언트 사이드 상태 관리

## 🚀 실행 방법

### 개발 서버 실행
```bash
# 의존성 설치
npm install

# 개발 서버 시작 (포트 3000)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 미리보기
npm run preview
```

### 코드 품질 관리
```bash
# ESLint 검사
npm run lint-eslint

# Prettier 포맷팅
npm run lint-prettier

# 전체 린팅 (ESLint + Prettier)
npm run lint
```

### 요구사항
- **Node.js 18+**
- **NPM 8+**
- **백엔드 API 서버** (`localhost:8080`) 필수

## 🌐 페이지 구조

### 주요 페이지 플로우
1. **메인 페이지** (`/`) - 로그인/회원가입
2. **결제 페이지** (`/paymentSheet`) - 결제수단 선택 및 시작
3. **결제 처리** (`/payment/processing`, `/payment/inicis/processing`) - PG 인증 및 승인
4. **결제 완료** (`/payment/success`) - 결제 결과 확인
5. **결제 내역** (`/payment/history`) - 주문별 그룹핑된 이력

### 특별 페이지
- **테스트 페이지** (`/test/debounce-throttle`) - 디바운스/스로틀 중복호출 테스트
- **이니시스 종료** (`/inicisClose`) - 이니시스 팝업창 닫기 처리

## 💳 결제 플로우

### 토스페이먼츠 결제
1. **결제 시작** → 토스페이먼츠 SDK 호출
2. **PG 인증** → 사용자가 카드 정보 입력 (팝업/리다이렉트)
3. **인증 완료** → `/payment/processing`로 리다이렉트
4. **승인 요청** → 백엔드 API로 승인 요청
5. **결과 처리** → 성공/실패 페이지로 이동

### 이니시스 결제
1. **결제 시작** → 이니시스 팝업창 호출
2. **PG 인증** → 팝업에서 카드 정보 입력
3. **인증 완료** → `/payment/inicis/processing`로 데이터 전달
4. **승인 요청** → 백엔드 이니시스 API로 승인 요청
5. **팝업 종료** → 메인 창에서 결과 처리

### 복합결제 (카드 + 적립금)
1. **결제수단 선택** → 카드금액 + 적립금금액 입력
2. **각각 처리** → 카드결제와 적립금결제 순차 실행
3. **통합 관리** → 동일한 주문번호로 결제 내역 그룹핑

## 🔗 API 연동

### 백엔드 연동 설정
```javascript
const API_BASE_URL = 'http://localhost:8080/api'

// 주요 API 호출들
- POST ${API_BASE_URL}/payment/confirm     // 결제 승인
- POST ${API_BASE_URL}/payment/cancel/:id  // 결제 취소
- GET  ${API_BASE_URL}/payment/history/:memberId // 결제 내역
- POST ${API_BASE_URL}/member/login        // 로그인
- POST ${API_BASE_URL}/member/signup       // 회원가입
```

### CORS 설정
백엔드에서 모든 Origin을 허용하도록 설정되어 있어 별도 프록시 설정 불필요합니다.

## 🎨 UI/UX 특징

### 반응형 디자인
- **모바일 퍼스트**: 작은 화면부터 설계
- **그리드 시스템**: CSS Grid와 Flexbox 활용
- **브레이크포인트**: 768px 기준 모바일/데스크톱 대응

### 사용자 경험
- **실시간 피드백**: 결제 진행 상황 실시간 표시
- **에러 처리**: 친화적인 에러 메시지 및 복구 가이드
- **로딩 상태**: 명확한 로딩 인디케이터
- **상태 관리**: LocalStorage 기반 세션 관리

## 🧪 테스트 기능

### 디바운스/스로틀 테스트 (`/test/debounce-throttle`)
- **중복호출 방지**: useDebounce vs useThrottle 비교
- **Race Condition**: 동시 API 호출 시나리오 테스트
- **자동 테스트**: 정확한 타이밍의 공격 시나리오 재현
- **실시간 로깅**: 각 단계별 상세 로그 확인

### 테스트 시나리오
- **일반 디바운스**: 300ms 지연으로 중복 방지
- **실제 중복호출**: 디바운스 우회하여 Race Condition 재현
- **타이밍 어택**: 정확한 타이밍으로 디바운스 약점 공격
- **안전성 비교**: Throttle과 Debounce 보안성 비교

## 🔒 보안 고려사항

### 클라이언트 사이드 보안
- **중복 결제 방지**: 디바운스와 API 플래그 이중 방어
- **상태 검증**: 결제 단계별 유효성 검사
- **세션 관리**: 로그인 상태 검증 및 자동 갱신

### PG 연동 보안
- **테스트 키 사용**: 실제 결제 발생하지 않음
- **서버 검증**: 클라이언트 결과를 서버에서 재검증
- **트랜잭션 무결성**: 실패 시 자동 롤백

## 🔗 관련 프로젝트

이 프론트엔드는 **payment-api** (Spring Boot)와 함께 동작합니다.
- **Backend Repository**: `../payment-api`
- **Backend URL**: `http://localhost:8080`
- **API Documentation**: Backend README 참조

## 📝 개발 가이드

### 새로운 PG사 추가
1. PG사별 결제 페이지 생성 (`pages/payment/[pg-name]/`)
2. SDK 연동 로직 구현
3. 백엔드 API 엔드포인트 연동
4. 에러 처리 및 상태 관리 추가

### 컴포넌트 개발
- **Composition API 사용**: `<script setup>` 구조 권장
- **반응형 데이터**: `ref`, `reactive` 적극 활용
- **타입 안정성**: TypeScript 점진적 도입 고려

### 스타일링 가이드
- **Scoped CSS**: 컴포넌트별 스타일 격리
- **CSS 변수**: 일관된 색상/간격 시스템
- **모바일 우선**: min-width 미디어쿼리 사용