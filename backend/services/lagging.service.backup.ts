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

      // 1-1. 기본 사고 데이터 조회 (필요한 모든 필드 포함)
      const accidentsQuery = await db()
        .select({
          accident_id: occurrenceReport.accident_id,
          company_name: occurrenceReport.company_name,
          site_name: occurrenceReport.site_name,
          acci_time: occurrenceReport.acci_time,
          accident_type_level1: occurrenceReport.accident_type_level1,
          is_contractor: occurrenceReport.is_contractor,
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

      // 2. 연간 근로시간 조회 (임직원/협력업체 구분)
      const workingHoursQuery = await db()
        .select({
          company_id: annualWorkingHours.company_id,
          total_hours: annualWorkingHours.total_hours,
          employee_hours: annualWorkingHours.employee_hours,
          partner_on_hours: annualWorkingHours.partner_on_hours,
          partner_off_hours: annualWorkingHours.partner_off_hours,
        })
        .from(annualWorkingHours)
        .where(eq(annualWorkingHours.year, year));

      // 전체 근로시간 계산
      let totalWorkingHours = 0;
      let employeeWorkingHours = 0;
      let contractorWorkingHours = 0;
      
      workingHoursQuery.forEach(wh => {
        totalWorkingHours += wh.total_hours || 0;
        employeeWorkingHours += wh.employee_hours || 0;
        // 협력업체 = 상주 + 비상주
        contractorWorkingHours += (wh.partner_on_hours || 0) + (wh.partner_off_hours || 0);
      });
      
      const workingHoursData = {
        total: totalWorkingHours,
        employee: employeeWorkingHours,
        contractor: contractorWorkingHours
      };

      // 3. 조사보고서 존재 여부 배치 조회
      const investigationStatus = await this.getInvestigationBatch(accidentIds);

      // 4. 지표 계산
      const summary = this.calculateIndicators(
        accidentsQuery, 
        victimsQuery, 
        propertyDamageQuery, 
        workingHoursData, 
        investigationStatus,
        year
      );

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
   * @description 지표 계산 로직 (원래 설계대로 복원)
   */
  private static calculateIndicators(
    accidentsData: any[],
    victimsData: any[],
    propertyDamageData: any[],
    workingHoursData: { total: number; employee: number; contractor: number },
    investigationStatus: Record<string, boolean>,
    year: number
  ) {
    // 인적/복합 사고만 필터링
    const humanAccidents = accidentsData.filter(acc => 
      acc.accident_type_level1 === '인적' || acc.accident_type_level1 === '복합'
    );
    
    console.log(`[LaggingService] ${year}년 전체 사고: ${accidentsData.length}건, 인적/복합 사고: ${humanAccidents.length}건`);
    
    // 사고 건수 계산
    const accidentCount = {
      total: humanAccidents.length,
      employee: humanAccidents.filter(acc => !acc.is_contractor).length,
      contractor: humanAccidents.filter(acc => acc.is_contractor).length
    };

    // 사업장별 사고 건수
    const siteAccidentCounts: Record<string, number> = {};
    accidentsData.forEach(acc => {
      const siteName = acc.site_name || '미지정';
      siteAccidentCounts[siteName] = (siteAccidentCounts[siteName] || 0) + 1;
    });

    // 인적/복합 사고의 재해자만 필터링
    const humanAccidentIds = new Set(humanAccidents.map(acc => acc.accident_id));
    const humanVictims = victimsData.filter(v => humanAccidentIds.has(v.accident_id));
    
    // 재해자 수 계산 (소속 정보 기반)
    const victimCount = {
      total: humanVictims.length,
      employee: 0,
      contractor: 0
    };
    
    // 각 사고의 is_contractor 정보와 재해자 매칭
    const accidentTypeMap = new Map(humanAccidents.map(acc => [acc.accident_id, acc.is_contractor]));
    humanVictims.forEach(victim => {
      const isContractor = accidentTypeMap.get(victim.accident_id) || false;
      if (isContractor) {
        victimCount.contractor++;
      } else {
        victimCount.employee++;
      }
    });

    // 부상 유형별 계산 (인적/복합 사고만)
    const injuryTypeCounts: Record<string, number> = {};
    humanVictims.forEach(victim => {
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

    // LTIR용 기준이상 사고 건수 계산 (중상, 사망, 기타만)
    const ltirSevereTypes = new Set(['중상', '사망', '기타']);
    const ltirAccidentCounts = {
      total: 0,
      employee: 0,
      contractor: 0
    };
    
    // TRIR용 기준이상 사고 건수 계산 (모든 부상 유형)
    const trirAccidentCounts = {
      total: 0,
      employee: 0,
      contractor: 0
    };
    
    // 근로손실일수 계산
    const lossDays = {
      total: 0,
      employee: 0,
      contractor: 0
    };
    
    // 각 사고별로 계산
    humanAccidents.forEach(accident => {
      const accidentVictims = humanVictims.filter(v => v.accident_id === accident.accident_id);
      
      let hasLtirInjury = false;
      let hasTrirInjury = false;
      let accidentLossDays = 0;
      
      accidentVictims.forEach(victim => {
        // LTIR 체크
        if (ltirSevereTypes.has(victim.injury_type)) {
          hasLtirInjury = true;
        }
        
        // TRIR 체크 (모든 부상)
        if (victim.injury_type) {
          hasTrirInjury = true;
        }
        
        // 근로손실일수 계산 (사망=7500일, 중상=180일, 기타=90일, 경상=30일 추정)
        if (victim.injury_type === '사망') {
          accidentLossDays += 7500;
        } else if (victim.injury_type === '중상') {
          accidentLossDays += 180;
        } else if (victim.injury_type === '기타') {
          accidentLossDays += 90;
        } else if (victim.injury_type === '경상') {
          accidentLossDays += 30;
        } else if (victim.injury_type === '병원치료') {
          accidentLossDays += 15;
        } else if (victim.injury_type === '응급처치') {
          accidentLossDays += 3;
        }
      });
      
      // LTIR 카운트
      if (hasLtirInjury) {
        ltirAccidentCounts.total++;
        if (accident.is_contractor) {
          ltirAccidentCounts.contractor++;
        } else {
          ltirAccidentCounts.employee++;
        }
      }
      
      // TRIR 카운트
      if (hasTrirInjury) {
        trirAccidentCounts.total++;
        if (accident.is_contractor) {
          trirAccidentCounts.contractor++;
        } else {
          trirAccidentCounts.employee++;
        }
      }
      
      // 근로손실일수 누적
      lossDays.total += accidentLossDays;
      if (accident.is_contractor) {
        lossDays.contractor += accidentLossDays;
      } else {
        lossDays.employee += accidentLossDays;
      }
    });
    
    console.log(`[LaggingService] LTIR 사고 건수:`, ltirAccidentCounts);
    console.log(`[LaggingService] TRIR 사고 건수:`, trirAccidentCounts);
    console.log(`[LaggingService] 근로손실일수:`, lossDays);
    
    // LTIR, TRIR, 강도율 계산
    const ltir = this.calculateLTIR(ltirAccidentCounts.total, workingHoursData.total);
    const trir = this.calculateTRIR(trirAccidentCounts.total, workingHoursData.total);
    const severityRate = this.calculateSeverityRate(lossDays.total, workingHoursData.total);

    // 조사보고서 통계
    const investigationCount = Object.values(investigationStatus).filter(exists => exists).length;

    return {
      accidentCount,
      siteAccidentCounts,
      victimCount,
      injuryTypeCounts,
      propertyDamage,
      totalLossDays: lossDays.total,
      workingHours: workingHoursData,
      ltirAccidentCounts,
      trirAccidentCounts,
      lossDays,
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
   * @description 강도율 계산 (근로손실일수 / 연간 근로시간 × 1000)
   */
  private static calculateSeverityRate(lossDays: number, workingHours: number): number {
    if (workingHours === 0) return 0;
    return (lossDays / workingHours) * 1000;
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