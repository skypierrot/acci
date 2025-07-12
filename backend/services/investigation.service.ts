/**
 * @file services/investigation.service.ts
 * @description 조사보고서 관련 비즈니스 로직을 처리하는 서비스 클래스
 */

import { eq, desc, sql, ilike } from "drizzle-orm";
import { db, tables } from "../orm/index";

// 타임스탬프 필드 목록 (조사보고서 스키마의 모든 타임스탬프 필드)
const TIMESTAMP_FIELDS = [
  'investigation_start_time',
  'investigation_end_time',
  'original_acci_time',
  'investigation_acci_time',
  'report_written_date',
  'created_at',
  'updated_at'
];

// 문자열이나 다른 값을 Date 객체로 변환하는 헬퍼 함수
const ensureDate = (value: any): Date | null => {
  if (!value) return null;
  
  if (value instanceof Date) {
    console.log(`[INVESTIGATION][ensureDate] 이미 Date 객체임: ${value}`);
    return value;
  }
  
  try {
    // 문자열 또는 숫자를 Date 객체로 변환 시도
    const date = new Date(value);
    // 유효한 날짜인지 확인
    if (!isNaN(date.getTime())) {
      console.log(`[INVESTIGATION][ensureDate] 유효한 날짜로 변환 성공: ${value} → ${date.toISOString()}`);
      return date;
    }
  } catch (e) {
    console.error('[INVESTIGATION][ensureDate] 날짜 변환 오류:', e, value);
  }
  
  console.log(`[INVESTIGATION][ensureDate] 변환 실패: ${value} (타입: ${typeof value})`);
  return null; // 변환 실패 시 null 반환
};

// 데이터 객체의 모든 타임스탬프 필드를 처리하는 함수
const processTimestampFields = (data: any): any => {
  const result = { ...data };
  
  console.log('[INVESTIGATION][processTimestampFields] 시작 - 필드 타입 현황:');
  TIMESTAMP_FIELDS.forEach(field => {
    console.log(`[INVESTIGATION][processTimestampFields] ${field}:`, {
      value: result[field],
      type: typeof result[field],
      isDate: result[field] instanceof Date,
      isString: typeof result[field] === 'string',
      isValidDate: result[field] && !isNaN(new Date(result[field]).getTime()),
      hasToISOString: result[field] && typeof result[field].toISOString === 'function'
    });
  });
  
  TIMESTAMP_FIELDS.forEach(field => {
    if (field in result) {
      const dateValue = ensureDate(result[field]);
      // null이 아닌 경우에만 값 설정 (null이면 해당 필드 제거)
      if (dateValue) {
        result[field] = dateValue;
        console.log(`[INVESTIGATION][processTimestampFields] ${field} 설정: ${dateValue.toISOString()}`);
      } else {
        delete result[field];
        console.log(`[INVESTIGATION][processTimestampFields] ${field} 필드 제거 (유효하지 않은 날짜)`);
      }
    }
  });
  
  return result;
};

export interface InvestigationReportData {
  // 기본 정보
  accident_id: string;
  investigation_start_time?: string;
  investigation_end_time?: string;
  investigation_team_lead?: string;
  investigation_team_members?: string;
  investigation_location?: string;

  // 원본 정보
  original_global_accident_no?: string;
  original_accident_id?: string;
  original_acci_time?: string;
  original_acci_location?: string;
  original_accident_type_level1?: string;
  original_accident_type_level2?: string;
  original_acci_summary?: string;
  original_acci_detail?: string;
  original_victim_count?: number;

  // 조사 수정 정보
  investigation_global_accident_no?: string;
  investigation_accident_id?: string;
  investigation_acci_time?: string;
  investigation_acci_location?: string;
  investigation_accident_type_level1?: string;
  investigation_accident_type_level2?: string;
  investigation_acci_summary?: string;
  investigation_acci_detail?: string;
  investigation_victim_count?: number;
  investigation_victims_json?: string;
  investigation_victims?: any[];
  investigation_property_damage?: any[];
  
  // 피해 정보
  damage_severity?: string;
  death_count?: number;
  injured_count?: number;
  damage_cost?: number;
  
  // 원인 분석/재발방지대책 구조적 저장 필드 추가
  /**
   * 원인분석(직접/근본원인, 배열 구조)
   * 프론트에서는 객체/배열로 오고, DB에는 JSON 문자열로 저장
   */
  cause_analysis?: any;
  /**
   * 재발방지대책(기술/교육/관리적 대책, 배열 구조)
   * 프론트에서는 객체/배열로 오고, DB에는 JSON 문자열로 저장
   */
  prevention_actions?: any;
  
  // 조사 결론
  investigation_conclusion?: string;
  investigation_status?: string;
  investigation_summary?: string;
  investigator_signature?: string;
  report_written_date?: string;
}

export default class InvestigationService {
  /**
   * 발생보고서로부터 조사보고서 생성
   * @param occurrenceId 발생보고서 ID
   * @returns 생성된 조사보고서
   */
  static async createFromOccurrence(occurrenceId: string) {
    console.log("[INVESTIGATION][createFromOccurrence] 발생보고서 기반 조사보고서 생성:", occurrenceId);
    
    try {
      return await db().transaction(async (tx) => {
        // 1. 발생보고서 조회
        const occurrenceReport = await tx
          .select()
          .from(tables.occurrenceReport)
          .where(eq(tables.occurrenceReport.accident_id, occurrenceId))
          .limit(1);

        if (occurrenceReport.length === 0) {
          throw new Error(`발생보고서를 찾을 수 없습니다: ${occurrenceId}`);
        }

        const occurrence = occurrenceReport[0];

        // 2. 기존 조사보고서 존재 확인
        const existingInvestigation = await tx
          .select()
          .from(tables.investigationReport)
          .where(eq(tables.investigationReport.accident_id, occurrenceId))
          .limit(1);

        if (existingInvestigation.length > 0) {
          throw new Error(`이미 조사보고서가 존재합니다: ${occurrenceId}`);
        }

        // 3. 조사보고서 생성 (발생보고서 데이터를 원본으로 복사)
        const investigationData = {
          accident_id: occurrence.accident_id,
          original_global_accident_no: occurrence.global_accident_no,
          original_accident_id: occurrence.accident_id,
          original_acci_time: occurrence.acci_time ? occurrence.acci_time.toISOString() : null,
          original_acci_location: occurrence.acci_location,
          original_accident_type_level1: occurrence.accident_type_level1,
          original_accident_type_level2: occurrence.accident_type_level2,
          original_acci_summary: occurrence.acci_summary,
          original_acci_detail: occurrence.acci_detail,
          original_victim_count: occurrence.victim_count,
          // 조사 정보는 초기값으로 원본과 동일하게 설정
          investigation_global_accident_no: occurrence.global_accident_no,
          investigation_accident_id: occurrence.accident_id,
          investigation_acci_time: occurrence.acci_time ? occurrence.acci_time.toISOString() : null,
          investigation_acci_location: occurrence.acci_location,
          investigation_accident_type_level1: occurrence.accident_type_level1,
          investigation_accident_type_level2: occurrence.accident_type_level2,
          investigation_acci_summary: occurrence.acci_summary,
          investigation_acci_detail: occurrence.acci_detail,
          investigation_victim_count: occurrence.victim_count,
          investigation_status: 'draft'
        };

        await tx
          .insert(tables.investigationReport)
          .values(investigationData);

        // 4. 발생보고서의 재해자 정보를 조사보고서용 테이블에 복사
        const occurrenceVictims = await tx
          .select()
          .from(tables.victims)
          .where(eq(tables.victims.accident_id, occurrenceId))
          .orderBy(tables.victims.victim_id);

        if (occurrenceVictims.length > 0) {
          const investigationVictimsToInsert = occurrenceVictims.map(victim => ({
            accident_id: occurrenceId,
            name: victim.name,
            age: victim.age,
            belong: victim.belong,
            duty: victim.duty,
            injury_type: victim.injury_type,
            ppe_worn: victim.ppe_worn,
            first_aid: victim.first_aid,
            birth_date: victim.birth_date ? victim.birth_date.toISOString().slice(0, 10) : null, // timestamp를 string으로 변환
            absence_start_date: null, // 발생보고서에는 없는 필드
            return_expected_date: null, // 발생보고서에는 없는 필드
            job_experience_duration: null, // 발생보고서에는 없는 필드
            job_experience_unit: null, // 발생보고서에는 없는 필드
            injury_location: victim.injury_location,
            medical_opinion: victim.medical_opinion,
            training_completed: victim.training_completed,
            etc_notes: victim.etc_notes,
          }));

          await tx
            .insert(tables.investigationVictims)
            .values(investigationVictimsToInsert);

          console.log(`[INVESTIGATION][createFromOccurrence] 재해자 정보 ${occurrenceVictims.length}명 복사 완료`);
        }

        // 5. 발생보고서의 물적피해 정보를 조사보고서용 테이블에 복사
        try {
          // property_damage 테이블에서 실제 존재하는 컬럼만 명시적으로 select
          const occurrencePropertyDamage = await tx
            .select({
              damage_id: tables.propertyDamage.damage_id,
              accident_id: tables.propertyDamage.accident_id,
              damage_target: tables.propertyDamage.damage_target,
              damage_type: tables.propertyDamage.damage_type,
              estimated_cost: tables.propertyDamage.estimated_cost,
              damage_content: tables.propertyDamage.damage_content,
              recovery_plan: tables.propertyDamage.recovery_plan,
              etc_notes: tables.propertyDamage.etc_notes,
              created_at: tables.propertyDamage.created_at,
              updated_at: tables.propertyDamage.updated_at,
            })
            .from(tables.propertyDamage)
            .where(eq(tables.propertyDamage.accident_id, occurrenceId))
            .orderBy(tables.propertyDamage.damage_id);

          console.log(`[INVESTIGATION][createFromOccurrence] 발생보고서 물적피해 데이터 조회: ${occurrencePropertyDamage.length}건`);

          if (occurrencePropertyDamage.length > 0) {
            // ORM 스키마에 정의된 필드만 필터링하여 insert (damage_id는 자동생성 PK이므로 제외)
            const investigationPropertyDamageToInsert = occurrencePropertyDamage.map(damage => {
              // ORM 스키마에 정의된 필드만 추출 (damage_id 제외)
              const {
                damage_id, // PK는 자동생성되므로 제외
                damage_type, // 발생보고서에만 있는 필드 제외
                recovery_plan, // 발생보고서에만 있는 필드 제외
                etc_notes, // 발생보고서에만 있는 필드 제외
                created_at, // 자동생성되므로 제외
                updated_at, // 자동생성되므로 제외
                ...validFields // 실제 DB 컬럼만 남김
              } = damage;
              
              return {
                accident_id: occurrenceId,
                damage_target: validFields.damage_target,
                estimated_cost: validFields.estimated_cost,
                damage_content: validFields.damage_content,
                // 발생보고서 테이블에는 없는 필드들은 null로 설정
                shutdown_start_date: null, // 발생보고서에는 없는 필드
                recovery_expected_date: null, // 발생보고서에는 없는 필드
              };
            });

            await tx
              .insert(tables.investigationPropertyDamage)
              .values(investigationPropertyDamageToInsert);

            console.log(`[INVESTIGATION][createFromOccurrence] 물적피해 정보 ${occurrencePropertyDamage.length}건 복사 완료`);
          } else {
            console.log(`[INVESTIGATION][createFromOccurrence] 발생보고서에 물적피해 데이터가 없음`);
          }
        } catch (error) {
          console.error(`[INVESTIGATION][createFromOccurrence] 물적피해 정보 복사 중 오류:`, error);
          // 물적피해 정보 복사 실패해도 조사보고서 생성은 계속 진행
        }

        console.log("[INVESTIGATION][createFromOccurrence] 조사보고서 생성 완료");
        return investigationData;
      });
    } catch (error) {
      console.error("[INVESTIGATION][createFromOccurrence] 조사보고서 생성 실패:", error);
      throw error;
    }
  }

  /**
   * 조사보고서 생성
   * @param data 조사보고서 데이터
   * @returns 생성된 조사보고서
   */
  static async create(data: InvestigationReportData) {
    console.log("[INVESTIGATION][create] 조사보고서 생성 시작:", data.accident_id);
    
    try {
      return await db().transaction(async (tx) => {
        // 1. 기존 조사보고서 존재 확인
        const existing = await tx
          .select()
          .from(tables.investigationReport)
          .where(eq(tables.investigationReport.accident_id, data.accident_id))
          .limit(1);

        if (existing.length > 0) {
          throw new Error(`이미 조사보고서가 존재합니다: ${data.accident_id}`);
        }

        // 2. 데이터 정리 및 JSON 필드 처리
        const cleanData = { ...data };
        
        // 재해자 정보 처리
        if (data.investigation_victims && Array.isArray(data.investigation_victims)) {
          cleanData.investigation_victims_json = JSON.stringify(data.investigation_victims);
          console.log(`[INVESTIGATION][create] 재해자 정보 JSON 변환: ${data.investigation_victims.length}명`);
        }
        
        // 프론트엔드에서 보낸 배열 필드 제거 (DB에는 JSON 문자열로 저장)
        delete (cleanData as any).investigation_victims;
        
        // 원인 분석 정보 처리
        if (data.cause_analysis) {
          cleanData.cause_analysis = JSON.stringify(data.cause_analysis);
          console.log(`[INVESTIGATION][create] 원인분석 정보 JSON 변환: ${Array.isArray(data.cause_analysis) ? data.cause_analysis.length : 0}건`);
        }

        // 재발방지대책 정보 처리
        if (data.prevention_actions) {
          cleanData.prevention_actions = JSON.stringify(data.prevention_actions);
          console.log(`[INVESTIGATION][create] 재발방지대책 정보 JSON 변환: ${Array.isArray(data.prevention_actions) ? data.prevention_actions.length : 0}건`);
        }

        // 3. 조사보고서 생성
        await tx
          .insert(tables.investigationReport)
          .values(cleanData);

        console.log("[INVESTIGATION][create] 조사보고서 생성 완료");
        return data;
      });
    } catch (error) {
      console.error("[INVESTIGATION][create] 조사보고서 생성 실패:", error);
      throw error;
    }
  }

  /**
   * 조사보고서 조회 (ID로)
   * @param accident_id 사고 ID
   * @returns 조사보고서 데이터
   */
  static async getById(accident_id: string) {
    console.log("[INVESTIGATION][getById] 조사보고서 조회:", accident_id);
    
    try {
      const result = await db()
        .select()
        .from(tables.investigationReport)
        .where(eq(tables.investigationReport.accident_id, accident_id))
        .limit(1);

      if (result.length === 0) {
        throw new Error(`조사보고서를 찾을 수 없습니다: ${accident_id}`);
      }

      const investigation = result[0];

      // 원본 발생보고서의 재해자 정보 조회
      try {
        const occurrenceResult = await db()
          .select()
          .from(tables.occurrenceReport)
          .where(eq(tables.occurrenceReport.accident_id, accident_id))
          .limit(1);

        if (occurrenceResult.length > 0) {
          const occurrence = occurrenceResult[0];
          
          // 재해자 정보 조회
          const victimsData = await db()
            .select()
            .from(tables.victims)
            .where(eq(tables.victims.accident_id, accident_id))
            .orderBy(tables.victims.victim_id);

          console.log(`[INVESTIGATION][getById] 원본 재해자 정보 ${victimsData.length}건 조회됨`);
          
          // 재해자 정보가 있으면 original_victims에 추가
          if (victimsData.length > 0) {
            (investigation as any).original_victims = victimsData;
          } else if (occurrence.victims_json) {
            // DB에 재해자 정보는 없지만 victims_json이 있는 경우 파싱
            try {
              const parsedVictims = JSON.parse(occurrence.victims_json);
              if (Array.isArray(parsedVictims) && parsedVictims.length > 0) {
                (investigation as any).original_victims = parsedVictims;
                console.log(`[INVESTIGATION][getById] victims_json에서 ${parsedVictims.length}명의 재해자 정보 파싱됨`);
              }
            } catch (e) {
              console.error('[INVESTIGATION][getById] victims_json 파싱 오류:', e);
              (investigation as any).original_victims = [];
            }
          } else {
            (investigation as any).original_victims = [];
          }
        } else {
          console.log("[INVESTIGATION][getById] 원본 발생보고서를 찾을 수 없음");
          (investigation as any).original_victims = [];
        }
      } catch (err) {
        console.error("[INVESTIGATION][getById] 원본 재해자 정보 조회 오류:", err);
        (investigation as any).original_victims = [];
      }

      // 조사보고서의 재해자 정보 조회 (새로운 테이블 사용)
      try {
        const investigationVictimsData = await db()
          .select()
          .from(tables.investigationVictims)
          .where(eq(tables.investigationVictims.accident_id, accident_id))
          .orderBy(tables.investigationVictims.victim_id);

        console.log(`[INVESTIGATION][getById] 조사보고서 재해자 정보 ${investigationVictimsData.length}건 조회됨`);
        (investigation as any).investigation_victims = investigationVictimsData;
      } catch (err) {
        console.error("[INVESTIGATION][getById] 조사보고서 재해자 정보 조회 오류:", err);
        (investigation as any).investigation_victims = [];
      }

      // 조사보고서의 물적피해 정보 조회 (새로운 테이블 사용)
      try {
        const investigationPropertyDamageData = await db()
          .select()
          .from(tables.investigationPropertyDamage)
          .where(eq(tables.investigationPropertyDamage.accident_id, accident_id))
          .orderBy(tables.investigationPropertyDamage.damage_id);

        console.log(`[INVESTIGATION][getById] 조사보고서 물적피해 정보 ${investigationPropertyDamageData.length}건 조회됨`);
        (investigation as any).investigation_property_damage = investigationPropertyDamageData;
      } catch (err) {
        console.error("[INVESTIGATION][getById] 조사보고서 물적피해 정보 조회 오류:", err);
        (investigation as any).investigation_property_damage = [];
      }

      // 원인 분석 정보 처리
      if (investigation.cause_analysis) {
        try {
          const parsedCauseAnalysis = JSON.parse(investigation.cause_analysis);
          if (Array.isArray(parsedCauseAnalysis) && parsedCauseAnalysis.length > 0) {
            (investigation as any).cause_analysis = parsedCauseAnalysis;
            console.log(`[INVESTIGATION][getById] 조사보고서 원인분석 정보 ${parsedCauseAnalysis.length}건 파싱됨`);
          }
        } catch (e) {
          console.error('[INVESTIGATION][getById] cause_analysis 파싱 오류:', e);
          (investigation as any).cause_analysis = [];
        }
      } else {
        (investigation as any).cause_analysis = [];
      }

      // 재발방지대책 정보 처리
      if (investigation.prevention_actions) {
        try {
          const parsedPreventionActions = JSON.parse(investigation.prevention_actions);
          if (Array.isArray(parsedPreventionActions) && parsedPreventionActions.length > 0) {
            (investigation as any).prevention_actions = parsedPreventionActions;
            console.log(`[INVESTIGATION][getById] 조사보고서 재발방지대책 정보 ${parsedPreventionActions.length}건 파싱됨`);
          }
        } catch (e) {
          console.error('[INVESTIGATION][getById] prevention_actions 파싱 오류:', e);
          (investigation as any).prevention_actions = [];
        }
      } else {
        (investigation as any).prevention_actions = [];
      }

      console.log("[INVESTIGATION][getById] 조사보고서 조회 완료");
      return investigation;
    } catch (error) {
      console.error("[INVESTIGATION][getById] 조사보고서 조회 실패:", error);
      throw error;
    }
  }

  /**
   * 조사보고서 수정
   * @param accident_id 사고 ID
   * @param data 수정할 데이터
   * @returns 수정된 조사보고서
   */
  static async update(accident_id: string, data: Partial<InvestigationReportData>) {
    console.log("[INVESTIGATION][update] 조사보고서 수정 시작:", accident_id);
    
    try {
      return await db().transaction(async (tx) => {
        // 1. 기존 조사보고서 존재 확인
        const existing = await tx
          .select()
          .from(tables.investigationReport)
          .where(eq(tables.investigationReport.accident_id, accident_id))
          .limit(1);

        if (existing.length === 0) {
          throw new Error(`조사보고서를 찾을 수 없습니다: ${accident_id}`);
        }

        // 2. 데이터 정리 및 timestamp 필드 처리
        const cleanData = { ...data };
        
        // 읽기 전용 필드 제거
        if ('created_at' in cleanData) delete cleanData.created_at;
        if ('updated_at' in cleanData) delete cleanData.updated_at;
        
        // 조사보고서 재해자 정보 처리 (새로운 테이블 사용)
        if (data.investigation_victims && Array.isArray(data.investigation_victims)) {
          // 기존 재해자 정보 삭제
          await tx
            .delete(tables.investigationVictims)
            .where(eq(tables.investigationVictims.accident_id, accident_id));

          // 새로운 재해자 정보 삽입
          if (data.investigation_victims.length > 0) {
            const victimsToInsert = data.investigation_victims.map((victim: any) => ({
              accident_id,
              name: victim.name,
              age: victim.age,
              belong: victim.belong,
              duty: victim.duty,
              injury_type: victim.injury_type,
              ppe_worn: victim.ppe_worn,
              first_aid: victim.first_aid,
              birth_date: victim.birth_date,
              absence_start_date: victim.absence_start_date,
              return_expected_date: victim.return_expected_date,
              job_experience_duration: victim.job_experience_duration,
              job_experience_unit: victim.job_experience_unit,
              injury_location: victim.injury_location,
              medical_opinion: victim.medical_opinion,
              training_completed: victim.training_completed,
              etc_notes: victim.etc_notes,
            }));

            await tx
              .insert(tables.investigationVictims)
              .values(victimsToInsert);

            console.log(`[INVESTIGATION][update] 조사보고서 재해자 정보 ${data.investigation_victims.length}명 저장됨`);
          }
        }

        // 조사보고서 물적피해 정보 처리 (새로운 테이블 사용)
        if (data.investigation_property_damage && Array.isArray(data.investigation_property_damage)) {
          // 기존 물적피해 정보 삭제
          await tx
            .delete(tables.investigationPropertyDamage)
            .where(eq(tables.investigationPropertyDamage.accident_id, accident_id));

          // 새로운 물적피해 정보 삽입
          if (data.investigation_property_damage.length > 0) {
            // ORM 스키마에 정의된 필드만 필터링하여 insert (damage_id는 자동생성 PK이므로 제외)
            const damageToInsert = data.investigation_property_damage.map((damage: any) => {
              // ORM 스키마에 정의된 필드만 추출 (damage_id 제외)
              const {
                damage_id, // PK는 자동생성되므로 제외
                id, // 프론트엔드 임시 식별자 제외
                __tempKey, // 임시 키 제외
                selected, // UI 체크박스 등 제외
                ...validFields // 실제 DB 컬럼만 남김
              } = damage;
              
              return {
                accident_id,
                damage_target: validFields.damage_target,
                estimated_cost: validFields.estimated_cost,
                damage_content: validFields.damage_content,
                shutdown_start_date: validFields.shutdown_start_date ? new Date(validFields.shutdown_start_date) : null,
                recovery_expected_date: validFields.recovery_expected_date ? new Date(validFields.recovery_expected_date) : null,
              };
            });

            await tx
              .insert(tables.investigationPropertyDamage)
              .values(damageToInsert);

            console.log(`[INVESTIGATION][update] 조사보고서 물적피해 정보 ${data.investigation_property_damage.length}건 저장됨`);
          }
        }

        // 프론트엔드에서 보낸 배열 필드 제거 (DB에는 별도 테이블로 저장)
        delete (cleanData as any).investigation_victims;
        delete (cleanData as any).investigation_property_damage;
        
        // 원인 분석 정보 처리
        if (data.cause_analysis) {
          cleanData.cause_analysis = JSON.stringify(data.cause_analysis);
          console.log(`[INVESTIGATION][update] 원인분석 정보 JSON 변환: ${Array.isArray(data.cause_analysis) ? data.cause_analysis.length : 0}건`);
        }

        // 재발방지대책 정보 처리
        if (data.prevention_actions) {
          cleanData.prevention_actions = JSON.stringify(data.prevention_actions);
          console.log(`[INVESTIGATION][update] 재발방지대책 정보 JSON 변환: ${Array.isArray(data.prevention_actions) ? data.prevention_actions.length : 0}건`);
        }
        
        // 모든 timestamp 필드가 Date 객체인지 확인하고 처리
        const processedData = processTimestampFields(cleanData);
        
        console.log("[INVESTIGATION][update] 수정 직전 데이터 필드:", Object.keys(processedData));
        console.log("[INVESTIGATION][update] 타임스탬프 필드 값:", {
          investigation_start_time: processedData.investigation_start_time,
          investigation_end_time: processedData.investigation_end_time,
          original_acci_time: processedData.original_acci_time,
          investigation_acci_time: processedData.investigation_acci_time,
          report_written_date: processedData.report_written_date
        });

        // 3. 조사보고서 업데이트
        await tx
          .update(tables.investigationReport)
          .set(processedData)
          .where(eq(tables.investigationReport.accident_id, accident_id));

        console.log("[INVESTIGATION][update] 조사보고서 수정 완료");
        
        // 4. 수정된 결과 조회
        const updatedReport = await this.getById(accident_id);
        return updatedReport || { ...existing[0], ...processedData };
      });
    } catch (error) {
      console.error("[INVESTIGATION][update] 조사보고서 수정 실패:", error);
      throw error;
    }
  }

  /**
   * 조사보고서 삭제
   * @param accident_id 사고 ID
   */
  static async delete(accident_id: string) {
    console.log("[INVESTIGATION][delete] 조사보고서 삭제 시작:", accident_id);
    
    try {
      await db()
        .delete(tables.investigationReport)
        .where(eq(tables.investigationReport.accident_id, accident_id));

      console.log("[INVESTIGATION][delete] 조사보고서 삭제 완료");
      return { success: true, message: "조사보고서가 삭제되었습니다." };
    } catch (error) {
      console.error("[INVESTIGATION][delete] 조사보고서 삭제 실패:", error);
      throw error;
    }
  }

  /**
   * 조사보고서 목록 조회
   * @param filters 필터 조건
   * @returns 조사보고서 목록
   */
  static async getList(filters: {
    investigation_team_lead?: string;
    investigation_status?: string;
    searchTerm?: string; // 검색어 필터 추가
    limit?: number;
    offset?: number;
  } = {}) {
    console.log("[INVESTIGATION][getList] 조사보고서 목록 조회:", filters);
    
    try {
      // 기본 쿼리 설정
      let query: any = db()
        .select()
        .from(tables.investigationReport);

      // 필터 적용 (목록 쿼리)
      if (filters.investigation_team_lead) {
        query = query.where(eq(tables.investigationReport.investigation_team_lead, filters.investigation_team_lead));
      }
      if (filters.investigation_status) {
        query = query.where(eq(tables.investigationReport.investigation_status, filters.investigation_status));
      }
      if (filters.searchTerm) {
        query = query.where(ilike(tables.investigationReport.investigation_acci_summary, `%${filters.searchTerm}%`)); // 검색어로 요약 필드 검색
      }

      // 정렬 및 페이징
      query = query.orderBy(desc(tables.investigationReport.created_at));
      
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      
      if (filters.offset) {
        query = query.offset(filters.offset);
      }

      // 총 개수 쿼리 (필터 적용) - 타입 추론 문제 우회를 위해 any 캐스트
      let countQuery: any = db()
        .select({ count: sql`count(*)`.as('count') })
        .from(tables.investigationReport);

      // 필터 적용 (총 개수 쿼리)
      if (filters.investigation_team_lead) {
        countQuery = countQuery.where(eq(tables.investigationReport.investigation_team_lead, filters.investigation_team_lead));
      }
      if (filters.investigation_status) {
        countQuery = countQuery.where(eq(tables.investigationReport.investigation_status, filters.investigation_status));
      }
      if (filters.searchTerm) {
        countQuery = countQuery.where(ilike(tables.investigationReport.investigation_acci_summary, `%${filters.searchTerm}%`));
      }

      // 쿼리 실행
      const [result, countResult] = await Promise.all([
        query,
        countQuery
      ]);

      const total = Number(countResult[0]?.count ?? 0);

      console.log(`[INVESTIGATION][getList] 조사보고서 목록 조회 완료: ${result.length}건 / 총 ${total}건`);
      
      return { data: result, total };
    } catch (error) {
      console.error("[INVESTIGATION][getList] 조사보고서 목록 조회 실패:", error);
      throw error;
    }
  }

  /**
   * 발생보고서로부터 조사보고서 존재 여부 확인
   * @param accident_id 사고 ID
   * @returns 조사보고서 존재 여부
   */
  static async exists(accident_id: string): Promise<boolean> {
    try {
      const result = await db()
        .select({ accident_id: tables.investigationReport.accident_id })
        .from(tables.investigationReport)
        .where(eq(tables.investigationReport.accident_id, accident_id))
        .limit(1);

      return result.length > 0;
    } catch (error) {
      console.error("[INVESTIGATION][exists] 조사보고서 존재 확인 실패:", error);
      return false;
    }
  }

  /**
   * 발생보고서의 물적피해 정보 조회
   * @param accident_id 사고 ID
   * @returns 물적피해 정보 배열
   */
  static async getOriginalPropertyDamage(accident_id: string) {
    console.log("[INVESTIGATION][getOriginalPropertyDamage] 발생보고서 물적피해 정보 조회:", accident_id);
    
    try {
      // 발생보고서 존재 확인
      const occurrenceResult = await db()
        .select()
        .from(tables.occurrenceReport)
        .where(eq(tables.occurrenceReport.accident_id, accident_id))
        .limit(1);

      if (occurrenceResult.length === 0) {
        throw new Error(`발생보고서를 찾을 수 없습니다: ${accident_id}`);
      }

      // property_damage 테이블에서 실제 존재하는 컬럼만 명시적으로 select
      const propertyDamageData = await db()
        .select({
          damage_id: tables.propertyDamage.damage_id,
          accident_id: tables.propertyDamage.accident_id,
          damage_target: tables.propertyDamage.damage_target,
          damage_type: tables.propertyDamage.damage_type,
          estimated_cost: tables.propertyDamage.estimated_cost,
          damage_content: tables.propertyDamage.damage_content,
          recovery_plan: tables.propertyDamage.recovery_plan,
          etc_notes: tables.propertyDamage.etc_notes,
          created_at: tables.propertyDamage.created_at,
          updated_at: tables.propertyDamage.updated_at,
        })
        .from(tables.propertyDamage)
        .where(eq(tables.propertyDamage.accident_id, accident_id))
        .orderBy(tables.propertyDamage.damage_id);

      console.log(`[INVESTIGATION][getOriginalPropertyDamage] 물적피해 정보 ${propertyDamageData.length}건 조회 완료`);
      return propertyDamageData;
    } catch (error) {
      console.error("[INVESTIGATION][getOriginalPropertyDamage] 발생보고서 물적피해 정보 조회 실패:", error);
      throw error;
    }
  }

  /**
   * 발생보고서의 개별 재해자 정보 조회
   * @param accident_id 사고 ID
   * @param victimIndex 재해자 인덱스 (0부터 시작)
   * @returns 개별 재해자 정보
   */
  static async getOriginalVictim(accident_id: string, victimIndex: number) {
    console.log("[INVESTIGATION][getOriginalVictim] 발생보고서 개별 재해자 정보 조회:", accident_id, "인덱스:", victimIndex);
    
    try {
      // 발생보고서 존재 확인
      const occurrenceResult = await db()
        .select()
        .from(tables.occurrenceReport)
        .where(eq(tables.occurrenceReport.accident_id, accident_id))
        .limit(1);

      if (occurrenceResult.length === 0) {
        throw new Error(`발생보고서를 찾을 수 없습니다: ${accident_id}`);
      }

      // victims 테이블에서 해당 인덱스의 재해자 정보 조회
      const victimsData = await db()
        .select()
        .from(tables.victims)
        .where(eq(tables.victims.accident_id, accident_id))
        .orderBy(tables.victims.victim_id);

      if (victimIndex < 0 || victimIndex >= victimsData.length) {
        throw new Error(`재해자 인덱스 ${victimIndex}가 유효하지 않습니다. (총 ${victimsData.length}명)`);
      }

      const victim = victimsData[victimIndex];
      console.log(`[INVESTIGATION][getOriginalVictim] 개별 재해자 정보 조회 완료: ${victim.name || '이름없음'}`);
      return victim;
    } catch (error) {
      console.error("[INVESTIGATION][getOriginalVictim] 발생보고서 개별 재해자 정보 조회 실패:", error);
      throw error;
    }
  }

  /**
   * 발생보고서의 개별 물적피해 정보 조회
   * @param accident_id 사고 ID
   * @param damageIndex 물적피해 인덱스 (0부터 시작)
   * @returns 개별 물적피해 정보
   */
  static async getOriginalPropertyDamageItem(accident_id: string, damageIndex: number) {
    console.log("[INVESTIGATION][getOriginalPropertyDamageItem] 발생보고서 개별 물적피해 정보 조회:", accident_id, "인덱스:", damageIndex);
    
    try {
      // 발생보고서 존재 확인
      const occurrenceResult = await db()
        .select()
        .from(tables.occurrenceReport)
        .where(eq(tables.occurrenceReport.accident_id, accident_id))
        .limit(1);

      if (occurrenceResult.length === 0) {
        throw new Error(`발생보고서를 찾을 수 없습니다: ${accident_id}`);
      }

      // property_damage 테이블에서 해당 인덱스의 물적피해 정보 조회
      const propertyDamageData = await db()
        .select({
          damage_id: tables.propertyDamage.damage_id,
          accident_id: tables.propertyDamage.accident_id,
          damage_target: tables.propertyDamage.damage_target,
          damage_type: tables.propertyDamage.damage_type,
          estimated_cost: tables.propertyDamage.estimated_cost,
          damage_content: tables.propertyDamage.damage_content,
          recovery_plan: tables.propertyDamage.recovery_plan,
          etc_notes: tables.propertyDamage.etc_notes,
          created_at: tables.propertyDamage.created_at,
          updated_at: tables.propertyDamage.updated_at,
        })
        .from(tables.propertyDamage)
        .where(eq(tables.propertyDamage.accident_id, accident_id))
        .orderBy(tables.propertyDamage.damage_id);

      if (damageIndex < 0 || damageIndex >= propertyDamageData.length) {
        throw new Error(`물적피해 인덱스 ${damageIndex}가 유효하지 않습니다. (총 ${propertyDamageData.length}건)`);
      }

      const propertyDamage = propertyDamageData[damageIndex];
      console.log(`[INVESTIGATION][getOriginalPropertyDamageItem] 개별 물적피해 정보 조회 완료: ${propertyDamage.damage_target || '대상물없음'}`);
      return propertyDamage;
    } catch (error) {
      console.error("[INVESTIGATION][getOriginalPropertyDamageItem] 발생보고서 개별 물적피해 정보 조회 실패:", error);
      throw error;
    }
  }

  /**
   * 조사보고서 상태 업데이트
   * @param accident_id 사고 ID
   * @param status 새로운 상태
   */
  static async updateStatus(accident_id: string, status: string) {
    console.log("[INVESTIGATION][updateStatus] 조사보고서 상태 업데이트:", accident_id, status);
    
    try {
      await db()
        .update(tables.investigationReport)
        .set({ 
          investigation_status: status,
        })
        .where(eq(tables.investigationReport.accident_id, accident_id));

      console.log("[INVESTIGATION][updateStatus] 조사보고서 상태 업데이트 완료");
      return { success: true, message: "조사보고서 상태가 업데이트되었습니다." };
    } catch (error) {
      console.error("[INVESTIGATION][updateStatus] 조사보고서 상태 업데이트 실패:", error);
      throw error;
    }
  }
} 