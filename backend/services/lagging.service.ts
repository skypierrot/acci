/**
 * @file services/lagging.service.ts
 * @description
 *  - Lagging 지표 관련 비즈니스 로직을 구현합니다.
 *  - 성능 최적화를 위해 통합 쿼리와 배치 처리를 사용합니다.
 */

import { db, tables } from "../orm/index";
import { sql, desc, eq, and, gte, lte, count, sum, inArray } from "drizzle-orm";
import { occurrenceReport } from "../orm/schema/occurrence";
import { victims } from "../orm/schema/victims";
import { propertyDamage } from "../orm/schema/property_damage";
import { investigationReport } from "../orm/schema/investigation";
import { annualWorkingHours } from "../orm/schema/annual_working_hours";

// 캐시 시스템 (메모리 기반)
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// 캐시 TTL (5분)
const CACHE_TTL = 5 * 60 * 1000;

// 캐시 키 생성 함수
const generateCacheKey = (prefix: string, params: any): string => {
  return `${prefix}:${JSON.stringify(params)}`;
};

// 캐시에서 데이터 조회
const getFromCache = (key: string): any | null => {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > cached.ttl) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
};

// 캐시에 데이터 저장
const setCache = (key: string, data: any, ttl: number = CACHE_TTL): void => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
};

// 캐시 무효화
const invalidateCache = (pattern: string): void => {
  const keysToDelete: string[] = [];
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => cache.delete(key));
};

export default class LaggingService {
  /**
   * @method getSummaryByYear
   * @description 특정 연도의 모든 lagging 지표를 한 번에 계산
   */
  static async getSummaryByYear(year: number) {
    const cacheKey = generateCacheKey('lagging_summary', { year });
    const cached = getFromCache(cacheKey);
    if (cached) {
      console.log(`[LaggingService] 캐시에서 ${year}년도 지표 요약 조회`);
      return cached;
    }

    console.log(`[LaggingService] ${year}년도 지표 요약 계산 시작`);

    try {
      // 1. 기본 사고 데이터 조회 (JOIN을 활용한 단일 쿼리)
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);

      // 1-1. 기본 사고 데이터 조회
      const accidentsQuery = await db()
        .select({
          accident_id: occurrenceReport.accident_id,
          company_name: occurrenceReport.company_name,
          site_name: occurrenceReport.site_name,
          acci_time: occurrenceReport.acci_time,
        })
        .from(occurrenceReport)
        .where(
          and(
            gte(occurrenceReport.acci_time, startDate),
            lte(occurrenceReport.acci_time, endDate)
          )
        );

      console.log(`[LaggingService] 기본 사고 데이터 조회 완료: ${accidentsQuery.length}건`);

      // 1-2. 재해자 정보 조회
      const accidentIds = accidentsQuery.map(acc => acc.accident_id);
      const victimsQuery = await db()
        .select({
          accident_id: victims.accident_id,
          victim_id: victims.victim_id,
          injury_type: victims.injury_type,
          belong: victims.belong,
        })
        .from(victims)
        .where(inArray(victims.accident_id, accidentIds));

      // 1-3. 물적피해 정보 조회
      const propertyDamageQuery = await db()
        .select({
          accident_id: propertyDamage.accident_id,
          damage_type: propertyDamage.damage_type,
          estimated_cost: propertyDamage.estimated_cost,
        })
        .from(propertyDamage)
        .where(inArray(propertyDamage.accident_id, accidentIds));

      console.log(`[LaggingService] 재해자 데이터 조회 완료: ${victimsQuery.length}건`);
      console.log(`[LaggingService] 물적피해 데이터 조회 완료: ${propertyDamageQuery.length}건`);

      console.log(`[LaggingService] 사고 데이터 조회 완료: ${accidentsQuery.length}건`);

      // 2. 연간 근로시간 조회
      const workingHoursQuery = await db()
        .select({
          company_id: annualWorkingHours.company_id,
          total_hours: annualWorkingHours.total_hours,
        })
        .from(annualWorkingHours)
        .where(eq(annualWorkingHours.year, year));

      const workingHoursMap = new Map(
        workingHoursQuery.map(wh => [wh.company_id, wh.total_hours])
      );

      // 3. 조사보고서 존재 여부 배치 조회
      const investigationStatus = await this.getInvestigationBatch(accidentIds);

      // 4. 지표 계산
      const summary = this.calculateIndicators(accidentsQuery, victimsQuery, propertyDamageQuery, workingHoursMap, investigationStatus);

      // 캐시에 저장
      setCache(cacheKey, summary);

      console.log(`[LaggingService] ${year}년도 지표 요약 계산 완료`);
      return summary;

    } catch (error) {
      console.error(`[LaggingService] 지표 요약 계산 오류:`, error);
      throw error;
    }
  }

  /**
   * @method getChartData
   * @description 그래프용 데이터를 배치로 처리
   */
  static async getChartData(startYear: number, endYear: number) {
    const cacheKey = generateCacheKey('lagging_chart', { startYear, endYear });
    const cached = getFromCache(cacheKey);
    if (cached) {
      console.log(`[LaggingService] 캐시에서 차트 데이터 조회`);
      return cached;
    }

    console.log(`[LaggingService] 차트 데이터 계산 시작: ${startYear}년 ~ ${endYear}년`);

    try {
      const chartData = {
        accidentTrend: [] as any[],
        safetyIndex: [] as any[],
        detailedSafetyIndex: [] as any[],
        integratedAccident: [] as any[],
        siteAccident: [] as any[],
        injuryType: [] as any[],
        employeeType: [] as any[],
        propertyDamage: [] as any[]
      };

      // 연도별로 데이터 수집
      for (let year = startYear; year <= endYear; year++) {
        const yearData = await this.getSummaryByYear(year);
        
        // 사고 추세 데이터
        chartData.accidentTrend.push({
          year,
          totalAccidents: yearData.accidentCount.total,
          employeeAccidents: yearData.accidentCount.employee,
          contractorAccidents: yearData.accidentCount.contractor
        });

        // 안전지수 데이터
        chartData.safetyIndex.push({
          year,
          ltir: yearData.ltir,
          trir: yearData.trir,
          severityRate: yearData.severityRate
        });

        // 상세 안전지수 데이터 (현재는 단일 값이므로 동일한 값 사용)
        chartData.detailedSafetyIndex.push({
          year,
          employeeLtir: yearData.ltir,
          contractorLtir: yearData.ltir,
          employeeTrir: yearData.trir,
          contractorTrir: yearData.trir
        });

        // 통합 사고 데이터
        chartData.integratedAccident.push({
          year,
          accidents: yearData.accidentCount.total,
          victims: yearData.victimCount.total,
          propertyDamage: yearData.propertyDamage.total
        });

        // 사업장별 사고 데이터
        Object.entries(yearData.siteAccidentCounts).forEach(([siteName, count]) => {
          chartData.siteAccident.push({
            year,
            siteName,
            count
          });
        });

        // 부상 유형별 데이터
        Object.entries(yearData.injuryTypeCounts).forEach(([injuryType, count]) => {
          chartData.injuryType.push({
            year,
            injuryType,
            count
          });
        });

        // 직원 유형별 데이터
        chartData.employeeType.push({
          year,
          employee: yearData.victimCount.employee,
          contractor: yearData.victimCount.contractor
        });

        // 물적피해 데이터
        chartData.propertyDamage.push({
          year,
          direct: yearData.propertyDamage.direct,
          indirect: yearData.propertyDamage.indirect
        });
      }

      // 캐시에 저장
      setCache(cacheKey, chartData, 10 * 60 * 1000); // 10분 TTL

      console.log(`[LaggingService] 차트 데이터 계산 완료`);
      return chartData;

    } catch (error) {
      console.error(`[LaggingService] 차트 데이터 계산 오류:`, error);
      throw error;
    }
  }

  /**
   * @method getInvestigationBatch
   * @description 조사보고서 존재 여부를 배치로 조회
   */
  static async getInvestigationBatch(accidentIds: string[]) {
    if (accidentIds.length === 0) return {};

    const cacheKey = generateCacheKey('investigation_batch', { accidentIds });
    const cached = getFromCache(cacheKey);
    if (cached) {
      console.log(`[LaggingService] 캐시에서 조사보고서 배치 조회`);
      return cached;
    }

    console.log(`[LaggingService] 조사보고서 배치 조회 시작: ${accidentIds.length}건`);

    try {
      const investigations = await db()
        .select({
          accident_id: investigationReport.accident_id,
          exists: sql<boolean>`true`
        })
        .from(investigationReport)
        .where(inArray(investigationReport.accident_id, accidentIds));

      const investigationMap: Record<string, boolean> = {};
      
      // 모든 사고 ID에 대해 기본값 false 설정
      accidentIds.forEach(id => {
        investigationMap[id] = false;
      });

      // 조사보고서가 존재하는 사고만 true로 설정
      investigations.forEach(inv => {
        investigationMap[inv.accident_id] = true;
      });

      // 캐시에 저장 (1분 TTL)
      setCache(cacheKey, investigationMap, 60 * 1000);

      console.log(`[LaggingService] 조사보고서 배치 조회 완료`);
      return investigationMap;

    } catch (error) {
      console.error(`[LaggingService] 조사보고서 배치 조회 오류:`, error);
      throw error;
    }
  }

  /**
   * @method calculateIndicators
   * @description 지표 계산 로직
   */
  private static calculateIndicators(
    accidentsData: any[],
    victimsData: any[],
    propertyDamageData: any[],
    workingHoursMap: Map<string, number>,
    investigationStatus: Record<string, boolean>
  ) {
    // 사고 건수 계산
    const accidentCount = {
      total: accidentsData.length,
      employee: 0,
      contractor: 0
    };

    // 사업장별 사고 건수
    const siteAccidentCounts: Record<string, number> = {};
    accidentsData.forEach(acc => {
      const siteName = acc.site_name || '미지정';
      siteAccidentCounts[siteName] = (siteAccidentCounts[siteName] || 0) + 1;
    });

    // 재해자 수 계산 (소속 정보 기반으로 추정)
    const victimCount = {
      total: victimsData.length,
      employee: victimsData.filter(v => v.belong && !v.belong.includes('협력업체')).length,
      contractor: victimsData.filter(v => v.belong && v.belong.includes('협력업체')).length
    };

    // 사고별 재해자 유형 확인
    const accidentVictimTypes = new Map<string, Set<string>>();
    victimsData.forEach(victim => {
      if (!accidentVictimTypes.has(victim.accident_id)) {
        accidentVictimTypes.set(victim.accident_id, new Set());
      }
      const employeeType = victim.belong && victim.belong.includes('협력업체') ? '협력업체' : '임직원';
      accidentVictimTypes.get(victim.accident_id)!.add(employeeType);
    });

    // 임직원/협력업체 사고 건수 계산
    accidentVictimTypes.forEach((types) => {
      if (types.has('임직원')) accidentCount.employee++;
      if (types.has('협력업체')) accidentCount.contractor++;
    });

    // 부상 유형별 계산
    const injuryTypeCounts: Record<string, number> = {};
    victimsData.forEach(victim => {
      const injuryType = victim.injury_type || '미분류';
      injuryTypeCounts[injuryType] = (injuryTypeCounts[injuryType] || 0) + 1;
    });

    // 물적피해 계산
    const propertyDamage = {
      total: 0,
      direct: 0,
      indirect: 0
    };

    propertyDamageData.forEach(damage => {
      const amount = damage.estimated_cost || 0;
      propertyDamage.total += amount;
      
      if (damage.damage_type === '직접피해') {
        propertyDamage.direct += amount;
      } else if (damage.damage_type === '간접피해') {
        propertyDamage.indirect += amount;
      }
    });

    // 총 손실일수 (현재 스키마에는 loss_days가 없으므로 0으로 설정)
    const totalLossDays = 0;

    // LTIR, TRIR, 강도율 계산
    const totalWorkingHours = Array.from(workingHoursMap.values()).reduce((sum, hours) => sum + hours, 0);
    
    const ltir = this.calculateLTIR(accidentCount.total, totalWorkingHours);
    const trir = this.calculateTRIR(accidentCount.total, totalWorkingHours);
    const severityRate = this.calculateSeverityRate(totalLossDays, totalWorkingHours);

    // 조사보고서 통계
    const investigationCount = Object.values(investigationStatus).filter(exists => exists).length;

    return {
      accidentCount,
      siteAccidentCounts,
      victimCount,
      injuryTypeCounts,
      propertyDamage,
      totalLossDays,
      ltir,
      trir,
      severityRate,
      investigationCount,
      investigationStatus
    };
  }

  /**
   * @method calculateLTIR
   * @description LTIR (Lost Time Injury Rate) 계산
   */
  private static calculateLTIR(accidentCount: number, workingHours: number): number {
    if (workingHours === 0) return 0;
    return (accidentCount / workingHours) * 1_000_000;
  }

  /**
   * @method calculateTRIR
   * @description TRIR (Total Recordable Injury Rate) 계산
   */
  private static calculateTRIR(accidentCount: number, workingHours: number): number {
    if (workingHours === 0) return 0;
    return (accidentCount / workingHours) * 1_000_000;
  }

  /**
   * @method calculateSeverityRate
   * @description 강도율 계산
   */
  private static calculateSeverityRate(lossDays: number, workingHours: number): number {
    if (workingHours === 0) return 0;
    return (lossDays / workingHours) * 1_000_000;
  }

  /**
   * @method clearCache
   * @description 캐시 무효화 (테스트용)
   */
  static clearCache(): void {
    cache.clear();
    console.log('[LaggingService] 캐시가 모두 무효화되었습니다.');
  }
} 