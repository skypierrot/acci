'use client';

import React, { useState, useEffect } from 'react';
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

// 상태 색상 함수
const getStatusColor = (status?: string) => {
  switch (status) {
    case '조사 착수': return 'bg-blue-100 text-blue-800';
    case '조사 진행중': return 'bg-yellow-100 text-yellow-800';
    case '대책 이행중': return 'bg-purple-100 text-purple-800';
    case '완료': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function InvestigationDetailPage() {
  const params = useParams();
  const accidentId = params.id as string;
  
  // 모바일 상태 관리
  const [isMobile, setIsMobile] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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
    loadOriginalData
  } = useEditMode({ report, onSave: saveReport });
  
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 모바일 네비게이션 */}
      {isMobile && (
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
      )}
      
      <div className={`max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 ${isMobile ? 'pb-24' : ''}`}>
        {/* 헤더 */}
        <div className="mb-6">
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
          <div className="mb-6">
            <AlertMessage type="error" message={error} />
          </div>
        )}
        
        {saveSuccess && (
          <div className="mb-6">
            <AlertMessage type="success" message="조사보고서가 성공적으로 저장되었습니다." />
          </div>
        )}

        {/* 조사 기본 정보 - 스텝 0 */}
        <div className={`mb-6 ${isMobile && currentStep !== 0 ? 'hidden' : ''}`}>
          <InvestigationBasicInfoSection
            report={report}
            editForm={editForm}
            editMode={editMode}
            onInputChange={handleInputChange}
            onDateChange={handleDateChange}
            onDateClick={handleDateClick}
            getStatusColor={getStatusColor}
          />
        </div>

        {/* 사고 내용 - 스텝 1 */}
        <div className={`mb-6 ${isMobile && currentStep !== 1 ? 'hidden' : ''}`}>
          <div className="bg-white rounded-lg shadow p-6">
            <AccidentContentSection
              report={report}
              editForm={editForm}
              editMode={editMode}
              onInputChange={handleInputChange}
              onDateChange={handleDateChange}
              onDateClick={handleDateClick}
              onLoadOriginalData={loadOriginalData}
            />
          </div>
        </div>

        {/* 피해 정보 - 스텝 2 */}
        <div className={`bg-white shadow-sm rounded-lg mb-6 ${isMobile && currentStep !== 2 ? 'hidden' : ''}`}>
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium text-gray-900">피해 정보</h2>
                <p className="text-sm text-gray-500">재해자 및 물적피해 정보</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-8">
            {/* 재해자 정보 */}
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
            />

            {/* 물적피해 정보 */}
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
            />
          </div>
        </div>

                 {/* 원인 분석 - 스텝 3 */}
         <div className={`bg-white shadow-sm rounded-lg mb-6 ${isMobile && currentStep !== 3 ? 'hidden' : ''}`}>
           <div className="px-6 py-4 border-b border-gray-200">
             <h2 className="text-lg font-medium text-gray-900">원인 분석</h2>
             <p className="text-sm text-gray-500">직접원인 및 근본원인 분석</p>
           </div>
           <div className="px-6 py-6">
             <CauseAnalysisSection
               report={report}
               editForm={editForm}
               editMode={editMode}
               onInputChange={handleInputChange}
               onDateChange={handleDateChange}
               onDateClick={handleDateClick}
               showCauseOnly={true}
             />
           </div>
         </div>

         {/* 대책 정보 - 스텝 4 */}
         <div className={`bg-white shadow-sm rounded-lg mb-6 ${isMobile && currentStep !== 4 ? 'hidden' : ''}`}>
           <div className="px-6 py-4 border-b border-gray-200">
             <h2 className="text-lg font-medium text-gray-900">대책 정보</h2>
             <p className="text-sm text-gray-500">재발방지대책 및 이행계획</p>
           </div>
           <div className="px-6 py-6">
             <CauseAnalysisSection
               report={report}
               editForm={editForm}
               editMode={editMode}
               onInputChange={handleInputChange}
               onDateChange={handleDateChange}
               onDateClick={handleDateClick}
               showActionOnly={true}
             />
           </div>
         </div>

         {/* 조사 결론 - 스텝 5 */}
         <div className={`bg-white shadow-sm rounded-lg mb-6 ${isMobile && currentStep !== 5 ? 'hidden' : ''}`}>
           <div className="px-6 py-4 border-b border-gray-200">
             <h2 className="text-lg font-medium text-gray-900">조사 결론</h2>
             <p className="text-sm text-gray-500">조사 결과 및 종합 결론</p>
           </div>
           <div className="px-6 py-6">
             <CauseAnalysisSection
               report={report}
               editForm={editForm}
               editMode={editMode}
               onInputChange={handleInputChange}
               onDateChange={handleDateChange}
               onDateClick={handleDateClick}
               showConclusionOnly={true}
             />
           </div>
         </div>
      </div>
      
      {/* 모바일 하단 버튼 */}
      {isMobile && (
        <InvestigationMobileStepButtons
          report={report}
          editMode={editMode}
          currentStep={currentStep}
          goToStep={goToStep}
          goToNextStep={goToNextStep}
          goToPrevStep={goToPrevStep}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  );
} 