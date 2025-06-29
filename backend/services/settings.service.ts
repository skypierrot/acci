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
 * victim_count 필드를 재해자정보 그룹에서 사고정보 그룹으로 이동
 */
export const moveVictimCountToAccidentGroup = async () => {
  try {
    // victim_count 필드의 현재 설정 확인
    const victimCountSettings = await db()
      .select()
      .from(reportFormSettings)
      .where(
        and(
          eq(reportFormSettings.field_name, 'victim_count'),
          eq(reportFormSettings.report_type, 'occurrence')
        )
      );
    
    // 설정이 없거나 이미 사고정보 그룹에 있는 경우 건너뛰기
    if (
      victimCountSettings.length === 0 || 
      (victimCountSettings[0].field_group === '사고정보' && victimCountSettings[0].display_order === 12)
    ) {
      console.log('victim_count 필드가 이미 올바른 위치에 있습니다.');
      return true;
    }
    
    // victim_count 필드의 그룹을 '사고정보'로 변경
    await db()
      .update(reportFormSettings)
      .set({
        field_group: '사고정보',
        display_order: 17 // 사고 상세 내용 다음 순서
      })
      .where(
        and(
          eq(reportFormSettings.field_name, 'victim_count'),
          eq(reportFormSettings.report_type, 'occurrence')
        )
      );
    
    console.log('victim_count 필드를 사고정보 그룹으로 이동했습니다.');
    return true;
  } catch (error) {
    console.error(`[필드 이동 오류]: ${error}`);
    throw new Error('victim_count 필드 이동 중 오류가 발생했습니다.');
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