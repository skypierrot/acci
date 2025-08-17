#!/bin/bash

# Lagging 페이지 성능 개선 전 백업 스크립트
# 사용법: ./scripts/backup-lagging-improvement.sh

set -e

echo "🚀 Lagging 페이지 성능 개선 전 백업 시작..."

# 현재 시간을 백업 디렉토리명으로 사용
BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="temp/backup/lagging-improvement/${BACKUP_TIMESTAMP}"

# 백업 디렉토리 생성
echo "📁 백업 디렉토리 생성: ${BACKUP_DIR}"
mkdir -p "${BACKUP_DIR}"

# 백업할 파일 목록
BACKUP_FILES=(
    "frontend/app/lagging/page.tsx"
    "backend/controllers/occurrence.controller.ts"
    "backend/services/occurrence.service.ts"
    "frontend/components/charts/index.ts"
    "frontend/components/charts/AccidentTrendChart.tsx"
    "frontend/components/charts/SafetyIndexChart.tsx"
    "frontend/components/charts/DetailedSafetyIndexChart.tsx"
    "frontend/components/charts/IntegratedAccidentChart.tsx"
)

# 파일 백업
echo "📋 파일 백업 중..."
for file in "${BACKUP_FILES[@]}"; do
    if [ -f "$file" ]; then
        # 디렉토리 구조 유지하면서 백업
        backup_path="${BACKUP_DIR}/$(dirname "$file")"
        mkdir -p "$backup_path"
        cp "$file" "$backup_path/"
        echo "✅ 백업 완료: $file"
    else
        echo "⚠️  파일 없음: $file"
    fi
done

# 백업 메타데이터 생성
echo "📝 백업 메타데이터 생성..."
cat > "${BACKUP_DIR}/backup_metadata.json" << EOF
{
  "backup_timestamp": "${BACKUP_TIMESTAMP}",
  "backup_type": "lagging_performance_improvement",
  "description": "Lagging 페이지 성능 개선 전 백업",
  "files_backed_up": [
    "frontend/app/lagging/page.tsx",
    "backend/controllers/occurrence.controller.ts",
    "backend/services/occurrence.service.ts",
    "frontend/components/charts/index.ts",
    "frontend/components/charts/AccidentTrendChart.tsx",
    "frontend/components/charts/SafetyIndexChart.tsx",
    "frontend/components/charts/DetailedSafetyIndexChart.tsx",
    "frontend/components/charts/IntegratedAccidentChart.tsx"
  ],
  "backup_notes": "성능 개선 작업 전 원본 파일 백업",
  "created_by": "backup-lagging-improvement.sh",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')"
}
EOF

# 현재 성능 상태 기록
echo "📊 현재 성능 상태 기록..."
cat > "${BACKUP_DIR}/performance_baseline.json" << EOF
{
  "baseline_timestamp": "${BACKUP_TIMESTAMP}",
  "performance_metrics": {
    "initial_loading_time": "10-15초 (예상)",
    "api_call_count": "20-30회 (예상)",
    "memory_usage": "높음 (예상)",
    "bundle_size": "500KB+ (예상)"
  },
  "notes": "개선 전 성능 기준점"
}
EOF

# 백업 완료 메시지
echo ""
echo "✅ 백업 완료!"
echo "📁 백업 위치: ${BACKUP_DIR}"
echo "📋 백업된 파일 수: $(find "${BACKUP_DIR}" -type f -name "*.tsx" -o -name "*.ts" | wc -l)"
echo ""
echo "📝 다음 단계:"
echo "1. 백업 확인: ls -la ${BACKUP_DIR}"
echo "2. 성능 개선 작업 시작"
echo "3. 개선 후 검증: ./scripts/verify-lagging-improvement.sh"
echo "" 