/**
 * @file services/history.service.ts
 * @description
 *  - 사고 이력 조회 관련 비즈니스 로직을 구현합니다.
 *  - Drizzle ORM을 활용하여 데이터베이스에서 사고 이력을 조회합니다.
 */

import { db, tables } from "../orm/index";
import { sql, desc, SQL } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { getTableColumns } from "drizzle-orm";

// 필터 인터페이스
interface HistoryFilters {
  company: string;
  site: string;
  status: string;
  startDate: string;
  endDate: string;
}

// 페이징 인터페이스
interface HistoryPagination {
  page: number;
  size: number;
}

export default class HistoryService {
  /**
   * 사고 이력 목록 조회
   * @param filters 필터 조건
   * @param pagination 페이징 정보
   * @returns 사고 이력 목록과 페이징 정보
   */
  static async fetchHistoryList(filters: HistoryFilters, pagination: HistoryPagination) {
    console.log('[BACK][fetchHistoryList] 사고 이력 목록 조회 시작:', { filters, pagination });
    
    const { company, site, status, startDate, endDate } = filters;
    const { page, size } = pagination;
    const offset = (page - 1) * size;

    try {
      // 조건 구성
      const conditions: SQL[] = [];

      if (company) {
        conditions.push(sql`${tables.occurrenceReport.company_name} = ${company}`);
      }
      if (site) {
        // site 필터를 site_name 기반에서 site_code 기반으로 변경
        // 프론트엔드에서 site_code를 전달받아 site_code 컬럼과 비교
        conditions.push(sql`${tables.occurrenceReport.site_code} = ${site}`);
      }
      // startDate/endDate 기반 날짜 필터 처리
      if (startDate && endDate) {
        // YYYY-MM 또는 YYYY-MM-DD 형식 모두 지원
        let fromDate = startDate;
        let toDate = endDate;
        // YYYY-MM 형식이면 월의 1일/말일로 변환
        if (/^\d{4}-\d{2}$/.test(startDate)) {
          fromDate = `${startDate}-01`;
        }
        if (/^\d{4}-\d{2}$/.test(endDate)) {
          // 해당 월의 마지막 일 구하기
          const [y, m] = endDate.split('-').map(Number);
          const lastDay = new Date(y, m, 0).getDate();
          toDate = `${endDate}-${String(lastDay).padStart(2, '0')}`;
        }
        // 파라미터에 시간까지 포함해서 바인딩
        const fromDateTime = `${fromDate} 00:00:00`;
        const toDateTime = `${toDate} 23:59:59`;
        conditions.push(sql`${tables.occurrenceReport.acci_time} BETWEEN ${fromDateTime} AND ${toDateTime}`);
      }
      if (status) {
        if (status === '발생') {
          conditions.push(sql`${tables.investigationReport.accident_id} IS NULL`);
        } else if (status === '조사중') {
          conditions.push(sql`${tables.investigationReport.accident_id} IS NOT NULL AND (${tables.investigationReport.investigation_status} IS NULL OR ${tables.investigationReport.investigation_status} != 'completed' )`);
        } else if (status === '완료') {
          conditions.push(sql`${tables.investigationReport.accident_id} IS NOT NULL AND ${tables.investigationReport.investigation_status} = 'completed'`);
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

      // 각 사고별로 재해자 injury_type을 모두 조회하여 추가
      const accidentIds = data.map((row: any) => row.accident_id);
      console.log('[BACK][fetchHistoryList] 조회된 사고 ID들:', accidentIds);
      
      let victimsRows: any[] = [];
      if (accidentIds.length > 0) {
        // Drizzle ORM의 select 대신 직접 SQL 실행 (IN 쿼리 파라미터 안전하게 처리)
        // accidentIds가 없으면 빈 배열 반환
        const result = await db().execute(
          sql`SELECT accident_id, injury_type FROM victims WHERE accident_id IN (${sql.join(accidentIds.map((id: string) => sql`${id}`), sql`,`)})`
        );
        // 결과는 { rows: [...] } 형태이므로 rows만 추출
        victimsRows = (result as any).rows || [];
        console.log('[BACK][fetchHistoryList] victims 테이블 직접 SQL 조회 결과:', victimsRows);
      }
      // 사고ID별로 injury_type 배열로 그룹핑
      let injuryTypeMap: Record<string, string[]> = {};
      for (const v of victimsRows) {
        if (!injuryTypeMap[v.accident_id]) injuryTypeMap[v.accident_id] = [];
        if (v.injury_type) injuryTypeMap[v.accident_id].push(v.injury_type);
      }
      console.log('[BACK][fetchHistoryList] injury_type 그룹핑 결과:', injuryTypeMap);
      // 목록 row에 injury_types 필드 추가 (재해자 순서대로 콤마구분)
      for (const row of data) {
        const types = injuryTypeMap[row.accident_id] || [];
        row.injury_types = types.length > 0 ? types.join(', ') : '';
        console.log(`[BACK][fetchHistoryList] ${row.accident_id}의 injury_types: "${row.injury_types}"`);
      }

      const total = Number(totalResult[0].count);

      console.log(`[BACK][fetchHistoryList] 조회 완료: ${data.length}건 / 전체 ${total}건`);

      return {
        reports: data,
        total,
        page,
        totalPages: Math.ceil(total / size),
      };
    } catch (error: any) {
      console.error('[BACK][fetchHistoryList] 이력 목록 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 특정 사고 이력 상세 조회
   * @param id 사고 ID
   * @returns 사고 이력 상세 정보
   */
  static async getHistoryById(id: string) {
    console.log(`[BACK][getHistoryById] 사고 이력 상세 조회 시작 (ID: ${id})`);
    
    try {
      const reports = (await db()
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
        .where(sql`${tables.occurrenceReport.accident_id} = ${id}`)
        .limit(1)) as unknown as any[];

      if (reports.length === 0) {
        console.log(`[BACK][getHistoryById] 해당 ID의 사고 이력 없음 (ID: ${id})`);
        return null;
      }
      
      const report = reports[0];
      console.log(`[BACK][getHistoryById] 사고 이력 조회 완료`);
      
      return report;
    } catch (error: any) {
      console.error('[BACK][getHistoryById] 사고 이력 상세 조회 오류:', error);
      throw error;
    }
  }
} 