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

// 재해자 정보 인터페이스
interface VictimInfo {
  name: string;
  injury_type: string;
  absence_days?: number; // 휴업손실일 (조사보고서에서만)
}

// 물적피해 정보 인터페이스
interface PropertyDamageInfo {
  damage_target: string;
  estimated_cost: number;
}

// 재발방지대책 통계 인터페이스
interface PreventionStats {
  total_actions: number;
  completed_actions: number;
  completion_rate: number;
}

export default class HistoryService {
  /**
   * 사고 이력 목록 조회 (고도화된 정보 포함)
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

      // 데이터 쿼리: 조사보고서 정보도 함께 조회
      const dataQuery = db()
        .select({
          ...getTableColumns(tables.occurrenceReport),
          status: sql<string>`CASE 
            WHEN investigation_report.accident_id IS NOT NULL AND investigation_report.investigation_status = 'completed' THEN '완료'
            WHEN investigation_report.accident_id IS NOT NULL THEN '조사중'
            ELSE '발생'
          END`.as('status'),
          // 조사보고서 추가 정보
          investigation_accident_name: tables.investigationReport.investigation_accident_name,
          investigation_acci_time: tables.investigationReport.investigation_acci_time,
          investigation_accident_type_level1: tables.investigationReport.investigation_accident_type_level1,
          direct_cause: tables.investigationReport.direct_cause,
          root_cause: tables.investigationReport.root_cause,
          cause_analysis: tables.investigationReport.cause_analysis,
          prevention_actions: tables.investigationReport.prevention_actions,
        })
        .from(tables.occurrenceReport)
        .leftJoin(tables.investigationReport, eq(tables.occurrenceReport.accident_id, tables.investigationReport.accident_id))
        .where(whereClause)
        // 사고코드에서 연도/순번을 추출해 내림차순 정렬
        .orderBy(
          sql`CAST(SUBSTRING(${tables.occurrenceReport.global_accident_no} FROM '\\d{4}') AS INTEGER) DESC`,
          sql`CAST(SUBSTRING(${tables.occurrenceReport.global_accident_no} FROM '-(\\d{3})$') AS INTEGER) DESC`
        )
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

      if (data.length === 0) {
        console.log('[BACK][fetchHistoryList] 조회 결과 없음');
        return {
          reports: [],
          total: 0,
          page,
          totalPages: 0,
        };
      }

      const accidentIds = data.map((row: any) => row.accident_id);
      console.log('[BACK][fetchHistoryList] 조회된 사고 ID들:', accidentIds);

      // 각 사고별로 상세 정보를 병렬로 조회
      const [victimsData, propertyDamagesData, investigationVictimsData, investigationPropertyDamagesData, preventionStatsData, correctiveActionsData] = await Promise.all([
        this.getVictimsInfo(accidentIds),
        this.getPropertyDamagesInfo(accidentIds), 
        this.getInvestigationVictimsInfo(accidentIds),
        this.getInvestigationPropertyDamagesInfo(accidentIds),
        this.getPreventionActionsStats(accidentIds),
        this.getCorrectiveActionsList(accidentIds)
      ]);

      // 데이터를 각 사고별로 매핑
      const enhancedData = data.map((row: any) => {
        const accidentId = row.accident_id;
        const hasInvestigation = row.status === '조사중' || row.status === '완료';
        
        // 재해발생형태 결정 (조사보고서가 있으면 조사보고서 기준, 없으면 발생보고서 기준)
        const accidentType = hasInvestigation && row.investigation_accident_type_level1 
          ? row.investigation_accident_type_level1 
          : row.accident_type_level1;
        
        // 사고명 결정 (조사보고서가 있으면 조사보고서 기준, 없으면 발생보고서 기준)
        const accidentName = hasInvestigation && row.investigation_accident_name 
          ? row.investigation_accident_name 
          : row.accident_name;
        
        // 사고발생일시 결정 (조사보고서가 있으면 조사보고서 기준, 없으면 발생보고서 기준)
        const acciTime = hasInvestigation && row.investigation_acci_time 
          ? row.investigation_acci_time 
          : row.acci_time;

        // 재해자 정보 (조사보고서가 있으면 조사보고서 기준, 없으면 발생보고서 기준)
        const victims = hasInvestigation 
          ? investigationVictimsData[accidentId] || []
          : victimsData[accidentId] || [];

        // 물적피해 정보 (조사보고서가 있으면 조사보고서 기준, 없으면 발생보고서 기준)
        const propertyDamages = hasInvestigation 
          ? investigationPropertyDamagesData[accidentId] || []
          : propertyDamagesData[accidentId] || [];

        // 재발방지대책 통계 (조사보고서가 있는 경우만)
        const preventionStats = hasInvestigation 
          ? preventionStatsData[accidentId] || { total_actions: 0, completed_actions: 0, completion_rate: 0 }
          : null;

        return {
          ...row,
          // 기본 정보 (조사보고서 우선)
          final_accident_name: accidentName,
          final_acci_time: acciTime,
          final_accident_type_level1: accidentType,
          
          // 재해자 정보
          victims_info: victims,
          victims_summary: this.generateVictimsSummary(victims),
          
          // 물적피해 정보
          property_damages_info: propertyDamages,
          property_damages_summary: this.generatePropertyDamagesSummary(propertyDamages),
          
          // 원인 정보 (조사보고서에서만)
          causes_summary: hasInvestigation ? this.generateCausesSummary(row.direct_cause, row.root_cause, row.cause_analysis) : null,
          
          // 재발방지대책 정보 (조사보고서에서만)
          prevention_stats: preventionStats,
          // 개선조치(재발방지대책) 상세 리스트 추가
          prevention_actions: hasInvestigation ? (correctiveActionsData[accidentId] || []) : [],
        };
      });

      const total = Number(totalResult[0].count);

      console.log(`[BACK][fetchHistoryList] 조회 완료: ${enhancedData.length}건 / 전체 ${total}건`);

      return {
        reports: enhancedData,
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
   * 발생보고서 재해자 정보 조회
   */
  private static async getVictimsInfo(accidentIds: string[]): Promise<Record<string, VictimInfo[]>> {
    if (accidentIds.length === 0) return {};
    
    const result = await db().execute(
      sql`SELECT accident_id, name, injury_type FROM victims WHERE accident_id IN (${sql.join(accidentIds.map((id: string) => sql`${id}`), sql`,`)}) ORDER BY victim_id`
    );
    
    const victimsRows = (result as any).rows || [];
    const victimsMap: Record<string, VictimInfo[]> = {};
    
    for (const row of victimsRows) {
      if (!victimsMap[row.accident_id]) {
        victimsMap[row.accident_id] = [];
      }
      victimsMap[row.accident_id].push({
        name: row.name || '미확인',
        injury_type: row.injury_type || '정보없음'
      });
    }
    
    return victimsMap;
  }

  /**
   * 발생보고서 물적피해 정보 조회
   */
  private static async getPropertyDamagesInfo(accidentIds: string[]): Promise<Record<string, PropertyDamageInfo[]>> {
    if (accidentIds.length === 0) return {};
    
    const result = await db().execute(
      sql`SELECT accident_id, damage_target, estimated_cost FROM property_damage WHERE accident_id IN (${sql.join(accidentIds.map((id: string) => sql`${id}`), sql`,`)}) ORDER BY damage_id`
    );
    
    const damagesRows = (result as any).rows || [];
    const damagesMap: Record<string, PropertyDamageInfo[]> = {};
    
    for (const row of damagesRows) {
      if (!damagesMap[row.accident_id]) {
        damagesMap[row.accident_id] = [];
      }
      damagesMap[row.accident_id].push({
        damage_target: row.damage_target || '미확인',
        estimated_cost: Number(row.estimated_cost) || 0
      });
    }
    
    return damagesMap;
  }

  /**
   * 조사보고서 재해자 정보 조회 (휴업손실일 포함)
   */
  private static async getInvestigationVictimsInfo(accidentIds: string[]): Promise<Record<string, VictimInfo[]>> {
    if (accidentIds.length === 0) return {};
    
    const result = await db().execute(
      sql`SELECT accident_id, name, injury_type, absence_start_date, return_expected_date 
          FROM investigation_victims 
          WHERE accident_id IN (${sql.join(accidentIds.map((id: string) => sql`${id}`), sql`,`)}) 
          ORDER BY victim_id`
    );
    
    const victimsRows = (result as any).rows || [];
    const victimsMap: Record<string, VictimInfo[]> = {};
    
    for (const row of victimsRows) {
      if (!victimsMap[row.accident_id]) {
        victimsMap[row.accident_id] = [];
      }
      
      // 휴업손실일 계산
      let absenceDays = undefined;
      if (row.absence_start_date && row.return_expected_date) {
        try {
          const startDate = new Date(row.absence_start_date);
          const returnDate = new Date(row.return_expected_date);
          const diffTime = returnDate.getTime() - startDate.getTime();
          absenceDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } catch (e) {
          console.warn('휴업손실일 계산 오류:', e);
        }
      }
      
      victimsMap[row.accident_id].push({
        name: row.name || '미확인',
        injury_type: row.injury_type || '정보없음',
        absence_days: absenceDays
      });
    }
    
    return victimsMap;
  }

  /**
   * 조사보고서 물적피해 정보 조회
   */
  private static async getInvestigationPropertyDamagesInfo(accidentIds: string[]): Promise<Record<string, PropertyDamageInfo[]>> {
    if (accidentIds.length === 0) return {};
    
    const result = await db().execute(
      sql`SELECT accident_id, damage_target, estimated_cost 
          FROM investigation_property_damage 
          WHERE accident_id IN (${sql.join(accidentIds.map((id: string) => sql`${id}`), sql`,`)}) 
          ORDER BY damage_id`
    );
    
    const damagesRows = (result as any).rows || [];
    const damagesMap: Record<string, PropertyDamageInfo[]> = {};
    
    for (const row of damagesRows) {
      if (!damagesMap[row.accident_id]) {
        damagesMap[row.accident_id] = [];
      }
      damagesMap[row.accident_id].push({
        damage_target: row.damage_target || '미확인',
        estimated_cost: Number(row.estimated_cost) || 0
      });
    }
    
    return damagesMap;
  }

  /**
   * 재발방지대책 통계 조회
   */
  private static async getPreventionActionsStats(accidentIds: string[]): Promise<Record<string, PreventionStats>> {
    if (accidentIds.length === 0) return {};
    
    const result = await db().execute(
      sql`SELECT investigation_id as accident_id, 
                 COUNT(*) as total_actions,
                 COUNT(CASE WHEN progress_status = 'completed' THEN 1 END) as completed_actions
          FROM corrective_action 
          WHERE investigation_id IN (${sql.join(accidentIds.map((id: string) => sql`${id}`), sql`,`)})
          GROUP BY investigation_id`
    );
    
    const statsRows = (result as any).rows || [];
    const statsMap: Record<string, PreventionStats> = {};
    
    for (const row of statsRows) {
      const totalActions = Number(row.total_actions);
      const completedActions = Number(row.completed_actions);
      const completionRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
      
      statsMap[row.accident_id] = {
        total_actions: totalActions,
        completed_actions: completedActions,
        completion_rate: completionRate
      };
    }
    
    return statsMap;
  }

  /**
   * 재해자 정보 요약 생성
   */
  private static generateVictimsSummary(victims: VictimInfo[]): string {
    if (victims.length === 0) return '재해자 없음';
    
    if (victims.length === 1) {
      const victim = victims[0];
      const absenceInfo = victim.absence_days ? ` (${victim.absence_days}일 휴업)` : '';
      return `${victim.name} (${victim.injury_type})${absenceInfo}`;
    }
    
    const injuryTypes = victims.map(v => v.injury_type).filter((type, index, self) => self.indexOf(type) === index);
    return `${victims.length}명 (${injuryTypes.join(', ')})`;
  }

  /**
   * 물적피해 정보 요약 생성
   */
  private static generatePropertyDamagesSummary(damages: PropertyDamageInfo[]): string {
    if (damages.length === 0) return '물적피해 없음';
    
    const totalCost = damages.reduce((sum, damage) => sum + damage.estimated_cost, 0);
    const targets = damages.map(d => d.damage_target).filter((target, index, self) => self.indexOf(target) === index);
    
    if (damages.length === 1) {
      return `${targets[0]} (${totalCost.toLocaleString()}천원)`;
    }
    
    return `${damages.length}건 (${totalCost.toLocaleString()}천원)`;
  }

  /**
   * 원인 정보 요약 생성
   */
  private static generateCausesSummary(directCause: string, rootCause: string, causeAnalysis: string): string {
    const causes = [];
    
    // cause_analysis JSON이 있으면 우선 사용
    if (causeAnalysis) {
      try {
        const analysis = JSON.parse(causeAnalysis);
        
        // 직접원인 파싱
        if (analysis.direct_cause) {
          const directCauses = [];
          if (analysis.direct_cause.unsafe_condition && analysis.direct_cause.unsafe_condition.length > 0) {
            directCauses.push(...analysis.direct_cause.unsafe_condition);
          }
          if (analysis.direct_cause.unsafe_act && analysis.direct_cause.unsafe_act.length > 0) {
            directCauses.push(...analysis.direct_cause.unsafe_act);
          }
          if (directCauses.length > 0) {
            const directSummary = directCauses.join(', ').substring(0, 100);
            causes.push(`직접원인: ${directSummary}${directCauses.join(', ').length > 100 ? '...' : ''}`);
          }
        }
        
        // 근본원인 파싱
        if (analysis.root_cause) {
          const rootCauses = [];
          if (analysis.root_cause.human_factor && analysis.root_cause.human_factor.length > 0) {
            rootCauses.push(...analysis.root_cause.human_factor);
          }
          if (analysis.root_cause.system_factor && analysis.root_cause.system_factor.length > 0) {
            rootCauses.push(...analysis.root_cause.system_factor);
          }
          if (rootCauses.length > 0) {
            const rootSummary = rootCauses.join(', ').substring(0, 100);
            causes.push(`근본원인: ${rootSummary}${rootCauses.join(', ').length > 100 ? '...' : ''}`);
          }
        }
      } catch (error) {
        console.warn('[generateCausesSummary] cause_analysis JSON 파싱 오류:', error);
        // JSON 파싱 실패 시 기존 필드 사용
        if (directCause) causes.push(`직접원인: ${directCause.substring(0, 50)}${directCause.length > 50 ? '...' : ''}`);
        if (rootCause) causes.push(`근본원인: ${rootCause.substring(0, 50)}${rootCause.length > 50 ? '...' : ''}`);
      }
    } else {
      // cause_analysis가 없으면 기존 필드 사용
      if (directCause) causes.push(`직접원인: ${directCause.substring(0, 50)}${directCause.length > 50 ? '...' : ''}`);
      if (rootCause) causes.push(`근본원인: ${rootCause.substring(0, 50)}${rootCause.length > 50 ? '...' : ''}`);
    }
    
    return causes.length > 0 ? causes.join(' | ') : '원인분석 미완료';
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

  /**
   * 사고별 개선조치(재발방지대책) 리스트 반환
   */
  private static async getCorrectiveActionsList(accidentIds: string[]): Promise<Record<string, any[]>> {
    if (accidentIds.length === 0) return {};
    const result = await db().execute(
      sql`SELECT investigation_id as accident_id, title, progress_status FROM corrective_action WHERE investigation_id IN (${sql.join(accidentIds.map((id: string) => sql`${id}`), sql`,`)}) ORDER BY id`
    );
    const rows = (result as any).rows || [];
    const map: Record<string, any[]> = {};
    for (const row of rows) {
      if (!map[row.accident_id]) map[row.accident_id] = [];
      map[row.accident_id].push({
        title: row.title || '',
        progress_status: row.progress_status || '',
      });
    }
    return map;
  }
} 