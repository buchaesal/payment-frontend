# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

이 프로젝트는 토스페이먼츠와 이니시스를 지원하는 완전한 결제 시스템입니다. 두 개의 메인 컴포넌트로 구성되어 있습니다:

1. **payment-frontend**: Nuxt 3 기반 프론트엔드 (포트 3000)
2. **payment-api**: Spring Boot 기반 백엔드 API (포트 8080)

## Development Commands

### Frontend (Nuxt 3)
```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 코드 린팅 (모든 파일)
npm run lint
npm run lint-eslint
npm run lint-prettier

# 프로덕션 미리보기
npm run preview
```

### Backend (Spring Boot)
```bash
# API 서버로 이동
cd ../payment-api

# 개발 서버 실행 (Java 21 필요)
mvn spring-boot:run

# 클린 컴파일 후 실행
mvn clean compile spring-boot:run

# 테스트 실행
mvn test

# 패키징
mvn package
```

## Architecture Overview

### Backend Architecture (Spring Boot + JPA)

**패키지 구조**:
- `controller/`: REST API 엔드포인트 (Payment, Member, Inicis)
- `service/`: 비즈니스 로직 처리
- `entity/`: JPA 엔티티 (Payment, Member, PointHistory)
- `repository/`: 데이터 액세스 레이어
- `dto/`: 데이터 전송 객체
- `strategy/`: 결제 전략 패턴 구현 (카드결제/적립금결제)
- `factory/`: 결제 전략 팩토리
- `client/`: 외부 API 클라이언트 (토스페이먼츠, 이니시스)
- `config/`: 설정 클래스
- `enums/`: 열거형 상수 (PaymentMethod, PaymentType 등)

**핵심 아키텍처 패턴**:
- **Strategy Pattern**: `PaymentStrategy` 인터페이스를 통한 다양한 결제수단 지원
  - `CardPaymentStrategy`: 토스페이먼츠/이니시스 카드 결제
  - `PointsPaymentStrategy`: 적립금 결제 (사용/환불 로직)
- **Factory Pattern**: `PaymentStrategyFactory`를 통한 전략 객체 생성
- **Repository Pattern**: Spring Data JPA 리포지토리 패턴
- **Client Pattern**: 외부 PG사 API 통신을 위한 전용 클라이언트

**데이터베이스 관계**:
- `Member` ↔ `Payment` (1:N)
- `Member` ↔ `PointHistory` (1:N)  
- `Payment.member_id`는 `Members.id`를 참조하는 외래키

**중요한 데이터베이스 설계**:
- `PAYMENTS` 테이블에 `PAY_TYPE` 컬럼 (APPROVE/CANCEL 구분)
- `PAYMENTS` 테이블에 `PG_PROVIDER` 컬럼 (토스페이먼츠/이니시스 구분)
- `POINT_HISTORIES` 테이블의 `point_type`은 VARCHAR (EARN/USE/REFUND)
- 주문번호(`order_id`) 기반으로 복합결제 추적 가능

### Frontend Architecture (Nuxt 3 + Vue 3)

**페이지 구조**:
- `/`: 메인 페이지
- `/paymentSheet`: 결제 시작 페이지
- `/payment/processing`: 토스페이먼츠 결제 처리 중
- `/payment/inicis/processing`: 이니시스 결제 처리 중
- `/payment/success`: 결제 완료
- `/payment/fail`: 결제 실패
- `/payment/history`: 결제 내역 (주문별 그룹핑)
- `/inicisClose`: 이니시스 팝업 창 닫기용

**핵심 기능**:
- Vue 3 Composition API 사용
- Nuxt 3 기반 SSR/SPA
- 반응형 데이터 바인딩
- 로컬스토리지 활용한 상태 관리
- 토스페이먼츠 및 이니시스 SDK 통합
- 주문별 결제내역 그룹핑 UI

## Key API Endpoints

### Payment APIs
- `POST /api/payment/confirm`: 결제 승인 (복합결제 지원)
- `POST /api/payment/cancel/{paymentId}`: 개별 결제 취소 (ID 기반)
- `GET /api/payment/history/{memberId}`: 회원별 결제내역 조회 (그룹핑된 데이터)
- `GET /api/payment/health`: 헬스체크

### Member APIs
- `POST /api/member/signup`: 회원가입
- `POST /api/member/login`: 로그인
- `GET /api/member/{memberId}/points`: 적립금 조회

### Inicis APIs
- `POST /api/inicis/confirm`: 이니시스 결제 승인

## Payment Flow Architecture

1. **결제 시작**: 사용자가 결제하기 버튼 클릭 (/paymentSheet)
2. **결제 수단 선택**: 카드결제 또는 적립금결제 (복합결제 가능)
3. **외부 PG 연동**: 토스페이먼츠 또는 이니시스 SDK 호출
4. **PG 인증**: 사용자가 PG창에서 인증 완료
5. **결제 승인**: 백엔드 API를 통한 PG사 승인 요청
6. **전략 패턴 실행**: PaymentStrategy를 통한 결제수단별 처리
7. **데이터 저장**: Payment(APPROVE), PointHistory 엔티티에 결과 저장
8. **결과 반환**: 프론트엔드로 결제 결과 전달 (/payment/success)

## Payment Cancellation Flow

1. **취소 요청**: 결제내역에서 개별 결제 취소 버튼 클릭
2. **결제 ID 기반**: 특정 Payment 레코드의 ID로 취소 처리
3. **전략별 취소**: 카드결제는 PG사 API 호출, 적립금결제는 포인트 환원
4. **취소 기록**: Payment(CANCEL) 레코드 생성, PointHistory(REFUND) 추가
5. **UI 업데이트**: "취소됨" 상태로 버튼 변경

## Database Schema

### 핵심 테이블
- `MEMBERS`: 회원 정보 (id, member_id, name, email, points)
- `PAYMENTS`: 결제 내역 (pay_type, pg_provider, member_id FK)
- `POINT_HISTORIES`: 적립금 이력 (point_type VARCHAR: EARN/USE/REFUND)

## Development Workflow

1. **백엔드 먼저 실행**: Spring Boot API 서버 시작
2. **프론트엔드 실행**: Nuxt 개발 서버 시작
3. **CORS 설정**: PaymentController에 `@CrossOrigin(origins = "*")` 적용됨
4. **H2 Database**: 개발용 인메모리 DB 사용
5. **테스트 환경**: 토스페이먼츠 테스트 키 사용으로 실제 결제 없음

## Important Implementation Notes

- **복합결제 지원**: 한 주문에서 카드+적립금 동시 결제 가능
- **개별 취소 시스템**: Payment ID 기반으로 결제수단별 개별 취소
- **전략 패턴**: 새로운 결제수단 추가시 PaymentStrategy 구현체만 추가
- **트랜잭션 관리**: @Transactional을 통한 데이터 일관성 보장
- **Entity 관계**: String memberId 대신 Member 엔티티 참조 사용
- **에러 처리**: 결제 실패시 자동 롤백 처리
- **로깅**: SLF4J를 통한 상세한 결제 과정 로깅
- **ENUM vs VARCHAR**: H2 database 호환성을 위해 point_type을 VARCHAR로 저장
- **PG창 처리**: 이니시스 팝업창 닫기 감지 및 처리

## Frontend-Backend Architecture Principles

- **비즈니스 로직은 백엔드**: 결제내역 그룹핑, 병합 로직은 서비스 레이어에서 처리
- **프론트엔드는 UI 로직만**: 백엔드에서 가공된 데이터를 단순히 표시
- **API 설계**: RESTful 하지만 비즈니스 요구사항에 맞게 데이터 전처리하여 응답

## Testing

- 토스페이먼츠 테스트 환경 사용 (실제 결제 없음)
- 이니시스 테스트 환경 지원
- H2 인메모리 데이터베이스로 데이터 검증
- Java 21 기반 개발환경