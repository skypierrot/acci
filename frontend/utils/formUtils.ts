// 폼 데이터 유효성 검사 함수: 필수 필드 확인 및 에러 핸들링. occurrence와 investigation 공통 사용.
// @param data - 폼 데이터 객체 (제네릭 타입으로 유연성 제공)
// @returns {boolean, errors} - 유효 여부와 에러 메시지
export function validateForm<T extends { [key: string]: any }>(data: T): { isValid: boolean; errors: string[] } {
  const errors = [];
  
  // 사고 발생보고서 필수 필드 검사
  if ('company_name' in data && (!data.company_name || data.company_name.trim() === '')) {
    errors.push('회사명이 필요합니다.');
  }
  if ('site_name' in data && (!data.site_name || data.site_name.trim() === '')) {
    errors.push('사업장명이 필요합니다.');
  }
  if ('acci_time' in data && (!data.acci_time || data.acci_time.trim() === '')) {
    errors.push('사고 발생 일시가 필요합니다.');
  }
  if ('acci_location' in data && (!data.acci_location || data.acci_location.trim() === '')) {
    errors.push('사고 발생 위치가 필요합니다.');
  }
  
  // 조사보고서 필수 필드 검사
  if ('investigation_team_lead' in data && (!data.investigation_team_lead || data.investigation_team_lead.trim() === '')) {
    errors.push('조사 팀장이 필요합니다.');
  }
  if ('investigation_start_time' in data && (!data.investigation_start_time || data.investigation_start_time.trim() === '')) {
    errors.push('조사 시작 시간이 필요합니다.');
  }
  
  return { isValid: errors.length === 0, errors };
}

// 폼 제출 함수: API 호출 및 에러 핸들링. 공통 엔드포인트 처리.
// @param data - 폼 데이터 (제네릭 타입)
// @param endpoint - 제출 API 엔드포인트
// @returns Promise<Response> - 제출 결과
export async function submitForm<T>(data: T, endpoint: string): Promise<Response> {
  const response = await fetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || '제출 실패');
  }
  return response;
}

// 폼 수정 함수: PUT 메서드로 API 호출 및 에러 핸들링
// @param data - 폼 데이터 (제네릭 타입)
// @param endpoint - 수정 API 엔드포인트
// @returns Promise<Response> - 수정 결과
export async function updateForm<T>(data: T, endpoint: string): Promise<Response> {
  const response = await fetch(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || '수정 실패');
  }
  return response;
}

// ... existing code ... (추가 함수 필요 시 확장) 