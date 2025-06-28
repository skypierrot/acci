/**
 * @file utils/layout.utils.ts
 * @description 레이아웃 관련 유틸리티 함수들
 */

import { FormFieldSetting } from '@/services/report_form.service';

// 레이아웃 템플릿 타입 정의
export interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  layout: {
    [groupName: string]: {
      cols: number;
      fieldOrder?: string[];
    };
  };
}

// 사전 정의된 레이아웃 템플릿
export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    id: 'compact',
    name: '컴팩트 레이아웃',
    description: '공간 효율적인 3열 레이아웃',
    layout: {
      '기본정보': { cols: 3 },
      '사고정보': { cols: 2 },
      '재해자정보': { cols: 2 },
      '첨부파일': { cols: 2 },
      '보고자정보': { cols: 2 }
    }
  },
  {
    id: 'standard',
    name: '표준 레이아웃',
    description: '균형잡힌 2열 레이아웃',
    layout: {
      '기본정보': { cols: 2 },
      '사고정보': { cols: 2 },
      '재해자정보': { cols: 1 },
      '첨부파일': { cols: 2 },
      '보고자정보': { cols: 2 }
    }
  },
  {
    id: 'mobile',
    name: '모바일 친화적',
    description: '세로형 1열 레이아웃',
    layout: {
      '기본정보': { cols: 1 },
      '사고정보': { cols: 1 },
      '재해자정보': { cols: 1 },
      '첨부파일': { cols: 1 },
      '보고자정보': { cols: 1 }
    }
  }
];

/**
 * 그룹별 열 수 가져오기
 */
export const getGroupCols = (
  groupName: string, 
  groupedSettings: { [key: string]: FormFieldSetting[] },
  defaultCols: number = 2
): number => {
  if (!groupedSettings[groupName] || groupedSettings[groupName].length === 0) {
    return defaultCols;
  }
  
  // 그룹의 첫 번째 필드에서 group_cols 정보 가져오기
  const firstField = groupedSettings[groupName][0];
  return firstField?.group_cols || defaultCols;
};

/**
 * 동적 그리드 클래스 생성
 */
export const getGridClass = (cols: number, fieldCount?: number): string => {
  const baseClasses = "grid gap-4";
  
  // 필드 수가 열 수보다 적으면 필드 수에 맞춰 조정
  const actualCols = fieldCount && fieldCount < cols ? fieldCount : cols;
  
  switch (actualCols) {
    case 1: return `${baseClasses} grid-cols-1`;
    case 2: return `${baseClasses} grid-cols-1 md:grid-cols-2`;
    case 3: return `${baseClasses} grid-cols-1 md:grid-cols-3`;
    case 4: return `${baseClasses} grid-cols-1 md:grid-cols-4`;
    default: return `${baseClasses} grid-cols-1 md:grid-cols-2`;
  }
};

/**
 * 보이는 필드만 필터링
 */
export const getVisibleFields = (
  fields: FormFieldSetting[],
  isFieldVisible: (fieldName: string) => boolean
): FormFieldSetting[] => {
  return fields.filter(field => isFieldVisible(field.field_name));
};

/**
 * 레이아웃 템플릿 적용
 */
export const applyLayoutTemplate = (
  templateId: string,
  groupedSettings: { [key: string]: FormFieldSetting[] }
): { [groupName: string]: number } => {
  const template = LAYOUT_TEMPLATES.find(t => t.id === templateId);
  if (!template) {
    // 기본 템플릿 반환
    return Object.keys(groupedSettings).reduce((acc, groupName) => {
      acc[groupName] = 2;
      return acc;
    }, {} as { [groupName: string]: number });
  }
  
  const layout: { [groupName: string]: number } = {};
  Object.keys(groupedSettings).forEach(groupName => {
    layout[groupName] = template.layout[groupName]?.cols || 2;
  });
  
  return layout;
};

/**
 * 로컬 스토리지에서 레이아웃 설정 로드
 */
export const loadLayoutSettings = (reportType: string): {
  template: string;
  customLayout: { [groupName: string]: number };
} => {
  if (typeof window === 'undefined') {
    return { template: 'compact', customLayout: {} };
  }
  
  try {
    const saved = localStorage.getItem(`${reportType}_layout_settings`);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('레이아웃 설정 로드 오류:', error);
  }
  
  return { template: 'compact', customLayout: {} };
};

/**
 * 로컬 스토리지에 레이아웃 설정 저장
 */
export const saveLayoutSettings = (
  reportType: string, 
  template: string, 
  customLayout: { [groupName: string]: number }
): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const settings = { template, customLayout };
    localStorage.setItem(`${reportType}_layout_settings`, JSON.stringify(settings));
  } catch (error) {
    console.error('레이아웃 설정 저장 오류:', error);
  }
};

/**
 * 그룹별 필드 정렬
 */
export const sortFieldsByOrder = (fields: FormFieldSetting[]): FormFieldSetting[] => {
  return [...fields].sort((a, b) => a.display_order - b.display_order);
};

/**
 * 반응형 열 수 계산
 */
export const getResponsiveCols = (cols: number, isMobile: boolean): number => {
  if (isMobile) {
    return Math.min(cols, 2); // 모바일에서는 최대 2열
  }
  return cols;
};

// 필드 표시/숨김에 따른 동적 레이아웃 계산
export const calculateDynamicLayout = (
  fields: FormFieldSetting[],
  templateId: string,
  isMobile: boolean = false
): DynamicLayoutConfig => {
  const visibleFields = fields.filter(field => field.is_visible);
  const groups = groupFieldsByGroup(visibleFields);
  
  // 모바일에서는 항상 1열
  if (isMobile) {
    return {
      template: 'mobile',
      groups: Object.keys(groups).map(groupName => ({
        name: groupName,
        cols: 1,
        fields: groups[groupName]
      }))
    };
  }
  
  // 템플릿 찾기
  const template = LAYOUT_TEMPLATES.find(t => t.id === templateId);
  if (!template) {
    // 기본 템플릿 사용
    return {
      template: templateId,
      groups: Object.keys(groups).map(groupName => ({
        name: groupName,
        cols: 2,
        fields: groups[groupName]
      }))
    };
  }
  
  return {
    template: templateId,
    groups: Object.keys(groups).map(groupName => {
      const groupFields = groups[groupName];
      const visibleCount = groupFields.length;
      const templateCols = template.layout[groupName]?.cols || 2;
      
      // 필드 수에 따른 최적 열 수 계산
      let optimalCols = templateCols;
      
      if (visibleCount <= 2) {
        optimalCols = Math.min(visibleCount, templateCols);
      } else if (visibleCount <= 4) {
        optimalCols = Math.min(2, templateCols);
      } else {
        optimalCols = templateCols;
      }
      
      return {
        name: groupName,
        cols: optimalCols,
        fields: groupFields
      };
    })
  };
};

// 필드를 그룹별로 분류
const groupFieldsByGroup = (fields: FormFieldSetting[]): Record<string, FormFieldSetting[]> => {
  return fields.reduce((groups, field) => {
    const groupName = field.field_group || '기타';
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(field);
    return groups;
  }, {} as Record<string, FormFieldSetting[]>);
};

// 동적 레이아웃 설정 타입
export interface DynamicLayoutConfig {
  template: string;
  groups: {
    name: string;
    cols: number;
    fields: FormFieldSetting[];
  }[];
}

// 필드 표시/숨김 토글 헬퍼
export const toggleFieldVisibility = (
  settings: FormFieldSetting[],
  fieldName: string,
  isVisible: boolean
): FormFieldSetting[] => {
  return settings.map(setting => 
    setting.field_name === fieldName 
      ? { ...setting, is_visible: isVisible }
      : setting
  );
};

// 레이아웃 변경에 따른 CSS 클래스 생성
export const generateResponsiveGridClass = (
  cols: number,
  isMobile: boolean = false
): string => {
  if (isMobile) {
    return 'grid grid-cols-1 gap-4';
  }
  
  const colsClass = `grid-cols-${Math.min(cols, 3)}`;
  return `grid ${colsClass} gap-4 md:gap-6`;
}; 