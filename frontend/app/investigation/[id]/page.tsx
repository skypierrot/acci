'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

// 재해자 정보 인터페이스
interface VictimInfo {
  victim_id?: number;
  accident_id?: string;
  name: string;
  age: number;
  belong: string;
  duty: string;
  injury_type: string;
  ppe_worn: string;
  first_aid: string;
  birth_date?: string;
  absence_start_date?: string;
  return_expected_date?: string;
  created_at?: string;
  updated_at?: string;
}

interface InvestigationReport {
  accident_id: string;
  investigation_start_time?: string;
  investigation_end_time?: string;
  investigation_team_lead?: string;
  investigation_team_members?: string;
  investigation_location?: string;
  
  // 원본 정보
  original_global_accident_no?: string;
  original_accident_id?: string;
  original_acci_time?: string;
  original_acci_location?: string;
  original_accident_type_level1?: string;
  original_accident_type_level2?: string;
  original_acci_summary?: string;
  original_acci_detail?: string;
  original_victim_count?: number;
  original_victims?: VictimInfo[];
  
  // 조사 정보
  investigation_global_accident_no?: string;
  investigation_accident_id?: string;
  investigation_acci_time?: string;
  investigation_acci_location?: string;
  investigation_accident_type_level1?: string;
  investigation_accident_type_level2?: string;
  investigation_acci_summary?: string;
  investigation_acci_detail?: string;
  investigation_victim_count?: number;
  investigation_victims?: VictimInfo[];
  
  // 피해 정보
  damage_severity?: string;
  death_count?: number;
  injured_count?: number;
  damage_cost?: number;
  injury_location_detail?: string;
  victim_return_date?: string;
  
  // 원인 분석
  direct_cause?: string;
  root_cause?: string;
  
  // 대책 정보
  corrective_actions?: string;
  action_schedule?: string;
  action_verifier?: string;
  
  // 조사 결론
  investigation_conclusion?: string;
  investigation_status?: string;
  investigation_summary?: string;
  investigator_signature?: string;
  report_written_date?: string;
}

export default function InvestigationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const accidentId = params.id as string;
  
  const [report, setReport] = useState<InvestigationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // 편집 폼 데이터
  const [editForm, setEditForm] = useState<Partial<InvestigationReport>>({});

  // 조사보고서 조회
  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:6001/api/investigation/${accidentId}`);
      
      if (!response.ok) {
        throw new Error('조사보고서를 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      const reportData = data.data || data;
      setReport(reportData);
      setEditForm(reportData); // 편집 폼 초기화
    } catch (err) {
      console.error('조사보고서 조회 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      // 백엔드 문제로 인한 임시 데이터
      const tempData = {
        accident_id: accidentId,
        investigation_global_accident_no: 'HHH-A-2024-001',
        investigation_team_lead: '김조사관',
        investigation_team_members: '박조사원, 이조사원',
        investigation_location: '현장 사무실',
        investigation_start_time: '2024-01-16T09:00:00Z',
        investigation_status: '조사 착수',
        
        // 원본 정보
        original_global_accident_no: 'HHH-A-2024-001',
        original_acci_time: '2024-01-15T09:30:00Z',
        original_acci_location: '3층 사무실',
        original_accident_type_level1: '넘어짐',
        original_accident_type_level2: '미끄러짐',
        original_acci_summary: '복도에서 미끄러져 넘어짐',
        original_acci_detail: '복도 청소 후 물기로 인해 미끄러져 넘어짐',
        original_victim_count: 1,
        
        // 조사 정보 (초기값은 원본과 동일)
        investigation_acci_time: '2024-01-15T09:30:00Z',
        investigation_acci_location: '3층 사무실',
        investigation_accident_type_level1: '넘어짐',
        investigation_accident_type_level2: '미끄러짐',
        investigation_acci_summary: '복도에서 미끄러져 넘어짐',
        investigation_acci_detail: '복도 청소 후 물기로 인해 미끄러져 넘어짐',
        investigation_victim_count: 1,
        
        // 피해 정보
        damage_severity: '경상',
        death_count: 0,
        injured_count: 1,
        damage_cost: 0,
        
        // 원인 분석
        direct_cause: '바닥 청소 후 물기 제거 미흡',
        root_cause: '청소 후 안전 확인 절차 부재',
        
        // 대책 정보
        corrective_actions: '1. 청소 후 물기 완전 제거 절차 수립\n2. 미끄럼 방지 매트 설치\n3. 안전 표지판 설치',
        action_schedule: '2024년 2월 말까지',
        action_verifier: '안전관리자',
        
        // 조사 결론
        investigation_conclusion: '청소 후 안전 관리 절차 미흡으로 인한 미끄럼 사고로 판단됨',
        investigator_signature: '김조사관',
        report_written_date: '2024-01-20T00:00:00Z'
      };
      setReport(tempData);
      setEditForm(tempData);
    } finally {
      setLoading(false);
    }
  };

  // 편집 폼 입력 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: name.includes('count') || name === 'damage_cost' ? (parseInt(value) || 0) : value
    }));
  };

  // 날짜 필드 처리 (간단한 버전)
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 날짜 필드 클릭 시 달력 다이얼 열기
  const handleDateClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    input.showPicker?.();
  };

  // 원본 데이터 불러오기 함수
  const loadOriginalData = (field: 'summary' | 'detail' | 'time' | 'location' | 'type1' | 'type2' | 'victims') => {
    if (!report) return;
    
    if (field === 'summary') {
      setEditForm(prev => ({
        ...prev,
        investigation_acci_summary: report.original_acci_summary || ''
      }));
    } else if (field === 'detail') {
      setEditForm(prev => ({
        ...prev,
        investigation_acci_detail: report.original_acci_detail || ''
      }));
    } else if (field === 'time') {
      setEditForm(prev => ({
        ...prev,
        investigation_acci_time: report.original_acci_time || ''
      }));
    } else if (field === 'location') {
      setEditForm(prev => ({
        ...prev,
        investigation_acci_location: report.original_acci_location || ''
      }));
    } else if (field === 'type1') {
      setEditForm(prev => ({
        ...prev,
        investigation_accident_type_level1: report.original_accident_type_level1 || ''
      }));
    } else if (field === 'type2') {
      setEditForm(prev => ({
        ...prev,
        investigation_accident_type_level2: report.original_accident_type_level2 || ''
      }));
    } else if (field === 'victims') {
      setEditForm(prev => ({
        ...prev,
        investigation_victim_count: report.original_victim_count || 0,
        investigation_victims: report.original_victims ? [...report.original_victims] : []
      }));
    }
  };

  // 재해자 정보 변경 처리
  const handleVictimChange = (index: number, field: keyof VictimInfo, value: string | number) => {
    setEditForm(prev => {
      const newVictims = [...(prev.investigation_victims || [])];
      if (newVictims[index]) {
        newVictims[index] = { ...newVictims[index], [field]: value };
      }
      return { ...prev, investigation_victims: newVictims };
    });
  };

  // 재해자 추가
  const addVictim = () => {
    setEditForm(prev => {
      const newVictims = [...(prev.investigation_victims || [])];
      newVictims.push({
        name: '',
        age: 0,
        belong: '',
        duty: '',
        injury_type: '',
        ppe_worn: '',
        first_aid: '',
        absence_start_date: '',
        return_expected_date: ''
      });
      return {
        ...prev,
        investigation_victims: newVictims,
        investigation_victim_count: newVictims.length
      };
    });
  };

  // 재해자 삭제
  const removeVictim = (index: number) => {
    setEditForm(prev => {
      const newVictims = [...(prev.investigation_victims || [])];
      newVictims.splice(index, 1);
      return {
        ...prev,
        investigation_victims: newVictims,
        investigation_victim_count: newVictims.length
      };
    });
  };

  // 재해자 수 변경 처리
  const handleVictimCountChange = (newCount: number) => {
    setEditForm(prev => {
      const currentVictims = [...(prev.investigation_victims || [])];
      
      if (newCount > currentVictims.length) {
        // 재해자 수가 증가한 경우 빈 재해자 정보 추가
        const additionalVictims = Array(newCount - currentVictims.length).fill(null).map(() => ({
          name: '',
          age: 0,
          belong: '',
          duty: '',
          injury_type: '',
          ppe_worn: '',
          first_aid: '',
          absence_start_date: '',
          return_expected_date: ''
        }));
        currentVictims.push(...additionalVictims);
      } else if (newCount < currentVictims.length) {
        // 재해자 수가 감소한 경우 뒤에서부터 제거
        currentVictims.splice(newCount);
      }
      
      return {
        ...prev,
        investigation_victim_count: newCount,
        investigation_victims: currentVictims
      };
    });
  };

  // 편집 모드 토글
  const toggleEditMode = () => {
    if (editMode && report) {
      // 편집 모드 해제 시 원본 데이터로 복원
      setEditForm(report);
    } else if (!editMode && report) {
      // 편집 모드 진입 시 재해자 정보 초기화
      const initialVictims = report.investigation_victims || [];
      const initialCount = report.investigation_victim_count || 0;
      
      // 재해자 수와 배열 크기가 맞지 않는 경우 조정
      if (initialCount > 0 && initialVictims.length === 0) {
        // 재해자 수는 있지만 배열이 비어있는 경우 빈 재해자 정보 생성
        const emptyVictims = Array(initialCount).fill(null).map(() => ({
          name: '',
          age: 0,
          belong: '',
          duty: '',
          injury_type: '',
          ppe_worn: '',
          first_aid: '',
          absence_start_date: '',
          return_expected_date: ''
        }));
        setEditForm({
          ...report,
          investigation_victims: emptyVictims
        });
      } else {
        setEditForm(report);
      }
    }
    setEditMode(!editMode);
    setSaveSuccess(false);
  };

  // 조사보고서 저장
  const handleSave = async () => {
    if (!editForm.accident_id) {
      setError('사고 ID가 없습니다.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch(`http://localhost:6001/api/investigation/${editForm.accident_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '조사보고서 저장에 실패했습니다.');
      }

      const data = await response.json();
      setReport(data.data || editForm);
      setEditMode(false);
      setSaveSuccess(true);
      
      // 성공 메시지 3초 후 자동 숨김
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);

    } catch (err) {
      console.error('조사보고서 저장 오류:', err);
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (accidentId) {
      fetchReport();
    }
  }, [accidentId]);

  // 상태별 색상 반환
  const getStatusColor = (status?: string) => {
    switch (status) {
      case '조사 착수': return 'bg-blue-100 text-blue-800';
      case '조사 진행중': return 'bg-yellow-100 text-yellow-800';
      case '대책 이행중': return 'bg-purple-100 text-purple-800';
      case '완료': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 피해 정도별 색상 반환
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case '사망': return 'bg-red-100 text-red-800';
      case '중상': return 'bg-orange-100 text-orange-800';
      case '경상': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">조사보고서를 불러오는 중...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">조사보고서 상세</h1>
          <Link href="/investigation" className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium transition-colors">
            목록으로 돌아가기
          </Link>
        </div>
        
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{error || '조사보고서를 찾을 수 없습니다.'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">조사보고서 상세</h1>
          <p className="text-gray-600 mt-1">사고번호: {report.investigation_global_accident_no || report.accident_id}</p>
        </div>
        <div className="flex space-x-2">
          <Link href="/investigation" className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium transition-colors">
            목록으로 돌아가기
          </Link>
          {editMode ? (
            <>
              <button
                onClick={toggleEditMode}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
                disabled={saving}
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </>
          ) : (
            <button
              onClick={toggleEditMode}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              편집 모드
            </button>
          )}
        </div>
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

      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">조사보고서가 성공적으로 저장되었습니다.</p>
            </div>
          </div>
        </div>
      )}

      {/* 조사 기본 정보 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-semibold">조사 기본 정보</h2>
          {editMode ? (
            <select
              name="investigation_status"
              value={editForm.investigation_status || ''}
              onChange={handleInputChange}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">상태 선택</option>
              <option value="조사 착수">조사 착수</option>
              <option value="조사 진행중">조사 진행중</option>
              <option value="대책 이행중">대책 이행중</option>
              <option value="완료">완료</option>
            </select>
          ) : (
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(report.investigation_status)}`}>
              {report.investigation_status || '미정'}
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">조사팀장</label>
            {editMode ? (
              <input
                type="text"
                name="investigation_team_lead"
                value={editForm.investigation_team_lead || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="조사팀장 이름"
              />
            ) : (
              <div className="text-gray-900">{report.investigation_team_lead || '-'}</div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">조사팀원</label>
            {editMode ? (
              <input
                type="text"
                name="investigation_team_members"
                value={editForm.investigation_team_members || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="조사팀원 (쉼표로 구분)"
              />
            ) : (
              <div className="text-gray-900">{report.investigation_team_members || '-'}</div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">조사 장소</label>
            {editMode ? (
              <input
                type="text"
                name="investigation_location"
                value={editForm.investigation_location || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="조사 장소"
              />
            ) : (
              <div className="text-gray-900">{report.investigation_location || '-'}</div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">조사 시작일</label>
            {editMode ? (
              <div>
                <input
                  type="date"
                  name="investigation_start_time"
                  value={editForm.investigation_start_time ? new Date(editForm.investigation_start_time).toISOString().slice(0, 10) : ''}
                  onChange={handleDateChange}
                  onClick={handleDateClick}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                />
              </div>
            ) : (
              <div className="text-gray-900">
                {report.investigation_start_time 
                  ? new Date(report.investigation_start_time).toLocaleDateString('ko-KR')
                  : '-'
                }
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">조사 종료일</label>
            {editMode ? (
              <div>
                <input
                  type="date"
                  name="investigation_end_time"
                  value={editForm.investigation_end_time ? new Date(editForm.investigation_end_time).toISOString().slice(0, 10) : ''}
                  onChange={handleDateChange}
                  onClick={handleDateClick}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                />
              </div>
            ) : (
              <div className="text-gray-900">
                {report.investigation_end_time 
                  ? new Date(report.investigation_end_time).toLocaleDateString('ko-KR')
                  : '진행중'
                }
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">보고서 작성일</label>
            {editMode ? (
              <div>
                <input
                  type="date"
                  name="report_written_date"
                  value={editForm.report_written_date ? new Date(editForm.report_written_date).toISOString().slice(0, 10) : ''}
                  onChange={handleDateChange}
                  onClick={handleDateClick}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                />
              </div>
            ) : (
              <div className="text-gray-900">
                {report.report_written_date 
                  ? new Date(report.report_written_date).toLocaleDateString('ko-KR')
                  : '-'
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 사고 정보 비교 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">사고 정보 비교</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">구분</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">원본 정보</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">조사 수정 정보</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">사고번호</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{report.original_global_accident_no || '-'}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{report.investigation_global_accident_no || '-'}</td>
              </tr>
              
              <tr>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">발생일시</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {report.original_acci_time 
                    ? new Date(report.original_acci_time).toLocaleString('ko-KR')
                    : '-'
                  }
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {report.investigation_acci_time 
                    ? new Date(report.investigation_acci_time).toLocaleString('ko-KR')
                    : '-'
                  }
                </td>
              </tr>
              
              <tr>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">발생장소</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{report.original_acci_location || '-'}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{report.investigation_acci_location || '-'}</td>
              </tr>
              
              <tr>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">사고유형</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {report.original_accident_type_level1 && report.original_accident_type_level2
                    ? `${report.original_accident_type_level1} / ${report.original_accident_type_level2}`
                    : '-'
                  }
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {report.investigation_accident_type_level1 && report.investigation_accident_type_level2
                    ? `${report.investigation_accident_type_level1} / ${report.investigation_accident_type_level2}`
                    : '-'
                  }
                </td>
              </tr>
              
              <tr>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">재해자 수</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{report.original_victim_count || 0}명</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{report.investigation_victim_count || 0}명</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 사고 내용 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">사고 내용</h2>
        
        <div className="space-y-4">
          {/* 사고 발생 일시 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">사고 발생 일시</label>
              {editMode && (
                <button
                  type="button"
                  onClick={() => loadOriginalData('time')}
                  className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  원본 불러오기
                </button>
              )}
            </div>
            {editMode ? (
              <input
                type="datetime-local"
                name="investigation_acci_time"
                value={editForm.investigation_acci_time || ''}
                onChange={handleInputChange}
                onClick={handleDateClick}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
              />
            ) : (
              <div className="bg-blue-50 rounded-md p-3 text-sm text-gray-900">
                {report.investigation_acci_time 
                  ? new Date(report.investigation_acci_time).toLocaleString('ko-KR')
                  : '-'
                }
              </div>
            )}
          </div>

          {/* 사고 발생 위치 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">사고 발생 위치</label>
              {editMode && (
                <button
                  type="button"
                  onClick={() => loadOriginalData('location')}
                  className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  원본 불러오기
                </button>
              )}
            </div>
            {editMode ? (
              <input
                type="text"
                name="investigation_acci_location"
                value={editForm.investigation_acci_location || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="조사를 통해 수정된 사고 발생 위치를 입력하세요"
              />
            ) : (
              <div className="bg-blue-50 rounded-md p-3 text-sm text-gray-900">
                {report.investigation_acci_location || '-'}
              </div>
            )}
          </div>

          {/* 재해발생 형태 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">재해발생 형태</label>
              {editMode && (
                <button
                  type="button"
                  onClick={() => loadOriginalData('type1')}
                  className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  원본 불러오기
                </button>
              )}
            </div>
            {editMode ? (
              <select
                name="investigation_accident_type_level1"
                value={editForm.investigation_accident_type_level1 || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">선택하세요</option>
                <option value="인적">인적 (인명 피해)</option>
                <option value="물적">물적 (재산 피해)</option>
                <option value="복합">복합 (인적+물적)</option>
              </select>
            ) : (
              <div className="bg-blue-50 rounded-md p-3 text-sm text-gray-900">
                {report.investigation_accident_type_level1 || '-'}
              </div>
            )}
          </div>

          {/* 사고 유형 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">사고 유형</label>
              {editMode && (
                <button
                  type="button"
                  onClick={() => loadOriginalData('type2')}
                  className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  원본 불러오기
                </button>
              )}
            </div>
            {editMode ? (
              <select
                name="investigation_accident_type_level2"
                value={editForm.investigation_accident_type_level2 || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">선택하세요</option>
                <option value="떨어짐">떨어짐</option>
                <option value="넘어짐">넘어짐</option>
                <option value="부딪힘">부딪힘</option>
                <option value="맞음">맞음</option>
                <option value="무너짐">무너짐</option>
                <option value="끼임">끼임</option>
                <option value="감전">감전</option>
                <option value="터짐">터짐</option>
                <option value="깨짐·부서짐">깨짐·부서짐</option>
                <option value="타거나데임">타거나 데임</option>
                <option value="무리한동작">무리한 동작</option>
                <option value="이상온도물체접촉">이상온도 물체와의 접촉</option>
                <option value="화학물질누출접촉">화학물질 누출·접촉</option>
                <option value="산소결핍">산소결핍</option>
                <option value="빠짐익사">빠짐·익사</option>
                <option value="사업장내교통사고">사업장 내 교통사고</option>
                <option value="동물상해">동물상해</option>
                <option value="기타">기타</option>
              </select>
            ) : (
              <div className="bg-blue-50 rounded-md p-3 text-sm text-gray-900">
                {report.investigation_accident_type_level2 || '-'}
              </div>
            )}
          </div>
          
          {/* 사고 개요 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">사고 개요</label>
              {editMode && (
                <button
                  type="button"
                  onClick={() => loadOriginalData('summary')}
                  className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  원본 불러오기
                </button>
              )}
            </div>
            {editMode ? (
              <textarea
                name="investigation_acci_summary"
                value={editForm.investigation_acci_summary || ''}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="조사를 통해 수정된 사고 개요를 입력하세요"
              />
            ) : (
              <div className="bg-blue-50 rounded-md p-3 text-sm text-gray-900">
                {report.investigation_acci_summary || '-'}
              </div>
            )}
          </div>
          
          {/* 사고 상세 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">사고 상세</label>
              {editMode && (
                <button
                  type="button"
                  onClick={() => loadOriginalData('detail')}
                  className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  원본 불러오기
                </button>
              )}
            </div>
            {editMode ? (
              <textarea
                name="investigation_acci_detail"
                value={editForm.investigation_acci_detail || ''}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="조사를 통해 수정된 사고 상세 내용을 입력하세요"
              />
            ) : (
              <div className="bg-blue-50 rounded-md p-3 text-sm text-gray-900 whitespace-pre-wrap">
                {report.investigation_acci_detail || '-'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 피해 정보 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">피해 정보</h2>
        
        {/* 재해발생 형태에 따른 동적 표시 */}
        {(!report.investigation_accident_type_level1 || 
          report.investigation_accident_type_level1 === "인적" || 
          report.investigation_accident_type_level1 === "복합") && (
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-800 mb-4">인적 피해</h3>
            
            {/* 재해자 수 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">재해자 수</label>
                {editMode && (
                  <button
                    type="button"
                    onClick={() => loadOriginalData('victims')}
                    className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    원본 불러오기
                  </button>
                )}
              </div>
              {editMode ? (
                <input
                  type="number"
                  value={editForm.investigation_victim_count || 0}
                  onChange={(e) => handleVictimCountChange(parseInt(e.target.value) || 0)}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <div className="bg-blue-50 rounded-md p-3 text-sm text-gray-900">
                  {report.investigation_victim_count || 0}명
                </div>
              )}
            </div>

            {/* 재해자 정보 */}
            {(editForm.investigation_victim_count > 0 || report.investigation_victim_count > 0) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700">재해자 정보</h4>
                  {editMode && (
                    <div className="space-x-2">
                      <button
                        type="button"
                        onClick={addVictim}
                        className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                      >
                        재해자 추가
                      </button>
                    </div>
                  )}
                </div>
                
                {editMode ? (
                  <div className="space-y-4">
                    {(editForm.investigation_victims || []).map((victim, index) => (
                      <div key={index} className="border rounded-md p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-700">재해자 {index + 1}</h5>
                          {editForm.investigation_victims && editForm.investigation_victims.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeVictim(index)}
                              className="text-sm px-2 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">이름</label>
                            <input
                              type="text"
                              value={victim.name}
                              onChange={(e) => handleVictimChange(index, 'name', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              placeholder="재해자 이름"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">나이</label>
                            <input
                              type="number"
                              value={victim.age || ''}
                              onChange={(e) => handleVictimChange(index, 'age', parseInt(e.target.value) || 0)}
                              min="0"
                              max="100"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              placeholder="나이"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">소속</label>
                            <input
                              type="text"
                              value={victim.belong}
                              onChange={(e) => handleVictimChange(index, 'belong', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              placeholder="소속 부서/회사"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">직무</label>
                            <input
                              type="text"
                              value={victim.duty}
                              onChange={(e) => handleVictimChange(index, 'duty', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              placeholder="담당 업무"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">상해 정도</label>
                            <select
                              value={victim.injury_type}
                              onChange={(e) => handleVictimChange(index, 'injury_type', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">선택하세요</option>
                              <option value="경상">경상</option>
                              <option value="중상">중상</option>
                              <option value="사망">사망</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">보호구 착용</label>
                            <select
                              value={victim.ppe_worn}
                              onChange={(e) => handleVictimChange(index, 'ppe_worn', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">선택하세요</option>
                              <option value="착용">착용</option>
                              <option value="미착용">미착용</option>
                              <option value="부분착용">부분착용</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">휴업발생일</label>
                            <input
                              type="date"
                              value={victim.absence_start_date || ''}
                              onChange={(e) => handleVictimChange(index, 'absence_start_date', e.target.value)}
                              onClick={handleDateClick}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">복귀예정일</label>
                            <input
                              type="date"
                              value={victim.return_expected_date || ''}
                              onChange={(e) => handleVictimChange(index, 'return_expected_date', e.target.value)}
                              onClick={handleDateClick}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                            />
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-gray-600 mb-1">응급조치 내역</label>
                          <textarea
                            value={victim.first_aid}
                            onChange={(e) => handleVictimChange(index, 'first_aid', e.target.value)}
                            rows={2}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="응급조치 내용을 입력하세요"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                                ) : (
                  <div className="space-y-3">
                    {/* 재해자 정보가 있는 경우 표시 */}
                    {(report.investigation_victims && report.investigation_victims.length > 0) ? (
                      report.investigation_victims.map((victim, index) => (
                        <div key={index} className="bg-blue-50 rounded-md p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-700">재해자 {index + 1}: {victim.name || '미확인'}</h5>
                            {victim.injury_type && (
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(victim.injury_type)}`}>
                                {victim.injury_type}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div><span className="text-gray-600">나이:</span> {victim.age || '-'}세</div>
                            <div><span className="text-gray-600">소속:</span> {victim.belong || '-'}</div>
                            <div><span className="text-gray-600">직무:</span> {victim.duty || '-'}</div>
                            <div><span className="text-gray-600">보호구:</span> {victim.ppe_worn || '-'}</div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-2 gap-2 text-sm mt-2">
                            <div><span className="text-gray-600">휴업발생일:</span> {victim.absence_start_date || '-'}</div>
                            <div><span className="text-gray-600">복귀예정일:</span> {victim.return_expected_date || '-'}</div>
                          </div>
                          {victim.first_aid && (
                            <div className="mt-2 text-sm">
                              <span className="text-gray-600">응급조치:</span> {victim.first_aid}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-600 text-center">
                        재해자 정보가 없습니다.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 인적 피해 요약 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">피해 정도</label>
                {editMode ? (
                  <select
                    name="damage_severity"
                    value={editForm.damage_severity || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">선택하세요</option>
                    <option value="경상">경상</option>
                    <option value="중상">중상</option>
                    <option value="사망">사망</option>
                  </select>
                ) : (
                  <div>
                    {report.damage_severity ? (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(report.damage_severity)}`}>
                        {report.damage_severity}
                      </span>
                    ) : (
                      '-'
                    )}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사망자 수</label>
                {editMode ? (
                  <input
                    type="number"
                    name="death_count"
                    value={editForm.death_count || 0}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="text-gray-900">{report.death_count || 0}명</div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">부상자 수</label>
                {editMode ? (
                  <input
                    type="number"
                    name="injured_count"
                    value={editForm.injured_count || 0}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="text-gray-900">{report.injured_count || 0}명</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 물적 피해 (물적 또는 복합인 경우) */}
        {(report.investigation_accident_type_level1 === "물적" || 
          report.investigation_accident_type_level1 === "복합") && (
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-800 mb-4">물적 피해</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">피해 금액</label>
                {editMode ? (
                  <input
                    type="number"
                    name="damage_cost"
                    value={editForm.damage_cost || 0}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="피해 금액 (원)"
                  />
                ) : (
                  <div className="text-gray-900">
                    {report.damage_cost 
                      ? `${report.damage_cost.toLocaleString()}원`
                      : '-'
                    }
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">피해 상세</label>
                {editMode ? (
                  <textarea
                    name="injury_location_detail"
                    value={editForm.injury_location_detail || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="설비 손상, 생산 중단 등 구체적인 피해 내용"
                  />
                ) : (
                  <div className="text-gray-900">{report.injury_location_detail || '-'}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 원인 분석 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">원인 분석</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">직접 원인</label>
            {editMode ? (
              <textarea
                name="direct_cause"
                value={editForm.direct_cause || ''}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="사고의 직접적인 원인을 입력하세요"
              />
            ) : (
              <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-900 whitespace-pre-wrap">
                {report.direct_cause || '-'}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">근본 원인</label>
            {editMode ? (
              <textarea
                name="root_cause"
                value={editForm.root_cause || ''}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="사고의 근본적인 원인을 입력하세요"
              />
            ) : (
              <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-900 whitespace-pre-wrap">
                {report.root_cause || '-'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 대책 정보 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">대책 정보</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">재발방지대책</label>
            {editMode ? (
              <textarea
                name="corrective_actions"
                value={editForm.corrective_actions || ''}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="재발방지를 위한 구체적인 대책을 입력하세요"
              />
            ) : (
              <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-900 whitespace-pre-wrap">
                {report.corrective_actions || '-'}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">대책 이행 일정</label>
              {editMode ? (
                <input
                  type="text"
                  name="action_schedule"
                  value={editForm.action_schedule || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 2024년 3월 말까지"
                />
              ) : (
                <div className="text-gray-900">{report.action_schedule || '-'}</div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">대책 이행 확인자</label>
              {editMode ? (
                <input
                  type="text"
                  name="action_verifier"
                  value={editForm.action_verifier || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="확인자 이름"
                />
              ) : (
                <div className="text-gray-900">{report.action_verifier || '-'}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 조사 결론 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">조사 결론</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">조사 결론</label>
            {editMode ? (
              <textarea
                name="investigation_conclusion"
                value={editForm.investigation_conclusion || ''}
                onChange={handleInputChange}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="조사 결과에 대한 종합적인 결론을 입력하세요"
              />
            ) : (
              <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-900 whitespace-pre-wrap">
                {report.investigation_conclusion || '-'}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">조사자 서명</label>
              {editMode ? (
                <input
                  type="text"
                  name="investigator_signature"
                  value={editForm.investigator_signature || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="조사자 이름"
                />
              ) : (
                <div className="text-gray-900">{report.investigator_signature || '-'}</div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">조사 요약</label>
              {editMode ? (
                <input
                  type="text"
                  name="investigation_summary"
                  value={editForm.investigation_summary || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="조사 요약"
                />
              ) : (
                <div className="text-gray-900">{report.investigation_summary || '-'}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 하단 액션 버튼 */}
      <div className="flex justify-end space-x-4">
        <Link href={`/occurrence/${report.accident_id}`} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium transition-colors">
          원본 발생보고서 보기
        </Link>
        <button
          onClick={() => window.print()}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          인쇄/PDF 저장
        </button>
      </div>
    </div>
  );
} 