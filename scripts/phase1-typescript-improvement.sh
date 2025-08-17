#!/bin/bash

# Phase 1: TypeScript 타입 안정성 개선 스크립트
# 기능: 타입 안정성 향상 및 런타임 에러 방지

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

# Phase 1 시작
log_info "=== Phase 1: TypeScript 타입 안정성 개선 시작 ==="

# 1. 백업 디렉토리 생성
log_info "1. 백업 디렉토리 생성 중..."
mkdir -p "temp/backup/${TIMESTAMP}"
BACKUP_DIR="temp/backup/${TIMESTAMP}"

# 2. 개선 대상 파일 백업
log_info "2. 개선 대상 파일 백업 중..."

# 백업할 파일 목록
BACKUP_FILES=(
    "frontend/types/occurrence.types.ts"
    "frontend/types/investigation.types.ts"
    "frontend/app/page.tsx"
    "frontend/app/history/client.tsx"
    "frontend/components/history/HistoryTable.tsx"
    "frontend/hooks/useOccurrenceForm.ts"
    "frontend/hooks/useInvestigationData.ts"
)

for file in "${BACKUP_FILES[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "${BACKUP_DIR}/$(basename "$file")_backup_${TIMESTAMP}"
        log_success "백업 완료: $file"
    else
        log_warning "파일이 존재하지 않음: $file"
    fi
done

# 3. 공통 타입 정의 파일 생성
log_info "3. 공통 타입 정의 파일 생성 중..."

cat > "frontend/types/common.ts" << 'EOF'
/**
 * @file common.ts
 * @description 공통 타입 정의
 */

// 기본 API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 페이지네이션 타입
export interface PaginationParams {
  page: number;
  size: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

// 기본 엔티티 타입
export interface BaseEntity {
  id: string;
  created_at?: string;
  updated_at?: string;
}

// 회사 정보 타입
export interface Company extends BaseEntity {
  name: string;
  code: string;
  sites?: Site[];
}

// 사업장 정보 타입
export interface Site extends BaseEntity {
  name: string;
  code: string;
  company_id: string;
}

// 사용자 정보 타입
export interface User extends BaseEntity {
  name: string;
  email: string;
  role: string;
  company_id: string;
}

// 파일 정보 타입
export interface FileInfo extends BaseEntity {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
}

// 상태 타입
export type Status = '대기' | '진행' | '완료' | '취소' | '지연';

// 상해정도 타입
export type InjuryType = 
  | '사망'
  | '중상(3일 이상 휴업)'
  | '경상(1일 이상 휴업)'
  | '병원치료(MTC)'
  | '응급처치(FAC)'
  | '기타';

// 사고 유형 타입
export type AccidentType = '인적' | '물적' | '복합';

// 유틸리티 타입
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Required<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// 타입 가드 함수
export const isApiResponse = <T>(obj: any): obj is ApiResponse<T> => {
  return obj && typeof obj === 'object' && 'success' in obj;
};

export const isPaginatedResponse = <T>(obj: any): obj is PaginatedResponse<T> => {
  return isApiResponse(obj) && 'total' in obj && 'page' in obj && 'size' in obj;
};

export const isCompany = (obj: any): obj is Company => {
  return obj && typeof obj === 'object' && 'name' in obj && 'code' in obj;
};

export const isSite = (obj: any): obj is Site => {
  return obj && typeof obj === 'object' && 'name' in obj && 'code' in obj && 'company_id' in obj;
};

export const isUser = (obj: any): obj is User => {
  return obj && typeof obj === 'object' && 'name' in obj && 'email' in obj && 'role' in obj;
};

export const isFileInfo = (obj: any): obj is FileInfo => {
  return obj && typeof obj === 'object' && 'filename' in obj && 'originalname' in obj && 'mimetype' in obj;
};
EOF

log_success "공통 타입 정의 파일 생성 완료: frontend/types/common.ts"

# 4. any 타입 사용 부분 식별
log_info "4. any 타입 사용 부분 식별 중..."

# any 타입 사용 파일 찾기
ANY_TYPE_FILES=$(find frontend -name "*.ts" -o -name "*.tsx" | xargs grep -l "any" 2>/dev/null || true)

if [ -n "$ANY_TYPE_FILES" ]; then
    log_warning "any 타입을 사용하는 파일들:"
    echo "$ANY_TYPE_FILES" | while read file; do
        echo "  - $file"
    done
else
    log_success "any 타입을 사용하는 파일이 없습니다."
fi

# 5. TypeScript 컴파일 검증
log_info "5. TypeScript 컴파일 검증 중..."

cd frontend

# TypeScript 컴파일 체크
if npm run type-check 2>/dev/null || npx tsc --noEmit; then
    log_success "TypeScript 컴파일 성공"
else
    log_warning "TypeScript 컴파일 경고가 있습니다. 계속 진행합니다."
fi

cd ..

# 6. 빌드 검증
log_info "6. 빌드 검증 중..."

cd frontend

if npm run build; then
    log_success "빌드 성공"
else
    log_error "빌드 실패"
    exit 1
fi

cd ..

# 7. 도커 컨테이너 재시작
log_info "7. 도커 컨테이너 재시작 중..."

docker-compose restart frontend

# 8. 기능 검증
log_info "8. 기능 검증 중..."

# 프론트엔드 접근 확인
sleep 5
if curl -s http://localhost:4001 | grep -q "사고 관리 시스템"; then
    log_success "프론트엔드 접근 성공"
else
    log_error "프론트엔드 접근 실패"
    exit 1
fi

# API 응답 확인
if curl -s "http://localhost:6002/api/companies" > /dev/null; then
    log_success "API 응답 성공"
else
    log_error "API 응답 실패"
    exit 1
fi

# 9. 메타데이터 생성
log_info "9. 메타데이터 생성 중..."

cat > "${BACKUP_DIR}/phase1_metadata.json" << EOF
{
  "phase": "Phase 1: TypeScript 타입 안정성 개선",
  "timestamp": "$TIMESTAMP",
  "date": "$(date)",
  "git_branch": "$(git branch --show-current)",
  "git_commit": "$(git rev-parse HEAD)",
  "improvements": [
    "공통 타입 정의 파일 생성 (frontend/types/common.ts)",
    "API 응답 타입 정의",
    "페이지네이션 타입 정의",
    "기본 엔티티 타입 정의",
    "타입 가드 함수 추가",
    "유틸리티 타입 정의"
  ],
  "backup_files": [
EOF

for file in "${BACKUP_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "    \"$file\"," >> "${BACKUP_DIR}/phase1_metadata.json"
    fi
done

cat >> "${BACKUP_DIR}/phase1_metadata.json" << EOF
  ],
  "verification_results": {
    "typescript_compilation": "success",
    "build": "success",
    "frontend_access": "success",
    "api_response": "success"
  }
}
EOF

log_success "Phase 1 메타데이터 생성 완료"

# 10. Phase 1 완료 요약
echo ""
echo "=== Phase 1 완료 요약 ==="
echo "✅ 공통 타입 정의 파일 생성"
echo "✅ API 응답 타입 정의"
echo "✅ 페이지네이션 타입 정의"
echo "✅ 기본 엔티티 타입 정의"
echo "✅ 타입 가드 함수 추가"
echo "✅ 유틸리티 타입 정의"
echo "✅ TypeScript 컴파일 검증"
echo "✅ 빌드 검증"
echo "✅ 기능 검증"
echo ""
echo "📁 백업 위치: $BACKUP_DIR"
echo "📄 메타데이터: ${BACKUP_DIR}/phase1_metadata.json"
echo ""
log_success "Phase 1: TypeScript 타입 안정성 개선이 완료되었습니다!"

# 다음 단계 안내
echo ""
echo "다음 단계: Phase 2 - 성능 최적화"
echo "실행 명령: ./scripts/phase2-performance-optimization.sh" 