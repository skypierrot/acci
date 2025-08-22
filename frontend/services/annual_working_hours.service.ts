// 연간 근로시간 데이터 타입 정의
export interface AnnualWorkingHours {
  id?: number;
  company_id: string;
  site_id?: string | null;
  year: number;
  employee_hours: number;
  partner_on_hours: number;
  partner_off_hours: number;
  total_hours: number;
  is_closed: boolean;
  closed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Next.js API 라우트를 통해 백엔드와 통신
const API_BASE_URL = "/api";

/**
 * 연간 근로시간 목록 조회 (회사/연도별)
 */
export async function getAnnualWorkingHoursList(company_id: string, year?: number): Promise<AnnualWorkingHours[]> {
  // 요청 파라미터 콘솔 출력 (디버깅용)
  console.log('[연간근로시간][조회] company_id:', company_id, 'year:', year);
  // 쿼리 파라미터 구성
  const params = new URLSearchParams({ company_id });
  if (year) params.append('year', String(year));
  // 백엔드 API로 직접 요청
  const res = await fetch(`${API_BASE_URL}/settings/annual-working-hours?${params.toString()}`);
  if (!res.ok) throw new Error('연간 근로시간 목록 조회 실패');
  return await res.json();
}

/**
 * 연간 근로시간 단일 조회 (회사/사업장/연도)
 */
export async function getAnnualWorkingHoursOne(company_id: string, site_id: string | null, year: number): Promise<AnnualWorkingHours | null> {
  const params = new URLSearchParams({ company_id, year: String(year) });
  if (site_id) params.append('site_id', site_id);
  const res = await fetch(`${API_BASE_URL}/settings/annual-working-hours/one?${params.toString()}`);
  if (!res.ok) throw new Error('연간 근로시간 단일 조회 실패');
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

/**
 * 연간 근로시간 저장/수정 (upsert)
 */
export async function saveAnnualWorkingHours(data: Omit<AnnualWorkingHours, 'id' | 'total_hours' | 'created_at' | 'updated_at' | 'closed_at'>): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/settings/annual-working-hours`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('연간 근로시간 저장 실패');
  return await res.json();
}

/**
 * 연간 근로시간 삭제
 */
export async function deleteAnnualWorkingHours(company_id: string, site_id: string | null, year: number): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/settings/annual-working-hours`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company_id, site_id, year }),
  });
  if (!res.ok) throw new Error('연간 근로시간 삭제 실패');
  return await res.json();
}

/**
 * 연간 근로시간 마감
 */
export async function closeAnnualWorkingHours(company_id: string, site_id: string | null, year: number): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/settings/annual-working-hours/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company_id, site_id, year }),
  });
  if (!res.ok) throw new Error('연간 근로시간 마감 실패');
  return await res.json();
}

/**
 * 연간 근로시간 마감취소
 */
export async function openAnnualWorkingHours(company_id: string, site_id: string | null, year: number): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/settings/annual-working-hours/open`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company_id, site_id, year }),
  });
  if (!res.ok) throw new Error('연간 근로시간 마감취소 실패');
  return await res.json();
} 