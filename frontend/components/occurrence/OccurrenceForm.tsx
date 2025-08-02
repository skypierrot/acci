"use client";

import React, { useState, useEffect } from 'react';
import { OccurrenceFormData } from '../../types/occurrence.types';
import { Attachment } from '../../types/file-uploader.types';
import { useOccurrenceForm } from '../../hooks/useOccurrenceForm';
import BasicInfoSection from './BasicInfoSection';
import AccidentInfoSection from './AccidentInfoSection';
import VictimInfoSection from './VictimInfoSection';
import PropertyDamageSection from './PropertyDamageSection';
import ReporterInfoSection from './ReporterInfoSection';
import AttachmentSection from './AttachmentSection';
import { 
  UnifiedMobileStepNavigation, 
  UnifiedMobileStepButtons,
  UnifiedStep 
} from '../UnifiedMobileNavigation';
import { getUnifiedSteps } from '../../utils/occurrence.utils';

interface OccurrenceFormProps {
  initialData?: Partial<OccurrenceFormData>;
  isEditMode?: boolean;
  reportId?: string;
}

export default function OccurrenceForm({ 
  initialData, 
  isEditMode = false, 
  reportId 
}: OccurrenceFormProps) {
  const [isClient, setIsClient] = useState(false);
  
  const {
    formData,
    setFormData,
    isSubmitting,
    error,
    setError,
    companies,
    selectedCompany,
    companySearchTerm,
    showCompanyDropdown,
    siteSearchTerm,
    showSiteDropdown,
    isMobile,
    currentStep,
    handleChange,
    handleVictimChange,
    addVictim,
    removeVictim,
    handlePropertyDamageChange,
    addPropertyDamage,
    removePropertyDamage,
    handleFileChange,
    handleCompanySelect,
    handleSiteSelect,
    handleSubmit,
    goToNextStep,
    goToPrevStep,
    goToStep,
    isFieldVisible,
    isFieldRequired,
    getFieldLabel,
    getFieldsInGroup,
    getDynamicGridClass,
    setOriginalData,
    setCompanySearchTerm,
    setShowCompanyDropdown,
    setSiteSearchTerm,
    setShowSiteDropdown,
    formSettings,
    formSettingsLoaded,
  } = useOccurrenceForm(isEditMode, reportId);

  // 클라이언트 마운트 확인
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 초기 데이터 설정 (수정 모드일 때)
  useEffect(() => {
    if (initialData && isEditMode) {
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
      
      // 원본 데이터 저장 (비교용)
      setOriginalData(initialData);
      
      // 회사/사업장 검색어 설정
      if (initialData.company_name) {
        setCompanySearchTerm(initialData.company_name);
      }
      if (initialData.site_name) {
        setSiteSearchTerm(initialData.site_name);
      }
    }
  }, [initialData, isEditMode, setFormData, setOriginalData, setCompanySearchTerm, setSiteSearchTerm]);

  const handleCompanySearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCompanySearchTerm(value);
    setFormData(prev => ({ ...prev, company_name: value }));
    setShowCompanyDropdown(true);
  };

  const handleSiteSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSiteSearchTerm(value);
    setFormData(prev => ({ ...prev, site_name: value }));
    setShowSiteDropdown(true);
  };

  // 첨부파일 변경 핸들러 (attachments 배열만 사용)
  const handleAttachmentsChange = (attachments: Attachment[]) => {
    if (handleFileChange) {
      handleFileChange(attachments);
    } else {
      setFormData(prev => ({ ...prev, attachments }));
    }
  };

  // 수정 모드 제출 핸들러
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(e);
  };

  // 에러 표시 컴포넌트
  const ErrorDisplay = () => {
    if (!error) return null;

    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">오류가 발생했습니다</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setError(null)}
                className="bg-red-100 px-2 py-1 text-xs font-medium text-red-800 rounded hover:bg-red-200"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 클라이언트가 마운트되지 않았으면 로딩 표시
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-gray-600">페이지를 로딩 중입니다...</p>
        </div>
      </div>
    );
  }

  // 통일된 스텝 가져오기
  const unifiedSteps = getUnifiedSteps(formData.accident_type_level1);
  const currentStepData = unifiedSteps[currentStep];

  // 모바일 분기 렌더링 (스텝별 표시 방식으로 통일)
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* 페이지 헤더 */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              사고 발생보고서 {isEditMode ? '수정' : '작성'}
            </h1>
            <p className="text-gray-600">
              {isEditMode 
                ? '보고서 내용을 수정하고 저장해주세요.' 
                : '사고 발생 시 즉시 작성하여 제출해주세요.'
              }
            </p>
          </div>

          {/* 에러 표시 */}
          <ErrorDisplay />

          {/* 통일된 모바일 스텝 네비게이션 */}
          <UnifiedMobileStepNavigation
            steps={unifiedSteps}
            currentStep={currentStep}
            goToStep={goToStep}
            isStepCompleted={(stepIndex) => {
              // 스텝 완료 상태 확인 로직 (기존 isStepCompleted 함수 활용)
              const step = unifiedSteps[stepIndex];
              if (!step) return false;
              
              switch (step.id) {
                case 'basic':
                  return !!(formData.company_name && formData.site_name);
                case 'accident':
                  return !!(formData.acci_time && formData.acci_location && formData.accident_type_level1);
                case 'victim':
                  return formData.accident_type_level1 === "인적" || formData.accident_type_level1 === "복합" 
                    ? formData.victim_count > 0 && formData.victims.length >= formData.victim_count
                    : true;
                case 'property':
                  return formData.accident_type_level1 === "물적" || formData.accident_type_level1 === "복합"
                    ? formData.property_damage_count > 0 && formData.property_damages.length >= formData.property_damage_count
                    : true;
                case 'reporter':
                  return !!(formData.reporter_name && formData.reporter_phone);
                case 'attachment':
                  return true; // 첨부파일은 선택사항
                default:
                  return false;
              }
            }}
          />

          {/* 현재 스텝에 해당하는 섹션만 표시 */}
          {currentStepData?.id === 'basic' && (
            <BasicInfoSection
              formData={formData}
              onChange={handleChange}
              isFieldVisible={isFieldVisible}
              isFieldRequired={isFieldRequired}
              getFieldLabel={getFieldLabel}
              getFieldsInGroup={getFieldsInGroup}
              companies={companies}
              selectedCompany={selectedCompany}
              companySearchTerm={companySearchTerm}
              showCompanyDropdown={showCompanyDropdown}
              siteSearchTerm={siteSearchTerm}
              showSiteDropdown={showSiteDropdown}
              onCompanySelect={handleCompanySelect}
              onSiteSelect={handleSiteSelect}
              onCompanySearchChange={handleCompanySearchChange}
              onSiteSearchChange={handleSiteSearchChange}
              setShowCompanyDropdown={setShowCompanyDropdown}
              setShowSiteDropdown={setShowSiteDropdown}
              getDynamicGridClass={getDynamicGridClass}
              isMobile={isMobile}
              currentStep={currentStep}
            />
          )}

          {currentStepData?.id === 'accident' && (
            <AccidentInfoSection
              formData={formData}
              onChange={handleChange}
              isFieldVisible={isFieldVisible}
              isFieldRequired={isFieldRequired}
              getFieldLabel={getFieldLabel}
              getFieldsInGroup={getFieldsInGroup}
              getDynamicGridClass={getDynamicGridClass}
              isMobile={isMobile}
              currentStep={currentStep}
            />
          )}

          {currentStepData?.id === 'victim' && (
            <VictimInfoSection
              formData={formData}
              onChange={handleChange}
              onVictimChange={handleVictimChange}
              onAddVictim={addVictim}
              onRemoveVictim={removeVictim}
              isFieldVisible={isFieldVisible}
              isFieldRequired={isFieldRequired}
              getFieldLabel={getFieldLabel}
              getFieldsInGroup={getFieldsInGroup}
              getDynamicGridClass={getDynamicGridClass}
              isMobile={isMobile}
              currentStep={currentStep}
            />
          )}

          {currentStepData?.id === 'property' && (
            <PropertyDamageSection
              formData={formData}
              onChange={handleChange}
              onPropertyDamageChange={handlePropertyDamageChange}
              onAddPropertyDamage={addPropertyDamage}
              onRemovePropertyDamage={removePropertyDamage}
              isFieldVisible={isFieldVisible}
              isFieldRequired={isFieldRequired}
              getFieldLabel={getFieldLabel}
              getFieldsInGroup={getFieldsInGroup}
              getDynamicGridClass={getDynamicGridClass}
              isMobile={isMobile}
              currentStep={currentStep}
            />
          )}

          {currentStepData?.id === 'reporter' && (
            <ReporterInfoSection
              formData={formData}
              onChange={handleChange}
              isFieldVisible={isFieldVisible}
              isFieldRequired={isFieldRequired}
              getFieldLabel={getFieldLabel}
              getFieldsInGroup={getFieldsInGroup}
              getDynamicGridClass={getDynamicGridClass}
              isMobile={isMobile}
              currentStep={currentStep}
            />
          )}

          {currentStepData?.id === 'attachment' && (
            <AttachmentSection
              formData={formData}
              onFileChange={handleAttachmentsChange}
              isFieldVisible={isFieldVisible}
              isFieldRequired={isFieldRequired}
              getFieldLabel={getFieldLabel}
              getFieldsInGroup={getFieldsInGroup}
              getDynamicGridClass={getDynamicGridClass}
              isMobile={isMobile}
              currentStep={currentStep}
            />
          )}

          {/* 통일된 모바일 하단 버튼 */}
          <UnifiedMobileStepButtons
            currentStep={currentStep}
            totalSteps={unifiedSteps.length}
            onPrev={goToPrevStep}
            onNext={goToNextStep}
            onSubmit={isEditMode ? handleEditSubmit : handleSubmit}
            isSubmitting={isSubmitting}
            editMode={isEditMode}
            submitText="제출"
          />
        </div>
      </div>
    );
  }

  // 데스크톱 렌더링 (기존 방식 유지)
  return (
    <div className="min-h-screen bg-gray-50">
      {/* max-w-7xl로 폭 통일 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 페이지 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            사고 발생보고서 {isEditMode ? '수정' : '작성'}
          </h1>
          <p className="text-gray-600">
            {isEditMode 
              ? '보고서 내용을 수정하고 저장해주세요.' 
              : '사고 발생 시 즉시 작성하여 제출해주세요.'
            }
          </p>
        </div>

        {/* 에러 표시 */}
        <ErrorDisplay />

        {/* 메인 폼 */}
        <form onSubmit={isEditMode ? handleEditSubmit : handleSubmit} className="space-y-6">
          {formSettingsLoaded ? (
            <>
              {/* 기본정보 섹션 */}
              <BasicInfoSection
                formData={formData}
                onChange={handleChange}
                isFieldVisible={isFieldVisible}
                isFieldRequired={isFieldRequired}
                getFieldLabel={getFieldLabel}
                getFieldsInGroup={getFieldsInGroup}
                companies={companies}
                selectedCompany={selectedCompany}
                companySearchTerm={companySearchTerm}
                showCompanyDropdown={showCompanyDropdown}
                siteSearchTerm={siteSearchTerm}
                showSiteDropdown={showSiteDropdown}
                onCompanySelect={handleCompanySelect}
                onSiteSelect={handleSiteSelect}
                onCompanySearchChange={handleCompanySearchChange}
                onSiteSearchChange={handleSiteSearchChange}
                setShowCompanyDropdown={setShowCompanyDropdown}
                setShowSiteDropdown={setShowSiteDropdown}
                getDynamicGridClass={getDynamicGridClass}
                isMobile={isMobile}
                currentStep={currentStep}
              />

              {/* 사고정보 섹션 */}
              <AccidentInfoSection
                formData={formData}
                onChange={handleChange}
                isFieldVisible={isFieldVisible}
                isFieldRequired={isFieldRequired}
                getFieldLabel={getFieldLabel}
                getFieldsInGroup={getFieldsInGroup}
                getDynamicGridClass={getDynamicGridClass}
                isMobile={isMobile}
                currentStep={currentStep}
              />

              {/* 재해자 정보 섹션 */}
              <VictimInfoSection
                formData={formData}
                onChange={handleChange}
                onVictimChange={handleVictimChange}
                onAddVictim={addVictim}
                onRemoveVictim={removeVictim}
                isFieldVisible={isFieldVisible}
                isFieldRequired={isFieldRequired}
                getFieldLabel={getFieldLabel}
                getFieldsInGroup={getFieldsInGroup}
                getDynamicGridClass={getDynamicGridClass}
                isMobile={isMobile}
                currentStep={currentStep}
              />

              {/* 물적피해 정보 섹션 */}
              <PropertyDamageSection
                formData={formData}
                onChange={handleChange}
                onPropertyDamageChange={handlePropertyDamageChange}
                onAddPropertyDamage={addPropertyDamage}
                onRemovePropertyDamage={removePropertyDamage}
                isFieldVisible={isFieldVisible}
                isFieldRequired={isFieldRequired}
                getFieldLabel={getFieldLabel}
                getFieldsInGroup={getFieldsInGroup}
                getDynamicGridClass={getDynamicGridClass}
                isMobile={isMobile}
                currentStep={currentStep}
              />

              {/* 보고자 정보 섹션 */}
              <ReporterInfoSection
                formData={formData}
                onChange={handleChange}
                isFieldVisible={isFieldVisible}
                isFieldRequired={isFieldRequired}
                getFieldLabel={getFieldLabel}
                getFieldsInGroup={getFieldsInGroup}
                getDynamicGridClass={getDynamicGridClass}
                isMobile={isMobile}
                currentStep={currentStep}
              />

              {/* 첨부파일 섹션 */}
              <AttachmentSection
                formData={formData}
                onFileChange={handleAttachmentsChange}
                isFieldVisible={isFieldVisible}
                isFieldRequired={isFieldRequired}
                getFieldLabel={getFieldLabel}
                getFieldsInGroup={getFieldsInGroup}
                getDynamicGridClass={getDynamicGridClass}
                isMobile={isMobile}
                currentStep={currentStep}
              />

              {/* 제출 버튼 */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-3 rounded-md text-base font-medium ${
                    isSubmitting
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-primary-700 text-white hover:bg-primary-800'
                  }`}
                >
                  {isSubmitting ? '제출 중...' : (isEditMode ? '저장' : '제출')}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-4"></div>
              <p className="text-gray-600">폼 설정을 로딩 중입니다...</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
} 