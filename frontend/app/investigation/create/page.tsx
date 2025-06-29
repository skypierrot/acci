'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface OccurrenceReport {
  accident_id: string;
  global_accident_no: string;
  acci_time: string;
  company_name: string;
  site_name: string;
  acci_location: string;
  accident_type_level1: string;
  accident_type_level2: string;
  acci_summary: string;
  acci_detail: string;
  victim_count: number;
  victims_json: string;
  is_contractor: boolean;
  contractor_name?: string;
  reporter_name?: string;
  reporter_position?: string;
  reporter_belong?: string;
  first_report_time?: string;
  report_channel?: string;
  scene_photos?: string;
  cctv_video?: string;
  statement_docs?: string;
  etc_documents?: string;
  created_at: string;
  updated_at: string;
}

export default function CreateInvestigationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // URL 파라미터에서 from 값 추출
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  
  // 발생보고서 선택 상태
  const [selectedOccurrence, setSelectedOccurrence] = useState<OccurrenceReport | null>(null);
  const [occurrenceReports, setOccurrenceReports] = useState<OccurrenceReport[]>([]);
  const [showOccurrenceList, setShowOccurrenceList] = useState(false);
  
  // 조사보고서 폼 데이터
  const [formData, setFormData] = useState({
    accident_id: '',
    investigation_team_lead: '',
    investigation_team_members: '',
    investigation_location: '',
    investigation_start_time: '',
    investigation_end_time: '',
    investigation_status: '조사 착수',
    damage_severity: '',
    death_count: 0,
    injured_count: 0,
    damage_cost: 0,
    direct_cause: '',
    root_cause: '',
    corrective_actions: '',
    action_schedule: '',
    action_verifier: '',
    investigation_conclusion: '',
    investigator_signature: '',
  });

  // 발생보고서 목록 조회
  const fetchOccurrenceReports = async () => {
    try {
      setLoading(true);
      
      // 히스토리 페이지와 동일한 API 호출 방식 사용
      const response = await fetch('/api/occurrence?limit=50', {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`API 오류 (${response.status}): ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('발생보고서 API 응답:', data);
      
      // API 응답 구조에 맞게 데이터 추출 (히스토리 페이지와 동일)
      const reportsData = data.reports || data.data || [];
      if (reportsData && Array.isArray(reportsData)) {
        setOccurrenceReports(reportsData);
        console.log('발생보고서 데이터 로드 완료:', reportsData.length, '건');
      } else {
        console.error('API 응답에 reports 배열이 없습니다:', data);
        setOccurrenceReports([]);
      }
      
    } catch (err) {
      console.error('발생보고서 목록 조회 오류:', err);
      setError('발생보고서 목록을 불러오는데 실패했습니다: ' + (err instanceof Error ? err.message : '알 수 없는 오류'));
      setOccurrenceReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // URL 파라미터 설정
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setSearchParams(params);
    }
    
    fetchOccurrenceReports();
  }, []);

  // 발생보고서 목록이 로드된 후 URL 파라미터로 자동 선택
  useEffect(() => {
    if (searchParams && occurrenceReports.length > 0) {
      const fromAccidentId = searchParams.get('from');
      if (fromAccidentId) {
        const targetReport = occurrenceReports.find(report => report.accident_id === fromAccidentId);
        if (targetReport) {
          handleSelectOccurrence(targetReport);
          console.log('URL 파라미터로 발생보고서 자동 선택:', targetReport.accident_id);
        }
      }
    }
  }, [searchParams, occurrenceReports]);

  // 발생보고서 선택
  const handleSelectOccurrence = (occurrence: OccurrenceReport) => {
    setSelectedOccurrence(occurrence);
    setFormData(prev => ({
      ...prev,
      accident_id: occurrence.accident_id
    }));
    setShowOccurrenceList(false);
  };

  // 폼 데이터 변경 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('count') || name === 'damage_cost' ? parseInt(value) || 0 : value
    }));
  };

  // 날짜 필드 처리 (간단한 버전)
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 날짜 필드 클릭 시 달력 다이얼 열기
  const handleDateClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    input.showPicker?.();
  };

  // 날짜시간 입력 제한 처리 (강화된 버전)
  const handleDateTimeInput = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    let value = input.value;
    
    // datetime-local 형식에서 년도 부분만 제한
    if (value.length > 0) {
      const parts = value.split('-');
      if (parts[0] && parts[0].length > 4) {
        // 년도가 4자리를 초과하면 4자리로 제한
        parts[0] = parts[0].substring(0, 4);
        input.value = parts.join('-');
        
        // 상태도 업데이트
        const { name } = input;
        setFormData(prev => ({
          ...prev,
          [name]: input.value
        }));
      }
    }
  };

  // 키보드 입력 제한 (년도 4자리 이후 숫자 입력 차단)
  const handleDateTimeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const value = input.value;
    const cursorPosition = input.selectionStart || 0;
    
    // 숫자 키인지 확인
    const isNumber = /^[0-9]$/.test(e.key);
    
    if (isNumber && value.length > 0) {
      const beforeCursor = value.substring(0, cursorPosition);
      const afterCursor = value.substring(cursorPosition);
      
      // 년도 부분에 커서가 있고, 이미 4자리가 입력되어 있다면 추가 입력 차단
      if (cursorPosition <= 4) {
        const yearPart = value.split('-')[0] || '';
        if (yearPart.length >= 4 && cursorPosition === yearPart.length) {
          e.preventDefault();
          return;
        }
      }
    }
  };

  const handleDateTimeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (!value) return;
    
    // 숫자만 입력된 경우 자동 변환
    if (/^\d+$/.test(value)) {
      let formattedValue = '';
      
      if (value.length === 8) {
        // YYYYMMDD 형식을 YYYY-MM-DD로 변환
        const year = value.substring(0, 4);
        const month = value.substring(4, 6);
        const day = value.substring(6, 8);
        formattedValue = `${year}-${month}-${day}`;
      } else if (value.length === 10) {
        // YYYYMMDDHH 형식을 YYYY-MM-DDTHH:00로 변환
        const year = value.substring(0, 4);
        const month = value.substring(4, 6);
        const day = value.substring(6, 8);
        const hour = value.substring(8, 10);
        formattedValue = `${year}-${month}-${day}T${hour}:00`;
      } else if (value.length === 12) {
        // YYYYMMDDHHMM 형식을 YYYY-MM-DDTHH:MM로 변환
        const year = value.substring(0, 4);
        const month = value.substring(4, 6);
        const day = value.substring(6, 8);
        const hour = value.substring(8, 10);
        const minute = value.substring(10, 12);
        formattedValue = `${year}-${month}-${day}T${hour}:${minute}`;
      }
      
      if (formattedValue) {
        setFormData(prev => ({
          ...prev,
          [name]: formattedValue
        }));
      }
    }
  };

  // 조사보고서 생성
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOccurrence) {
      setError('발생보고서를 선택해주세요.');
      return;
    }

    if (!formData.investigation_team_lead.trim()) {
      setError('조사팀장을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/investigation/from-occurrence/${formData.accident_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '조사보고서 생성에 실패했습니다.');
      }

      const data = await response.json();
      setSuccess('조사보고서가 성공적으로 생성되었습니다.');
      
      // 3초 후 상세 페이지로 이동
      setTimeout(() => {
        router.push(`/investigation/${formData.accident_id}`);
      }, 3000);

    } catch (err) {
      console.error('조사보고서 생성 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">새 조사보고서 생성</h1>
        <Link href="/investigation" className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium transition-colors">
          목록으로 돌아가기
        </Link>
      </div>

      {/* 알림 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{success}</p>
              <p className="text-xs mt-1">잠시 후 상세 페이지로 이동합니다...</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 발생보고서 선택 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">1. 발생보고서 선택</h2>
          
          {!selectedOccurrence ? (
            <div>
              <button
                type="button"
                onClick={() => setShowOccurrenceList(!showOccurrenceList)}
                className="w-full bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-4 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                + 발생보고서를 선택하세요
              </button>
              
              {showOccurrenceList && (
                <div className="mt-4 border rounded-lg overflow-hidden">
                  <div className="max-h-64 overflow-y-auto">
                    {occurrenceReports.map((report) => (
                      <div
                        key={report.accident_id}
                        onClick={() => handleSelectOccurrence(report)}
                        className="p-4 border-b hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{report.global_accident_no}</div>
                            <div className="text-sm text-gray-600">{report.company_name} - {report.acci_location}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(report.acci_time).toLocaleString('ko-KR')}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {report.accident_type_level1} / {report.accident_type_level2}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-lg">{selectedOccurrence.global_accident_no}</div>
                  <div className="text-gray-600">{selectedOccurrence.company_name} - {selectedOccurrence.acci_location}</div>
                  <div className="text-gray-500 text-sm">
                    {new Date(selectedOccurrence.acci_time).toLocaleString('ko-KR')}
                  </div>
                  <div className="text-sm mt-2">
                    <span className="font-medium">사고 유형:</span> {selectedOccurrence.accident_type_level1} / {selectedOccurrence.accident_type_level2}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">재해자 수:</span> {selectedOccurrence.victim_count}명
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOccurrence(null);
                    setFormData(prev => ({ ...prev, accident_id: '' }));
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  변경
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 조사 정보 */}
        {selectedOccurrence && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">2. 조사 정보</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">조사팀장 *</label>
                <input
                  type="text"
                  name="investigation_team_lead"
                  value={formData.investigation_team_lead}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="조사팀장 이름을 입력하세요"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">조사팀원</label>
                <input
                  type="text"
                  name="investigation_team_members"
                  value={formData.investigation_team_members}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="조사팀원 이름 (콤마로 구분)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">조사 장소</label>
                <input
                  type="text"
                  name="investigation_location"
                  value={formData.investigation_location}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="조사 진행 장소"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">조사 상태</label>
                <select
                  name="investigation_status"
                  value={formData.investigation_status}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="조사 착수">조사 착수</option>
                  <option value="조사 진행중">조사 진행중</option>
                  <option value="대책 이행중">대책 이행중</option>
                  <option value="완료">완료</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">조사 시작일</label>
                <input
                  type="date"
                  name="investigation_start_time"
                  value={formData.investigation_start_time}
                  onChange={handleDateChange}
                  onClick={handleDateClick}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">조사 종료일</label>
                <input
                  type="date"
                  name="investigation_end_time"
                  value={formData.investigation_end_time}
                  onChange={handleDateChange}
                  onClick={handleDateClick}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* 피해 정보 */}
        {selectedOccurrence && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">3. 피해 정보</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">피해 정도</label>
                <select
                  name="damage_severity"
                  value={formData.damage_severity}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">선택하세요</option>
                  <option value="경상">경상</option>
                  <option value="중상">중상</option>
                  <option value="사망">사망</option>
                  <option value="재산피해">재산피해</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사망자 수</label>
                <input
                  type="number"
                  name="death_count"
                  value={formData.death_count}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">부상자 수</label>
                <input
                  type="number"
                  name="injured_count"
                  value={formData.injured_count}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">피해 금액 (원)</label>
                <input
                  type="number"
                  name="damage_cost"
                  value={formData.damage_cost}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* 원인 분석 */}
        {selectedOccurrence && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">4. 원인 분석</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">직접 원인</label>
                <textarea
                  name="direct_cause"
                  value={formData.direct_cause}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="사고의 직접적인 원인을 기술하세요"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">근본 원인</label>
                <textarea
                  name="root_cause"
                  value={formData.root_cause}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="사고의 근본적인 원인을 기술하세요"
                />
              </div>
            </div>
          </div>
        )}

        {/* 대책 정보 */}
        {selectedOccurrence && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">5. 대책 정보</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">재발방지대책</label>
                <textarea
                  name="corrective_actions"
                  value={formData.corrective_actions}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="재발방지를 위한 구체적인 대책을 기술하세요"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">대책 이행 일정</label>
                  <input
                    type="text"
                    name="action_schedule"
                    value={formData.action_schedule}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 2024년 2월 말까지"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">대책 이행 확인자</label>
                  <input
                    type="text"
                    name="action_verifier"
                    value={formData.action_verifier}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="대책 이행을 확인할 담당자"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 조사 결론 */}
        {selectedOccurrence && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">6. 조사 결론</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">조사 결론</label>
                <textarea
                  name="investigation_conclusion"
                  value={formData.investigation_conclusion}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="조사 결과에 대한 종합적인 결론을 기술하세요"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">조사자 서명</label>
                <input
                  type="text"
                  name="investigator_signature"
                  value={formData.investigator_signature}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="조사자 이름"
                />
              </div>
            </div>
          </div>
        )}

        {/* 제출 버튼 */}
        {selectedOccurrence && (
          <div className="flex justify-end space-x-4">
            <Link href="/investigation" className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md font-medium transition-colors">
              취소
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
            >
              {loading ? '생성 중...' : '조사보고서 생성'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
} 