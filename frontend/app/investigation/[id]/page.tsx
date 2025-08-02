'use client';

import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'next/navigation';
import { useInvestigationData } from '../../../hooks/useInvestigationData';
import { useEditMode } from '../../../hooks/useEditMode';
import { 
  InvestigationHeader,
  AlertMessage,
  PropertyDamageSection,
  VictimSection,
  AccidentContentSection,
  InvestigationBasicInfoSection,
  AccidentComparisonSection,
  CauseAnalysisSection
} from '../../../components/investigation';
import AttachmentSection from '../../../components/investigation/AttachmentSection';
import { 
  InvestigationMobileStepNavigation, 
  InvestigationMobileStepButtons 
} from '../../../components/investigation/MobileNavigation';
import { 
  UnifiedMobileStepNavigation, 
  UnifiedMobileStepButtons,
  UnifiedStep 
} from '../../../components/UnifiedMobileNavigation';
import { InvestigationDataContext } from '../../../contexts/InvestigationContext';
import { getCompanies } from '../../../services/company.service';
import { 
  getFilteredInvestigationSteps, 
  adjustStepIndex,
  InvestigationStep 
} from '../../../utils/investigation.utils';

// 상태 색상 함수 (한국어 상태값 기준, 색상 순서 통일)
const getStatusColor = (status?: string) => {
  switch (status) {
    case '대기': return 'bg-slate-100 text-slate-800';      // 대기: 슬레이트
    case '조사진행': return 'bg-yellow-100 text-yellow-800';    // 조사진행: 노란색
    case '조사완료': return 'bg-blue-100 text-blue-800';        // 조사완료: 파란색
    case '대책이행': return 'bg-purple-100 text-purple-800';    // 대책이행: 보라색
    case '조치완료': return 'bg-emerald-100 text-emerald-800';  // 조치완료: 에메랄드
    default: return 'bg-gray-100 text-gray-800';            // 기본: 회색
  }
};

export default function InvestigationDetailPage() {
  const params = useParams();
  const accidentId = params.id as string;
  
  // 모바일 상태 관리
  const [isMobile, setIsMobile] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // 사업장 정보 상태
  const [siteCodeToName, setSiteCodeToName] = useState<Record<string, string>>({});
  const [previousAccidentType, setPreviousAccidentType] = useState<string>(''); // 이전 사고형태 추적
  
  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // 사업장 정보 가져오기
  useEffect(() => {
    const fetchSiteInfo = async () => {
      try {
        const companies = await getCompanies();
        console.log('가져온 회사 정보:', companies);
        
        // 사업장 코드와 이름을 매핑하는 객체 생성
        const siteCodeToNameMap: Record<string, string> = {};
        companies.forEach((company: any) => {
          if (company.sites && Array.isArray(company.sites)) {
            company.sites.forEach((site: any) => {
              siteCodeToNameMap[site.code] = site.name;
              console.log(`사업장 매핑: ${site.code} -> ${site.name}`);
            });
          }
        });
        
        console.log('최종 사업장 매핑:', siteCodeToNameMap);
        setSiteCodeToName(siteCodeToNameMap);
      } catch (error) {
        console.error('사업장 정보 조회 오류:', error);
        // API 실패 시 빈 객체로 설정 (사업장코드 그대로 표시)
        setSiteCodeToName({});
      }
    };
    
    fetchSiteInfo();
  }, []);
  
  // 데이터 관리 훅
  const {
    report,
    loading,
    error,
    saving,
    saveSuccess,
    saveReport
  } = useInvestigationData({ accidentId });
  
  // 편집 모드 관리 훅
  const {
    editMode,
    editForm,
    toggleEditMode,
    handleInputChange,
    handleDateChange,
    handleDateClick,
    handleVictimChange,
    addVictim,
    removeVictim,
    handleVictimCountChange,
    addPropertyDamage,
    removePropertyDamage,
    handlePropertyDamageChange,
    loadOriginalData,
    loadOriginalVictim,
    loadOriginalPropertyDamageItem,
    handleAttachmentsChange,
    handleSave
  } = useEditMode({ report, onSave: saveReport });

  const investigationDataContext = useContext(InvestigationDataContext);
  
  // 사업장명 가져오기 함수
  const getSiteName = (siteCode?: string) => {
    if (!siteCode) return '-';
    console.log(`사업장코드 ${siteCode}에 대한 매핑:`, siteCodeToName[siteCode]);
    // API에서 가져온 매핑이 있으면 사용, 없으면 사업장코드 그대로 표시
    return siteCodeToName[siteCode] || siteCode;
  };
  
  // 사업장코드 추출 함수 (사업장사고코드에서)
  const getSiteCode = (accidentId?: string) => {
    if (!accidentId) return null;
    const parts = accidentId.split('-');
    // HHH-CC-2025-002 형식에서 CC가 사업장코드 (두 번째 부분)
    if (parts.length >= 2) {
      return parts[1]; // 두 번째 부분이 사업장코드 (예: CC)
    }
    return parts[0]; // 폴백: 첫 번째 부분
  };
  
  // 상태 저장 성공 후 대시보드/목록 갱신
  const handleStatusSave = async () => {
    try {
      await handleSave(); // 기존 저장 로직 호출
      // 저장 성공 후 대시보드/목록 갱신
      if (investigationDataContext) {
        // 대시보드 전체 갱신 (조사보고서 + 개선조치 통계)
        await investigationDataContext.refreshDashboard();
        // 현재 페이지 목록 갱신
        await investigationDataContext.fetchInvestigations(1, '');
      }
    } catch (error) {
      console.error('상태 저장 및 대시보드 갱신 중 오류:', error);
    }
  };
  
  // 사고형태 변경 감지 및 스텝 자동 조정
  useEffect(() => {
    if (!report) return;
    
    // 현재 사고형태 (편집 모드일 때는 editForm 우선, 아니면 report)
    const currentAccidentType = editMode 
      ? (editForm?.investigation_accident_type_level1 || report.investigation_accident_type_level1 || report.original_accident_type_level1)
      : (report.investigation_accident_type_level1 || report.original_accident_type_level1);
    
    // 이전 사고형태와 다르면 스텝 조정
    if (previousAccidentType && previousAccidentType !== currentAccidentType) {
      console.log('[InvestigationDetailPage] 사고형태 변경 감지:', {
        previousAccidentType,
        currentAccidentType,
        currentStep
      });
      
      const adjustedStep = adjustStepIndex(currentStep, currentStep, previousAccidentType, currentAccidentType);
      
      if (adjustedStep !== currentStep) {
        console.log('[InvestigationDetailPage] 스텝 자동 조정:', {
          from: currentStep,
          to: adjustedStep
        });
        setCurrentStep(adjustedStep);
      }
    }
    
    // 현재 사고형태를 이전 사고형태로 저장
    setPreviousAccidentType(currentAccidentType);
  }, [editMode, editForm?.investigation_accident_type_level1, report?.investigation_accident_type_level1, report?.original_accident_type_level1, currentStep, previousAccidentType]);

  // 모바일 스텝 네비게이션 핸들러
  const goToStep = (stepIndex: number) => {
    // 현재 사고형태에 따른 필터링된 스텝 가져오기
    const currentAccidentType = editMode 
      ? (editForm?.investigation_accident_type_level1 || report?.investigation_accident_type_level1 || report?.original_accident_type_level1)
      : (report?.investigation_accident_type_level1 || report?.original_accident_type_level1);
    
    const filteredSteps = getFilteredInvestigationSteps(currentAccidentType);
    
    // 유효한 스텝 범위 내에서만 이동
    if (stepIndex >= 0 && stepIndex < filteredSteps.length) {
      setCurrentStep(stepIndex);
    }
  };
  
  const goToNextStep = () => {
    setCurrentStep(prev => {
      // 현재 사고형태에 따른 필터링된 스텝 가져오기
      const currentAccidentType = editMode 
        ? (editForm?.investigation_accident_type_level1 || report?.investigation_accident_type_level1 || report?.original_accident_type_level1)
        : (report?.investigation_accident_type_level1 || report?.original_accident_type_level1);
      
      const filteredSteps = getFilteredInvestigationSteps(currentAccidentType);
      
      // 다음 스텝으로 이동 (범위 체크)
      return Math.min(prev + 1, filteredSteps.length - 1);
    });
  };
  
  const goToPrevStep = () => {
    setCurrentStep(prev => {
      // 이전 스텝으로 이동 (범위 체크)
      return Math.max(prev - 1, 0);
    });
  };

  // 모바일 분기 렌더링 (편집 모드와 읽기 모드 모두 지원)
  if (isMobile) {
    // 현재 사고형태에 따른 스텝 필터링
    const currentAccidentType = editMode 
      ? (editForm?.investigation_accident_type_level1 || report.investigation_accident_type_level1 || report.original_accident_type_level1)
      : (report.investigation_accident_type_level1 || report.original_accident_type_level1);
    
    const filteredSteps = getFilteredInvestigationSteps(currentAccidentType);
    const currentStepData = filteredSteps[currentStep];

    // 통일된 스텝 형식으로 변환
    const unifiedSteps: UnifiedStep[] = filteredSteps.map(step => ({
      id: step.id,
      title: step.title,
      description: step.description
    }));

    // 모바일: 섹션별로 currentStep에 따라 하나씩만 표시
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* 헤더 */}
          <div className="mb-6 no-print">
            <InvestigationHeader 
              report={report}
              actionButtons={{
                editMode,
                saving,
                onToggleEditMode: toggleEditMode,
                onSave: handleStatusSave
              }}
            />
          </div>
          
          {/* 통일된 모바일 스텝 네비게이션 */}
          <UnifiedMobileStepNavigation
            steps={unifiedSteps}
            currentStep={currentStep}
            goToStep={goToStep}
            isStepCompleted={(stepIndex) => {
              const step = unifiedSteps[stepIndex];
              if (!step) return false;
              
              switch (step.id) {
                case 'basic':
                  return !!(report.investigation_start_time && report.investigation_team_lead);
                case 'content':
                  return !!(report.investigation_acci_summary && report.investigation_acci_detail);
                case 'victims':
                  return !!(report.investigation_victims && report.investigation_victims.length > 0);
                case 'damage':
                  return !!(report.investigation_property_damage && report.investigation_property_damage.length > 0);
                case 'analysis':
                  return !!(report.cause_analysis);
                case 'action':
                  return !!(report.prevention_actions);
                case 'conclusion':
                  return !!(report.investigation_conclusion);
                case 'attachments':
                  return !!(report.attachments && report.attachments.length > 0);
                default:
                  return false;
              }
            }}
          />
          
          {/* 섹션별 조건부 렌더링 - 필터링된 스텝에 따라 */}
          {currentStepData?.id === 'basic' && (
            <InvestigationBasicInfoSection
              report={report}
              editForm={editForm}
              editMode={editMode}
              onInputChange={handleInputChange}
              onDateChange={handleDateChange}
              onDateClick={handleDateClick}
              getStatusColor={getStatusColor}
            />
          )}
          
          {currentStepData?.id === 'content' && (
            <AccidentContentSection
              report={report}
              editForm={editForm}
              editMode={editMode}
              onInputChange={handleInputChange}
              onDateChange={handleDateChange}
              onDateClick={handleDateClick}
              onLoadOriginalData={loadOriginalData}
            />
          )}
          
          {currentStepData?.id === 'victims' && (
            <VictimSection
              report={report}
              editForm={editForm}
              editMode={editMode}
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
          )}
          
          {currentStepData?.id === 'damage' && (
            <PropertyDamageSection
              report={report}
              editForm={editForm}
              editMode={editMode}
              onInputChange={handleInputChange}
              onDateChange={handleDateChange}
              onDateClick={handleDateClick}
              onPropertyDamageChange={handlePropertyDamageChange}
              onAddPropertyDamage={addPropertyDamage}
              onRemovePropertyDamage={removePropertyDamage}
              onLoadOriginalData={loadOriginalData}
              onLoadOriginalPropertyDamageItem={loadOriginalPropertyDamageItem}
            />
          )}
          
          {currentStepData?.id === 'analysis' && (
            <CauseAnalysisSection
              report={report}
              editForm={editForm}
              editMode={editMode}
              onInputChange={handleInputChange}
              onDateChange={handleDateChange}
              onDateClick={handleDateClick}
              showCauseOnly={true}
            />
          )}
          
          {currentStepData?.id === 'action' && (
            <CauseAnalysisSection
              report={report}
              editForm={editForm}
              editMode={editMode}
              onInputChange={handleInputChange}
              onDateChange={handleDateChange}
              onDateClick={handleDateClick}
              showActionOnly={true}
            />
          )}
          
          {currentStepData?.id === 'conclusion' && (
            <CauseAnalysisSection
              report={report}
              editForm={editForm}
              editMode={editMode}
              onInputChange={handleInputChange}
              onDateChange={handleDateChange}
              onDateClick={handleDateClick}
              showConclusionOnly={true}
            />
          )}
          
          {currentStepData?.id === 'attachments' && (
            <AttachmentSection
              report={report}
              editForm={editForm}
              editMode={editMode}
              onAttachmentsChange={handleAttachmentsChange}
            />
          )}
          
          {/* 통일된 모바일 하단 버튼 */}
          <UnifiedMobileStepButtons
            currentStep={currentStep}
            totalSteps={unifiedSteps.length}
            onPrev={goToPrevStep}
            onNext={goToNextStep}
            onSubmit={handleStatusSave}
            isSubmitting={saving}
            editMode={editMode}
            showButtons={editMode}
            submitText="저장"
          />
        </div>
      </div>
    );
  }
  // 그 외(데스크톱, 모바일 뷰 모드): 모든 섹션 한 번에 렌더링
  return (
    <div className="min-h-screen bg-gray-50">
      {/* max-w-7xl로 폭 통일 */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8 no-print">
          <InvestigationHeader 
            report={report}
            actionButtons={{
              editMode,
              saving,
              onToggleEditMode: toggleEditMode,
              onSave: handleSave
            }}
          />
        </div>
        
        {/* 알림 메시지 */}
        {error && (
          <div className="mb-6 no-print">
            <AlertMessage type="error" message={error?.message || '알 수 없는 오류가 발생했습니다.'} />
          </div>
        )}
        
        {saveSuccess && (
          <div className="mb-6 no-print">
            <AlertMessage type="success" message="조사보고서가 성공적으로 저장되었습니다." />
          </div>
        )}

        {/* 보고서 컨테이너 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* 보고서 헤더 */}
          <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-8 py-6 text-white">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">
                {report.investigation_accident_name || report.original_accident_name || '사고조사보고서'}
              </h1>
              <div className="text-slate-100 text-sm">
                <p className="flex justify-center items-center gap-6">
                  <span>사업장명: {getSiteName(getSiteCode(report.investigation_accident_id || report.original_accident_id))}</span>
                  <span>전체사고코드: {report.investigation_global_accident_no || report.original_global_accident_no || report.accident_id || '-'}</span>
                  <span>사업장사고코드: {report.investigation_accident_id || report.original_accident_id || '-'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* 보고서 내용 */}
          <div className="section-spacing p-8">
            <InvestigationBasicInfoSection
              report={report}
              editForm={editForm}
              editMode={editMode}
              onInputChange={handleInputChange}
              onDateChange={handleDateChange}
              onDateClick={handleDateClick}
              getStatusColor={getStatusColor}
            />
            
            <AccidentContentSection
              report={report}
              editForm={editForm}
              editMode={editMode}
              onInputChange={handleInputChange}
              onDateChange={handleDateChange}
              onDateClick={handleDateClick}
              onLoadOriginalData={loadOriginalData}
            />
            
            {/* 인적사고 또는 복합사고인 경우에만 재해자정보 섹션 표시 */}
            {(report.investigation_accident_type_level1 === '인적사고' || 
              report.investigation_accident_type_level1 === '복합사고' ||
              report.original_accident_type_level1 === '인적사고' ||
              report.original_accident_type_level1 === '복합사고') && (
              <VictimSection
                report={report}
                editForm={editForm}
                editMode={editMode}
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
            )}
            
            {/* 물적사고 또는 복합사고인 경우에만 물적피해 섹션 표시 */}
            {(report.investigation_accident_type_level1 === '물적사고' || 
              report.investigation_accident_type_level1 === '복합사고' ||
              report.original_accident_type_level1 === '물적사고' ||
              report.original_accident_type_level1 === '복합사고') && (
              <PropertyDamageSection
                report={report}
                editForm={editForm}
                editMode={editMode}
                onInputChange={handleInputChange}
                onDateChange={handleDateChange}
                onDateClick={handleDateClick}
                onAddPropertyDamage={addPropertyDamage}
                onRemovePropertyDamage={removePropertyDamage}
                onPropertyDamageChange={handlePropertyDamageChange}
                onLoadOriginalData={loadOriginalData}
                onLoadOriginalPropertyDamageItem={loadOriginalPropertyDamageItem}
              />
            )}
            
            <CauseAnalysisSection
              report={report}
              editForm={editForm}
              editMode={editMode}
              onInputChange={handleInputChange}
              onDateChange={handleDateChange}
              onDateClick={handleDateClick}
              showCauseOnly={true}
            />
            
            <CauseAnalysisSection
              report={report}
              editForm={editForm}
              editMode={editMode}
              onInputChange={handleInputChange}
              onDateChange={handleDateChange}
              onDateClick={handleDateClick}
              showActionOnly={true}
            />
            
            <CauseAnalysisSection
              report={report}
              editForm={editForm}
              editMode={editMode}
              onInputChange={handleInputChange}
              onDateChange={handleDateChange}
              onDateClick={handleDateClick}
              showConclusionOnly={true}
            />

            {/* 파일첨부 섹션 - 데스크톱 뷰에도 추가 */}
            <AttachmentSection
              report={report}
              editForm={editForm}
              editMode={editMode}
              onAttachmentsChange={handleAttachmentsChange}
            />

            {/* 하단 저장/취소 버튼: 편집모드일 때만 표시 */}
            {editMode && (
              <div className="flex justify-end gap-2 mt-8 no-print">
                {/* 취소 버튼 */}
                <button
                  type="button"
                  onClick={toggleEditMode}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium bg-white hover:bg-gray-100"
                  disabled={saving}
                >
                  취소
                </button>
                {/* 저장 버튼 */}
                <button
                  type="button"
                  onClick={handleStatusSave}
                  className="px-4 py-2 bg-slate-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-slate-700"
                  disabled={saving}
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 