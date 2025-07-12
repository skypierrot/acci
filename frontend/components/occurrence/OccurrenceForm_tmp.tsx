"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOccurrenceForm } from "../../hooks/useOccurrenceForm";
import { OccurrenceFormData, Attachment } from "../../types/occurrence.types";
import BasicInfoSection from "./BasicInfoSection";
import AccidentInfoSection from "./AccidentInfoSection";
import VictimInfoSection from "./VictimInfoSection";
import PropertyDamageSection from "./PropertyDamageSection";
import AttachmentSection from "./AttachmentSection";
import ReporterInfoSection from "./ReporterInfoSection";
import { MobileStepNavigation, MobileStepButtons } from "./MobileNavigation";

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
  const router = useRouter();
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">페이지를 로딩 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 모바일 네비게이션 */}
      {isMobile && (
        <MobileStepNavigation
          formData={formData}
          currentStep={currentStep}
          isFieldRequired={isFieldRequired}
          goToStep={goToStep}
          goToNextStep={goToNextStep}
          goToPrevStep={goToPrevStep}
          onSubmit={isEditMode ? handleEditSubmit : handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}

      <div className={`container mx-auto px-4 py-6 ${isMobile ? 'pb-24' : ''}`}>
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
                onChange={handleChange}
                onFileChange={handleAttachmentsChange}
                isFieldVisible={isFieldVisible}
                isFieldRequired={isFieldRequired}
                getFieldLabel={getFieldLabel}
                getFieldsInGroup={getFieldsInGroup}
                isMobile={isMobile}
                currentStep={currentStep}
              />
            </>
          ) : (
            <div>양식 설정을 불러오는 중입니다...</div>
          )}

          {/* 데스크톱 제출 버튼 */}
          {!isMobile && (
            <div className="pt-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isSubmitting ? '저장 중...' : (isEditMode ? '수정 완료' : '보고서 제출')}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* 모바일 하단 버튼 */}
      {isMobile && (
        <MobileStepButtons
          currentStep={currentStep}
          isFieldRequired={isFieldRequired}
          formData={formData}
          goToPrevStep={goToPrevStep}
          goToNextStep={goToNextStep}
          goToStep={goToStep}
          onSubmit={isEditMode ? handleEditSubmit : handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
} 