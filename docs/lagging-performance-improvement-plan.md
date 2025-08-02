# Lagging 페이지 성능 개선 계획

## 📋 개요
- **브랜치**: `refactor/lagging-performance-improvement`
- **목표**: lagging 페이지 로딩 성능 60-70% 개선 (10-15초 → 3-5초)
- **원칙**: 기능 손실 0%, UI 동일성 유지, 단계별 검증, 백업 시스템 구축

## 🎯 핵심 원칙

### 1. 기능 보존 원칙
- ✅ **기능 손실 0%**: 기존 기능이 1도 손실되지 않아야 함
- ✅ **UI 동일성**: 화면 UI가 현재와 동일하게 유지되어야 함
- ✅ **데이터 정확성**: 모든 지표 계산 결과가 기존과 동일해야 함
- ✅ **백업 시스템**: 개선 전 파일을 백업하여 비교 검증

### 2. 검증 프로세스
- ✅ **1:1 비교**: 개선 완료 후 원본과 개선본 비교
- ✅ **기능 테스트**: 각 단계별 기능 동작 확인
- ✅ **성능 측정**: 로딩 시간, API 호출 횟수 측정
- ✅ **데이터 검증**: 지표 계산 결과 정확성 확인

## 📊 현재 성능 문제점 분석

### 1. API 호출 중복 문제
- `getAllByYear` API가 각 지표별로 중복 호출됨 (6-8회)
- 조사보고서 존재 여부 확인을 위한 개별 API 호출이 많음 (사고당 1-2회)
- 연도별 데이터 수집 시 순차적 처리로 인한 지연

### 2. 데이터 처리 비효율성
- 프론트엔드에서 복잡한 계산 로직 처리
- 각 사고별로 개별적으로 재해자/물적피해 정보 조회
- 그래프 데이터 수집 시 모든 연도에 대해 반복 계산

### 3. 상태 관리 복잡성
- 20개 이상의 개별 상태 변수
- 캐시 시스템이 여러 곳에 분산되어 있음
- 불필요한 리렌더링 발생

## 🚀 개선 전략

### Phase 1: 백엔드 API 최적화 (우선순위: 높음)
**목표**: API 호출 횟수 80-85% 감소, 응답 시간 단축

#### 1.1 통합 API 엔드포인트 생성
- [ ] `/api/lagging/summary/:year` - 모든 지표를 한 번에 계산
- [ ] `/api/lagging/chart-data` - 그래프용 데이터 배치 처리
- [ ] `/api/lagging/investigation-batch` - 조사보고서 배치 조회

#### 1.2 데이터베이스 쿼리 최적화
- [ ] JOIN을 활용한 단일 쿼리로 변경
- [ ] 인덱스 최적화
- [ ] 쿼리 결과 캐싱

### Phase 2: 프론트엔드 구조 개선 (우선순위: 높음)
**목표**: 상태 관리 단순화, 컴포넌트 최적화

#### 2.1 상태 관리 단순화
- [ ] 개별 상태를 통합 객체로 병합
- [ ] React Query 또는 SWR 도입 검토
- [ ] 불필요한 상태 제거

#### 2.2 컴포넌트 최적화
- [ ] 큰 컴포넌트를 작은 단위로 분리
- [ ] React.memo, useMemo, useCallback 적용
- [ ] 지연 로딩(Lazy Loading) 구현

### Phase 3: 캐싱 시스템 개선 (우선순위: 중간)
**목표**: 캐시 효율성 향상, 메모리 사용량 최적화

#### 3.1 통합 캐시 시스템
- [ ] Redis 또는 메모리 캐시 도입
- [ ] 캐시 무효화 전략 수립
- [ ] 캐시 히트율 모니터링

### Phase 4: 그래프 렌더링 최적화 (우선순위: 중간)
**목표**: 차트 렌더링 성능 향상

#### 4.1 차트 라이브러리 최적화
- [ ] 차트 데이터 전처리 최적화
- [ ] 가상화(Virtualization) 적용
- [ ] 점진적 로딩 구현

## 🔄 백업 및 검증 시스템

### 백업 프로세스
1. **개선 전 백업**
   ```bash
   # 백업 디렉토리 생성
   mkdir -p temp/backup/lagging-improvement/$(date +%Y%m%d_%H%M%S)
   
   # 개선 대상 파일 백업
   cp frontend/app/lagging/page.tsx temp/backup/lagging-improvement/$(date +%Y%m%d_%H%M%S)/
   cp backend/controllers/occurrence.controller.ts temp/backup/lagging-improvement/$(date +%Y%m%d_%H%M%S)/
   cp backend/services/occurrence.service.ts temp/backup/lagging-improvement/$(date +%Y%m%d_%H%M%S)/
   ```

2. **백업 파일 관리**
   - 백업 파일명: `[원본파일명]_backup_[날짜시간].tsx`
   - 백업 위치: `temp/backup/lagging-improvement/[날짜시간]/`
   - 백업 메타데이터: `backup_metadata.json`

### 검증 프로세스
1. **기능 비교 검증**
   ```bash
   # 파일 비교
   diff [원본파일] [개선파일]
   
   # 기능 테스트
   npm run test
   npm run build
   ```

2. **UI 검증**
   - 스크린샷 비교
   - CSS 클래스 일치성 확인
   - 반응형 레이아웃 검증

3. **성능 검증**
   - 로딩 시간 측정
   - API 호출 횟수 확인
   - 메모리 사용량 확인

4. **데이터 정확성 검증**
   - 지표 계산 결과 비교
   - 그래프 데이터 정확성 확인
   - 캐시 동작 확인

## 📝 단계별 진행 체크리스트

### Phase 1: 백엔드 API 최적화

#### 1.1 통합 API 엔드포인트 생성
- [ ] `backend/controllers/lagging.controller.ts` 생성
- [ ] `backend/services/lagging.service.ts` 생성
- [ ] `/api/lagging/summary/:year` 엔드포인트 구현
- [ ] `/api/lagging/chart-data` 엔드포인트 구현
- [ ] `/api/lagging/investigation-batch` 엔드포인트 구현
- [ ] 백업: `temp/backup/lagging-improvement/[날짜]/backend_controllers_backup.ts`

#### 1.2 데이터베이스 쿼리 최적화
- [ ] JOIN 쿼리로 변경
- [ ] 인덱스 추가
- [ ] 쿼리 성능 측정
- [ ] 검증: API 응답 시간 50% 이상 단축 확인

### Phase 2: 프론트엔드 구조 개선

#### 2.1 상태 관리 단순화
- [ ] 통합 상태 객체 생성
- [ ] 개별 상태 변수 제거
- [ ] React Query 도입
- [ ] 검증: 상태 관리 코드 60% 이상 감소

#### 2.2 컴포넌트 분리
- [ ] LaggingPage 컴포넌트 분리
- [ ] 각 카드 컴포넌트 분리
- [ ] 차트 컴포넌트 분리
- [ ] 검증: 컴포넌트 재사용성 향상

### Phase 3: 캐싱 시스템 개선

#### 3.1 통합 캐시 시스템
- [ ] 캐시 시스템 통합
- [ ] 캐시 무효화 전략 구현
- [ ] 캐시 히트율 모니터링
- [ ] 검증: 캐시 효율성 80% 이상 향상

### Phase 4: 그래프 렌더링 최적화

#### 4.1 차트 라이브러리 최적화
- [ ] 차트 데이터 전처리 최적화
- [ ] 가상화 적용
- [ ] 점진적 로딩 구현
- [ ] 검증: 차트 렌더링 시간 50% 이상 단축

## 🚀 실행 가이드

### 1. 환경 준비
```bash
# 현재 브랜치 확인
git branch

# 백업 디렉토리 생성
mkdir -p temp/backup/lagging-improvement

# 도커 컨테이너 상태 확인
docker-compose ps
```

### 2. 단계별 실행
```bash
# Phase 1 실행
./scripts/phase1-lagging-backend-optimization.sh

# Phase 2 실행
./scripts/phase2-lagging-frontend-refactor.sh

# Phase 3 실행
./scripts/phase3-lagging-cache-improvement.sh

# Phase 4 실행
./scripts/phase4-lagging-chart-optimization.sh
```

### 3. 검증 실행
```bash
# 전체 검증
./scripts/verify-lagging-improvement.sh

# 기능 테스트
npm run test

# 빌드 테스트
npm run build

# 성능 테스트
npm run test:performance
```

## 📊 성공 지표

### 기능 보존 지표
- [ ] 모든 기존 기능 정상 동작
- [ ] UI 레이아웃 100% 일치
- [ ] 사용자 플로우 동일성 유지
- [ ] API 응답 처리 정상
- [ ] 지표 계산 결과 정확성 100%

### 성능 개선 지표
- [ ] 초기 로딩 시간 60-70% 단축 (10-15초 → 3-5초)
- [ ] API 호출 횟수 80-85% 감소 (20-30회 → 3-5회)
- [ ] 메모리 사용량 40-50% 최적화
- [ ] 번들 크기 40% 감소 (500KB+ → 300KB)

### 코드 품질 지표
- [ ] TypeScript 에러 0개
- [ ] ESLint 경고 80% 이상 감소
- [ ] 테스트 커버리지 80% 이상
- [ ] 코드 중복률 30% 이상 감소

## 🔍 롤백 계획

### 롤백 트리거 조건
- 기능 손실 발견
- UI 불일치 발견
- 성능 저하 발생
- 데이터 정확성 문제 발견
- 테스트 실패

### 롤백 프로세스
```bash
# 백업 파일 복원
cp temp/backup/lagging-improvement/[날짜시간]/[파일명] [원본위치]

# 브랜치 리셋
git reset --hard HEAD~1

# 도커 컨테이너 재시작
docker-compose restart frontend backend
```

## 📅 일정 계획

| Phase | 예상 소요 시간 | 시작일 | 완료일 | 상태 |
|-------|---------------|--------|--------|------|
| Phase 1 | 2-3일 | - | - | ⏳ 대기 |
| Phase 2 | 3-4일 | - | - | ⏳ 대기 |
| Phase 3 | 2-3일 | - | - | ⏳ 대기 |
| Phase 4 | 2-3일 | - | - | ⏳ 대기 |

**총 소요 시간**: 9-13일
**완료율**: 0%

## 📞 담당자 및 리뷰어

- **담당자**: AI Assistant
- **리뷰어**: 사용자
- **검증자**: 사용자
- **승인자**: 사용자

## 🎯 검증 체크리스트

### 기능 검증
- [ ] 연도 선택 기능 정상 동작
- [ ] 모든 지표 카드 정상 표시
- [ ] 그래프 차트 정상 렌더링
- [ ] 새로고침 버튼 정상 동작
- [ ] 차트 타입 변경 정상 동작

### 데이터 정확성 검증
- [ ] 사고 건수 계산 정확성
- [ ] 재해자 수 계산 정확성
- [ ] 물적피해금액 계산 정확성
- [ ] LTIR 계산 정확성
- [ ] TRIR 계산 정확성
- [ ] 강도율 계산 정확성

### 성능 검증
- [ ] 초기 로딩 시간 측정
- [ ] API 호출 횟수 확인
- [ ] 메모리 사용량 확인
- [ ] 캐시 효율성 확인

### UI 검증
- [ ] 레이아웃 일치성 확인
- [ ] 반응형 디자인 확인
- [ ] 스타일 일치성 확인
- [ ] 애니메이션 동작 확인

---

**마지막 업데이트**: 2025-01-27
**버전**: 1.0.0
**상태**: 계획 수립 완료 ✅ 