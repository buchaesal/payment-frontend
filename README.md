# 토스페이먼츠 결제 시스템

토스페이먼츠를 활용한 완전한 결제 시스템입니다.

## 프로젝트 구조

```
toss-payment-frontend/
├── pages/                    # Nuxt 3 프론트엔드
│   ├── index.vue            # 메인 결제 페이지
│   └── payment/
│       ├── processing.vue   # 결제 처리 중 (승인 요청)
│       ├── success.vue      # 결제 성공
│       └── fail.vue        # 결제 실패
├── toss-payment-api/        # Java API 백엔드
│   └── src/
│       └── SimplePaymentServer.java
└── layouts/
    └── default.vue          # 깔끔한 레이아웃
```

## 서버 실행 방법

### 1. Nuxt 3 프론트엔드 (포트 3000)
```bash
npm run dev
```

### 2. Java API 백엔드 (포트 8080)
```bash
cd toss-payment-api
javac src/SimplePaymentServer.java -d .
java SimplePaymentServer
```

## 인텔리제이에서 사용하기

### 백엔드 서버 실행
1. 인텔리제이에서 프로젝트 열기
2. Project 탭에서 `toss-payment-api` 모듈 확인
3. Run Configuration에서 `TossPaymentServer` 선택하여 실행
4. 또는 `SimplePaymentServer.java` 파일에서 우클릭 → Run

### 서버 껐다켰다 하기
- 인텔리제이 상단의 Run/Stop 버튼 사용
- 또는 단축키: Ctrl+F2 (정지), Shift+F10 (실행)

## 결제 플로우

1. **결제 시작**: `http://localhost:3000` → 결제하기 버튼 클릭
2. **토스페이먼츠 인증**: PG창에서 카드 정보 입력 (테스트 환경)
3. **인증 완료**: `/payment/processing` 페이지로 리다이렉트
4. **승인 요청**: Java API 서버(`localhost:8080`)로 승인 요청
5. **토스페이먼츠 승인**: Java 서버가 토스페이먼츠 API 호출
6. **결제 완료**: `/payment/success` 페이지에서 결과 확인

## API 엔드포인트

### Java 백엔드 (localhost:8080)
- `POST /api/payment/confirm` - 결제 승인
- `GET /api/payment/health` - 헬스체크

## 로그 확인
- **프론트엔드**: 브라우저 개발자도구 콘솔
- **백엔드**: 인텔리제이 Run 탭 또는 터미널

## 테스트 정보
- **토스페이먼츠 테스트 키** 사용 중
- **실제 결제 되지 않음**
- **테스트용 카드번호** 사용 가능