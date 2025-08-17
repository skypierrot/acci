# 중앙 로그인 시스템 연동 테스트 가이드

## 🔐 연동 완료 상태

### ✅ 구현된 기능

1. **백엔드 연동**
   - 중앙 로그인 시스템 API 클라이언트 (`backend/services/auth.service.ts`)
   - 인증 미들웨어 수정 (`backend/middleware/auth.middleware.ts`)
   - 새로운 인증 컨트롤러 (`backend/controllers/auth_pro.controller.ts`)
   - 인증 라우트 추가 (`backend/routes.ts`)

2. **프론트엔드 연동**
   - 중앙 로그인 시스템 서비스 (`frontend/services/auth-pro.service.ts`)
   - 인증 훅 (`frontend/hooks/useAuthPro.ts`)
   - 인증 가드 컴포넌트 (`frontend/components/AuthGuard.tsx`)
   - 로그인 페이지 수정 (`frontend/app/auth/page.tsx`)
   - 레이아웃에 인증 기능 통합 (`frontend/components/ClientLayout.tsx`)

3. **환경 설정**
   - 환경 변수 추가 (`.env`)
   - 의존성 추가 (`backend/package.json`)

## 🚀 테스트 방법

### 1. 중앙 로그인 시스템 실행

```bash
# 중앙 로그인 시스템 디렉토리로 이동
cd /Users/irug/Documents/develop/auth_pro

# Docker 컨테이너 실행
docker-compose up -d

# 상태 확인
docker-compose ps
```

### 2. 현재 프로젝트 실행

```bash
# 프로젝트 루트로 이동
cd /Users/irug/Documents/develop/acci_kpi

# Docker 컨테이너 실행
docker-compose up -d

# 상태 확인
docker-compose ps
```

### 3. 서비스 접속 확인

- **중앙 로그인 시스템**: http://localhost:47291
- **현재 프로젝트**: http://localhost:4001
- **현재 프로젝트 API**: http://localhost:6002

### 4. 로그인 테스트

1. **브라우저에서 접속**: http://localhost:4001
2. **자동으로 로그인 페이지로 리다이렉트됨**: http://localhost:4001/auth
3. **중앙 로그인 시스템 계정으로 로그인**
4. **MFA가 활성화된 경우 추가 인증**
5. **로그인 성공 시 대시보드로 이동**

## 🔧 API 엔드포인트

### 새로운 인증 API

- `POST /api/auth-pro/login` - 중앙 시스템 로그인
- `POST /api/auth-pro/mfa` - MFA 인증
- `POST /api/auth-pro/refresh` - 토큰 갱신
- `POST /api/auth-pro/logout` - 로그아웃
- `GET /api/auth-pro/user` - 사용자 정보 조회
- `POST /api/auth-pro/verify` - 토큰 검증

### 기존 인증 API (유지)

- `POST /api/auth/login` - 기존 로그인
- `GET /api/auth/me` - 사용자 정보 조회
- `POST /api/auth/logout` - 기존 로그아웃

## 🛡️ 보안 기능

1. **토큰 자동 갱신**: 5분마다 자동으로 토큰 갱신
2. **MFA 지원**: 2단계 인증 지원
3. **세션 관리**: 로컬 스토리지 기반 토큰 관리
4. **인증 가드**: 인증이 필요한 페이지 자동 보호

## 🔍 문제 해결

### 1. 중앙 로그인 시스템 연결 실패

```bash
# 중앙 시스템 상태 확인
curl http://localhost:47291/api/health

# 네트워크 연결 확인
docker network ls
docker network inspect auth_pro_default
```

### 2. CORS 오류

```bash
# 백엔드 CORS 설정 확인
# backend/index.ts에서 CORS 설정 확인
```

### 3. 토큰 검증 실패

```bash
# 백엔드 로그 확인
docker-compose logs backend

# 프론트엔드 개발자 도구에서 네트워크 탭 확인
```

## 📝 환경 변수 설정

### 필수 환경 변수

```bash
# 중앙 로그인 시스템 API URL
AUTH_PRO_API_URL=http://localhost:47291

# 중앙 로그인 시스템 프론트엔드 URL
AUTH_PRO_FRONTEND_URL=http://localhost:56384

# JWT 시크릿 키
JWT_SECRET=your-secret-key
```

## 🎯 다음 단계

1. **실제 테스트**: 중앙 로그인 시스템과 연동 테스트
2. **에러 처리 개선**: 더 상세한 에러 메시지 및 처리
3. **성능 최적화**: 토큰 캐싱 및 요청 최적화
4. **보안 강화**: HTTPS 설정 및 추가 보안 기능
5. **모니터링**: 로그 및 성능 모니터링 추가

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. **Docker 컨테이너 상태**: `docker-compose ps`
2. **로그 확인**: `docker-compose logs [service-name]`
3. **네트워크 연결**: `docker network inspect`
4. **환경 변수**: `.env` 파일 설정 확인 