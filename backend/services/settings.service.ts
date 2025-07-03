import { db } from '../orm';
import { reportFormSettings, defaultOccurrenceFormFields, defaultInvestigationFormFields } from '../orm/schema/report_form';
import { eq, and } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

/**
 * 양식 설정 조회
 * @param reportType 보고서 유형 (occurrence 또는 investigation)
 * @returns 해당 보고서 유형의 양식 설정
 */
export const getReportFormSettings = async (reportType: string) => {
  try {
    // 보고서 유형에 맞는 양식 설정 조회
    const settings = await db()
      .select()
      .from(reportFormSettings)
      .where(eq(reportFormSettings.report_type, reportType))
      .orderBy(reportFormSettings.display_order);
    
    return settings;
  } catch (error) {
    console.error(`[설정 조회 오류]: ${error}`);
    throw new Error('양식 설정을 조회하는 중 오류가 발생했습니다.');
  }
};

/**
 * 재해자 수 필드를 사고정보 그룹으로 이동
 */
export const moveVictimCountToAccidentGroup = async () => {
  try {
    await db()
      .update(reportFormSettings)
      .set({
        field_group: "사고정보",
        display_order: 17,
        updated_at: new Date()
      })
      .where(eq(reportFormSettings.field_name, "victim_count"));
    
    return { success: true, message: '재해자 수 필드를 사고정보 그룹으로 이동했습니다.' };
  } catch (error) {
    console.error(`[필드 이동 오류]: ${error}`);
    throw new Error('필드 이동 중 오류가 발생했습니다.');
  }
};

/**
 * 양식 설정 업데이트
 * @param id 설정 ID
 * @param updates 업데이트할 필드와 값
 * @returns 업데이트된 결과
 */
export const updateFormSetting = async (id: string, updates: any) => {
  try {
    // 설정 ID로 해당 설정 업데이트
    await db()
      .update(reportFormSettings)
      .set({
        ...updates,
        updated_at: new Date()
      })
      .where(eq(reportFormSettings.id, id));
    
    return { success: true, message: '설정이 업데이트되었습니다.' };
  } catch (error) {
    console.error(`[설정 업데이트 오류]: ${error}`);
    throw new Error('양식 설정을 업데이트하는 중 오류가 발생했습니다.');
  }
};

/**
 * 양식 설정 초기화
 * @param reportType 보고서 유형 (occurrence 또는 investigation)
 * @returns 초기화 결과
 */
export const resetFormSettings = async (reportType: string) => {
  try {
    // 현재 설정 삭제
    await db()
      .delete(reportFormSettings)
      .where(eq(reportFormSettings.report_type, reportType));
    
    // 기본 설정으로 초기화
    if (reportType === 'occurrence') {
      // 기본 필드 정의 복사
      const defaultFields = [...defaultOccurrenceFormFields];
      
      // 각 필드마다 ID 생성
      const fieldsWithIds = defaultFields.map(field => ({
        ...field,
        id: createId(),
        report_type: reportType
      }));
      
      // 기본 설정 삽입
      await db().insert(reportFormSettings).values(fieldsWithIds);
    } else if (reportType === 'investigation') {
      // 조사보고서 기본 필드 정의 복사
      const defaultFields = [...defaultInvestigationFormFields];
      
      // 각 필드마다 ID 생성
      const fieldsWithIds = defaultFields.map(field => ({
        ...field,
        id: createId(),
        report_type: reportType
      }));
      
      // 기본 설정 삽입
      await db().insert(reportFormSettings).values(fieldsWithIds);
    }
    
    return { success: true, message: '설정이 초기화되었습니다.' };
  } catch (error) {
    console.error(`[설정 초기화 오류]: ${error}`);
    throw new Error('양식 설정을 초기화하는 중 오류가 발생했습니다.');
  }
};

/**
 * 기존 설정에 누락된 필드들을 추가
 * @param reportType 보고서 유형 (occurrence 또는 investigation)
 * @returns 추가된 필드 정보
 */
export const addMissingFields = async (reportType: string) => {
  try {
    // 현재 DB에 있는 필드들 조회
    const existingFields = await db()
      .select({ field_name: reportFormSettings.field_name })
      .from(reportFormSettings)
      .where(eq(reportFormSettings.report_type, reportType));
    
    const existingFieldNames = existingFields.map(f => f.field_name);
    
    // 기본 필드 정의 가져오기
    let defaultFields: any[] = [];
    if (reportType === 'occurrence') {
      defaultFields = [...defaultOccurrenceFormFields];
    } else if (reportType === 'investigation') {
      defaultFields = [...defaultInvestigationFormFields];
    }
    
    // 누락된 필드들 찾기
    const missingFields = defaultFields.filter(field => 
      !existingFieldNames.includes(field.field_name)
    );
    
    if (missingFields.length === 0) {
      return { addedCount: 0, addedFields: [] };
    }
    
    // 누락된 필드들 추가
    const fieldsToAdd = missingFields.map(field => ({
      ...field,
      id: createId(),
      report_type: reportType,
      created_at: new Date(),
      updated_at: new Date()
    }));
    
    await db().insert(reportFormSettings).values(fieldsToAdd);
    
    return { 
      addedCount: fieldsToAdd.length, 
      addedFields: fieldsToAdd.map(f => ({ field_name: f.field_name, display_name: f.display_name }))
    };
  } catch (error) {
    console.error(`[누락 필드 추가 오류]: ${error}`);
    throw new Error('누락 필드 추가 중 오류가 발생했습니다.');
  }
}; 