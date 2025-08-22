/**
 * @file services/occurrence/occurrence.service.ts
 * @description 발생보고서 관련 공통 기능을 제공하는 서비스 모듈
 */

import { Attachment } from '../../types/occurrence.types';

// 발생보고서 데이터 인터페이스
export interface OccurrenceReportData {
  // 기본 정보
  global_accident_no: string;     // 전체사고코드
  accident_id: string;            // 사고 ID (자동 생성)
  accident_name: string;          // 사고명
  company_name: string;           // 회사명
  company_code: string;           // 회사 코드
  site_name: string;              // 사업장명
  site_code: string;              // 사업장 코드
  acci_time: string;              // 사고 발생 일시
  acci_location: string;          // 사고 발생 위치
  report_channel_no: string;      // 사고 코드
  first_report_time: string;      // 최초 보고 시간

   // 협력업체 관련
  is_contractor: boolean;         // 협력업체 직원 관련 사고 여부
  contractor_name: string;        // 협력업체명
  
  
  // 사고 분류 정보
  accident_type_level1: string;   // 재해발생 형태 (인적, 물적, 복합)
  accident_type_level2: string;   // 사고 유형 (기계, 전기 등)
  acci_summary: string;           // 사고 개요
  acci_detail: string;            // 사고 상세 내용
  victim_count: number;           // 재해자 수
  
  // 기본 재해자 정보
  victim_name: string;            // 재해자 이름
  victim_age: number;             // 재해자 나이
  victim_belong: string;          // 재해자 소속
  victim_duty: string;            // 재해자 직무
  injury_type: string;            // 상해 정도
  ppe_worn: string;               // 보호구 착용 여부
  first_aid: string;              // 응급조치 내역
  

  // 파일 첨부 (이제는 attachments 배열 하나만 사용)
  attachments: Attachment[];
  
  // 보고자 정보
  reporter_name: string;          // 보고자 이름
  reporter_position: string;      // 보고자 직책
  reporter_belong: string;        // 보고자 소속
  report_channel: string;         // 보고 경로

  
  // 선택적 추가 필드
  victims?: VictimInfo[];         // 재해자 정보 배열
  victims_json?: string;          // 재해자 정보 JSON 문자열
  created_at?: string;            // 생성 시간
  updated_at?: string;            // 수정 시간
  [key: string]: any;             // 추가 필드 허용
}

// 발생보고서 피해자 정보 인터페이스
export interface VictimInfo {
  name: string;
  age: number;
  belong: string;
  duty: string;
  injury_type: string;
  ppe_worn: string;
  first_aid: string;
  victim_is_contractor?: boolean;    // 협력업체 소속 여부
  birth_date?: string | Date | null; // 생년월일 필드
}

/**
 * 발생보고서 유효성 검사
 * @param data 발생보고서 데이터
 * @returns 유효성 검사 결과 (유효하면 true, 그렇지 않으면 false)
 */
export const validateOccurrenceReport = (data: OccurrenceReportData): { valid: boolean; error?: string } => {
  // 필수 필드 검사
  if (!data.company_name || !data.site_name || !data.acci_time || !data.acci_location) {
    return { 
      valid: false, 
      error: "필수 정보(회사명, 사업장명, 사고 발생 일시, 사고 발생 장소)가 누락되었습니다." 
    };
  }
  
  // 재해자 정보 유효성 검사
  if (data.victims && Array.isArray(data.victims) && data.victims.length > 0) {
    for (let i = 0; i < data.victims.length; i++) {
      const victim = data.victims[i];
      if (!victim.name) {
        return {
          valid: false,
          error: `${i + 1}번째 재해자의 이름이 누락되었습니다.`
        };
      }
    }
  }
  
  return { valid: true };
};

/**
 * @function processVictimsData
 * @description 재해자 정보 데이터를 일관되게 처리합니다.
 * @param data 발생보고서 데이터
 * @returns 처리된 데이터
 */
export const processVictimsData = (data: OccurrenceReportData): OccurrenceReportData => {
  const processed = { ...data };
  
  // victims 배열 처리
  if (processed.victims && Array.isArray(processed.victims)) {
    // 유효한 재해자 정보만 필터링 (최소한 이름이 있는 경우)
    const validVictims = processed.victims.filter(victim => 
      victim && typeof victim === 'object' && 'name' in victim && !!victim.name
    );
    
    processed.victims = validVictims;
    
    // victims_json 업데이트
    processed.victims_json = JSON.stringify(validVictims);
    
    // victim_count를 재해자 배열 길이로 설정
    processed.victim_count = validVictims.length;
    console.log(`[processVictimsData] victims 배열(${validVictims.length}명)에 맞게 victim_count 설정`);
  } 
  // victims_json 처리
  else if (processed.victims_json && typeof processed.victims_json === 'string') {
    try {
      const parsedVictims = JSON.parse(processed.victims_json);
      
      // 유효한 배열인지 확인
      if (Array.isArray(parsedVictims)) {
        const validVictims = parsedVictims.filter(victim => 
          victim && typeof victim === 'object' && 
          (('name' in victim && !!victim.name) || 
           ('victim_name' in victim && !!victim.victim_name))
        );
        
        processed.victims = validVictims;
        processed.victim_count = validVictims.length;
        console.log(`[processVictimsData] victims_json 파싱 결과(${validVictims.length}명)에 맞게 victim_count 설정`);
      } else {
        // 유효하지 않은 JSON 문자열이면 초기화
        processed.victims = [];
        processed.victims_json = '[]';
        processed.victim_count = 0;
        console.log(`[processVictimsData] victims_json이 유효한 배열이 아님, 초기화`);
      }
    } catch (e) {
      console.error('[processVictimsData] victims_json 파싱 오류:', e);
      // 파싱 오류 시 초기화
      processed.victims = [];
      processed.victims_json = '[]';
      processed.victim_count = 0;
    }
  }
  // victim_count만 있는 경우
  else if (processed.victim_count > 0) {
    // victim_count가 있고 victims 배열이 없는 경우, 빈 객체로 초기화
    processed.victims = Array(processed.victim_count).fill(null).map(() => ({
      name: '',
      age: 0,
      belong: '',
      duty: '',
      injury_type: '',
      ppe_worn: '',
      first_aid: ''
    }));
    
    processed.victims_json = JSON.stringify(processed.victims);
    console.log(`[processVictimsData] victim_count(${processed.victim_count})에 맞게 victims 배열 생성`);
  }
  // 아무 정보도 없는 경우
  else {
    processed.victims = [];
    processed.victims_json = '[]';
    processed.victim_count = 0;
    console.log(`[processVictimsData] 재해자 정보 없음, 초기화`);
  }
  
  return processed;
};

/**
 * 파일 배열 필드 처리 (파일 ID 기반 처리)
 * @param data 발생보고서 데이터
 * @returns 처리된 데이터
 */
export const processFileFields = (data: OccurrenceReportData): OccurrenceReportData => {
  const processed = { ...data };
  
  console.log('[processFileFields] 원본 첨부파일:', processed.attachments);
  
  // attachments가 배열이 아니면 빈 배열로 초기화
  if (!Array.isArray(processed.attachments)) {
    processed.attachments = [];
  }
  
  // 첨부파일 처리: blob URL이 아닌 실제 파일 ID만 추출
  processed.attachments = processed.attachments
    .filter(attachment => {
      // fileId가 있는 첨부파일만 유효한 것으로 처리
      if (!attachment.fileId) {
        console.warn('[processFileFields] fileId가 없는 첨부파일 제외:', attachment);
        return false;
      }
      
      // blob URL은 제외 (실제 업로드되지 않은 파일)
      if (attachment.url && attachment.url.startsWith('blob:')) {
        console.warn('[processFileFields] blob URL 첨부파일 제외:', attachment);
        return false;
      }
      
      return true;
    })
    .map(attachment => {
      // 백엔드로 전달할 때는 필요한 필드만 포함
      return {
        fileId: attachment.fileId,
        name: attachment.name,
        type: attachment.type,
        size: attachment.size || 0,
        // previewUrl이 있으면 사용, 없으면 fileId 기반 URL 생성
        url: attachment.previewUrl || `/api/files/${attachment.fileId}/preview`,
        previewUrl: attachment.previewUrl,
      };
    });
  
  console.log(`[processFileFields] 처리된 첨부파일 ${processed.attachments.length}개:`, 
    processed.attachments.map(a => ({ fileId: a.fileId, name: a.name })));
  
  return processed;
};

/**
 * 날짜 필드 처리
 * @param data 발생보고서 데이터
 * @returns 처리된 데이터
 */
export const processDateFields = (data: OccurrenceReportData): OccurrenceReportData => {
  const processed = { ...data };
  
  console.log('날짜 처리 전 데이터:', JSON.stringify({
    acci_time: processed.acci_time,
    first_report_time: processed.first_report_time,
    created_at: processed.created_at,
    updated_at: processed.updated_at
  }, null, 2));
  
  // 날짜 필드 처리
  ['acci_time', 'first_report_time', 'created_at', 'updated_at'].forEach(field => {
    try {
      const value = processed[field];
      console.log(`[FRONT][processDateFields][${field}]`, {
        value,
        type: typeof value,
        isDate: value instanceof Date,
        isString: typeof value === 'string',
        isValidDate: value && !isNaN(new Date(value).getTime()),
        hasToISOString: value && typeof value.toISOString === 'function'
      });
      
      // undefined, null, 함수인 경우 현재 시간 문자열로 설정
      if (!value || typeof value === 'function') {
        // 한국 시간으로 설정
        const koreanTime = new Date();
        koreanTime.setHours(koreanTime.getHours() + 9); // UTC+9
        processed[field] = koreanTime.toISOString();
        console.log(`[FRONT][processDateFields] ${field}: 값이 없어 한국 시간으로 설정`, processed[field]);
        return;
      }
      
      // 이미 ISO 형식 문자열인 경우 그대로 사용
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        console.log(`[FRONT][processDateFields] ${field}: 이미 ISO 형식임`, value);
        return;
      }
      
      // 진짜 Date 객체인지 확인 (null, 배열, 함수, 일반 객체는 제외)
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        typeof value !== 'function' &&
        value instanceof Date
      ) {
        processed[field] = value.toISOString();
        console.log(`[FRONT][processDateFields] ${field}: Date 객체를 ISO 문자열로 변환`, processed[field]);
        return;
      }
      
      // 문자열인 경우 Date로 변환 시도
      if (typeof value === 'string') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          processed[field] = date.toISOString();
          console.log(`[FRONT][processDateFields] ${field}: 문자열을 Date로 변환 후 ISO 문자열로 변환`, processed[field]);
          return;
        } else {
          console.log(`[FRONT][processDateFields] ${field}: 유효하지 않은 날짜 문자열`, value);
        }
      }
      
      // 그 외의 경우(숫자, 배열, 객체, 함수 등)는 한국 시간으로 대체
      const koreanTime = new Date();
      koreanTime.setHours(koreanTime.getHours() + 9); // UTC+9
      processed[field] = koreanTime.toISOString();
      console.log(`[FRONT][processDateFields] ${field}: 처리할 수 없는 형식이라 한국 시간으로 설정`, processed[field]);
    } catch (e) {
      console.error(`[FRONT][processDateFields] ${field} 처리 중 오류:`, e);
      const koreanTime = new Date();
      koreanTime.setHours(koreanTime.getHours() + 9); // UTC+9
      processed[field] = koreanTime.toISOString();
      console.log(`[FRONT][processDateFields] ${field}: 오류 발생으로 한국 시간으로 설정`, processed[field]);
    }
  });
  
  console.log('[FRONT][processDateFields] 날짜 처리 후 데이터:', JSON.stringify({
    acci_time: processed.acci_time,
    first_report_time: processed.first_report_time,
    created_at: processed.created_at,
    updated_at: processed.updated_at
  }, null, 2));
  
  return processed;
};

/**
 * 발생보고서 생성 API 호출
 * @param data 발생보고서 데이터
 * @returns API 응답
 */
export const createOccurrenceReport = async (data: OccurrenceReportData): Promise<{ success: boolean; accident_id?: string; error?: string }> => {
  try {
    console.log("[FRONT][createOccurrenceReport] 시작");
    
    // 유효성 검사
    const validation = validateOccurrenceReport(data);
    if (!validation.valid) {
      console.error(`[FRONT][createOccurrenceReport] 유효성 검사 실패:`, validation.error);
      return { success: false, error: validation.error };
    }
    
    // 깊은 복사를 통해 참조 관계 제거 (JSON 직렬화/역직렬화)
    let safeData: OccurrenceReportData;
    try {
      const jsonString = JSON.stringify(data);
      console.log(`[FRONT][createOccurrenceReport] 데이터 직렬화 완료 (${jsonString.length} 바이트)`);
      
      safeData = JSON.parse(jsonString);
      console.log(`[FRONT][createOccurrenceReport] 깊은 복사 완료`);
    } catch (e) {
      console.error(`[FRONT][createOccurrenceReport] 데이터 직렬화 오류:`, e);
      // 오류 발생 시 얕은 복사로 대체
      safeData = { ...data };
    }
    
    // 날짜 필드가 누락되거나 잘못된 경우 안전한 값으로 대체
    ['acci_time', 'first_report_time', 'created_at', 'updated_at'].forEach(field => {
      try {
        if (!safeData[field]) {
          const koreanTime = new Date();
          koreanTime.setHours(koreanTime.getHours() + 9); // UTC+9
          safeData[field] = koreanTime.toISOString();
          console.log(`[FRONT][createOccurrenceReport] ${field} 없음, 한국 시간으로 생성:`, safeData[field]);
        } else if (typeof safeData[field] !== 'string') {
          // 문자열이 아닌 경우 한국 시간 문자열로 설정
          const koreanTime = new Date();
          koreanTime.setHours(koreanTime.getHours() + 9); // UTC+9
          safeData[field] = koreanTime.toISOString();
          console.log(`[FRONT][createOccurrenceReport] ${field} 타입 오류, 한국 시간으로 재설정:`, safeData[field]);
        }
      } catch (e) {
        console.error(`[FRONT][createOccurrenceReport] ${field} 처리 오류:`, e);
        const koreanTime = new Date();
        koreanTime.setHours(koreanTime.getHours() + 9); // UTC+9
        safeData[field] = koreanTime.toISOString();
      }
    });
    
    // 재해자 정보 로깅
    if (safeData.victims && Array.isArray(safeData.victims) && safeData.victims.length > 0) {
      console.log(`[FRONT][createOccurrenceReport] 재해자 정보 ${safeData.victims.length}명:`, 
        safeData.victims.map(v => ({
          name: v.name,
          age: v.age,
          injury_type: v.injury_type
        }))
      );
    }
    
    // 보고자 정보 로깅
    if (safeData.reporter_name || safeData.reporter_position || safeData.reporter_belong) {
      console.log(`[FRONT][createOccurrenceReport] 보고자 정보:`, {
        name: safeData.reporter_name,
        position: safeData.reporter_position,
        belong: safeData.reporter_belong
      });
    }
    
    // 파일 필드 처리
    let processedData = processFileFields(safeData);
    console.log(`[FRONT][createOccurrenceReport] 파일 필드 처리 완료`);
    
    // 날짜 필드 처리
    processedData = processDateFields(processedData);
    console.log(`[FRONT][createOccurrenceReport] 날짜 필드 처리 완료`);
    
    // API 호출
    try {
      console.log('[FRONT][createOccurrenceReport] API 호출 직전 데이터 크기:', 
        JSON.stringify(processedData).length, '바이트');
      
      const response = await fetch("/api/occurrence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(processedData),
      });
      
      if (!response.ok) {
        let errorMessage = "사고 발생보고서 저장 중 오류가 발생했습니다.";
        
        try {
          const errorData = await response.json();
          if (errorData.error || errorData.message) {
            errorMessage = errorData.error || errorData.message;
          }
        } catch (e) {
          console.error('[FRONT][createOccurrenceReport] 오류 응답 파싱 실패:', e);
        }
        
        console.error('[FRONT][createOccurrenceReport] API 오류:', errorMessage);
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('[FRONT][createOccurrenceReport] 성공 응답:', result);
      
      return {
        success: true,
        accident_id: result.accident_id
      };
    } catch (apiError: any) {
      console.error("[FRONT][createOccurrenceReport] API 호출 오류:", apiError);
      throw apiError; // 상위 catch 블록으로 전달
    }
  } catch (error: any) {
    console.error("[FRONT][createOccurrenceReport] 최종 오류:", error);
    return {
      success: false,
      error: error.message || "사고 발생보고서 저장 중 오류가 발생했습니다."
    };
  }
};

/**
 * 발생보고서 수정 API 호출
 * @param id 발생보고서 ID
 * @param data 발생보고서 데이터
 * @returns API 응답
 */
export const updateOccurrenceReport = async (id: string, data: OccurrenceReportData): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`[FRONT][updateOccurrenceReport] 시작 (ID: ${id})`);
    
    // 유효성 검사
    const validation = validateOccurrenceReport(data);
    if (!validation.valid) {
      console.error(`[FRONT][updateOccurrenceReport] 유효성 검사 실패:`, validation.error);
      return { success: false, error: validation.error };
    }
    
    // 깊은 복사를 통해 참조 관계 제거 (JSON 직렬화/역직렬화)
    let safeData: OccurrenceReportData;
    try {
      const jsonString = JSON.stringify(data);
      console.log(`[FRONT][updateOccurrenceReport] 데이터 직렬화 완료 (${jsonString.length} 바이트)`);
      
      safeData = JSON.parse(jsonString);
      console.log(`[FRONT][updateOccurrenceReport] 깊은 복사 완료`);
      
      // 직렬화/역직렬화 후 타입 검사
      ['acci_time', 'first_report_time', 'created_at', 'updated_at'].forEach(field => {
        console.log(`[FRONT][updateOccurrenceReport] 직렬화 후 ${field} 타입:`, {
          value: safeData[field],
          type: typeof safeData[field],
          isDate: safeData[field] instanceof Date
        });
      });
    } catch (e) {
      console.error(`[FRONT][updateOccurrenceReport] 데이터 직렬화 오류:`, e);
      // 오류 발생 시 얕은 복사로 대체
      safeData = { ...data };
    }
    
    // 날짜 필드가 누락되거나 잘못된 경우 안전한 값으로 대체
    if (!safeData.created_at) {
      const koreanTime = new Date();
      koreanTime.setHours(koreanTime.getHours() + 9); // UTC+9
      safeData.created_at = koreanTime.toISOString();
      console.log(`[FRONT][updateOccurrenceReport] created_at 없음, 한국 시간으로 생성:`, safeData.created_at);
    }
    
    if (!safeData.updated_at) {
      const koreanTime = new Date();
      koreanTime.setHours(koreanTime.getHours() + 9); // UTC+9
      safeData.updated_at = koreanTime.toISOString();
      console.log(`[FRONT][updateOccurrenceReport] updated_at 없음, 한국 시간으로 생성:`, safeData.updated_at);
    }
    
    // 재해자 정보 로깅
    if (safeData.victims && Array.isArray(safeData.victims) && safeData.victims.length > 0) {
      console.log(`[FRONT][updateOccurrenceReport] 재해자 정보 ${safeData.victims.length}명:`, 
        safeData.victims.map(v => ({
          name: v.name,
          age: v.age,
          injury_type: v.injury_type
        }))
      );
    }
    
    // 보고자 정보 로깅
    if (safeData.reporter_name || safeData.reporter_position || safeData.reporter_belong) {
      console.log(`[FRONT][updateOccurrenceReport] 보고자 정보:`, {
        name: safeData.reporter_name,
        position: safeData.reporter_position,
        belong: safeData.reporter_belong
      });
    }
    
    // 파일 필드 처리
    let processedData = processFileFields(safeData);
    console.log(`[FRONT][updateOccurrenceReport] 파일 필드 처리 완료`);
    
    // 날짜 필드 처리
    processedData = processDateFields(processedData);
    console.log(`[FRONT][updateOccurrenceReport] 날짜 필드 처리 완료`);
    
    // API 호출
    try {
      console.log(`[FRONT][updateOccurrenceReport] API 호출 직전 타임스탬프 필드:`, {
        acci_time: processedData.acci_time,
        first_report_time: processedData.first_report_time,
        created_at: processedData.created_at,
        updated_at: processedData.updated_at
      });
      
      const response = await fetch(`/api/occurrence/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(processedData),
      });
      
      if (!response.ok) {
        let errorMessage = `API 오류 (${response.status}): ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          if (errorData.error || errorData.message) {
            errorMessage = errorData.error || errorData.message;
          }
        } catch (e) {
          console.error(`[FRONT][updateOccurrenceReport] 오류 응답 파싱 실패:`, e);
        }
        
        console.error(`[FRONT][updateOccurrenceReport] API 오류:`, errorMessage);
        throw new Error(errorMessage);
      }
      
      console.log(`[FRONT][updateOccurrenceReport] 성공 (ID: ${id})`);
      return {
        success: true
      };
    } catch (apiError: any) {
      console.error(`[FRONT][updateOccurrenceReport] API 호출 오류:`, apiError);
      throw apiError; // 상위 catch 블록으로 전달
    }
  } catch (error: any) {
    console.error(`[FRONT][updateOccurrenceReport] 최종 오류:`, error);
    return {
      success: false,
      error: error.message || "사고 발생보고서 수정 중 오류가 발생했습니다."
    };
  }
};

/**
 * 발생보고서 조회 API 호출
 * @param id 발생보고서 ID
 * @returns 발생보고서 데이터
 */
export const getOccurrenceReport = async (id: string): Promise<OccurrenceReportData> => {
  try {
    const response = await fetch(`/api/occurrence/${id}`);
    
    if (!response.ok) {
      throw new Error(`API 오류 (${response.status}): ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("발생보고서 조회 오류:", error);
    throw new Error(error.message || "사고 발생보고서를 불러오는 중 오류가 발생했습니다.");
  }
};

/**
 * 발생보고서 목록 조회 API 호출
 * @param page 페이지 번호
 * @param limit 페이지당 항목 수
 * @returns 발생보고서 목록
 */
export const getOccurrenceReports = async (page = 1, limit = 10): Promise<{ reports: OccurrenceReportData[]; total: number; page: number; limit: number; total_pages: number }> => {
  try {
    const response = await fetch(`/api/occurrence?page=${page}&limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`API 오류 (${response.status}): ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("발생보고서 목록 조회 오류:", error);
    throw new Error(error.message || "사고 발생보고서 목록을 불러오는 중 오류가 발생했습니다.");
  }
};

/**
 * 날짜 시간 변환 함수
 * @param dateString 날짜 문자열
 * @returns datetime-local 입력에 적합한 형식의 문자열
 */
export const formatDateForInput = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    // 문자열을 Date 객체로 변환
    const date = new Date(dateString);
    
    // 유효한 날짜인지 확인
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // YYYY-MM-DDTHH:MM 형식으로 변환 (datetime-local 입력에 필요한 형식)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (e) {
    console.error('날짜 변환 오류:', e);
    return '';
  }
}; 