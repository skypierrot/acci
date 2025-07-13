'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { InvestigationReport, VictimInfo } from '../../../types/investigation.types';
import { useEditMode } from '../../../hooks/useEditMode';
import { 
  InvestigationHeader,
  AlertMessage,
  PropertyDamageSection,
  VictimSection,
  AccidentContentSection,
  InvestigationBasicInfoSection,
  CauseAnalysisSection
} from '../../../components/investigation';
import { 
  InvestigationMobileStepNavigation
} from '../../../components/investigation/MobileNavigation';

// 기존 OccurrenceReport 인터페이스 유지
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
  property_damages?: any[]; // 물적 피해 정보 추가
  victims?: VictimInfo[]; // 재해자 정보 추가
  accident_name?: string; // 추가된 필드
}

// 상태 색상 함수 (편집 페이지에서 복사)
const getStatusColor = (status?: string) => {
  switch (status) {
    case '조사 착수':
      return 'bg-blue-100 text-blue-800';
    case '조사 진행중':
      return 'bg-yellow-100 text-yellow-800';
    case '대책 이행중':
      return 'bg-purple-100 text-purple-800';
    case '완료':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function CreateInvestigationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobile, setIsMobile] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // 발생보고서 관련 상태 (기존 유지)
  const [selectedOccurrence, setSelectedOccurrence] = useState<OccurrenceReport | null>(null);
  const [occurrenceReports, setOccurrenceReports] = useState<OccurrenceReport[]>([]);
  const [showOccurrenceList, setShowOccurrenceList] = useState(false);
  
  // 로딩/에러/성공 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // 빈 보고서 초기화 (편집 페이지의 report 구조 사용)
  const initialReport: InvestigationReport = {
    accident_id: '',
    investigation_global_accident_no: '',
    investigation_team_lead: '',
    investigation_team_members: '',
    investigation_location: '',
    investigation_start_time: '',
    investigation_end_time: '',
    investigation_status: '조사 착수',
    damage_cost: 0,
    direct_cause: '',
    root_cause: '',
    corrective_actions: '',
    action_schedule: '',
    action_verifier: '',
    investigation_conclusion: '',
    investigator_signature: '',
    investigation_victim_count: 0,
    investigation_victims: [],
    property_damages: [],
    // 기타 필드 초기화
    investigation_acci_time: '',
    investigation_acci_location: '',
    investigation_accident_type_level1: '',
    investigation_accident_type_level2: '',
    investigation_acci_summary: '',
    investigation_acci_detail: '',
    // 원본 필드 (발생보고서 선택 시 채움)
    original_acci_time: '',
    original_acci_location: '',
    original_accident_type_level1: '',
    original_accident_type_level2: '',
    original_acci_summary: '',
    original_acci_detail: '',
    original_victim_count: 0,
    original_victims: []
  };
  
  // useEditMode 훅 사용 (생성 모드로 초기 report 전달)
  const {
    editMode,
    editForm,
    toggleEditMode,
    handleInputChange,
    handleDateChange,
    handleDateClick,
    handleSave: handleEditSave,
    handleVictimChange,
    addVictim,
    removeVictim,
    handleVictimCountChange,
    addPropertyDamage,
    removePropertyDamage,
    handlePropertyDamageChange,
    loadOriginalData,
    updateOriginalVictims,
    loadOriginalVictim,
    loadOriginalPropertyDamageItem
  } = useEditMode({
    report: initialReport,
    onSave: async (data) => {
      await handleCreate(data);
    }
  });
  
  // 모바일 감지 (편집 페이지에서 복사)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // 발생보고서 목록 조회 (기존 함수 유지)
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
    fetchOccurrenceReports();
  }, []);
  
  // 발생보고서 상세 정보 fetch 및 선택 핸들러
  const handleOccurrenceSelect = async (accident_id: string) => {
    try {
      // 상세 API 호출로 victims, property_damages 등 모든 정보 포함
      const response = await fetch(`/api/occurrence/${accident_id}`);
      if (!response.ok) {
        throw new Error('상세 발생보고서 조회 실패');
      }
      const occurrence = await response.json();
      handleSelectOccurrence(occurrence);
    } catch (error) {
      console.error('[에러] 발생보고서 상세 조회 실패:', error);
    }
  };

  // URL 파라미터 처리 및 자동 선택 (상세 fetch로 변경)
  useEffect(() => {
    if (occurrenceReports.length > 0) {
      const fromAccidentId = searchParams.get('from');
      if (fromAccidentId) {
        handleOccurrenceSelect(fromAccidentId);
      }
    }
  }, [searchParams, occurrenceReports]);
  
  // 발생보고서 선택 핸들러 (핸들러 기반 복원: victims, property_damages 모두 반영)
  const handleSelectOccurrence = (occurrence: OccurrenceReport) => {
    setSelectedOccurrence(occurrence);
    setShowOccurrenceList(false);

    // 1. 단일 필드(기본 조사정보 및 원본 필드) 업데이트
    handleInputChange({ target: { name: 'accident_id', value: occurrence.accident_id } } as any);
    handleInputChange({ target: { name: 'investigation_global_accident_no', value: occurrence.global_accident_no } } as any);
    handleDateChange({ target: { name: 'investigation_acci_time', value: occurrence.acci_time } } as any);
    handleInputChange({ target: { name: 'investigation_acci_location', value: occurrence.acci_location } } as any);
    handleInputChange({ target: { name: 'investigation_accident_type_level1', value: occurrence.accident_type_level1 } } as any);
    handleInputChange({ target: { name: 'investigation_accident_type_level2', value: occurrence.accident_type_level2 } } as any);
    handleInputChange({ target: { name: 'investigation_acci_summary', value: occurrence.acci_summary } } as any);
    handleInputChange({ target: { name: 'investigation_acci_detail', value: occurrence.acci_detail } } as any);
    
    // 사고명 필드 복사 (원본 및 조사 사고명 모두)
    handleInputChange({ target: { name: 'original_accident_name', value: occurrence.accident_name } } as any);
    handleInputChange({ target: { name: 'investigation_accident_name', value: occurrence.accident_name } } as any);
    
    // 원본 필드
    handleInputChange({ target: { name: 'original_acci_time', value: occurrence.acci_time } } as any);
    handleInputChange({ target: { name: 'original_acci_location', value: occurrence.acci_location } } as any);
    handleInputChange({ target: { name: 'original_accident_type_level1', value: occurrence.accident_type_level1 } } as any);
    handleInputChange({ target: { name: 'original_accident_type_level2', value: occurrence.accident_type_level2 } } as any);
    handleInputChange({ target: { name: 'original_acci_summary', value: occurrence.acci_summary } } as any);
    handleInputChange({ target: { name: 'original_acci_detail', value: occurrence.acci_detail } } as any);
    handleInputChange({ target: { name: 'original_victim_count', value: occurrence.victim_count.toString() } } as any);

    // 2. 재해자 정보(victims) 반영
    // victims_json 우선, 없으면 victims 배열 사용
    const victims: VictimInfo[] = occurrence.victims_json
      ? JSON.parse(occurrence.victims_json)
      : (occurrence.victims || []);
    // 재해자 수 동기화
    handleVictimCountChange(occurrence.victim_count);
    // 각 재해자 정보를 개별 핸들러로 반영
    victims.forEach((victim: VictimInfo, index: number) => {
      Object.entries(victim).forEach(([field, value]) => {
        handleVictimChange(index, field as keyof VictimInfo, value);
      });
    });
    // 원본 재해자 정보 저장
    updateOriginalVictims(victims);

    // 3. 물적피해 정보(property_damages) 반영 (실제 값으로 바로 할당)
    if (occurrence.property_damages && Array.isArray(occurrence.property_damages)) {
      // 1) property_damages 배열을 실제 값으로 바로 할당
      handleInputChange({ target: { name: 'property_damages', value: occurrence.property_damages } } as any);
      // 2) investigation_property_damage에도 복사 (id 필드 변환 포함)
      const mappedDamages = occurrence.property_damages.map((damage: any) => ({
        ...damage,
        id: damage.id || (damage.damage_id ? String(damage.damage_id) : undefined), // id 필드가 없으면 damage_id를 id로 변환
      }));
      handleInputChange({ target: { name: 'investigation_property_damage', value: mappedDamages } } as any);
      // 3) (필요하다면) 각 항목을 id 기반으로 개별 핸들러로 동기화
      mappedDamages.forEach((damage: any) => {
        const id = String(damage.id || '');
        if (!id) return;
        Object.entries(damage).forEach(([field, value]) => {
          if (field !== 'id' && field !== 'damage_id') {
            handlePropertyDamageChange(id, field as any, String(value));
          }
        });
      });
    }
    console.log('[점검] 선택된 victims:', victims);
    console.log('[점검] 선택된 property_damages:', occurrence.property_damages);
  };
  
  // 생성 핸들러 (기존 handleSubmit 기반, 훅 통합)
  const handleCreate = async (formData: Partial<InvestigationReport>) => {
    if (!selectedOccurrence) {
      setError('발생보고서를 선택해주세요.');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // investigation_property_damage 전송 데이터 가공 (id -> damage_id, 불필요 필드 제거)
      let investigationPropertyDamage = (formData.investigation_property_damage || []).map((item: any) => {
        // id만 있고 damage_id가 없으면 변환
        const damage_id = item.damage_id || item.id || undefined;
        // DB에 없는 불필요한 필드 목록 (프론트엔드 전용)
        const {
          id, // 프론트엔드 임시 식별자
          __tempKey, // 혹시 있을 수 있는 임시 키
          selected, // UI 체크박스 등
          ...rest
        } = item;
        return {
          ...rest,
          damage_id: damage_id ? String(damage_id) : undefined,
        };
      });
      // undefined damage_id는 제외
      investigationPropertyDamage = investigationPropertyDamage.filter((d: any) => d.damage_id);
      // saveData에 반영
      const saveData = {
        ...formData,
        investigation_property_damage: investigationPropertyDamage,
        injury_location_detail: formData.property_damages && formData.property_damages.length > 0 
          ? JSON.stringify({
              property_damages: formData.property_damages,
              legacy_detail: formData.injury_location_detail || ''
            })
          : formData.injury_location_detail || ''
      };
      delete saveData.property_damages;
      
      const response = await fetch(`/api/investigation/from-occurrence/${formData.accident_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          setError(`${errorData.message} 기존 보고서 페이지로 이동합니다...`);
          setTimeout(() => router.push(`/investigation/${formData.accident_id}`), 2000);
          return;
        }
        throw new Error(errorData.message || '조사보고서 생성 실패');
      }
      
      const data = await response.json();
      setSuccess('조사보고서가 생성되었습니다.');
      setTimeout(() => router.push(`/investigation/${formData.accident_id}`), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setSaving(false);
    }
  };
  

  
  // 렌더링 부분 (편집 페이지 구조 복사, 생성에 맞게 조정)
  // 발생보고서 선택 UI (기존 유지, 섹션 위에 배치)
  if (!selectedOccurrence) {
    return (
      <div className="space-y-6 p-4">
        <h1 className="text-2xl font-bold">새 조사보고서 생성</h1>
        {/* 기존 발생보고서 선택 UI */}
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
                        onClick={() => handleOccurrenceSelect(report.accident_id)}
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
                    handleInputChange({ target: { name: 'accident_id', value: '' } } as any);
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  변경
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // 메인 렌더링 (편집 페이지와 유사)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 헤더 (편집 페이지 컴포넌트 사용, 생성 모드 표시) */}
        <InvestigationHeader 
          report={editForm as InvestigationReport}
          actionButtons={{
            editMode: true,
            saving,
            onToggleEditMode: () => {},
            onSave: () => handleCreate(editForm)
          }}
        />
        
        {/* 알림 (기존 유지, 컴포넌트 사용) */}
        {error && <AlertMessage type="error" message={error} />}
        {success && <AlertMessage type="success" message={success} />}
        
        {/* 보고서 내용 (섹션 컴포넌트 사용) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
            <h1 className="text-2xl font-bold text-center">새 사고조사보고서</h1>
          </div>
          <div className="p-8 space-y-8">
            <InvestigationBasicInfoSection
              report={editForm as InvestigationReport}
              editForm={editForm}
              editMode={true}
              onInputChange={handleInputChange}
              onDateChange={handleDateChange}
              onDateClick={handleDateClick}
              getStatusColor={getStatusColor}
            />
            <AccidentContentSection
              report={editForm as InvestigationReport}
              editForm={editForm}
              editMode={true}
              onInputChange={handleInputChange}
              onDateChange={handleDateChange}
              onDateClick={handleDateClick}
              onLoadOriginalData={loadOriginalData}
            />
            <VictimSection
              report={editForm as InvestigationReport}
              editForm={editForm}
              editMode={true}
              onInputChange={handleInputChange}
              onDateChange={handleDateChange}
              onDateClick={handleDateClick}
              onVictimChange={handleVictimChange}
              onAddVictim={addVictim}
              onRemoveVictim={removeVictim}
              onVictimCountChange={handleVictimCountChange}
              onLoadOriginalData={loadOriginalData}
              onLoadOriginalVictim={loadOriginalVictim}
            />
            <PropertyDamageSection
              report={editForm as InvestigationReport}
              editForm={editForm}
              editMode={true}
              onInputChange={handleInputChange}
              onDateChange={handleDateChange}
              onDateClick={handleDateClick}
              onAddPropertyDamage={addPropertyDamage}
              onRemovePropertyDamage={removePropertyDamage}
              onPropertyDamageChange={handlePropertyDamageChange}
              onLoadOriginalData={loadOriginalData}
              onLoadOriginalPropertyDamageItem={loadOriginalPropertyDamageItem}
            />
            <CauseAnalysisSection
              report={editForm as InvestigationReport}
              editForm={editForm}
              editMode={true}
              onInputChange={handleInputChange}
              onDateChange={handleDateChange}
              onDateClick={handleDateClick}
            />
          </div>
        </div>
        
        {/* 모바일 네비게이션 (필요 시) */}
        {isMobile && (
          <InvestigationMobileStepNavigation
            report={editForm as InvestigationReport}
            editMode={true}
            currentStep={currentStep}
            goToStep={setCurrentStep}
            goToNextStep={() => setCurrentStep(prev => prev + 1)}
            goToPrevStep={() => setCurrentStep(prev => prev - 1)}
            onSave={() => handleCreate(editForm)}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
} 