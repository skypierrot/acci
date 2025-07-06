/**
 * @file services/report_form.service.ts
 * @description
 *  - 보고서 양식 설정을 관리하는 서비스 모듈
 *  - 발생보고서와 조사보고서의 필드 표시 여부, 필수 여부, 순서 등을 관리
 */

import axios from "axios";

// Next.js API 라우트를 통해 백엔드와 통신
const BACKEND_API_URL = '/api';

// 그리드 레이아웃 타입 정의
export interface GridLayout {
  x: number; // 그리드 x 위치
  y: number; // 그리드 y 위치
  w: number; // 그리드 너비
  h: number; // 그리드 높이
}

// 양식 필드 설정 타입 정의
export interface FormFieldSetting {
  id?: string;
  report_type: string;
  field_name: string;
  is_visible: boolean;
  is_required: boolean;
  display_order: number;
  field_group: string;
  display_name: string;
  description?: string;
  grid_layout?: GridLayout;
  layout_template?: string;
  group_cols?: number;
  created_at?: string;
  updated_at?: string;
}

// 양식 설정 캐시 (메모리)
const formSettingsCache: Record<string, {
  settings: FormFieldSetting[];
  timestamp: number;
}> = {};

// 캐시 유효 시간 (10분)
const CACHE_TTL = 10 * 60 * 1000;

/**
 * @function applyMobileGridSettings
 * @description 모바일 환경에서 모든 섹션의 그리드 열을 1로 설정합니다.
 * @param settings 원본 양식 설정 배열
 * @param forceMobile 강제로 모바일 모드 적용 여부
 * @returns 모바일용으로 처리된 양식 설정 배열
 */
export const applyMobileGridSettings = (settings: FormFieldSetting[], forceMobile?: boolean): FormFieldSetting[] => {
  // 브라우저 환경이 아니면 원본 그대로 반환 (SSR 대응)
  if (typeof window === 'undefined') {
    console.log('[양식 설정] 서버 환경: 원본 설정 반환');
    return settings;
  }
  
  // 강제 모바일 모드이거나 화면 크기가 768px 미만이면 모바일 처리
  const isMobile = forceMobile || window.innerWidth < 768;
  
  if (!isMobile) {
    console.log('[양식 설정] 데스크톱 환경: 원본 그리드 설정 사용');
    return settings;
  }
  
  console.log('[양식 설정] 모바일 환경 감지: 모든 섹션을 1열로 변경');
  
  // 모바일에서는 모든 설정의 group_cols를 1로 변경
  return settings.map(setting => ({
    ...setting,
    group_cols: 1
  }));
};

/**
 * @function getFormSettings
 * @description 보고서 양식 설정을 가져옵니다.
 * @param reportType 보고서 유형 (occurrence 또는 investigation)
 * @param forceRefresh 캐시 무시하고 새로 가져올지 여부
 * @returns 양식 설정 배열
 */
export const getFormSettings = async (reportType: string, forceRefresh: boolean = false): Promise<FormFieldSetting[]> => {
  try {
    const now = Date.now();
    const cacheKey = reportType;
    
    // 캐시에 유효한 데이터가 있고 강제 새로고침이 아닌 경우 캐시 사용
    if (
      !forceRefresh &&
      formSettingsCache[cacheKey] &&
      now - formSettingsCache[cacheKey].timestamp < CACHE_TTL
    ) {
      console.log(`[양식 설정] 캐시된 설정 사용 (${reportType})`);
      return formSettingsCache[cacheKey].settings;
    }
    
    // 로컬 스토리지에서 설정 확인 (브라우저 환경인 경우만)
    if (typeof window !== 'undefined' && !forceRefresh) {
      const cacheKey = `${reportType}_form_settings`;
      const cachedSettings = localStorage.getItem(cacheKey);
      
      if (cachedSettings) {
        try {
          const parsed = JSON.parse(cachedSettings);
          const cachedData = parsed.data || parsed;
          
          if (Array.isArray(cachedData) && cachedData.length > 0) {
            console.log(`[양식 설정] 로컬 스토리지 설정 사용 (${reportType})`);
            
            // 메모리 캐시도 업데이트
            formSettingsCache[reportType] = {
              settings: cachedData,
              timestamp: now
            };
            
            return cachedData;
          }
        } catch (e) {
          console.error('[양식 설정] 로컬 스토리지 데이터 파싱 오류:', e);
          // 오류 발생 시 로컬 스토리지 캐시 삭제
          localStorage.removeItem(cacheKey);
        }
      }
    }
    
    // API에서 설정 가져오기
    console.log(`[양식 설정] API에서 설정 가져오기 (${reportType})`);
    const response = await axios.get(`${BACKEND_API_URL}/settings/reports/${reportType}`);
    const settings = response.data.data;
    
    // 설정 정렬 (display_order 기준)
    settings.sort((a: FormFieldSetting, b: FormFieldSetting) => a.display_order - b.display_order);
    
    // 메모리 캐시 업데이트
    formSettingsCache[reportType] = {
      settings,
      timestamp: now
    };
    
    // 로컬 스토리지 캐시 업데이트 (브라우저 환경인 경우만)
    if (typeof window !== 'undefined') {
      try {
        const cacheKey = `${reportType}_form_settings`;
        localStorage.setItem(cacheKey, JSON.stringify(settings));
      } catch (e) {
        console.error('[양식 설정] 로컬 스토리지 캐시 업데이트 오류:', e);
      }
    }
    
    return settings;
  } catch (error) {
    console.error(`[양식 설정] ${reportType} 보고서 양식 설정 조회 오류:`, error);
    
    // 오류 발생 시 캐시된 설정 반환 (있는 경우)
    if (formSettingsCache[reportType]) {
      console.log(`[양식 설정] API 오류, 캐시된 설정 반환 (${reportType})`);
      return formSettingsCache[reportType].settings;
    }
    
    // 오류 발생 시 로컬 스토리지에서 설정 확인 (브라우저 환경인 경우만)
    if (typeof window !== 'undefined') {
      const cacheKey = `${reportType}_form_settings`;
      const cachedSettings = localStorage.getItem(cacheKey);
      
      if (cachedSettings) {
        try {
          const parsed = JSON.parse(cachedSettings);
          const cachedData = parsed.data || parsed;
          
          if (Array.isArray(cachedData) && cachedData.length > 0) {
            console.log(`[양식 설정] API 오류, 로컬 스토리지 설정 반환 (${reportType})`);
            return cachedData;
          }
        } catch (e) {
          console.error('[양식 설정] 로컬 스토리지 데이터 파싱 오류:', e);
        }
      }
    }
    
    throw error;
  }
};

/**
 * @function clearFormSettingsCache
 * @description 양식 설정 캐시를 초기화합니다.
 * @param reportType 보고서 유형 (occurrence 또는 investigation), 생략 시 모든 캐시 초기화
 */
export const clearFormSettingsCache = (reportType?: string): void => {
  if (reportType) {
    // 특정 보고서 유형의 캐시만 초기화
    delete formSettingsCache[reportType];
    
    // 로컬 스토리지 캐시도 초기화 (브라우저 환경인 경우만)
    if (typeof window !== 'undefined') {
      const cacheKey = `${reportType}_form_settings`;
      localStorage.removeItem(cacheKey);
    }
    
    console.log(`[양식 설정] ${reportType} 보고서 양식 설정 캐시 초기화됨`);
  } else {
    // 모든 캐시 초기화
    Object.keys(formSettingsCache).forEach(key => {
      delete formSettingsCache[key];
    });
    
    // 로컬 스토리지 캐시도 초기화 (브라우저 환경인 경우만)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('occurrence_form_settings');
      localStorage.removeItem('investigation_form_settings');
    }
    
    console.log('[양식 설정] 모든 보고서 양식 설정 캐시 초기화됨');
  }
};

/**
 * @function updateFormSettings
 * @description 보고서 양식 설정을 업데이트합니다.
 * @param reportType 보고서 유형 (occurrence 또는 investigation)
 * @param settings 업데이트할 양식 설정 배열
 * @returns 업데이트된 양식 설정 배열
 */
export const updateFormSettings = async (reportType: string, settings: FormFieldSetting[]): Promise<FormFieldSetting[]> => {
  try {
    const response = await axios.put(`${BACKEND_API_URL}/settings/reports/${reportType}`, { settings });
    
    // 저장 성공 후 캐시 초기화
    clearFormSettingsCache(reportType);
    console.log(`[양식 설정] ${reportType} 보고서 설정 저장 후 캐시 초기화됨`);
    
    return response.data.data;
  } catch (error) {
    console.error(`[서비스 오류] ${reportType} 보고서 양식 설정 업데이트 오류:`, error);
    throw error;
  }
};

/**
 * @function getRequiredFields
 * @description 필수 입력 필드 목록을 가져옵니다.
 * @param reportType 보고서 유형 (occurrence 또는 investigation)
 * @returns 필수 입력 필드 배열
 */
export const getRequiredFields = async (reportType: string): Promise<FormFieldSetting[]> => {
  try {
    const response = await axios.get(`${BACKEND_API_URL}/settings/reports/${reportType}/required`);
    return response.data.data;
  } catch (error) {
    console.error(`[서비스 오류] ${reportType} 보고서 필수 입력 필드 조회 오류:`, error);
    throw error;
  }
};

/**
 * @function getFieldsByVisibility
 * @description 표시 여부에 따른 필드 목록을 가져옵니다.
 * @param reportType 보고서 유형 (occurrence 또는 investigation)
 * @param isVisible 표시 여부 (true: 표시, false: 숨김)
 * @returns 필드 설정 배열
 */
export const getFieldsByVisibility = async (reportType: string, isVisible: boolean): Promise<FormFieldSetting[]> => {
  try {
    const response = await axios.get(`${BACKEND_API_URL}/settings/reports/${reportType}/visible`, {
      params: { visible: isVisible }
    });
    return response.data.data;
  } catch (error) {
    console.error(`[서비스 오류] ${reportType} 보고서 표시 여부(${isVisible}) 필드 조회 오류:`, error);
    throw error;
  }
};

/**
 * @function resetFormSettings
 * @description 보고서 양식 설정을 기본값으로 초기화합니다.
 * @param reportType 보고서 유형 (occurrence 또는 investigation)
 * @returns 초기화된 양식 설정 배열
 */
export const resetFormSettings = async (reportType: string): Promise<FormFieldSetting[]> => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/settings/reports/${reportType}/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('초기화 요청 실패');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('초기화 오류:', error);
    throw error;
  }
};

/**
 * @function updateFormSetting
 * @description 특정 필드의 양식 설정을 업데이트합니다.
 * @param id 설정 ID
 * @param updates 업데이트할 필드 및 값
 * @returns 업데이트된 양식 설정
 */
export const updateFormSetting = async (
  id: string, 
  updates: Partial<FormFieldSetting>
): Promise<FormFieldSetting> => {
  try {
    const response = await axios.patch(
      `${BACKEND_API_URL}/settings/reports/fields/${id}`,
      updates
    );
    
    const updatedSetting = response.data.data;
    
    // 관련 보고서 유형의 캐시 초기화
    if (updatedSetting && updatedSetting.report_type) {
      clearFormSettingsCache(updatedSetting.report_type);
    }
    
    return updatedSetting;
  } catch (error) {
    console.error(`[양식 설정] 필드 설정 업데이트 오류 (ID: ${id}):`, error);
    throw error;
  }
};

/**
 * @function saveGridLayout
 * @description 그리드 레이아웃 설정을 로컬 스토리지에 저장합니다.
 * @param reportType 보고서 유형 (occurrence 또는 investigation)
 * @param layouts 그리드 레이아웃 설정 객체
 */
export const saveGridLayout = (reportType: string, layouts: Record<string, GridLayout>): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheKey = `${reportType}_grid_layout`;
    localStorage.setItem(cacheKey, JSON.stringify(layouts));
    console.log(`[그리드 레이아웃] ${reportType} 보고서 그리드 레이아웃 설정이 저장되었습니다.`);
  } catch (e) {
    console.error('[그리드 레이아웃] 로컬 스토리지 저장 오류:', e);
  }
};

/**
 * @function getGridLayout
 * @description 그리드 레이아웃 설정을 로컬 스토리지에서 불러옵니다.
 * @param reportType 보고서 유형 (occurrence 또는 investigation)
 * @returns 그리드 레이아웃 설정 객체
 */
export const getGridLayout = (reportType: string): Record<string, GridLayout> => {
  if (typeof window === 'undefined') return {};
  
  try {
    const cacheKey = `${reportType}_grid_layout`;
    const cachedLayouts = localStorage.getItem(cacheKey);
    
    if (cachedLayouts) {
      const layouts = JSON.parse(cachedLayouts);
      console.log(`[그리드 레이아웃] ${reportType} 보고서 그리드 레이아웃 설정을 로드했습니다.`);
      return layouts;
    }
  } catch (e) {
    console.error('[그리드 레이아웃] 로컬 스토리지 로드 오류:', e);
  }
  
  return {};
};

/**
 * @function updateGridLayout
 * @description 그리드 레이아웃 설정을 서버에 저장합니다.
 * @param reportType 보고서 유형 (occurrence 또는 investigation)
 * @param fields 그리드 레이아웃이 포함된 필드 설정 배열
 */
export const updateGridLayout = async (reportType: string, fields: FormFieldSetting[]): Promise<void> => {
  try {
    const response = await axios.put(`${BACKEND_API_URL}/settings/reports/${reportType}`, {
      settings: fields.map(field => ({
        id: field.id,
        report_type: field.report_type,
        field_name: field.field_name,
        is_visible: field.is_visible,
        is_required: field.is_required,
        display_order: field.display_order,
        field_group: field.field_group,
        display_name: field.display_name,
        grid_layout: field.grid_layout || { x: 0, y: 0, w: 1, h: 1 }
      }))
    });
    
    if (response.status === 200) {
      console.log(`[그리드 레이아웃] ${reportType} 보고서 그리드 레이아웃이 서버에 저장되었습니다.`);
    }
  } catch (error) {
    console.error('[그리드 레이아웃] 서버 저장 오류:', error);
    throw error;
  }
};

/**
 * 기존 설정에 누락된 필드들을 추가
 * @param reportType 보고서 유형
 * @returns 추가된 필드 정보
 */
export const addMissingFields = async (reportType: string): Promise<{ addedCount: number; addedFields: any[] }> => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/settings/reports/${reportType}/add-missing-fields`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('누락된 필드 추가 요청 실패');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('누락된 필드 추가 오류:', error);
    throw error;
  }
}; 