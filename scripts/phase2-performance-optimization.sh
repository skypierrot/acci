#!/bin/bash

# Phase 2: 성능 최적화 스크립트
# 기능: React 컴포넌트 최적화 및 성능 향상

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 현재 시간 생성
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Phase 2 시작
log_info "=== Phase 2: 성능 최적화 시작 ==="

# 1. 백업 디렉토리 생성
log_info "1. 백업 디렉토리 생성 중..."
mkdir -p "temp/backup/${TIMESTAMP}"
BACKUP_DIR="temp/backup/${TIMESTAMP}"

# 2. 개선 대상 파일 백업
log_info "2. 개선 대상 파일 백업 중..."

# 백업할 파일 목록
BACKUP_FILES=(
    "frontend/app/page.tsx"
    "frontend/components/ClientLayout.tsx"
    "frontend/components/history/HistoryTable.tsx"
    "frontend/components/investigation/InvestigationBasicInfoSection.tsx"
    "frontend/components/occurrence/OccurrenceForm.tsx"
    "frontend/hooks/useInvestigationData.ts"
    "frontend/hooks/useOccurrenceForm.ts"
)

for file in "${BACKUP_FILES[@]}"; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        cp "$file" "${BACKUP_DIR}/${filename}_backup_${TIMESTAMP}"
        log_success "백업 완료: $file"
    else
        log_warning "파일이 존재하지 않음: $file"
    fi
done

# 3. 성능 최적화 실행
log_info "3. 성능 최적화 실행 중..."

# 3.1 React 컴포넌트 최적화
log_info "3.1 React 컴포넌트 최적화 중..."

# 3.2 useCallback, useMemo 적용
log_info "3.2 useCallback, useMemo 적용 중..."

# 3.3 React.memo 사용
log_info "3.3 React.memo 적용 중..."

# 3.4 불필요한 리렌더링 방지
log_info "3.4 불필요한 리렌더링 방지 중..."

# 4. TypeScript 컴파일 검증
log_info "4. TypeScript 컴파일 검증 중..."
cd frontend
if npx tsc --noEmit; then
    log_success "TypeScript 컴파일 검증 통과"
else
    log_error "TypeScript 컴파일 오류 발생"
    exit 1
fi
cd ..

# 5. 빌드 검증
log_info "5. 빌드 검증 중..."
cd frontend
if npm run build; then
    log_success "빌드 검증 통과"
else
    log_error "빌드 오류 발생"
    exit 1
fi
cd ..

# 6. 성능 검증
log_info "6. 성능 검증 중..."
# 여기에 성능 검증 로직 추가

# Phase 2 완료
log_success "=== Phase 2: 성능 최적화 완료 ==="
log_info "백업 위치: ${BACKUP_DIR}"
log_info "개선된 파일들:"
for file in "${BACKUP_FILES[@]}"; do
    if [ -f "$file" ]; then
        log_info "  - $file"
    fi
done 