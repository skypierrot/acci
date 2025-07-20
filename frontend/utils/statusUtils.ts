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

// 재해발생형태에 따른 표시 정보 결정
export const getAccidentTypeDisplay = (report) => {
  const accidentType = report.final_accident_type_level1 || report.accident_type_level1;
  const hasVictims = report.victims_info.length > 0;
  const hasPropertyDamages = report.property_damages_info.length > 0;
  if (hasVictims && hasPropertyDamages) {
    return { type: '복합', displayType: 'both' };
  } else if (hasVictims) {
    return { type: '인적', displayType: 'human' };
  } else if (hasPropertyDamages) {
    return { type: '물적', displayType: 'property' };
  } else {
    return { type: accidentType, displayType: 'unknown' };
  }
};

// 재발방지대책 완료율에 따른 색상 클래스
export const getCompletionRateColor = (rate) => {
  if (rate >= 80) return 'text-green-600';
  if (rate >= 50) return 'text-yellow-600';
  return 'text-red-600';
}; 