import { db } from '../orm';
import { reportFormSettings, defaultOccurrenceFormFields } from '../orm/schema/report_form';
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
        display_order: 12 // accident_type_level2 다음 순서
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
      .set(updates)
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
      // 기본 필드 정의에서 victim_count 필드가 사고정보 그룹에 있는지 확인
      const defaultFields = [...defaultOccurrenceFormFields];
      
      // victim_count 필드의 위치 조정 및 다른 필드들의 순서 재조정
      const victimCountIndex = defaultFields.findIndex(field => field.field_name === 'victim_count');
      
      if (victimCountIndex !== -1) {
        // victim_count를 사고정보 그룹의 display_order 12 위치로 이동
        defaultFields[victimCountIndex] = {
          ...defaultFields[victimCountIndex],
          field_group: '사고정보',
          display_order: 12
        };
        
        // 다른 필드들의 순서 조정 (사고정보 그룹 내에서)
        for (let i = 0; i < defaultFields.length; i++) {
          const field = defaultFields[i];
          if (i !== victimCountIndex && field.field_group === '사고정보') {
            // acci_location은 display_order 13으로 조정
            if (field.field_name === 'acci_location') {
              defaultFields[i] = { ...field, display_order: 13 };
            }
            // accident_type_level1은 display_order 14로 조정
            else if (field.field_name === 'accident_type_level1') {
              defaultFields[i] = { ...field, display_order: 14 };
            }
            // accident_type_level2는 display_order 15로 조정
            else if (field.field_name === 'accident_type_level2') {
              defaultFields[i] = { ...field, display_order: 15 };
            }
            // acci_summary는 display_order 16으로 조정
            else if (field.field_name === 'acci_summary') {
              defaultFields[i] = { ...field, display_order: 16 };
            }
            // acci_detail은 display_order 17로 조정
            else if (field.field_name === 'acci_detail') {
              defaultFields[i] = { ...field, display_order: 17 };
            }
          }
        }
        
        // 재해자정보 그룹의 필드들도 순서 조정 (시작 번호를 18로)
        let rehajaIdx = 18;
        for (let i = 0; i < defaultFields.length; i++) {
          if (defaultFields[i].field_group === '재해자정보') {
            defaultFields[i] = { ...defaultFields[i], display_order: rehajaIdx++ };
          }
        }
      }
      
      // 각 필드마다 ID 생성
      const fieldsWithIds = defaultFields.map(field => ({
        ...field,
        id: createId(),
        report_type: reportType
      }));
      
      // 기본 설정 삽입
      await db().insert(reportFormSettings).values(fieldsWithIds);
    }
    
    // 재설정 후 victim_count 필드 위치 확인을 위한 로그 출력
    if (reportType === 'occurrence') {
      const result = await db()
        .select()
        .from(reportFormSettings)
        .where(
          and(
            eq(reportFormSettings.field_name, 'victim_count'),
            eq(reportFormSettings.report_type, 'occurrence')
          )
        );
      
      console.log('재설정 후 victim_count 필드 위치:', result);
    }
    
    return { success: true, message: '설정이 초기화되었습니다.' };
  } catch (error) {
    console.error(`[설정 초기화 오류]: ${error}`);
    throw new Error('양식 설정을 초기화하는 중 오류가 발생했습니다.');
  }
}; 