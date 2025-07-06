/**
 * @file components/DynamicFormGroup.tsx
 * @description 동적 그룹 렌더링 컴포넌트 - 필드 표시/숨김에 따른 실시간 레이아웃 조정
 */

import React from 'react';
import { FormFieldSetting } from '@/services/report_form.service';
import { 
  calculateDynamicLayout, 
  generateResponsiveGridClass,
  DynamicLayoutConfig 
} from '@/utils/layout.utils';

interface DynamicFormGroupProps {
  groupName: string;
  fields: FormFieldSetting[];
  templateId: string;
  isMobile?: boolean;
  isFieldVisible: (fieldName: string) => boolean;
  renderField: (field: FormFieldSetting) => React.ReactNode;
  className?: string;
}

export const DynamicFormGroup: React.FC<DynamicFormGroupProps> = ({
  groupName,
  fields,
  templateId,
  isMobile = false,
  isFieldVisible,
  renderField,
  className = ""
}) => {
  // 보이는 필드만 필터링
  const visibleFields = fields.filter(field => isFieldVisible(field.field_name));
  
  // 필드가 없으면 렌더링하지 않음
  if (visibleFields.length === 0) {
    return null;
  }
  
  // 동적 레이아웃 계산
  const layoutConfig = calculateDynamicLayout(visibleFields, templateId, isMobile);
  const groupLayout = layoutConfig.groups.find(g => g.name === groupName);
  
  if (!groupLayout) {
    return null;
  }
  
  // 그리드 클래스 생성
  const gridClass = generateResponsiveGridClass(groupLayout.cols, isMobile);
  
  return (
    <div className={`space-y-4 ${className}`}>
      <h2 className="text-lg md:text-xl font-semibold mb-4 text-gray-800">
        {groupName}
        <span className="text-sm text-gray-500 ml-2">
          ({visibleFields.length}개 필드)
        </span>
      </h2>
      
      <div className={gridClass}>
        {visibleFields.map((field) => (
          <div key={field.field_name} className="space-y-1">
            {renderField(field)}
          </div>
        ))}
      </div>
      
      {/* 레이아웃 디버그 정보 (개발 모드에서만) */}
      {typeof window !== 'undefined' && window.location.hostname === 'localhost' && (
        <div className="text-xs text-gray-400 mt-2">
          레이아웃: {groupLayout.cols}열, 템플릿: {templateId}
          {isMobile && ' (모바일)'}
        </div>
      )}
    </div>
  );
};

// 전체 폼을 위한 동적 레이아웃 컨테이너
interface DynamicFormLayoutProps {
  fields: FormFieldSetting[];
  templateId: string;
  isMobile?: boolean;
  isFieldVisible: (fieldName: string) => boolean;
  renderField: (field: FormFieldSetting) => React.ReactNode;
  className?: string;
}

export const DynamicFormLayout: React.FC<DynamicFormLayoutProps> = ({
  fields,
  templateId,
  isMobile = false,
  isFieldVisible,
  renderField,
  className = ""
}) => {
  // 보이는 필드만 필터링
  const visibleFields = fields.filter(field => isFieldVisible(field.field_name));
  
  // 동적 레이아웃 계산
  const layoutConfig = calculateDynamicLayout(visibleFields, templateId, isMobile);
  
  // 그룹별로 필드 분류
  const groupedFields: Record<string, FormFieldSetting[]> = {};
  visibleFields.forEach(field => {
    const groupName = field.field_group || '기타';
    if (!groupedFields[groupName]) {
      groupedFields[groupName] = [];
    }
    groupedFields[groupName].push(field);
  });
  
  return (
    <div className={`space-y-8 ${className}`}>
      {layoutConfig.groups.map((group) => (
        <DynamicFormGroup
          key={group.name}
          groupName={group.name}
          fields={groupedFields[group.name] || []}
          templateId={templateId}
          isMobile={isMobile}
          isFieldVisible={isFieldVisible}
          renderField={renderField}
        />
      ))}
      
      {/* 전체 레이아웃 정보 (개발 모드에서만) */}
      {typeof window !== 'undefined' && window.location.hostname === 'localhost' && (
        <div className="text-xs text-gray-400 p-2 bg-gray-50 rounded">
          <div>전체 필드: {fields.length}개</div>
          <div>보이는 필드: {visibleFields.length}개</div>
          <div>그룹 수: {layoutConfig.groups.length}개</div>
          <div>템플릿: {templateId}</div>
        </div>
      )}
    </div>
  );
};

export default DynamicFormGroup; 