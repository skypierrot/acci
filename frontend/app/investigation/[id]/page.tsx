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
import { 
  InvestigationMobileStepNavigation, 
  InvestigationMobileStepButtons 
} from '../../../components/investigation/MobileNavigation';
import { InvestigationDataContext } from '../../../contexts/InvestigationContext';
import { getCompanies } from '../../../services/company.service';

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
    handleSave,
    handleVictimChange,
    addVictim,
    removeVictim,
    handleVictimCountChange,
    addPropertyDamage,
    removePropertyDamage,
    handlePropertyDamageChange,
    loadOriginalData,
    loadOriginalVictim,
    loadOriginalPropertyDamageItem
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
  
  // 모바일 스텝 네비게이션 핸들러
  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };
  
  const goToNextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 5)); // 총 6단계
  };
  
  const goToPrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">조사보고서를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">조사보고서를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  // 모바일, 편집모드 분기 렌더링
  if (isMobile && editMode) {
    // 모바일 + 편집모드: 섹션별로 currentStep에 따라 하나씩만 표시
    return (
      <div className="min-h-screen bg-gray-50">
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
          {/* 섹션별 조건부 렌더링 */}
          {currentStep === 0 && (
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
          {currentStep === 1 && (
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
          {currentStep === 2 && (
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
          {currentStep === 3 && (
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
          {currentStep === 4 && (
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
          {currentStep === 5 && (
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
          {currentStep === 6 && (
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
          {/* 모바일 네비게이션 */}
          <div className="no-print">
            <InvestigationMobileStepNavigation
              report={report}
              editMode={editMode}
              currentStep={currentStep}
              goToStep={goToStep}
              goToNextStep={goToNextStep}
              goToPrevStep={goToPrevStep}
              onSave={handleSave}
              saving={saving}
            />
          </div>
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