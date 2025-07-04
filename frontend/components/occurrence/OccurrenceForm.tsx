"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOccurrenceForm } from "../../hooks/useOccurrenceForm";
import { OccurrenceFormData } from "../../types/occurrence.types";
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
    setShowSiteDropdown
  } = useOccurrenceForm(isEditMode);

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

  // 특별 핸들러들 (신규 작성 페이지와 동일)
  const handleAcciTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, acciTime: value }));
  };

  const handleCompanySearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCompanySearchTerm(value);
    setFormData(prev => ({ ...prev, company: value }));
    setShowCompanyDropdown(true);
  };

  const handleSiteSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSiteSearchTerm(value);
    setFormData(prev => ({ ...prev, site: value }));
    setShowSiteDropdown(true);
  };

  // 수정 모드 제출 핸들러
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportId) return;

    try {
      setError(null);
      
      // 1단계: 보고서 데이터 수정
      const response = await fetch(`/api/occurrence/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('수정에 실패했습니다.');
      }

      // 2단계: 업로드된 파일들을 보고서에 첨부 (수정 모드에서도 필요)
      const fileFields = ['scene_photos', 'cctv_video', 'statement_docs', 'etc_documents'];
      const allFileIds: string[] = [];

      // 각 파일 필드에서 파일 ID 수집
      fileFields.forEach(fieldName => {
        const fieldValue = formData[fieldName as keyof typeof formData];
        if (Array.isArray(fieldValue) && fieldValue.length > 0) {
          // 문자열 배열인지 확인 (파일 ID 배열)
          if (fieldValue.every(item => typeof item === 'string')) {
            allFileIds.push(...(fieldValue as string[]));
          }
        }
      });

      console.log('[수정 모드] 첨부할 파일 ID들:', allFileIds);

      // 파일이 있는 경우에만 첨부 API 호출
      if (allFileIds.length > 0) {
        try {
          const attachResponse = await fetch('http://192.168.100.200:6001/api/files/attach', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileIds: allFileIds,
              reportId: reportId,
              reportType: 'occurrence'
            }),
          });

          if (!attachResponse.ok) {
            console.error('파일 첨부 실패, 하지만 보고서는 수정됨');
            // 파일 첨부 실패해도 보고서 수정은 성공했으므로 경고만 표시
            alert('보고서는 수정되었지만 일부 파일 첨부에 실패했습니다.');
          } else {
            const attachResult = await attachResponse.json();
            console.log('[수정 모드] 파일 첨부 성공:', attachResult);
          }
        } catch (attachError) {
          console.error('[수정 모드] 파일 첨부 중 오류:', attachError);
          // 파일 첨부 실패해도 보고서는 수정됨
        }
      }

      alert('보고서가 성공적으로 수정되었습니다.');
      router.push(`/occurrence/${reportId}`);
    } catch (error) {
      console.error('수정 오류:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    }
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
            onAcciTimeChange={handleAcciTimeChange}
            isFieldVisible={isFieldVisible}
            isFieldRequired={isFieldRequired}
            getFieldLabel={getFieldLabel}
            getFieldsInGroup={getFieldsInGroup}
            getDynamicGridClass={getDynamicGridClass}
            isMobile={isMobile}
            currentStep={currentStep}
          />

          {/* 재해자정보 섹션 */}
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
            isMobile={isMobile}
            currentStep={currentStep}
          />

          {/* 재해발생형태가 물적/복합일 때만 물적피해 입력 섹션 */}
          {(formData.accident_type_level1 === '물적' || formData.accident_type_level1 === '복합') && (
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
              isMobile={isMobile}
              currentStep={currentStep}
            />
          )}

          {/* 첨부파일 섹션 */}
          <AttachmentSection
            formData={formData}
            onChange={handleChange}
            onFileChange={handleFileChange}
            isFieldVisible={isFieldVisible}
            isFieldRequired={isFieldRequired}
            getFieldLabel={getFieldLabel}
            getFieldsInGroup={getFieldsInGroup}
            isMobile={isMobile}
            currentStep={currentStep}
          />

          {/* 보고자정보 섹션 */}
          <ReporterInfoSection
            formData={formData}
            onChange={handleChange}
            isFieldVisible={isFieldVisible}
            isFieldRequired={isFieldRequired}
            getFieldLabel={getFieldLabel}
            getFieldsInGroup={getFieldsInGroup}
            isMobile={isMobile}
            currentStep={currentStep}
          />

          {/* 데스크톱 제출 버튼 */}
          {!isMobile && (
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => router.push(isEditMode ? `/occurrence/${reportId}` : '/dashboard')}
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-3 rounded-md text-white font-medium ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? (isEditMode ? '수정 중...' : '제출 중...') : (isEditMode ? '수정 완료' : '제출')}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* 모바일 하단 버튼 */}
      {isMobile && (
        <MobileStepButtons
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
    </div>
  );
} 