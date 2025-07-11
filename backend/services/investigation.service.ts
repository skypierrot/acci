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
  
  // 피해 정보
  damage_severity?: string;
  death_count?: number;
  injured_count?: number;
  damage_cost?: number;
  
  // 원인 분석
  direct_cause?: string;
  root_cause?: string;
  
  // 대책 정보
  corrective_actions?: string;
  action_schedule?: string;
  action_verifier?: string;
  
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

        // 2. 조사보고서 생성
        await tx
          .insert(tables.investigationReport)
          .values(data);

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

      // 조사보고서의 재해자 정보 처리
      if (investigation.investigation_victims_json) {
        try {
          const parsedVictims = JSON.parse(investigation.investigation_victims_json);
          if (Array.isArray(parsedVictims) && parsedVictims.length > 0) {
            (investigation as any).investigation_victims = parsedVictims;
            console.log(`[INVESTIGATION][getById] 조사보고서 재해자 정보 ${parsedVictims.length}명 파싱됨`);
          }
        } catch (e) {
          console.error('[INVESTIGATION][getById] investigation_victims_json 파싱 오류:', e);
          (investigation as any).investigation_victims = [];
        }
      } else {
        (investigation as any).investigation_victims = [];
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
        delete cleanData.created_at;
        delete cleanData.updated_at;
        
        // 재해자 정보 처리
        if (data.investigation_victims && Array.isArray(data.investigation_victims)) {
          cleanData.investigation_victims_json = JSON.stringify(data.investigation_victims);
          console.log(`[INVESTIGATION][update] 재해자 정보 JSON 변환: ${data.investigation_victims.length}명`);
        }
        
        // 프론트엔드에서 보낸 배열 필드 제거 (DB에는 JSON 문자열로 저장)
        delete (cleanData as any).investigation_victims;
        
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
      let query = db()
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
          investigation_team_lead: status, // 임시로 team_lead 필드 사용
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