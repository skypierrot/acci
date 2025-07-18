"use client";

/**
 * @file app/test-layout/page.tsx
 * @description 동적 레이아웃 테스트 페이지
 */

import React, { useState, useEffect } from 'react';
import { FormFieldSetting } from '@/services/report_form.service';
// import DynamicFormGroup from '@/components/DynamicFormGroup';
// import BasicInfoFields from '@/components/form-fields/BasicInfoFields';
// import { LAYOUT_TEMPLATES, saveLayoutSettings, loadLayoutSettings } from '@/utils/layout.utils';

// 임시로 로컬에 정의
const LAYOUT_TEMPLATES = [
  {
    id: 'compact',
    name: '컴팩트 레이아웃',
    description: '공간 효율적인 3열 레이아웃',
    layout: {
      '기본정보': { cols: 3 },
      '사고정보': { cols: 2 },
    }
  },
  {
    id: 'standard',
    name: '표준 레이아웃',
    description: '균형잡힌 2열 레이아웃',
    layout: {
      '기본정보': { cols: 2 },
      '사고정보': { cols: 2 },
    }
  },
  {
    id: 'mobile',
    name: '모바일 친화적',
    description: '세로형 1열 레이아웃',
    layout: {
      '기본정보': { cols: 1 },
      '사고정보': { cols: 1 },
    }
  }
];

const saveLayoutSettings = (reportType: string, template: string, layout: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${reportType}_layout_settings`, JSON.stringify({ template, customLayout: layout }));
  }
};

const loadLayoutSettings = (reportType: string) => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(`${reportType}_layout_settings`);
      return saved ? JSON.parse(saved) : { template: 'compact', customLayout: {} };
    } catch {
      return { template: 'compact', customLayout: {} };
    }
  }
  return { template: 'compact', customLayout: {} };
};

// 테스트용 더미 데이터
const mockFormSettings: FormFieldSetting[] = [
  { field_name: 'global_accident_no', display_name: '전체사고코드', field_group: '기본정보', is_visible: true, is_required: true, display_order: 1, report_type: 'occurrence' },
  { field_name: 'accident_id', display_name: '사업장사고코드', field_group: '기본정보', is_visible: true, is_required: true, display_order: 2, report_type: 'occurrence' },
  { field_name: 'company_name', display_name: '회사명', field_group: '기본정보', is_visible: true, is_required: true, display_order: 3, report_type: 'occurrence' },
  { field_name: 'company_code', display_name: '회사 코드', field_group: '기본정보', is_visible: false, is_required: true, display_order: 4, report_type: 'occurrence' },
  { field_name: 'site_name', display_name: '사업장명', field_group: '기본정보', is_visible: true, is_required: true, display_order: 5, report_type: 'occurrence' },
  { field_name: 'site_code', display_name: '사업장 코드', field_group: '기본정보', is_visible: false, is_required: true, display_order: 6, report_type: 'occurrence' },
  { field_name: 'is_contractor', display_name: '협력업체 여부', field_group: '기본정보', is_visible: true, is_required: false, display_order: 7, report_type: 'occurrence' },
  { field_name: 'contractor_name', display_name: '협력업체명', field_group: '기본정보', is_visible: true, is_required: false, display_order: 8, report_type: 'occurrence' },
  
  { field_name: 'acci_time', display_name: '사고 발생 일시', field_group: '사고정보', is_visible: true, is_required: true, display_order: 9, report_type: 'occurrence' },
  { field_name: 'acci_location', display_name: '사고 발생 위치', field_group: '사고정보', is_visible: true, is_required: true, display_order: 10, report_type: 'occurrence' },
  { field_name: 'accident_type_level1', display_name: '재해발생 형태', field_group: '사고정보', is_visible: true, is_required: true, display_order: 11, report_type: 'occurrence' },
  { field_name: 'accident_type_level2', display_name: '사고 유형', field_group: '사고정보', is_visible: true, is_required: true, display_order: 12, report_type: 'occurrence' },
];

const mockFormData = {
  global_accident_no: 'HHH-2025-001',
  accident_id: '',
  report_channel_no: 'HHH-A-001-20250525',
  company_name: '한화시스템',
  company_code: 'HHH',
  site_name: 'A 사업장',
  site_code: 'A',
  is_contractor: false,
  contractor_name: '',
  acci_time: '2025-01-25T14:30',
  acci_location: '생산 라인 2',
  accident_type_level1: '인적',
  accident_type_level2: '기계',
};

export default function TestLayoutPage() {
  const [selectedTemplate, setSelectedTemplate] = useState('compact');
  const [customLayout, setCustomLayout] = useState<{[groupName: string]: number}>({
    '기본정보': 3,
    '사고정보': 2,
  });
  const [isMobile, setIsMobile] = useState(false);

  // 그룹별 필드 분류
  const groupedSettings = mockFormSettings.reduce((acc, field) => {
    const group = field.field_group;
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {} as {[key: string]: FormFieldSetting[]});

  // 화면 크기 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 레이아웃 설정 로드
  useEffect(() => {
    const settings = loadLayoutSettings('occurrence');
    setSelectedTemplate(settings.template);
    setCustomLayout(settings.customLayout);
  }, []);

  // 템플릿 적용
  const applyTemplate = (templateId: string) => {
    const template = LAYOUT_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    setSelectedTemplate(templateId);
    
    const newLayout = { ...customLayout };
         Object.entries(template.layout).forEach(([groupName, config]) => {
       newLayout[groupName] = (config as any).cols;
     });
    setCustomLayout(newLayout);
    
    // 설정 저장
    saveLayoutSettings('occurrence', templateId, newLayout);
  };

  // 그룹별 열 수 변경
  const handleGroupColsChange = (groupName: string, cols: number) => {
    const newLayout = {
      ...customLayout,
      [groupName]: cols
    };
    setCustomLayout(newLayout);
    setSelectedTemplate('custom');
    
    // 설정 저장
    saveLayoutSettings('occurrence', 'custom', newLayout);
  };

  // 필드 가시성 확인
  const isFieldVisible = (fieldName: string): boolean => {
    const setting = mockFormSettings.find(s => s.field_name === fieldName);
    return setting ? setting.is_visible : true;
  };

  const isFieldRequired = (fieldName: string): boolean => {
    const setting = mockFormSettings.find(s => s.field_name === fieldName);
    return setting ? setting.is_required : false;
  };

  const getFieldLabel = (fieldName: string, defaultLabel: string): string => {
    const setting = mockFormSettings.find(s => s.field_name === fieldName);
    return setting?.display_name || defaultLabel;
  };

  // 더미 핸들러들
  const handleChange = () => {};
  const handleCompanySearchChange = () => {};
  const handleSiteSearchChange = () => {};
  const setShowCompanyDropdown = () => {};
  const setShowSiteDropdown = () => {};
  const handleCompanySelect = () => {};
  const handleSiteSelect = () => {};

  // 그리드 클래스 생성
  const getGridClass = (cols: number, fieldCount?: number): string => {
    const baseClasses = "grid gap-4";
    const actualCols = fieldCount && fieldCount < cols ? fieldCount : cols;
    
    switch (actualCols) {
      case 1: return `${baseClasses} grid-cols-1`;
      case 2: return `${baseClasses} grid-cols-1 md:grid-cols-2`;
      case 3: return `${baseClasses} grid-cols-1 md:grid-cols-3`;
      case 4: return `${baseClasses} grid-cols-1 md:grid-cols-4`;
      default: return `${baseClasses} grid-cols-1 md:grid-cols-2`;
    }
  };

  // 필드 렌더링
  const renderField = (field: FormFieldSetting) => {
    const labelClass = "block text-sm font-medium text-gray-600 mb-1";
    // [색상 일관성 작업] 파란색 계열 → slate/emerald/neutral 계열로 교체
    // 입력 필드 포커스 스타일 변경
    const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500";
    const disabledInputClass = "w-full border border-gray-300 bg-gray-100 rounded-md px-3 py-2 text-sm shadow-sm";

    // 기본정보 필드들
    if (field.field_group === '기본정보') {
      switch (field.field_name) {
        case 'global_accident_no':
          return (
            <>
              <label className={labelClass}>
                {getFieldLabel(field.field_name, field.display_name)}
                {isFieldRequired(field.field_name) && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="text"
                value={mockFormData.global_accident_no}
                readOnly
                className={disabledInputClass}
                placeholder="자동 생성"
              />
              <p className="text-xs text-gray-500 mt-1">형식: [회사코드]-[연도]-[순번3자리]</p>
            </>
          );
        
        case 'accident_id':
          return (
            <>
              <label className={labelClass}>
                {getFieldLabel(field.field_name, field.display_name)}
                {isFieldRequired(field.field_name) && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="text"
                value={mockFormData.report_channel_no}
                readOnly
                className={disabledInputClass}
                placeholder="자동 생성"
              />
              <p className="text-xs text-gray-500 mt-1">형식: [회사코드]-[사업장코드]-[순번3자리]-[YYYYMMDD]</p>
            </>
          );

        case 'company_name':
          return (
            <>
              <label className={labelClass}>
                {getFieldLabel(field.field_name, field.display_name)}
                {isFieldRequired(field.field_name) && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="text"
                value={mockFormData.company_name}
                className={inputClass}
                placeholder="회사명 검색"
              />
            </>
          );

        case 'site_name':
          return (
            <>
              <label className={labelClass}>
                {getFieldLabel(field.field_name, field.display_name)}
                {isFieldRequired(field.field_name) && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="text"
                value={mockFormData.site_name}
                className={inputClass}
                placeholder="사업장명 검색"
              />
            </>
          );

        case 'is_contractor':
          return (
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={mockFormData.is_contractor}
                // [색상 일관성 작업] 체크박스 색상 변경
                className="h-4 w-4 text-emerald-600 rounded"
              />
              <label className="ml-2 text-sm font-medium text-gray-600">
                {getFieldLabel(field.field_name, field.display_name)}
              </label>
            </div>
          );

        case 'contractor_name':
          return (
            <>
              <label className={labelClass}>
                {getFieldLabel(field.field_name, field.display_name)}
                {isFieldRequired(field.field_name) && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="text"
                value={mockFormData.contractor_name}
                disabled={!mockFormData.is_contractor}
                className={mockFormData.is_contractor ? inputClass : disabledInputClass}
                placeholder="협력업체명을 입력하세요"
              />
            </>
          );
      }
    }
    
    // 다른 그룹의 기본 렌더링
    return (
      <>
        <label className={labelClass}>
          {getFieldLabel(field.field_name, field.display_name)}
          {isFieldRequired(field.field_name) && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type="text"
          name={field.field_name}
          value={(mockFormData as any)[field.field_name] || ''}
          onChange={handleChange}
          className={inputClass}
          placeholder={`${field.display_name} 입력`}
        />
      </>
    );
  };

  // 동적 폼 그룹 컴포넌트 (인라인)
  const DynamicFormGroup = ({ groupName, fields }: { groupName: string; fields: FormFieldSetting[] }) => {
    const visibleFields = fields.filter(field => isFieldVisible(field.field_name));
    const cols = customLayout[groupName] || 2;
    const responsiveCols = isMobile ? Math.min(cols, 2) : cols;
    const gridClass = getGridClass(responsiveCols, visibleFields.length);

    if (visibleFields.length === 0) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
          {groupName}
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({visibleFields.length}개 필드, {responsiveCols}열)
          </span>
        </h3>
        
        <div className={gridClass}>
          {visibleFields.map((field) => (
            <div key={field.id || field.field_name}>
              {renderField(field)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">동적 레이아웃 테스트</h1>
      
      {/* 레이아웃 컨트롤 */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">레이아웃 설정</h2>
        
        {/* 템플릿 선택 */}
        <div className="mb-4">
          <h3 className="text-md font-medium mb-2">템플릿 선택</h3>
          <div className="flex flex-wrap gap-2">
            {LAYOUT_TEMPLATES.map(template => (
              <button
                key={template.id}
                className={`px-3 py-2 rounded text-sm ${
                  selectedTemplate === template.id
                    ? 'bg-slate-500 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => applyTemplate(template.id)}
              >
                {template.name}
              </button>
            ))}
            <button
              className={`px-3 py-2 rounded text-sm ${
                selectedTemplate === 'custom'
                  ? 'bg-slate-500 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedTemplate('custom')}
            >
              커스텀
            </button>
          </div>
        </div>
        
        {/* 그룹별 열 수 설정 */}
        <div>
          <h3 className="text-md font-medium mb-2">그룹별 열 수 설정</h3>
          <div className="flex flex-wrap gap-4">
            {Object.keys(groupedSettings).map(groupName => (
              <div key={groupName} className="flex items-center gap-2">
                <label className="text-sm">{groupName}:</label>
                <select
                  value={customLayout[groupName] || 2}
                  onChange={(e) => handleGroupColsChange(groupName, parseInt(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={1}>1열</option>
                  <option value={2}>2열</option>
                  <option value={3}>3열</option>
                  <option value={4}>4열</option>
                </select>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-2 text-sm text-gray-600">
          현재 화면: {isMobile ? '모바일' : '데스크톱'} | 
          선택된 템플릿: {selectedTemplate}
        </div>
      </div>

             {/* 동적 폼 렌더링 */}
       <div className="space-y-8">
         {Object.entries(groupedSettings).map(([groupName, fields]) => (
           <DynamicFormGroup
             key={groupName}
             groupName={groupName}
             fields={fields}
           />
         ))}
       </div>
    </div>
  );
} 