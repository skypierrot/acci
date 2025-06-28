/**
 * @file components/form-fields/BasicInfoFields.tsx
 * @description 기본정보 섹션의 필드 렌더링 컴포넌트
 */

import React from 'react';
import { FormFieldSetting } from '@/services/report_form.service';

interface BasicInfoFieldsProps {
  field: FormFieldSetting;
  formData: any;
  isFieldRequired: (fieldName: string) => boolean;
  getFieldLabel: (fieldName: string, defaultLabel: string) => string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleCompanySearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSiteSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setShowCompanyDropdown: (show: boolean) => void;
  setShowSiteDropdown: (show: boolean) => void;
  companySearchTerm: string;
  siteSearchTerm: string;
  showCompanyDropdown: boolean;
  showSiteDropdown: boolean;
  filteredCompanies: any[];
  filteredSites: any[];
  selectedCompany: any;
  handleCompanySelect: (company: any) => void;
  handleSiteSelect: (site: any) => void;
  companyDropdownRef: React.RefObject<HTMLDivElement>;
  siteDropdownRef: React.RefObject<HTMLDivElement>;
  isFieldVisible: (fieldName: string) => boolean;
  companies: any[];
  sites: any[];
  handleAcciTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  templateId?: string;
  isMobile?: boolean;
}

/**
 * 기본정보 필드 렌더링 컴포넌트
 */
const BasicInfoFields: React.FC<BasicInfoFieldsProps> = ({
  field,
  formData,
  isFieldRequired,
  getFieldLabel,
  handleChange,
  handleCompanySearchChange,
  handleSiteSearchChange,
  setShowCompanyDropdown,
  setShowSiteDropdown,
  companySearchTerm,
  siteSearchTerm,
  showCompanyDropdown,
  showSiteDropdown,
  filteredCompanies,
  filteredSites,
  selectedCompany,
  handleCompanySelect,
  handleSiteSelect,
  companyDropdownRef,
  siteDropdownRef,
  isFieldVisible,
  companies,
  sites,
  handleAcciTimeChange,
  templateId = 'standard',
  isMobile = false
}) => {
  const fieldName = field.field_name;

  // 공통 스타일
  const labelClass = "block text-sm font-medium text-gray-600 mb-1";
  const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const disabledInputClass = "w-full border border-gray-300 bg-gray-100 rounded-md px-3 py-2 text-sm shadow-sm";

  // 동적 레이아웃 계산
  const getLayoutClass = () => {
    const visibleFieldCount = [
      'global_accident_no',
      'accident_id', 
      'company_name',
      'site_name',
      'acci_time',
      'first_report_time'
    ].filter(field => isFieldVisible(field)).length;

    if (isMobile || visibleFieldCount <= 2) {
      return 'grid grid-cols-1 gap-4';
    } else if (visibleFieldCount <= 4) {
      return 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6';
    } else {
      // 템플릿에 따른 레이아웃
      switch (templateId) {
        case 'compact':
          return 'grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6';
        case 'mobile':
          return 'grid grid-cols-1 gap-4';
        default:
          return 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6';
      }
    }
  };

  switch (fieldName) {
    case 'company_name':
      return (
        <div ref={companyDropdownRef} className="relative">
          <label className={labelClass}>
            {getFieldLabel("company_name", "회사명")}
            {isFieldRequired("company_name") && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={companySearchTerm}
            onChange={handleCompanySearchChange}
            onFocus={() => setShowCompanyDropdown(true)}
            required={isFieldRequired("company_name")}
            className={inputClass}
            placeholder="회사명 검색"
          />
          {showCompanyDropdown && filteredCompanies.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredCompanies.map((company) => (
                <div
                  key={company.id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleCompanySelect(company)}
                >
                  {company.name}
                </div>
              ))}
            </div>
          )}
        </div>
      );

    case 'company_code':
      return (
        <>
          <label className={labelClass}>
            {getFieldLabel("company_code", "회사 코드")}
            {isFieldRequired("company_code") && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            name="company_code"
            value={formData.company_code}
            readOnly
            disabled
            className={disabledInputClass}
            required={isFieldRequired("company_code")}
          />
        </>
      );

    case 'site_name':
      return (
        <div ref={siteDropdownRef} className="relative">
          <label className={labelClass}>
            {getFieldLabel("site_name", "사업장명")}
            {isFieldRequired("site_name") && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={siteSearchTerm}
            onChange={handleSiteSearchChange}
            onFocus={() => setShowSiteDropdown(true)}
            disabled={!selectedCompany}
            required={isFieldRequired("site_name")}
            className={inputClass}
            placeholder={selectedCompany ? "사업장명 검색" : "먼저 회사를 선택하세요"}
          />
          {showSiteDropdown && filteredSites.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredSites.map((site) => (
                <div
                  key={site.id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSiteSelect(site)}
                >
                  {site.name}
                </div>
              ))}
            </div>
          )}
        </div>
      );

    case 'site_code':
      return (
        <>
          <label className={labelClass}>
            {getFieldLabel("site_code", "사업장 코드")}
            {isFieldRequired("site_code") && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            name="site_code"
            value={formData.site_code}
            readOnly
            disabled
            className={disabledInputClass}
            required={isFieldRequired("site_code")}
          />
        </>
      );

    case 'global_accident_no':
      return (
        <>
          <label className={labelClass}>
            {getFieldLabel("global_accident_no", "전체사고코드")}
            {isFieldRequired("global_accident_no") && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            name="global_accident_no"
            value={formData.global_accident_no}
            readOnly
            disabled
            className={disabledInputClass}
            placeholder={selectedCompany ? "회사 선택 시 자동 생성됩니다" : "회사를 먼저 선택해주세요"}
            required={isFieldRequired("global_accident_no")}
          />
          <p className="text-xs text-gray-500 mt-1">
            형식: [회사코드]-[연도]-[순번3자리]
          </p>
        </>
      );

    case 'accident_id':
      return (
        <>
          <label className={labelClass}>
            {getFieldLabel("accident_id", "사업장사고코드")}
            {isFieldRequired("accident_id") && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            name="accident_id"
            value={formData.report_channel_no}
            readOnly
            disabled
            className={disabledInputClass}
            placeholder={selectedCompany && formData.site_code ? "사업장 선택 시 자동 생성됩니다" : "회사와 사업장을 먼저 선택해주세요"}
            required={isFieldRequired("accident_id")}
          />
          <p className="text-xs text-gray-500 mt-1">
            형식: [회사코드]-[사업장코드]-[순번3자리]-[YYYYMMDD]
          </p>
        </>
      );

    case 'report_channel_no':
      return (
        <>
          <label className={labelClass}>
            {getFieldLabel("report_channel_no", "보고 경로 번호")}
            {isFieldRequired("report_channel_no") && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            name="report_channel_no"
            value={formData.report_channel_no}
            readOnly
            disabled
            className={disabledInputClass}
            required={isFieldRequired("report_channel_no")}
          />
        </>
      );

    case 'is_contractor':
      return (
        <div className="flex items-center">
          <input
            type="checkbox"
            name="is_contractor"
            checked={formData.is_contractor}
            onChange={handleChange}
            id="is_contractor"
            className="h-4 w-4 text-blue-600 rounded"
          />
          <label htmlFor="is_contractor" className="ml-2 text-sm font-medium text-gray-600">
            {getFieldLabel("is_contractor", "협력업체 사고")}
          </label>
        </div>
      );

    case 'contractor_name':
      return (
        <>
          <label className={labelClass}>
            {getFieldLabel("contractor_name", "협력업체명")}
            {isFieldRequired("contractor_name") && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            name="contractor_name"
            value={formData.contractor_name}
            onChange={handleChange}
            disabled={!formData.is_contractor}
            required={formData.is_contractor && isFieldRequired("contractor_name")}
            className={formData.is_contractor ? inputClass : disabledInputClass}
            placeholder={formData.is_contractor ? "협력업체명을 입력하세요" : "협력업체 사고인 경우 입력"}
          />
        </>
      );

    case 'first_report_time':
      return (
        <>
          <label className={labelClass}>
            {getFieldLabel("first_report_time", "최초 보고 시간")}
            {isFieldRequired("first_report_time") && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="datetime-local"
            name="first_report_time"
            value={formData.first_report_time}
            onChange={handleChange}
            required={isFieldRequired("first_report_time")}
            className={inputClass}
          />
        </>
      );

    case 'acci_time':
      return (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {getFieldLabel("acci_time", "사고 발생 일시")}
            {isFieldRequired("acci_time") && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="datetime-local"
            name="acci_time"
            value={formData.acci_time}
            onChange={handleAcciTimeChange}
            required={isFieldRequired("acci_time")}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      );

    default:
      return null;
  }
};

export default BasicInfoFields; 