/**
 * @file services/occurrence.service.ts
 * @description
 *  - 사고 발생보고 관련 비즈니스 로직을 구현합니다.
 *  - Drizzle ORM을 활용하여 데이터베이스에 CRUD 작업을 수행합니다.
 */

import { db, tables } from "../orm/index";
import { sql, desc, SQL } from "drizzle-orm";
import { victims } from "../orm/schema/victims";
import { propertyDamage } from "../orm/schema/property_damage";
import { occurrenceSequence } from "../orm/schema/occurrence";
import { eq } from "drizzle-orm";
import { getTableColumns } from "drizzle-orm";

// 타임스탬프 필드 목록 (스키마에 정의된 모든 타임스탬프 필드)
const TIMESTAMP_FIELDS = [
  'acci_time',
  'first_report_time',
  'created_at',
  'updated_at'
];

// 문자열이나 다른 값을 Date 객체로 변환하는 헬퍼 함수
const ensureDate = (value: any): Date | null => {
  if (!value) return null;
  
  if (value instanceof Date) {
    return value;
  }
  
  try {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
  } catch (e) {
    console.error('[BACK][ensureDate] 날짜 변환 오류:', e, value);
  }
  
  return null; // 변환 실패 시 null 반환
};

// 데이터 객체의 모든 타임스탬프 필드를 처리하는 함수
const processTimestampFields = (data: any): any => {
  const result = { ...data };
  
  TIMESTAMP_FIELDS.forEach(field => {
    if (field in result) {
      const dateValue = ensureDate(result[field]);
      if (dateValue) {
        result[field] = dateValue;
      } else {
        delete result[field];
      }
    }
  });
  
  return result;
};

// JSON 구문 분석을 위한 헬퍼 함수
const parseJsonSafe = (jsonString: string | null | undefined): any[] => {
  if (!jsonString) return [];
  
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.error('[BACK][parseJsonSafe] JSON 파싱 오류:', e);
  }
  
  return [];
};

// 재해자 정보 DB 저장 함수
const saveVictims = async (
  accident_id: string, 
  victimsData: any[], 
  transaction?: any
): Promise<number> => {
  const dbClient = transaction || db();
  
  try {
    if (!victimsData || !Array.isArray(victimsData) || victimsData.length === 0) {
      console.log('[BACK][saveVictims] 저장할 재해자 정보 없음');
      return 0;
    }
    
    console.log(`[BACK][saveVictims] 저장할 재해자 수: ${victimsData.length}`, victimsData);

    await dbClient
      .delete(victims)
      .where(sql`${victims.accident_id} = ${accident_id}`);
    
    const preparedVictims = victimsData.map((victim: any) => {
      let birthDate = null;
      if (victim.birth_date) {
        birthDate = ensureDate(victim.birth_date);
      }
      
      return {
        accident_id,
        name: victim.name,
        age: victim.age,
        belong: victim.belong,
        duty: victim.duty,
        injury_type: victim.injury_type,
        ppe_worn: victim.ppe_worn,
        first_aid: victim.first_aid,
        birth_date: birthDate,
        injury_location: victim.injury_location,
        medical_opinion: victim.medical_opinion,
        training_completed: victim.training_completed,
        etc_notes: victim.etc_notes,
        created_at: new Date(),
        updated_at: new Date()
      };
    });
    
    if (preparedVictims.length > 0) {
      console.log('[BACK][saveVictims] DB에 저장할 재해자 데이터:', preparedVictims);
      await dbClient.insert(victims).values(preparedVictims);
    }
    
    return preparedVictims.length;
  } catch (error: any) {
    console.error('[BACK][saveVictims] 재해자 정보 저장 오류:', error);
    throw error;
  }
};

// 물적 피해 정보 DB 저장 함수
const savePropertyDamages = async (
  accident_id: string,
  propertyDamagesData: any[],
  transaction?: any
): Promise<number> => {
  const dbClient = transaction || db();

  try {
    if (!propertyDamagesData || !Array.isArray(propertyDamagesData) || propertyDamagesData.length === 0) {
      console.log('[BACK][savePropertyDamages] 저장할 물적 피해 정보 없음');
      return 0;
    }
    console.log(`[BACK][savePropertyDamages] 저장할 물적 피해 수: ${propertyDamagesData.length}`, propertyDamagesData);

    await dbClient
      .delete(tables.propertyDamage)
      .where(sql`${tables.propertyDamage.accident_id} = ${accident_id}`);

    const preparedData = propertyDamagesData.map((item: any) => {
      return {
        accident_id,
        damage_target: item.damage_target, // 피해대상물
        damage_type: item.damage_type, // 피해유형
        damage_content: item.damage_content, // 피해내용
        estimated_cost: item.estimated_cost ? Number(item.estimated_cost) : 0, // 피해금액
        shutdown_start_date: item.shutdown_start_date ? new Date(item.shutdown_start_date) : null,
        recovery_expected_date: item.recovery_expected_date ? new Date(item.recovery_expected_date) : null,
        recovery_plan: item.recovery_plan, // 복구계획
        etc_notes: item.etc_notes, // 기타사항
        created_at: new Date(),
        updated_at: new Date(),
      };
    });
    
    if (preparedData.length > 0) {
      console.log('[BACK][savePropertyDamages] DB에 저장할 물적 피해 데이터:', preparedData);
      await dbClient.insert(tables.propertyDamage).values(preparedData);
    }

    return preparedData.length;
  } catch (error: any) {
    console.error('[BACK][savePropertyDamages] 물적 피해 정보 저장 오류:', error);
    throw error;
  }
};

const getReportWithDetails = async (id: string) => {
  console.log(`[BACK][getReportWithDetails] 상세 정보 조회 시작 (ID: ${id})`);
  const reports = (await db()
    .select()
    .from(tables.occurrenceReport)
    .where(sql`${tables.occurrenceReport.accident_id} = ${id}`)
    .limit(1)) as unknown as any[];

  if (reports.length === 0) {
    console.log(`[BACK][getReportWithDetails] 해당 ID의 보고서 없음 (ID: ${id})`);
    return null;
  }
  
  const report = reports[0];
  console.log(`[BACK][getReportWithDetails] 기본 보고서 정보 조회 완료`);
  
  const victimsData = (await db()
    .select()
    .from(victims)
    .where(sql`${victims.accident_id} = ${id}`)
    .orderBy(victims.victim_id)) as unknown as any[];
  
  (report as any).victims = victimsData;
  console.log(`[BACK][getReportWithDetails] 재해자 정보 ${victimsData.length}건 조회 완료`);

  const propertyDamagesData = (await db()
    .select()
    .from(tables.propertyDamage)
    .where(sql`${tables.propertyDamage.accident_id} = ${id}`)
    .orderBy(tables.propertyDamage.damage_id)) as unknown as any[];

  (report as any).property_damages = propertyDamagesData;
  console.log(`[BACK][getReportWithDetails] 물적 피해 정보 ${propertyDamagesData.length}건 조회 완료`);

  const fileFields = ['attachments', 'scene_photos', 'cctv_video', 'statement_docs', 'etc_documents'];
  fileFields.forEach(field => {
    const value = report[field as keyof typeof report];
    (report as any)[field] = parseJsonSafe(value);
  });
  console.log(`[BACK][getReportWithDetails] 파일 필드 처리 완료`);

  return report;
};

const cleanDataForDb = (data: any) => {
  const cleanData = { ...data };
  console.log('[BACK][cleanDataForDb] 원본 데이터:', data);
  
  delete cleanData.victims;
  delete cleanData.property_damages;
  console.log('[BACK][cleanDataForDb] 하위 배열 제거 후:', cleanData);

  const schemaKeys = Object.keys(tables.occurrenceReport);
  Object.keys(cleanData).forEach(key => {
    if (!schemaKeys.includes(key)) {
      delete cleanData[key];
    }
  });
  console.log('[BACK][cleanDataForDb] 스키마 필터링 후:', cleanData);

  const processed = processTimestampFields(cleanData);
  console.log('[BACK][cleanDataForDb] 타임스탬프 처리 후:', processed);
  return processed;
};

interface Filters {
  company: string;
  status: string;
  from: string;
  to: string;
}

interface Pagination {
  page: number;
  size: number;
}

export default class OccurrenceService {
  /**
   * 예상 순번 조회
   * @param sequenceType - 'company' 또는 'site'
   * @param sequenceCode - 회사코드 또는 회사코드-사업장코드
   * @param sequenceYear - 연도
   * @returns 예상 순번
   */
  static async getExpectedSequence(
    sequenceType: 'company' | 'site',
    sequenceCode: string,
    sequenceYear: number
  ) {
    console.log(`[BACK][getExpectedSequence] 예상 순번 조회 시작:`, {
      sequenceType,
      sequenceCode,
      sequenceYear
    });

    try {
      // 현재 시퀀스 조회
      const existingSequence = await db()
        .select()
        .from(occurrenceSequence)
        .where(sql`${occurrenceSequence.type} = ${sequenceType} 
                  AND ${occurrenceSequence.company_code} = ${sequenceCode.split('-')[0]}
                  AND ${occurrenceSequence.year} = ${sequenceYear}
                  ${sequenceType === 'site' ? sql`AND ${occurrenceSequence.site_code} = ${sequenceCode.split('-')[1]}` : sql``}`)
        .limit(1);

      let nextSequence = 1;
      if (existingSequence.length > 0) {
        nextSequence = existingSequence[0].current_seq + 1;
      }

      console.log(`[BACK][getExpectedSequence] 예상 순번: ${nextSequence}`);
      return { nextSequence };
    } catch (error) {
      console.error('[BACK][getExpectedSequence] 예상 순번 조회 오류:', error);
      throw error;
    }
  }

  static async fetchList(filters: Filters, pagination: Pagination) {
    console.log('[BACK][fetchList] 발생보고서 목록 조회 시작:', { filters, pagination });
    
    const { company, status, from, to } = filters;
    const { page, size } = pagination;
    const offset = (page - 1) * size;

    try {
      // 조건 구성
      const conditions: SQL[] = [];

      if (company) {
        conditions.push(sql`${tables.occurrenceReport.company_name} = ${company}`);
      }
      if (from && to) {
        conditions.push(sql`${tables.occurrenceReport.acci_time} BETWEEN ${from} AND ${to}`);
      }
      if (status) {
        if (status === '발생') {
          conditions.push(sql`i.accident_id IS NULL`);
        } else if (status === '조사중') {
          conditions.push(sql`i.accident_id IS NOT NULL AND (i.investigation_status IS NULL OR i.investigation_status != 'completed' )`);
        } else if (status === '완료') {
          conditions.push(sql`i.accident_id IS NOT NULL AND i.investigation_status = 'completed'`);
        }
      }

      const whereClause = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;

      // 데이터 쿼리: join하여 status 계산
      const dataQuery = db()
        .select({
          ...getTableColumns(tables.occurrenceReport),
          status: sql<string>`CASE 
            WHEN investigation_report.accident_id IS NOT NULL AND investigation_report.investigation_status = 'completed' THEN '완료'
            WHEN investigation_report.accident_id IS NOT NULL THEN '조사중'
            ELSE '발생'
          END`.as('status')
        })
        .from(tables.occurrenceReport)
        .leftJoin(tables.investigationReport, eq(tables.occurrenceReport.accident_id, tables.investigationReport.accident_id))
        .where(whereClause)
        .orderBy(desc(tables.occurrenceReport.created_at))
        .limit(size)
        .offset(offset) as any;

      // 카운트 쿼리: 동일 join과 where
      const countQuery = db()
        .select({ count: sql<number>`count(*)`.as('count') })
        .from(tables.occurrenceReport)
        .leftJoin(tables.investigationReport, eq(tables.occurrenceReport.accident_id, tables.investigationReport.accident_id))
        .where(whereClause) as any;

      const [data, totalResult] = await Promise.all([
        dataQuery,
        countQuery
      ]);

      const total = Number(totalResult[0].count);

      console.log(`[BACK][fetchList] 조회 완료: ${data.length}건 / 전체 ${total}건`);

      return {
        reports: data,
        total,
        page,
        totalPages: Math.ceil(total / size),
      };
    } catch (error: any) {
      console.error('[BACK][fetchList] 목록 조회 오류:', error);
      throw error;
    }
  }

  static async getById(id: string) {
    return getReportWithDetails(id);
  }

  static async create(data: any) {
    console.log("===== [Service] 사고 발생보고서 생성 시작 =====");
    console.log("[BACK][create] 수신 데이터:", data);
    try {
      return await db().transaction(async (tx) => {
        console.log("[BACK][create] 트랜잭션 시작");

        const year = new Date(data.acci_time).getFullYear();
        const companyCode = data.company_code;
        const siteCode = data.site_code;

        // 필수 필드 검증
        if (!companyCode || !siteCode) {
          throw new Error("company_code와 site_code는 필수입니다.");
        }

        // 1. 사업장사고코드 생성: [회사코드]-[사업장코드]-[연도]-[순번3자리]
        let siteSeqRow = await tx
          .select()
          .from(occurrenceSequence)
          .where(sql`${occurrenceSequence.company_code} = ${companyCode} AND ${occurrenceSequence.site_code} = ${siteCode} AND ${occurrenceSequence.year} = ${year} AND ${occurrenceSequence.type} = 'site'`)
          .limit(1);
        
        let nextSiteSeq = 1;
        if (siteSeqRow.length > 0) {
          nextSiteSeq = siteSeqRow[0].current_seq + 1;
        }

        // 사업장사고코드 중복 체크
        const accidentIdToCheck = `${companyCode}-${siteCode}-${year}-${String(nextSiteSeq).padStart(3, '0')}`;
        const existingAccidentId = await tx
          .select()
          .from(tables.occurrenceReport)
          .where(sql`${tables.occurrenceReport.accident_id} = ${accidentIdToCheck}`);
        
        if (existingAccidentId.length > 0) {
          throw new Error(`이미 존재하는 accident_id(${accidentIdToCheck})와 중복됩니다.`);
        }

        // 사업장 시퀀스 업데이트
        if (siteSeqRow.length > 0) {
          await tx
            .update(occurrenceSequence)
            .set({ current_seq: nextSiteSeq })
            .where(sql`${occurrenceSequence.company_code} = ${companyCode} AND ${occurrenceSequence.site_code} = ${siteCode} AND ${occurrenceSequence.year} = ${year} AND ${occurrenceSequence.type} = 'site'`);
        } else {
          await tx.insert(occurrenceSequence).values({
            company_code: companyCode,
            site_code: siteCode,
            year,
            type: 'site',
            current_seq: nextSiteSeq,
          });
        }

        // 2. 전체사고코드 생성: [회사코드]-[연도]-[순번3자리]
        let globalSeqRow = await tx
          .select()
          .from(occurrenceSequence)
          .where(sql`${occurrenceSequence.company_code} = ${companyCode} AND ${occurrenceSequence.year} = ${year} AND ${occurrenceSequence.type} = 'global'`)
          .limit(1);
        
        let nextGlobalSeq = 1;
        if (globalSeqRow.length > 0) {
          nextGlobalSeq = globalSeqRow[0].current_seq + 1;
        }

        // 전체사고코드 중복 체크
        const globalAccidentNoToCheck = `${companyCode}-${year}-${String(nextGlobalSeq).padStart(3, '0')}`;
        const existingGlobalAccidentNo = await tx
          .select()
          .from(tables.occurrenceReport)
          .where(sql`${tables.occurrenceReport.global_accident_no} = ${globalAccidentNoToCheck}`);
        
        if (existingGlobalAccidentNo.length > 0) {
          throw new Error(`이미 존재하는 global_accident_no(${globalAccidentNoToCheck})와 중복됩니다.`);
        }

        // 전체 시퀀스 업데이트
        if (globalSeqRow.length > 0) {
          await tx
            .update(occurrenceSequence)
            .set({ current_seq: nextGlobalSeq })
            .where(sql`${occurrenceSequence.company_code} = ${companyCode} AND ${occurrenceSequence.year} = ${year} AND ${occurrenceSequence.type} = 'global'`);
        } else {
          await tx.insert(occurrenceSequence).values({
            company_code: companyCode,
            site_code: null,
            year,
            type: 'global',
            current_seq: nextGlobalSeq,
          });
        }

        // 생성된 ID 설정
        const accidentId = `${companyCode}-${siteCode}-${year}-${String(nextSiteSeq).padStart(3, '0')}`;
        const globalAccidentNo = `${companyCode}-${year}-${String(nextGlobalSeq).padStart(3, '0')}`;

        data.accident_id = accidentId;
        data.global_accident_no = globalAccidentNo;
        data.report_channel_no = accidentId; // 사업장사고코드를 보고 경로 번호로 사용
        
        console.log(`[BACK][create] 생성된 ID: accident_id=${data.accident_id}, global_accident_no=${data.global_accident_no}`);

        data.first_report_time = data.first_report_time || new Date().toISOString();
        data.created_at = data.created_at || new Date().toISOString();
        data.updated_at = data.updated_at || new Date().toISOString();

        if (Array.isArray(data.attachments)) {
          data.attachments = JSON.stringify(data.attachments);
        } else if (typeof data.attachments !== 'string') {
          data.attachments = '[]';
        }

        const victimsArray = data.victims && Array.isArray(data.victims) ? data.victims : [];
        const propertyDamagesArray = data.property_damages && Array.isArray(data.property_damages) ? data.property_damages : [];
        console.log(`[BACK][create] 재해자 수: ${victimsArray.length}, 물적피해 수: ${propertyDamagesArray.length}`);

        if (victimsArray.length > 0 && (!data.victim_count || data.victim_count === 0)) {
          data.victim_count = victimsArray.length;
          console.log(`[BACK][create] victim_count 자동 설정: ${data.victim_count}`);
        }

        const processedData = cleanDataForDb(data);
        console.log('[BACK][create] DB 저장용 데이터 (처리 완료):', processedData);

        await tx.insert(tables.occurrenceReport).values(processedData);
        console.log('[BACK][create] occurrenceReport 테이블 저장 성공');

        await saveVictims(data.accident_id, victimsArray, tx);
        console.log('[BACK][create] saveVictims 호출 완료');
        await savePropertyDamages(data.accident_id, propertyDamagesArray, tx);
        console.log('[BACK][create] savePropertyDamages 호출 완료');

        console.log('[BACK][create] 트랜잭션 커밋');

        // 트랜잭션이 성공적으로 완료되었으므로, 입력 데이터를 기반으로 응답 객체를 구성하여 반환합니다.
        // 이렇게 하면 DB에서 다시 읽어오는 과정에서 발생할 수 있는 타이밍 이슈를 피할 수 있습니다.
        return {
          ...processedData,
          victims: victimsArray,
          property_damages: propertyDamagesArray,
        };
      });
    } catch (error: any) {
      console.error("[BACK][create] !!!!! 사고 발생보고서 생성 중 심각한 오류 발생 !!!!!");
      console.error("[BACK][create] 오류 메시지:", error.message);
      console.error("[BACK][create] 오류 스택:", error.stack);
      if(error.code) console.error("[BACK][create] DB 오류 코드:", error.code);
      if(error.detail) console.error("[BACK][create] DB 오류 상세:", error.detail);
      console.error("[BACK][create] 전체 오류 객체:", error);
      throw error;
    }
  }

  static async update(id: string, data: any) {
    console.log(`===== [Service] 사고 발생보고서 수정 시작 (ID: ${id}) =====`);
    console.log(`[BACK][update] 수신 데이터:`, data);
    try {
      return await db().transaction(async (tx) => {
        console.log(`[BACK][update] 트랜잭션 시작 (ID: ${id})`);
        const existing = await getReportWithDetails(id);
        if (!existing) {
          throw new Error("수정할 사고를 찾을 수 없습니다.");
        }
        
        data.updated_at = new Date().toISOString();
        
        if (Array.isArray(data.attachments)) {
          data.attachments = JSON.stringify(data.attachments);
        } else if (typeof data.attachments !== 'string') {
          data.attachments = existing.attachments;
        }
        
        const victimsArray = data.victims && Array.isArray(data.victims) ? data.victims : [];
        const propertyDamagesArray = data.property_damages && Array.isArray(data.property_damages) ? data.property_damages : [];
        console.log(`[BACK][update] 재해자 수: ${victimsArray.length}, 물적피해 수: ${propertyDamagesArray.length}`);
        
        if (victimsArray.length > 0) {
          data.victim_count = victimsArray.length;
          console.log(`[BACK][update] victim_count 업데이트: ${data.victim_count}`);
        }
        
        const processedData = cleanDataForDb(data);
        console.log('[BACK][update] DB 저장용 데이터 (처리 완료):', processedData);
        
        await tx
          .update(tables.occurrenceReport)
          .set(processedData)
          .where(sql`${tables.occurrenceReport.accident_id} = ${id}`);
        console.log('[BACK][update] occurrenceReport 테이블 업데이트 성공');
        
        await saveVictims(id, victimsArray, tx);
        console.log('[BACK][update] saveVictims 호출 완료');
        await savePropertyDamages(id, propertyDamagesArray, tx);
        console.log('[BACK][update] savePropertyDamages 호출 완료');
        
        console.log(`[BACK][update] 트랜잭션 커밋 (ID: ${id})`);
        
        // 트랜잭션 완료 후 DB를 재조회하는 대신, 업데이트에 사용된 데이터로 응답을 구성합니다.
        return {
          ...existing,
          ...processedData,
          victims: victimsArray,
          property_damages: propertyDamagesArray,
        };
      });
    } catch (error: any) {
      console.error(`[BACK][update] !!!!! 사고 발생보고서 수정 중 심각한 오류 발생 (ID: ${id}) !!!!!`);
      console.error("[BACK][update] 오류 메시지:", error.message);
      console.error("[BACK][update] 오류 스택:", error.stack);
      if(error.code) console.error("[BACK][update] DB 오류 코드:", error.code);
      if(error.detail) console.error("[BACK][update] DB 오류 상세:", error.detail);
      console.error("[BACK][update] 전체 오류 객체:", error);
      throw error;
    }
  }

  static async remove(id: string) {
    const existing = await getReportWithDetails(id);
    if (!existing) {
      throw new Error("삭제할 사고를 찾을 수 없습니다.");
    }

    const year = new Date(existing.acci_time).getFullYear();
    const companyCode = existing.company_code;
    const siteCode = existing.site_code;

    await db()
      .delete(tables.occurrenceReport)
      .where(sql`${tables.occurrenceReport.accident_id} = ${id}`);

    // Reset site sequence if no more reports for this site/year
    const siteCountResult = await db().select({ count: sql`count(*)` }).from(tables.occurrenceReport)
      .where(sql`${tables.occurrenceReport.company_code} = ${companyCode} AND ${tables.occurrenceReport.site_code} = ${siteCode} AND EXTRACT(YEAR FROM ${tables.occurrenceReport.acci_time}) = ${year}`);
    const siteCount = Number(siteCountResult[0].count);

    if (siteCount === 0) {
      await db().delete(occurrenceSequence)
        .where(sql`${occurrenceSequence.company_code} = ${companyCode} AND ${occurrenceSequence.site_code} = ${siteCode} AND ${occurrenceSequence.year} = ${year} AND ${occurrenceSequence.type} = 'site'`);
    }

    // Reset global sequence if no more reports for this company/year
    const globalCountResult = await db().select({ count: sql`count(*)` }).from(tables.occurrenceReport)
      .where(sql`${tables.occurrenceReport.company_code} = ${companyCode} AND EXTRACT(YEAR FROM ${tables.occurrenceReport.acci_time}) = ${year}`);
    const globalCount = Number(globalCountResult[0].count);

    if (globalCount === 0) {
      await db().delete(occurrenceSequence)
        .where(sql`${occurrenceSequence.company_code} = ${companyCode} AND ${occurrenceSequence.year} = ${year} AND ${occurrenceSequence.type} = 'global'`);
    }
  }
}
