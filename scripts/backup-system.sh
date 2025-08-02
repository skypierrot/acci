#!/bin/bash

# 백업 시스템 스크립트
# 기능: 개선 전 파일을 백업하고 메타데이터를 관리

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
BACKUP_DIR="temp/backup/${TIMESTAMP}"

# 백업 디렉토리 생성
create_backup_directory() {
    log_info "백업 디렉토리 생성 중..."
    mkdir -p "${BACKUP_DIR}"
    log_success "백업 디렉토리 생성 완료: ${BACKUP_DIR}"
}

# 파일 백업
backup_file() {
    local file_path="$1"
    local file_name=$(basename "$file_path")
    local backup_path="${BACKUP_DIR}/${file_name}_backup_${TIMESTAMP}"
    
    if [ -f "$file_path" ]; then
        cp "$file_path" "$backup_path"
        log_success "파일 백업 완료: $file_path -> $backup_path"
        echo "$backup_path"
    else
        log_warning "파일이 존재하지 않음: $file_path"
        echo ""
    fi
}

# 메타데이터 생성
create_metadata() {
    local metadata_file="${BACKUP_DIR}/backup_metadata.json"
    
    cat > "$metadata_file" << EOF
{
  "backup_timestamp": "$TIMESTAMP",
  "backup_date": "$(date)",
  "git_branch": "$(git branch --show-current)",
  "git_commit": "$(git rev-parse HEAD)",
  "git_commit_message": "$(git log -1 --pretty=%B | tr '\n' ' ' | sed 's/ *$//')",
  "backup_files": [
EOF

    # 백업된 파일 목록 추가
    local first=true
    for file in "${BACKUP_DIR}"/*_backup_*; do
        if [ -f "$file" ]; then
            local file_name=$(basename "$file")
            local original_path=$(echo "$file_name" | sed 's/_backup_[0-9_]*$//')
            
            if [ "$first" = true ]; then
                first=false
            else
                echo "," >> "$metadata_file"
            fi
            
            cat >> "$metadata_file" << EOF
    {
      "original_path": "$original_path",
      "backup_path": "$file_name",
      "file_size": "$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "unknown")",
      "checksum": "$(md5sum "$file" 2>/dev/null | cut -d' ' -f1 || echo "unknown")"
    }
EOF
        fi
    done
    
    cat >> "$metadata_file" << EOF
  ],
  "system_info": {
    "os": "$(uname -s)",
    "hostname": "$(hostname)",
    "user": "$(whoami)"
  }
}
EOF

    log_success "메타데이터 생성 완료: $metadata_file"
}

# 전체 백업 프로세스
backup_files() {
    local files=("$@")
    
    if [ ${#files[@]} -eq 0 ]; then
        log_error "백업할 파일이 지정되지 않았습니다."
        echo "사용법: $0 [파일1] [파일2] ..."
        exit 1
    fi
    
    log_info "백업 프로세스 시작..."
    create_backup_directory
    
    local backed_up_files=()
    for file in "${files[@]}"; do
        local backup_path=$(backup_file "$file")
        if [ -n "$backup_path" ]; then
            backed_up_files+=("$backup_path")
        fi
    done
    
    create_metadata
    
    log_success "백업 프로세스 완료!"
    log_info "백업된 파일 수: ${#backed_up_files[@]}"
    log_info "백업 위치: $BACKUP_DIR"
    
    # 백업 요약 출력
    echo ""
    echo "=== 백업 요약 ==="
    echo "백업 시간: $TIMESTAMP"
    echo "백업 위치: $BACKUP_DIR"
    echo "백업된 파일:"
    for file in "${backed_up_files[@]}"; do
        echo "  - $(basename "$file")"
    done
}

# 백업 복원
restore_backup() {
    local backup_file="$1"
    local target_path="$2"
    
    if [ -z "$backup_file" ] || [ -z "$target_path" ]; then
        log_error "백업 파일과 대상 경로를 모두 지정해야 합니다."
        echo "사용법: $0 --restore [백업파일] [대상경로]"
        exit 1
    fi
    
    if [ -f "$backup_file" ]; then
        cp "$backup_file" "$target_path"
        log_success "백업 복원 완료: $backup_file -> $target_path"
    else
        log_error "백업 파일이 존재하지 않습니다: $backup_file"
        exit 1
    fi
}

# 백업 목록 조회
list_backups() {
    local backup_root="temp/backup"
    
    if [ ! -d "$backup_root" ]; then
        log_warning "백업 디렉토리가 존재하지 않습니다: $backup_root"
        return
    fi
    
    echo "=== 백업 목록 ==="
    for backup_dir in "$backup_root"/*; do
        if [ -d "$backup_dir" ]; then
            local dir_name=$(basename "$backup_dir")
            local metadata_file="$backup_dir/backup_metadata.json"
            
            echo "📁 $dir_name"
            if [ -f "$metadata_file" ]; then
                local commit_msg=$(grep -o '"git_commit_message": "[^"]*"' "$metadata_file" | cut -d'"' -f4)
                echo "   커밋: $commit_msg"
            fi
            
            local file_count=$(find "$backup_dir" -name "*_backup_*" -type f | wc -l)
            echo "   파일 수: $file_count"
            echo ""
        fi
    done
}

# 메인 실행 로직
main() {
    case "${1:-}" in
        --restore)
            restore_backup "$2" "$3"
            ;;
        --list)
            list_backups
            ;;
        --help|-h)
            echo "백업 시스템 스크립트"
            echo ""
            echo "사용법:"
            echo "  $0 [파일1] [파일2] ...     # 파일들을 백업"
            echo "  $0 --restore [백업파일] [대상경로]  # 백업 복원"
            echo "  $0 --list                  # 백업 목록 조회"
            echo "  $0 --help                  # 도움말 표시"
            echo ""
            echo "예시:"
            echo "  $0 frontend/app/page.tsx frontend/components/Button.tsx"
            echo "  $0 --restore temp/backup/20241201_143022/page.tsx_backup_20241201_143022 frontend/app/page.tsx"
            echo "  $0 --list"
            ;;
        *)
            backup_files "$@"
            ;;
    esac
}

# 스크립트 실행
main "$@" 