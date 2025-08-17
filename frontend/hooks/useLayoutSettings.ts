/**
 * @file hooks/useLayoutSettings.ts
 * @description 레이아웃 설정을 관리하는 커스텀 훅
 */

import { useState, useEffect, useCallback } from 'react';
import { FormFieldSetting } from '@/services/report_form.service';
import { 
  loadLayoutSettings, 
  saveLayoutSettings, 
  calculateDynamicLayout,
  DynamicLayoutConfig,
  toggleFieldVisibility
} from '@/utils/layout.utils';

interface UseLayoutSettingsProps {
  reportType: string;
  formSettings: FormFieldSetting[];
  isFieldVisible: (fieldName: string) => boolean;
}

interface UseLayoutSettingsReturn {
  templateId: string;
  layoutConfig: DynamicLayoutConfig;
  isMobile: boolean;
  setTemplateId: (templateId: string) => void;
  updateFieldVisibility: (fieldName: string, isVisible: boolean) => void;
  refreshLayout: () => void;
}

export const useLayoutSettings = ({
  reportType,
  formSettings,
  isFieldVisible
}: UseLayoutSettingsProps): UseLayoutSettingsReturn => {
  const [templateId, setTemplateId] = useState<string>('standard');
  const [layoutConfig, setLayoutConfig] = useState<DynamicLayoutConfig>({
    template: 'standard',
    groups: []
  });
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 감지
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
    const settings = loadLayoutSettings(reportType);
    setTemplateId(settings.template);
  }, [reportType]);

  // 레이아웃 계산 및 업데이트
  const calculateLayout = useCallback(() => {
    if (formSettings.length === 0) return;

    // 보이는 필드만 필터링
    const visibleFields = formSettings.filter(field => isFieldVisible(field.field_name));
    
    // 동적 레이아웃 계산
    const newLayoutConfig = calculateDynamicLayout(visibleFields, templateId, isMobile);
    setLayoutConfig(newLayoutConfig);
  }, [formSettings, templateId, isMobile, isFieldVisible]);

  // 필드 설정이나 템플릿이 변경될 때마다 레이아웃 재계산
  useEffect(() => {
    calculateLayout();
  }, [calculateLayout]);

  // 템플릿 변경 핸들러
  const handleTemplateChange = useCallback((newTemplateId: string) => {
    setTemplateId(newTemplateId);
    
    // 로컬 스토리지에 저장
    const settings = loadLayoutSettings(reportType);
    saveLayoutSettings(reportType, newTemplateId, settings.customLayout);
  }, [reportType]);

  // 필드 표시/숨김 토글 핸들러
  const updateFieldVisibility = useCallback((fieldName: string, isVisible: boolean) => {
    // 이 함수는 실제로는 부모 컴포넌트에서 필드 설정을 업데이트해야 함
    // 여기서는 레이아웃만 다시 계산
    setTimeout(() => {
      calculateLayout();
    }, 0);
  }, [calculateLayout]);

  // 레이아웃 강제 새로고침
  const refreshLayout = useCallback(() => {
    calculateLayout();
  }, [calculateLayout]);

  return {
    templateId,
    layoutConfig,
    isMobile,
    setTemplateId: handleTemplateChange,
    updateFieldVisibility,
    refreshLayout
  };
};

// 레이아웃 템플릿 옵션
export const LAYOUT_TEMPLATE_OPTIONS = [
  {
    id: 'compact',
    name: '컴팩트 레이아웃',
    description: '공간 효율적인 3열 레이아웃',
    icon: '📐'
  },
  {
    id: 'standard',
    name: '표준 레이아웃',
    description: '균형잡힌 2열 레이아웃',
    icon: '📋'
  },
  {
    id: 'mobile',
    name: '모바일 친화적',
    description: '세로형 1열 레이아웃',
    icon: '📱'
  }
];

// 레이아웃 통계 계산
export const calculateLayoutStats = (
  formSettings: FormFieldSetting[],
  isFieldVisible: (fieldName: string) => boolean
) => {
  const totalFields = formSettings.length;
  const visibleFields = formSettings.filter(field => isFieldVisible(field.field_name)).length;
  const hiddenFields = totalFields - visibleFields;
  
  // 그룹별 통계
  const groupStats: Record<string, { total: number; visible: number }> = {};
  
  formSettings.forEach(field => {
    const groupName = field.field_group || '기타';
    if (!groupStats[groupName]) {
      groupStats[groupName] = { total: 0, visible: 0 };
    }
    groupStats[groupName].total++;
    if (isFieldVisible(field.field_name)) {
      groupStats[groupName].visible++;
    }
  });

  return {
    totalFields,
    visibleFields,
    hiddenFields,
    visibilityPercentage: totalFields > 0 ? Math.round((visibleFields / totalFields) * 100) : 0,
    groupStats
  };
};

export default useLayoutSettings; 