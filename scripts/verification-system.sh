#!/bin/bash

# 검증 시스템 스크립트
# 기능: 개선 후 기능, UI, 성능 검증

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

# 파일 비교 검증
verify_file_changes() {
    local original_file="$1"
    local improved_file="$2"
    
    log_info "파일 변경사항 검증 중..."
    
    if [ ! -f "$original_file" ]; then
        log_error "원본 파일이 존재하지 않습니다: $original_file"
        return 1
    fi
    
    if [ ! -f "$improved_file" ]; then
        log_error "개선된 파일이 존재하지 않습니다: $improved_file"
        return 1
    fi
    
    # 파일 크기 비교
    local original_size=$(stat -f%z "$original_file" 2>/dev/null || stat -c%s "$original_file" 2>/dev/null || echo "0")
    local improved_size=$(stat -f%z "$improved_file" 2>/dev/null || stat -c%s "$improved_file" 2>/dev/null || echo "0")
    
    log_info "파일 크기 비교:"
    log_info "  원본: ${original_size} bytes"
    log_info "  개선: ${improved_size} bytes"
    
    # 파일 내용 비교 (주석과 공백 제외)
    local diff_output=$(diff -B -w <(grep -v '^[[:space:]]*//' "$original_file" | grep -v '^[[:space:]]*$') <(grep -v '^[[:space:]]*//' "$improved_file" | grep -v '^[[:space:]]*$') || true)
    
    if [ -z "$diff_output" ]; then
        log_success "파일 내용이 동일합니다 (주석과 공백 제외)"
        return 0
    else
        log_warning "파일 내용에 차이가 있습니다:"
        echo "$diff_output" | head -20
        return 1
    fi
}

# TypeScript 컴파일 검증
verify_typescript_compilation() {
    log_info "TypeScript 컴파일 검증 중..."
    
    cd frontend
    
    # TypeScript 컴파일 체크
    if npm run type-check 2>/dev/null; then
        log_success "TypeScript 컴파일 성공"
        return 0
    else
        log_error "TypeScript 컴파일 실패"
        return 1
    fi
}

# 빌드 검증
verify_build() {
    log_info "빌드 검증 중..."
    
    cd frontend
    
    # 빌드 실행
    if npm run build; then
        log_success "빌드 성공"
        
        # 번들 크기 확인
        local bundle_size=$(du -sh .next/static/chunks/ 2>/dev/null | tail -1 | cut -f1 || echo "unknown")
        log_info "번들 크기: $bundle_size"
        
        return 0
    else
        log_error "빌드 실패"
        return 1
    fi
}

# 도커 컨테이너 상태 검증
verify_docker_status() {
    log_info "도커 컨테이너 상태 검증 중..."
    
    local containers=("accident-frontend" "accident-backend" "accident-db")
    local all_healthy=true
    
    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container.*Up"; then
            log_success "컨테이너 실행 중: $container"
        else
            log_error "컨테이너가 실행되지 않음: $container"
            all_healthy=false
        fi
    done
    
    if [ "$all_healthy" = true ]; then
        return 0
    else
        return 1
    fi
}

# API 응답 검증
verify_api_responses() {
    log_info "API 응답 검증 중..."
    
    local apis=(
        "http://localhost:6002/api/occurrence/all?year=2025"
        "http://localhost:6002/api/history?page=1&size=5"
        "http://localhost:6002/api/companies"
    )
    
    local all_success=true
    
    for api in "${apis[@]}"; do
        if curl -s "$api" > /dev/null; then
            log_success "API 응답 성공: $api"
        else
            log_error "API 응답 실패: $api"
            all_success=false
        fi
    done
    
    if [ "$all_success" = true ]; then
        return 0
    else
        return 1
    fi
}

# 프론트엔드 접근 검증
verify_frontend_access() {
    log_info "프론트엔드 접근 검증 중..."
    
    if curl -s http://localhost:4001 | grep -q "사고 관리 시스템"; then
        log_success "프론트엔드 접근 성공"
        return 0
    else
        log_error "프론트엔드 접근 실패"
        return 1
    fi
}

# 성능 검증
verify_performance() {
    log_info "성능 검증 중..."
    
    # 페이지 로딩 시간 측정
    local start_time=$(date +%s.%N)
    curl -s http://localhost:4001 > /dev/null
    local end_time=$(date +%s.%N)
    
    local load_time=$(echo "$end_time - $start_time" | bc -l 2>/dev/null || echo "unknown")
    log_info "페이지 로딩 시간: ${load_time}초"
    
    # 메모리 사용량 확인
    local memory_usage=$(docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}" | grep accident-frontend || echo "unknown")
    log_info "메모리 사용량: $memory_usage"
    
    return 0
}

# 전체 검증 프로세스
verify_all() {
    log_info "전체 검증 프로세스 시작..."
    
    local verification_results=()
    
    # 1. 도커 컨테이너 상태 검증
    if verify_docker_status; then
        verification_results+=("docker_status:pass")
    else
        verification_results+=("docker_status:fail")
    fi
    
    # 2. API 응답 검증
    if verify_api_responses; then
        verification_results+=("api_responses:pass")
    else
        verification_results+=("api_responses:fail")
    fi
    
    # 3. 프론트엔드 접근 검증
    if verify_frontend_access; then
        verification_results+=("frontend_access:pass")
    else
        verification_results+=("frontend_access:fail")
    fi
    
    # 4. TypeScript 컴파일 검증
    if verify_typescript_compilation; then
        verification_results+=("typescript_compilation:pass")
    else
        verification_results+=("typescript_compilation:fail")
    fi
    
    # 5. 빌드 검증
    if verify_build; then
        verification_results+=("build:pass")
    else
        verification_results+=("build:fail")
    fi
    
    # 6. 성능 검증
    if verify_performance; then
        verification_results+=("performance:pass")
    else
        verification_results+=("performance:fail")
    fi
    
    # 검증 결과 요약
    echo ""
    echo "=== 검증 결과 요약 ==="
    local pass_count=0
    local fail_count=0
    
    for result in "${verification_results[@]}"; do
        local test_name=$(echo "$result" | cut -d: -f1)
        local test_result=$(echo "$result" | cut -d: -f2)
        
        if [ "$test_result" = "pass" ]; then
            echo "✅ $test_name: PASS"
            ((pass_count++))
        else
            echo "❌ $test_name: FAIL"
            ((fail_count++))
        fi
    done
    
    echo ""
    echo "총 검증 항목: $((pass_count + fail_count))"
    echo "성공: $pass_count"
    echo "실패: $fail_count"
    
    if [ $fail_count -eq 0 ]; then
        log_success "모든 검증이 성공했습니다!"
        return 0
    else
        log_error "$fail_count개의 검증이 실패했습니다."
        return 1
    fi
}

# 파일 비교 검증
verify_file_comparison() {
    local original_file="$1"
    local improved_file="$2"
    
    if [ -z "$original_file" ] || [ -z "$improved_file" ]; then
        log_error "원본 파일과 개선된 파일을 모두 지정해야 합니다."
        echo "사용법: $0 --compare [원본파일] [개선파일]"
        exit 1
    fi
    
    verify_file_changes "$original_file" "$improved_file"
}

# 메인 실행 로직
main() {
    case "${1:-}" in
        --compare)
            verify_file_comparison "$2" "$3"
            ;;
        --all)
            verify_all
            ;;
        --docker)
            verify_docker_status
            ;;
        --api)
            verify_api_responses
            ;;
        --frontend)
            verify_frontend_access
            ;;
        --typescript)
            verify_typescript_compilation
            ;;
        --build)
            verify_build
            ;;
        --performance)
            verify_performance
            ;;
        --help|-h)
            echo "검증 시스템 스크립트"
            echo ""
            echo "사용법:"
            echo "  $0 --all                    # 전체 검증"
            echo "  $0 --compare [원본] [개선]   # 파일 비교 검증"
            echo "  $0 --docker                 # 도커 컨테이너 상태 검증"
            echo "  $0 --api                    # API 응답 검증"
            echo "  $0 --frontend               # 프론트엔드 접근 검증"
            echo "  $0 --typescript             # TypeScript 컴파일 검증"
            echo "  $0 --build                  # 빌드 검증"
            echo "  $0 --performance            # 성능 검증"
            echo "  $0 --help                   # 도움말 표시"
            echo ""
            echo "예시:"
            echo "  $0 --all"
            echo "  $0 --compare temp/backup/20241201_143022/page.tsx_backup_20241201_143022 frontend/app/page.tsx"
            ;;
        *)
            verify_all
            ;;
    esac
}

# 스크립트 실행
main "$@" 