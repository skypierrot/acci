import React from 'react';
import { FormSectionProps, CompanySelectionProps } from '../../types/occurrence.types';
import { Company, Site } from '../../services/company.service';

interface BasicInfoSectionProps extends FormSectionProps, CompanySelectionProps {
  getDynamicGridClass: (groupName: string) => string;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  formData,
  onChange,
  isFieldVisible,
  isFieldRequired,
  getFieldLabel,
  getFieldsInGroup,
  companies,
  selectedCompany,
  companySearchTerm,
  showCompanyDropdown,
  siteSearchTerm,
  showSiteDropdown,
  onCompanySelect,
  onSiteSelect,
  onCompanySearchChange,
  onSiteSearchChange,
  setShowCompanyDropdown,
  setShowSiteDropdown,
  getDynamicGridClass,
  isMobile = false,
  currentStep = 0
}) => {
  // 실제 동적 그리드 열 수 계산
  const [gridCols, setGridCols] = React.useState(2);
  
  React.useEffect(() => {
    // useOccurrenceForm에서 처리된 설정 사용 (모바일 처리 포함)
    const basicInfoFields = getFieldsInGroup('조직정보');
    if (basicInfoFields.length > 0) {
      const gridCols = basicInfoFields[0].group_cols || 2;
      console.log('[BasicInfoSection] 처리된 열 수:', gridCols, '(모바일 처리 적용됨)');
      setGridCols(gridCols);
    }
  }, [getFieldsInGroup]);


  // 회사 필터링 - 검색어가 없으면 모든 회사 표시
  const filteredCompanies = companies.filter(company =>
    companySearchTerm === '' || company.name.toLowerCase().includes(companySearchTerm.toLowerCase())
  );

  // 사업장 필터링 - 검색어가 없으면 모든 사업장 표시
  const filteredSites = selectedCompany?.sites?.filter((site: Site) =>
    siteSearchTerm === '' || site.name.toLowerCase().includes(siteSearchTerm.toLowerCase())
  ) || [];

  // 조직정보 그룹의 필드들을 display_order 순으로 가져오기
  const basicInfoFields = getFieldsInGroup('조직정보');
  
  // 필드별 렌더링 함수
  const renderField = (field: any) => {
    const fieldName = field.field_name;
    
    // 필드가 보이지 않으면 렌더링하지 않음
    if (!isFieldVisible(fieldName)) return null;
    
    switch (fieldName) {
      case 'company_name':
        return (
          <div key={fieldName} className="relative">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              {getFieldLabel(fieldName, "회사명")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={companySearchTerm}
              onChange={onCompanySearchChange}
              onFocus={() => setShowCompanyDropdown(true)}
              onBlur={() => {
                setTimeout(() => setShowCompanyDropdown(false), 150);
              }}
              placeholder="회사명을 검색하세요"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required={isFieldRequired(fieldName)}
            />
            {showCompanyDropdown && companies.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredCompanies.map((company) => (
                  <div
                    key={company.id}
                    onClick={() => onCompanySelect(company)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    <div className="font-medium">{company.name}</div>
                    <div className="text-sm text-gray-500">코드: {company.code}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
        
      case 'site_name':
        return (
          <div key={fieldName} className="relative">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              {getFieldLabel(fieldName, "사업장명")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={siteSearchTerm}
              onChange={onSiteSearchChange}
              onFocus={() => selectedCompany && setShowSiteDropdown(true)}
              onBlur={() => {
                setTimeout(() => setShowSiteDropdown(false), 150);
              }}
              placeholder={selectedCompany ? "사업장명을 검색하세요" : "먼저 회사를 선택해주세요"}
              disabled={!selectedCompany}
              className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
              required={isFieldRequired(fieldName)}
            />
            {showSiteDropdown && selectedCompany?.sites?.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredSites.map((site) => (
                  <div
                    key={site.id}
                    onClick={() => onSiteSelect(site)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    <div className="font-medium">{site.name}</div>
                    <div className="text-sm text-gray-500">코드: {site.code}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
        
      case 'is_contractor':
        return (
          <div key={fieldName} className="relative w-full">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              {getFieldLabel(fieldName, "협력업체 여부")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              name={fieldName}
              value={formData.is_contractor ? "true" : "false"}
              onChange={onChange}
              className="appearance-none w-full border border-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={isFieldRequired(fieldName)}
            >
              <option value="false">아니오</option>
              <option value="true">예</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 12a1 1 0 01-.707-.293l-3-3a1 1 0 111.414-1.414L10 9.586l2.293-2.293a1 1 0 111.414 1.414l-3 3A1 1 0 0110 12z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        );
        
      case 'contractor_name':
        // 협력업체인 경우에만 표시
        if (!formData.is_contractor) return null;
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              {getFieldLabel(fieldName, "협력업체명")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              name={fieldName}
              value={formData.contractor_name}
              onChange={onChange}
              placeholder="협력업체명을 입력하세요"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required={isFieldRequired(fieldName) && formData.is_contractor}
            />
          </div>
        );
        
      case 'global_accident_no':
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              {getFieldLabel(fieldName, "전체사고코드")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              name={fieldName}
              value={formData.global_accident_no}
              readOnly
              disabled
              className="w-full border border-gray-300 bg-gray-100 rounded-md px-3 py-2"
              placeholder={selectedCompany ? "회사 선택 시 자동 생성됩니다" : "회사를 먼저 선택해주세요"}
              required={isFieldRequired(fieldName)}
            />
            <p className="text-xs text-gray-500 mt-1">
              형식: [회사코드]-[연도]-[순번3자리]
            </p>
          </div>
        );
        
      case 'accident_id':
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              {getFieldLabel(fieldName, "사업장사고코드")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              name={fieldName}
              value={formData.accident_id}
              readOnly
              disabled
              className="w-full border border-gray-300 bg-gray-100 rounded-md px-3 py-2"
              placeholder={selectedCompany ? "사업장 선택 시 자동 생성됩니다" : "사업장을 먼저 선택해주세요"}
              required={isFieldRequired(fieldName)}
            />
            <p className="text-xs text-gray-500 mt-1">
              형식: [사업장코드]-[연도]-[순번3자리]
            </p>
          </div>
        );
        
      default:
        // 기타 필드들은 기본 input으로 처리
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              {getFieldLabel(fieldName, fieldName)}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              name={fieldName}
              value={(formData as any)[fieldName] || ''}
              onChange={onChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required={isFieldRequired(fieldName)}
            />
          </div>
        );
    }
  };

  return (
    <div className={`bg-gray-50 p-3 md:p-4 rounded-md mb-6 ${isMobile && currentStep !== 0 ? 'hidden' : ''}`}>
      <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">조직 정보</h2>
      
      {/* 동적 필드 렌더링 (display_order 순서대로) */}
      <div className="grid gap-4" style={{display: 'grid', gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`}}>
        {basicInfoFields.map(field => renderField(field))}
      </div>
    </div>
  );
};

export default BasicInfoSection; 