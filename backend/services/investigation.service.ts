/**
 * @file services/investigation.service.ts
 * @description 조사보고서 관련 비즈니스 로직을 처리하는 서비스 클래스
 */

import { eq, desc, sql, ilike, and } from "drizzle-orm";
import { db, tables } from "../orm/index";
import { getKoreanTime, getKoreanTimeISO } from "../utils/koreanTime";
import { correctiveAction } from "../orm/schema/investigation";

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
  original_accident_name?: string; // 원본 사고명 필드 추가
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
  investigation_accident_name?: string; // 조사 사고명 필드 추가
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
          original_accident_name: occurrence.accident_name, // 원본 사고명 복사
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
          investigation_accident_name: occurrence.accident_name, // 조사 사고명도 초기값은 동일하게 복사
          investigation_acci_summary: occurrence.acci_summary,
          investigation_acci_detail: occurrence.acci_detail,
          investigation_victim_count: occurrence.victim_count,
          investigation_status: '대기'
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
        if (data.original_accident_name) cleanData.original_accident_name = data.original_accident_name;
        if (data.investigation_accident_name) cleanData.investigation_accident_name = data.investigation_accident_name;
        if (data.investigation_victims && Array.isArray(data.investigation_victims)) {
          cleanData.investigation_victims_json = JSON.stringify(data.investigation_victims);
          console.log(`[INVESTIGATION][create] 재해자 정보 JSON 변환: ${data.investigation_victims.length}명`);
        }
        delete (cleanData as any).investigation_victims;
        if (data.cause_analysis) {
          cleanData.cause_analysis = JSON.stringify(data.cause_analysis);
          console.log(`[INVESTIGATION][create] 원인분석 정보 JSON 변환: ${Array.isArray(data.cause_analysis) ? data.cause_analysis.length : 0}건`);
        }
        if (data.prevention_actions) {
          cleanData.prevention_actions = JSON.stringify(data.prevention_actions);
          console.log(`[INVESTIGATION][create] 재발방지대책 정보 JSON 변환: ${Array.isArray(data.prevention_actions) ? data.prevention_actions.length : 0}건`);
        }

        // 3. 조사보고서 생성
        await tx
          .insert(tables.investigationReport)
          .values(cleanData);

        // 4. 개선조치(재발방지대책) 테이블 저장
        // 한글 주석: prevention_actions가 있으면 corrective_action 테이블에 insert
        if (data.prevention_actions) {
          let actionsJson;
          try {
            actionsJson = typeof data.prevention_actions === 'string' ? JSON.parse(data.prevention_actions) : data.prevention_actions;
          } catch (e) {
            console.error(`[SKIP] JSON 파싱 오류: accident_id=${data.accident_id}`);
            actionsJson = null;
          }
          if (actionsJson) {
            for (const type of ['technical_actions', 'educational_actions', 'managerial_actions']) {
              const arr = actionsJson[type] || [];
              for (const action of arr) {
                await tx.insert(correctiveAction).values({
                  investigation_id: data.accident_id,
                  action_type: action.action_type || type.replace('_actions',''),
                  title: action.title || null,
                  improvement_plan: action.improvement_plan,
                  progress_status: action.progress_status,
                  scheduled_date: action.scheduled_date,
                  responsible_person: action.responsible_person,
                });
              }
            }
          }
        }

        console.log("[INVESTIGATION][create] 조사보고서 생성 및 개선조치 저장 완료");
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

      // 사고명 필드가 누락된 경우를 대비해 undefined일 때 빈 문자열로 반환
      if (typeof investigation.original_accident_name === 'undefined') {
        investigation.original_accident_name = '';
      }
      if (typeof investigation.investigation_accident_name === 'undefined') {
        investigation.investigation_accident_name = '';
      }

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

      // 요약 정보 생성
      let causeAnalysisSummary = '';
      let preventionActionsSummary = '';
      let totalActions = 0;
      let completedActions = 0;
      let pendingActions = 0;
      let responsiblePersons: string[] = [];
      let scheduledDates: string[] = [];

      // 원인분석 요약 추출
      if (investigation.cause_analysis) {
        try {
          const causeAnalysis = JSON.parse(investigation.cause_analysis);
          const directConditions = causeAnalysis.direct_cause?.unsafe_condition?.length || 0;
          const directActs = causeAnalysis.direct_cause?.unsafe_act?.length || 0;
          const humanFactors = causeAnalysis.root_cause?.human_factor?.length || 0;
          const systemFactors = causeAnalysis.root_cause?.system_factor?.length || 0;
          causeAnalysisSummary = `직접원인 ${directConditions + directActs}건, 근본원인 ${humanFactors + systemFactors}건`;
        } catch (e) {
          causeAnalysisSummary = '원인분석 정보 있음';
        }
      }

      // 재발방지대책 요약 추출
      if (investigation.prevention_actions) {
        try {
          const preventionActions = JSON.parse(investigation.prevention_actions);
          const technicalActions = preventionActions.technical_actions || [];
          const educationalActions = preventionActions.educational_actions || [];
          const managerialActions = preventionActions.managerial_actions || [];
          
          const allActions = [...technicalActions, ...educationalActions, ...managerialActions];
          totalActions = allActions.length;
          
          allActions.forEach((action: any) => {
            if (action.responsible_person) {
              responsiblePersons.push(action.responsible_person);
            }
            if (action.scheduled_date) {
              scheduledDates.push(action.scheduled_date);
            }
            if (action.progress_status === '완료') {
              completedActions++;
            } else if (action.progress_status === '대기') {
              pendingActions++;
            }
          });
          
          preventionActionsSummary = `기술적 ${technicalActions.length}건, 교육적 ${educationalActions.length}건, 관리적 ${managerialActions.length}건`;
        } catch (e) {
          preventionActionsSummary = '재발방지대책 정보 있음';
        }
      }

      // 요약 정보를 investigation 객체에 추가
      (investigation as any).cause_analysis_summary = causeAnalysisSummary;
      (investigation as any).prevention_actions_summary = preventionActionsSummary;
      (investigation as any).total_actions = totalActions;
      (investigation as any).completed_actions = completedActions;
      (investigation as any).pending_actions = pendingActions;
      (investigation as any).responsible_persons = [...new Set(responsiblePersons)]; // 중복 제거
      (investigation as any).scheduled_dates = scheduledDates;
      (investigation as any).completion_rate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

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
        if (data.original_accident_name) cleanData.original_accident_name = data.original_accident_name;
        if (data.investigation_accident_name) cleanData.investigation_accident_name = data.investigation_accident_name;
        if ('created_at' in cleanData) delete cleanData.created_at;
        if ('updated_at' in cleanData) delete cleanData.updated_at;
        if (data.investigation_victims && Array.isArray(data.investigation_victims)) {
          await tx.delete(tables.investigationVictims).where(eq(tables.investigationVictims.accident_id, accident_id));
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
            await tx.insert(tables.investigationVictims).values(victimsToInsert);
            console.log(`[INVESTIGATION][update] 조사보고서 재해자 정보 ${data.investigation_victims.length}명 저장됨`);
          }
        }
        if (data.investigation_property_damage && Array.isArray(data.investigation_property_damage)) {
          await tx.delete(tables.investigationPropertyDamage).where(eq(tables.investigationPropertyDamage.accident_id, accident_id));
          if (data.investigation_property_damage.length > 0) {
            const damageToInsert = data.investigation_property_damage.map((damage: any) => {
              const { damage_id, id, __tempKey, selected, ...validFields } = damage;
              return {
                accident_id,
                damage_target: validFields.damage_target,
                estimated_cost: validFields.estimated_cost,
                damage_content: validFields.damage_content,
                shutdown_start_date: validFields.shutdown_start_date ? new Date(validFields.shutdown_start_date) : null,
                recovery_expected_date: validFields.recovery_expected_date ? new Date(validFields.recovery_expected_date) : null,
              };
            });
            await tx.insert(tables.investigationPropertyDamage).values(damageToInsert);
            console.log(`[INVESTIGATION][update] 조사보고서 물적피해 정보 ${data.investigation_property_damage.length}건 저장됨`);
          }
        }
        delete (cleanData as any).investigation_victims;
        delete (cleanData as any).investigation_property_damage;
        if (data.cause_analysis) {
          cleanData.cause_analysis = JSON.stringify(data.cause_analysis);
          console.log(`[INVESTIGATION][update] 원인분석 정보 JSON 변환: ${Array.isArray(data.cause_analysis) ? data.cause_analysis.length : 0}건`);
        }
        if (data.prevention_actions) {
          cleanData.prevention_actions = JSON.stringify(data.prevention_actions);
          console.log(`[INVESTIGATION][update] 재발방지대책 정보 JSON 변환: ${Array.isArray(data.prevention_actions) ? data.prevention_actions.length : 0}건`);
        }
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
        // 4. 개선조치(재발방지대책) 테이블 갱신
        // 한글 주석: 기존 개선조치 삭제 후, prevention_actions가 있으면 새로 insert
        await tx.delete(correctiveAction).where(eq(correctiveAction.investigation_id, accident_id));
        if (data.prevention_actions) {
          let actionsJson;
          try {
            actionsJson = typeof data.prevention_actions === 'string' ? JSON.parse(data.prevention_actions) : data.prevention_actions;
          } catch (e) {
            console.error(`[SKIP] JSON 파싱 오류: accident_id=${accident_id}`);
            actionsJson = null;
          }
          if (actionsJson) {
            for (const type of ['technical_actions', 'educational_actions', 'managerial_actions']) {
              const arr = actionsJson[type] || [];
              for (const action of arr) {
                await tx.insert(correctiveAction).values({
                  investigation_id: accident_id,
                  action_type: action.action_type || type.replace('_actions',''),
                  title: action.title || null,
                  improvement_plan: action.improvement_plan,
                  progress_status: action.progress_status,
                  scheduled_date: action.scheduled_date,
                  responsible_person: action.responsible_person,
                });
              }
            }
          }
        }
        // 5. 수정된 결과 조회
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
        // 검색 범위 확장: 사고명, 요약, 원인분석, 재발방지대책
        query = query.where(
          sql`(
            ${tables.investigationReport.investigation_accident_name} ILIKE ${`%${filters.searchTerm}%`} OR
            ${tables.investigationReport.investigation_acci_summary} ILIKE ${`%${filters.searchTerm}%`} OR
            ${tables.investigationReport.cause_analysis} ILIKE ${`%${filters.searchTerm}%`} OR
            ${tables.investigationReport.prevention_actions} ILIKE ${`%${filters.searchTerm}%`}
          )`
        );
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
        // 검색 범위 확장: 사고명, 요약, 원인분석, 재발방지대책
        countQuery = countQuery.where(
          sql`(
            ${tables.investigationReport.investigation_accident_name} ILIKE ${`%${filters.searchTerm}%`} OR
            ${tables.investigationReport.investigation_acci_summary} ILIKE ${`%${filters.searchTerm}%`} OR
            ${tables.investigationReport.cause_analysis} ILIKE ${`%${filters.searchTerm}%`} OR
            ${tables.investigationReport.prevention_actions} ILIKE ${`%${filters.searchTerm}%`}
          )`
        );
      }

      // 쿼리 실행
      const [result, countResult] = await Promise.all([
        query,
        countQuery
      ]);

      const total = Number(countResult[0]?.count ?? 0);

      // 결과 데이터에 개선사항 요약 정보 추가 (실제 개선조치 테이블 기반)
      const accidentIds = result.map((item: any) => item.accident_id);
      
      // 개선조치 테이블에서 실제 데이터 조회
      let correctiveActionsMap: Record<string, any[]> = {};
      if (accidentIds.length > 0) {
        try {
          console.log('[INVESTIGATION][getList] 개선조치 조회 대상 accident_ids:', accidentIds);
          
          // 먼저 전체 개선조치 데이터를 조회한 후 필터링
          const allCorrectiveActions = await db()
            .select()
            .from(correctiveAction);
          
          console.log('[INVESTIGATION][getList] 전체 개선조치:', allCorrectiveActions.length, '건');
          
          // 메모리에서 필터링
          const correctiveActionsData = allCorrectiveActions.filter((action: any) => 
            accidentIds.includes(action.investigation_id)
          );
          
          console.log('[INVESTIGATION][getList] 개선조치 조회 결과:', correctiveActionsData.length, '건');
          
          // 실제 매칭된 investigation_id들 로그
          const matchedIds = correctiveActionsData.map((action: any) => action.investigation_id);
          console.log('[INVESTIGATION][getList] 매칭된 investigation_ids:', [...new Set(matchedIds)]);
          
          // accident_id별로 그룹핑
          correctiveActionsData.forEach((action: any) => {
            if (!correctiveActionsMap[action.investigation_id]) {
              correctiveActionsMap[action.investigation_id] = [];
            }
            correctiveActionsMap[action.investigation_id].push(action);
          });
          
          console.log('[INVESTIGATION][getList] 개선조치 매핑 결과:', Object.keys(correctiveActionsMap).length, '개 조사보고서');
        } catch (e) {
          console.error('[INVESTIGATION][getList] 개선조치 데이터 조회 오류:', e);
        }
      }

      const enhancedResult = result.map((item: any) => {
        let causeAnalysisSummary = '';
        let preventionActionsSummary = '';
        let totalActions = 0;
        let completedActions = 0;
        let pendingActions = 0;
        let responsiblePersons: string[] = [];
        let scheduledDates: string[] = [];

        // 원인분석 요약 추출
        if (item.cause_analysis) {
          try {
            const causeAnalysis = JSON.parse(item.cause_analysis);
            const directCauses = causeAnalysis.direct_cause?.unsafe_condition?.length || 0;
            const rootCauses = causeAnalysis.root_cause?.human_factor?.length || 0;
            causeAnalysisSummary = `직접원인 ${directCauses}건, 근본원인 ${rootCauses}건`;
          } catch (e) {
            causeAnalysisSummary = '원인분석 정보 있음';
          }
        }

        // 실제 개선조치 테이블에서 통계 계산
        const actions = correctiveActionsMap[item.accident_id] || [];
        totalActions = actions.length;
        
        // 타입별 카운트
        let technicalCount = 0;
        let educationalCount = 0;
        let managerialCount = 0;
        
        actions.forEach((action: any) => {
          // 담당자 수집
          if (action.responsible_person) {
            responsiblePersons.push(action.responsible_person);
          }
          // 예정일 수집
          if (action.scheduled_date) {
            scheduledDates.push(action.scheduled_date);
          }
          // 상태별 카운트
          if (action.progress_status === '완료') {
            completedActions++;
          } else if (action.progress_status === '대기') {
            pendingActions++;
          }
          // 타입별 카운트
          if (action.action_type === 'technical') {
            technicalCount++;
          } else if (action.action_type === 'educational') {
            educationalCount++;
          } else if (action.action_type === 'managerial') {
            managerialCount++;
          }
        });

        // prevention_actions JSON에서도 요약 정보 추출 (백업용)
        if (item.prevention_actions && totalActions === 0) {
          try {
            const preventionActions = JSON.parse(item.prevention_actions);
            const technicalActions = preventionActions.technical_actions || [];
            const educationalActions = preventionActions.educational_actions || [];
            const managerialActions = preventionActions.managerial_actions || [];
            
            technicalCount = technicalActions.length;
            educationalCount = educationalActions.length;
            managerialCount = managerialActions.length;
            totalActions = technicalCount + educationalCount + managerialCount;
          } catch (e) {
            // JSON 파싱 실패 시 무시
          }
        }

        preventionActionsSummary = totalActions > 0 
          ? `기술적 ${technicalCount}건, 교육적 ${educationalCount}건, 관리적 ${managerialCount}건`
          : '';

        return {
          ...item,
          cause_analysis_summary: causeAnalysisSummary,
          prevention_actions_summary: preventionActionsSummary,
          total_actions: totalActions,
          completed_actions: completedActions,
          pending_actions: pendingActions,
          responsible_persons: [...new Set(responsiblePersons)], // 중복 제거
          scheduled_dates: scheduledDates,
          completion_rate: totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0
        };
      });

      console.log(`[INVESTIGATION][getList] 조사보고서 목록 조회 완료: ${enhancedResult.length}건 / 총 ${total}건`);
      
      return { data: enhancedResult, total };
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

  /**
   * 개선조치(재발방지대책) 진행현황 통계 집계 함수
   * @param year 연도(선택, 없으면 전체)
   * @returns { total, pending, in_progress, delayed, completed }
   */
  static async getCorrectiveActionsStats(year?: number) {
    try {
      // drizzle ORM의 db() 함수를 호출하여 인스턴스를 얻고 쿼리 빌더 사용
      // 연도 필터가 있으면 investigation_report와 join 필요
      if (year) {
        const { investigationReport } = await import('../orm/schema/investigation');
        const yearStr = String(year);
        const likePattern = `%-${yearStr}-%`;
        
        // 한글 주석: 쿼리 빌더를 사용하여 통계 집계 (한국어 상태 기준)
        const result = await db()
          .select({
            total: sql<number>`count(*)`.as('total'),
            pending: sql<number>`count(*) filter (where ${correctiveAction.progress_status} = '대기')`.as('pending'),
            in_progress: sql<number>`count(*) filter (where ${correctiveAction.progress_status} = '진행')`.as('in_progress'),
            delayed: sql<number>`count(*) filter (where ${correctiveAction.progress_status} = '지연')`.as('delayed'),
            completed: sql<number>`count(*) filter (where ${correctiveAction.progress_status} = '완료')`.as('completed'),
          })
          .from(correctiveAction)
          .leftJoin(investigationReport, eq(correctiveAction.investigation_id, investigationReport.accident_id))
          .where(sql`${investigationReport.original_global_accident_no} LIKE ${likePattern}`);
        
        // 모든 상태를 0으로 초기화 (없는 상태도 0건으로 표시)
        const stats = result[0] || { total: 0, pending: 0, in_progress: 0, delayed: 0, completed: 0 };
        return {
          total: stats.total || 0,
          pending: stats.pending || 0,
          in_progress: stats.in_progress || 0,
          delayed: stats.delayed || 0,
          completed: stats.completed || 0
        };
      } else {
        // 전체 통계 (한국어 상태 기준)
        const result = await db()
          .select({
            total: sql<number>`count(*)`.as('total'),
            pending: sql<number>`count(*) filter (where ${correctiveAction.progress_status} = '대기')`.as('pending'),
            in_progress: sql<number>`count(*) filter (where ${correctiveAction.progress_status} = '진행')`.as('in_progress'),
            delayed: sql<number>`count(*) filter (where ${correctiveAction.progress_status} = '지연')`.as('delayed'),
            completed: sql<number>`count(*) filter (where ${correctiveAction.progress_status} = '완료')`.as('completed'),
          })
          .from(correctiveAction);
        
        // 모든 상태를 0으로 초기화 (없는 상태도 0건으로 표시)
        const stats = result[0] || { total: 0, pending: 0, in_progress: 0, delayed: 0, completed: 0 };
        return {
          total: stats.total || 0,
          pending: stats.pending || 0,
          in_progress: stats.in_progress || 0,
          delayed: stats.delayed || 0,
          completed: stats.completed || 0
        };
      }
    } catch (error) {
      console.error('[INVESTIGATION][getCorrectiveActionsStats] 통계 조회 오류:', error);
      // 에러 발생 시에도 모든 상태를 0으로 반환
      return {
        total: 0,
        pending: 0,
        in_progress: 0,
        delayed: 0,
        completed: 0
      };
    }
  }
} 

/**
 * 개선조치(재발방지대책) ActionItem 관련 서비스 함수들
 * - CRUD, 상태별/담당자별/통계 등
 */
export class CorrectiveActionService {


  /**
   * 개선조치 생성
   * @param action 개선조치 데이터 (ActionItem 형태)
   * @returns 생성된 개선조치 row
   */
  static async create(action: any) {
    // 개선조치 생성 (insert)
    // action: { investigation_id, action_type, title, improvement_plan, progress_status, scheduled_date, responsible_person, completion_date }
    const [created] = await db().insert(correctiveAction).values(action).returning();
    return created;
  }

  /**
   * 개선조치 단건 조회
   * @param id 개선조치 id
   * @returns 개선조치 row
   */
  static async getById(id: number) {
    const [action] = await db().select().from(correctiveAction).where(eq(correctiveAction.id, id)).limit(1);
    return action;
  }

  /**
   * 조사보고서별 개선조치 전체 조회
   * @param investigation_id 조사보고서 accident_id
   * @returns 개선조치 row 배열
   */
  static async getByInvestigationId(investigation_id: string) {
    try {
      const actions = await db().select().from(correctiveAction).where(eq(correctiveAction.investigation_id, investigation_id));
      console.log(`[CORRECTIVE_ACTION][getByInvestigationId] 조회 결과: ${actions.length}건`);
      
      // title이 비어있거나 improvement_plan과 동일한 경우 자동 생성
      const processedActions = actions.map(action => {
        if (!action.title || action.title === action.improvement_plan) {
          const actionType = action.action_type;
          const actionTypeLabel = actionType === 'technical' ? '기술적대책' : 
                                actionType === 'educational' ? '교육적대책' : 
                                actionType === 'managerial' ? '관리적대책' : 
                                '개선대책';
          
          // ID를 기반으로 번호 생성 (없으면 기본값)
          const actionNumber = action.id ? action.id % 100 : 1;
          return {
            ...action,
            title: `${actionTypeLabel} ${actionNumber}`
          };
        }
        return action;
      });
      
      return processedActions;
    } catch (error) {
      console.error('[CORRECTIVE_ACTION][getByInvestigationId] 오류:', error);
      throw error;
    }
  }

  /**
   * 개선조치 수정
   * @param id 개선조치 id
   * @param data 수정할 데이터
   * @returns 수정된 개선조치 row
   */
  static async update(id: number, data: any) {
    const [updated] = await db().update(correctiveAction).set(data).where(eq(correctiveAction.id, id)).returning();
    return updated;
  }

  /**
   * 개선조치 삭제
   * @param id 개선조치 id
   * @returns 삭제 성공 여부
   */
  static async remove(id: number) {
    await db().delete(correctiveAction).where(eq(correctiveAction.id, id));
    return { success: true };
  }

  /**
   * 상태별 개선조치 리스트/통계 조회
   * @param status 개선조치 상태 (예: 'pending', 'in_progress', 'completed', 'delayed' 등)
   * @param year 연도(선택, investigation_report의 global_accident_no에서 추출)
   * @returns 해당 상태의 개선조치 리스트 및 통계
   */
  static async getByStatus(status: string, year?: number) {
    // 연도 필터가 있으면 investigation_report와 join 필요
    if (year) {
      // investigation_report 테이블 import
      const { investigationReport } = await import('../orm/schema/investigation');
      // 연도 추출: global_accident_no가 [회사코드]-[YYYY]-[순번] 형식
      const yearStr = String(year);
      const likePattern = `%-${yearStr}-%`;
      // join + where
      const actions = await db()
        .select({
          id: correctiveAction.id,
          investigation_id: correctiveAction.investigation_id,
          action_type: correctiveAction.action_type,
          title: correctiveAction.title,
          improvement_plan: correctiveAction.improvement_plan,
          progress_status: correctiveAction.progress_status,
          scheduled_date: correctiveAction.scheduled_date,
          responsible_person: correctiveAction.responsible_person,
          completion_date: correctiveAction.completion_date,
          created_at: correctiveAction.created_at,
          updated_at: correctiveAction.updated_at,
          original_global_accident_no: sql<string>`${investigationReport.original_global_accident_no}`.as('original_global_accident_no')
        })
        .from(correctiveAction)
        .leftJoin(
          investigationReport,
          eq(correctiveAction.investigation_id, investigationReport.accident_id)
        )
        .where(
          sql`${correctiveAction.progress_status} = ${status} AND ${investigationReport.original_global_accident_no} LIKE ${likePattern}`
        );
      // title이 비어있거나 improvement_plan과 동일한 경우 자동 생성
      const processedActions = actions.map(action => {
        if (!action.title || action.title === action.improvement_plan) {
          const actionType = action.action_type;
          const actionTypeLabel = actionType === 'technical' ? '기술적대책' : 
                                actionType === 'educational' ? '교육적대책' : 
                                actionType === 'managerial' ? '관리적대책' : 
                                '개선대책';
          
          // ID를 기반으로 번호 생성 (없으면 기본값)
          const actionNumber = action.id ? action.id % 100 : 1;
          return {
            ...action,
            title: `${actionTypeLabel} ${actionNumber}`
          };
        }
        return action;
      });
      
      return processedActions;
    } else {
      // 연도 필터 없으면 상태만으로 필터링
      const actions = await db().select().from(correctiveAction).where(eq(correctiveAction.progress_status, status));
      
      // title이 비어있거나 improvement_plan과 동일한 경우 자동 생성
      const processedActions = actions.map(action => {
        if (!action.title || action.title === action.improvement_plan) {
          const actionType = action.action_type;
          const actionTypeLabel = actionType === 'technical' ? '기술적대책' : 
                                actionType === 'educational' ? '교육적대책' : 
                                actionType === 'managerial' ? '관리적대책' : 
                                '개선대책';
          
          // ID를 기반으로 번호 생성 (없으면 기본값)
          const actionNumber = action.id ? action.id % 100 : 1;
          return {
            ...action,
            title: `${actionTypeLabel} ${actionNumber}`
          };
        }
        return action;
      });
      
      return processedActions;
    }
  }

  /**
   * 담당자별 개선조치 리스트/통계 조회
   * @param manager 담당자명
   * @param year 연도(선택)
   * @returns 해당 담당자의 개선조치 리스트 및 통계
   */
  static async getByManager(manager: string, year?: number) {
    if (year) {
      const { investigationReport } = await import('../orm/schema/investigation');
      const yearStr = String(year);
      const likePattern = `%-${yearStr}-%`;
      const actions = await db()
        .select({
          id: correctiveAction.id,
          investigation_id: correctiveAction.investigation_id,
          action_type: correctiveAction.action_type,
          title: correctiveAction.title,
          improvement_plan: correctiveAction.improvement_plan,
          progress_status: correctiveAction.progress_status,
          scheduled_date: correctiveAction.scheduled_date,
          responsible_person: correctiveAction.responsible_person,
          completion_date: correctiveAction.completion_date,
          created_at: correctiveAction.created_at,
          updated_at: correctiveAction.updated_at,
          original_global_accident_no: investigationReport.original_global_accident_no
        })
        .from(correctiveAction)
        .leftJoin(
          investigationReport,
          eq(correctiveAction.investigation_id, investigationReport.accident_id)
        )
        .where(
          and(
            eq(correctiveAction.responsible_person, manager),
            sql`${investigationReport.original_global_accident_no} LIKE ${likePattern}`
          )
        );
      // title이 비어있거나 improvement_plan과 동일한 경우 자동 생성
      const processedActions = actions.map(action => {
        if (!action.title || action.title === action.improvement_plan) {
          const actionType = action.action_type;
          const actionTypeLabel = actionType === 'technical' ? '기술적대책' : 
                                actionType === 'educational' ? '교육적대책' : 
                                actionType === 'managerial' ? '관리적대책' : 
                                '개선대책';
          
          // ID를 기반으로 번호 생성 (없으면 기본값)
          const actionNumber = action.id ? action.id % 100 : 1;
          return {
            ...action,
            title: `${actionTypeLabel} ${actionNumber}`
          };
        }
        return action;
      });
      
      return processedActions;
    } else {
      const actions = await db().select().from(correctiveAction).where(eq(correctiveAction.responsible_person, manager));
      
      // title이 비어있거나 improvement_plan과 동일한 경우 자동 생성
      const processedActions = actions.map(action => {
        if (!action.title || action.title === action.improvement_plan) {
          const actionType = action.action_type;
          const actionTypeLabel = actionType === 'technical' ? '기술적대책' : 
                                actionType === 'educational' ? '교육적대책' : 
                                actionType === 'managerial' ? '관리적대책' : 
                                '개선대책';
          
          // ID를 기반으로 번호 생성 (없으면 기본값)
          const actionNumber = action.id ? action.id % 100 : 1;
          return {
            ...action,
            title: `${actionTypeLabel} ${actionNumber}`
          };
        }
        return action;
      });
      
      return processedActions;
    }
  }

  /**
   * 연도별 전체 개선조치 리스트 반환
   * @param year 연도(선택)
   * @returns 개선조치 row 배열 (조사보고서 정보 포함)
   */
  static async getAllByYear(year?: number) {
    console.log('[SERVICE] CorrectiveActionService.getAllByYear 진입', { year });
    
    const { investigationReport } = await import('../orm/schema/investigation');
    
    if (year) {
      console.log('[SERVICE] 연도 필터 적용:', year);
      const yearStr = String(year);
      const likePattern = `%-${yearStr}-%`;
      console.log('[SERVICE] LIKE 패턴:', likePattern);
      
      // join + where (연도 필터 적용)
      const actions = await db()
        .select({
          id: correctiveAction.id,
          investigation_id: correctiveAction.investigation_id,
          action_type: correctiveAction.action_type,
          title: correctiveAction.title,
          improvement_plan: correctiveAction.improvement_plan,
          progress_status: correctiveAction.progress_status,
          scheduled_date: correctiveAction.scheduled_date,
          responsible_person: correctiveAction.responsible_person,
          completion_date: correctiveAction.completion_date,
          created_at: correctiveAction.created_at,
          updated_at: correctiveAction.updated_at,
          // 조사보고서 정보 추가
          original_global_accident_no: investigationReport.original_global_accident_no,
          investigation_global_accident_no: investigationReport.investigation_global_accident_no,
          investigation_accident_name: investigationReport.investigation_accident_name
        })
        .from(correctiveAction)
        .leftJoin(
          investigationReport,
          eq(correctiveAction.investigation_id, investigationReport.accident_id)
        )
        .where(sql`${investigationReport.original_global_accident_no} LIKE ${likePattern}`);
      
      console.log('[SERVICE] 연도별 조회 결과:', actions.length, '건');
      
      // title이 비어있거나 improvement_plan과 동일한 경우 자동 생성
      const processedActions = actions.map(action => {
        if (!action.title || action.title === action.improvement_plan) {
          const actionType = action.action_type;
          const actionTypeLabel = actionType === 'technical' ? '기술적대책' : 
                                actionType === 'educational' ? '교육적대책' : 
                                actionType === 'managerial' ? '관리적대책' : 
                                '개선대책';
          
          // ID를 기반으로 번호 생성 (없으면 기본값)
          const actionNumber = action.id ? action.id % 100 : 1;
          return {
            ...action,
            title: `${actionTypeLabel} ${actionNumber}`
          };
        }
        return action;
      });
      
      return processedActions;
    } else {
      console.log('[SERVICE] 전체 조회 (연도 필터 없음)');
      // 전체 반환 (조사보고서 정보 포함)
      const actions = await db()
        .select({
          id: correctiveAction.id,
          investigation_id: correctiveAction.investigation_id,
          action_type: correctiveAction.action_type,
          title: correctiveAction.title,
          improvement_plan: correctiveAction.improvement_plan,
          progress_status: correctiveAction.progress_status,
          scheduled_date: correctiveAction.scheduled_date,
          responsible_person: correctiveAction.responsible_person,
          completion_date: correctiveAction.completion_date,
          created_at: correctiveAction.created_at,
          updated_at: correctiveAction.updated_at,
          // 조사보고서 정보 추가
          original_global_accident_no: investigationReport.original_global_accident_no,
          investigation_global_accident_no: investigationReport.investigation_global_accident_no,
          investigation_accident_name: investigationReport.investigation_accident_name
        })
        .from(correctiveAction)
        .leftJoin(
          investigationReport,
          eq(correctiveAction.investigation_id, investigationReport.accident_id)
        );
      
      console.log('[SERVICE] 전체 조회 결과:', actions.length, '건');
      
      // title이 비어있거나 improvement_plan과 동일한 경우 자동 생성
      const processedActions = actions.map(action => {
        if (!action.title || action.title === action.improvement_plan) {
          const actionType = action.action_type;
          const actionTypeLabel = actionType === 'technical' ? '기술적대책' : 
                                actionType === 'educational' ? '교육적대책' : 
                                actionType === 'managerial' ? '관리적대책' : 
                                '개선대책';
          
          // ID를 기반으로 번호 생성 (없으면 기본값)
          const actionNumber = action.id ? action.id % 100 : 1;
          return {
            ...action,
            title: `${actionTypeLabel} ${actionNumber}`
          };
        }
        return action;
      });
      
      return processedActions;
    }
  }
} 