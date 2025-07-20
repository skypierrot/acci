// 사고조사현황 상태 산정 함수
// occurrence: 발생보고서, investigation: 조사보고서(없을 수 있음)
export function getInvestigationStatus(occurrence: any, investigation: any): string {
  if (!investigation) {
    // 조사보고서가 없으면 '대기'
    return '대기';
  }
  const status = investigation.investigation_status;
  if (status === '대기' || status === 'draft') {
    return '대기';
  } else if (status === '조사 진행') {
    return '조사 진행';
  } else if (status === '조사 완료') {
    return '조사 완료';
  } else if (status === '대책 이행') {
    return '대책 이행';
  } else if (status === '조치완료') {
    return '조치완료';
  } else {
    // 알 수 없는 상태는 그대로 반환
    return status || '대기';
  }
}

// /history 표기 변환 함수
export function convertStatusForHistory(status: string): string {
  if (status === '대기') return '발생';
  if (status === '조치완료') return '종결';
  return status;
} 