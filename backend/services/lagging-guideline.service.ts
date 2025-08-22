/**
 * @file services/lagging-guideline.service.ts
 * @description
 *  - 가이드라인에 정확히 맞춘 Lagging service
 *  - 배치 API를 통한 성능 최적화
 *  - 올바른 계산 로직 구현
 */

import { db } from "../orm/index";
import { sql, desc, eq, and, gte, lte, count, sum, inArray, like } from "drizzle-orm";
import { occurrenceReport } from "../orm/schema/occurrence";
import { victims } from "../orm/schema/victims";
import { propertyDamage } from "../orm/schema/property_damage";
import { investigationReport } from "../orm/schema/investigation";
import { investigationVictims } from "../orm/schema/investigation_victims";
import { annualWorkingHours } from "../orm/schema/annual_working_hours";

// Cache system
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const generateCacheKey = (prefix: string, params: any): string => {
  return `${prefix}:${JSON.stringify(params)}`;
};

const getFromCache = (key: string): any | null => {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > cached.ttl) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
};

const setCache = (key: string, data: any, ttl: number = CACHE_TTL): void => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
};

export default class LaggingGuidelineService {
  /**
   * Parse accident year from global accident code
   * Format: HHH-AA-YYYY-NNN
   */
  private static parseAccidentYear(globalAccidentNo: string): number | null {
    if (!globalAccidentNo) return null;
    
    const match = globalAccidentNo.match(/^[A-Z]{3}-[A-Z]{2}-(\d{4})-\d{3}$/);
    if (!match) return null;
    
    return parseInt(match[1], 10);
  }

  /**
   * Parse site code from global accident code
   * Format: HHH-AA-YYYY-NNN (AA is site code)
   */
  private static parseSiteCode(globalAccidentNo: string): string {
    if (!globalAccidentNo) return '미지정';
    
    const match = globalAccidentNo.match(/^[A-Z]{3}-([A-Z]{2})-\d{4}-\d{3}$/);
    if (!match) return '미지정';
    
    return match[1];
  }

  /**
   * Get summary by year according to guideline
   */
  static async getSummaryByYear(year: number) {
    const cacheKey = generateCacheKey('lagging_guideline_summary', { year });
    const cached = getFromCache(cacheKey);
    if (cached) {
      console.log(`[LaggingGuidelineService] Cache hit for year ${year}`);
      return cached;
    }

    console.log(`[LaggingGuidelineService] Calculating summary for year ${year}`);

    try {
      // 1. 해당년도 모든 사고 가져오기 (사고코드 년도 기준)
      const yearPattern = `%-${year}-%`;
      const accidentsQuery = await db()
        .select({
          accident_id: occurrenceReport.accident_id,
          global_accident_no: occurrenceReport.global_accident_no,
          company_name: occurrenceReport.company_name,
          site_name: occurrenceReport.site_name,
          acci_time: occurrenceReport.acci_time,
          accident_type_level1: occurrenceReport.accident_type_level1,
          is_contractor: occurrenceReport.is_contractor,
        })
        .from(occurrenceReport)
        .where(like(occurrenceReport.global_accident_no, yearPattern));

      console.log(`[LaggingGuidelineService] Found ${accidentsQuery.length} accidents for year ${year}`);

      // 2. 재해자 데이터 가져오기
      const accidentIds = accidentsQuery.map(acc => acc.accident_id);
      const victimsQuery = accidentIds.length > 0
        ? await db()
            .select({
              accident_id: victims.accident_id,
              victim_id: victims.victim_id,
              injury_type: victims.injury_type,
              belong: victims.belong,
              absence_start_date: victims.absence_start_date,
              expected_return_date: victims.expected_return_date,
            })
            .from(victims)
            .where(inArray(victims.accident_id, accidentIds))
        : [];

      // 3. 물적피해 데이터 가져오기
      const propertyDamageQuery = accidentIds.length > 0
        ? await db()
            .select({
              accident_id: propertyDamage.accident_id,
              damage_type: propertyDamage.damage_type,
              estimated_cost: propertyDamage.estimated_cost,
            })
            .from(propertyDamage)
            .where(inArray(propertyDamage.accident_id, accidentIds))
        : [];

      // 4. 연간근로시간 데이터 가져오기
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

      // 5. 조사보고서 재해자 데이터 가져오기 (강도율 계산용)
      const investigationVictimsQuery = accidentIds.length > 0
        ? await db()
            .select({
              accident_id: investigationVictims.accident_id,
              victim_id: investigationVictims.victim_id,
              injury_type: investigationVictims.injury_type,
              absence_start_date: investigationVictims.absence_start_date,
              return_expected_date: investigationVictims.return_expected_date,
            })
            .from(investigationVictims)
            .where(inArray(investigationVictims.accident_id, accidentIds))
        : [];

      // Calculate summary according to guideline
      const summary = this.calculateSummaryByGuideline(
        year,
        accidentsQuery,
        victimsQuery,
        propertyDamageQuery,
        workingHoursQuery,
        investigationVictimsQuery
      );

      setCache(cacheKey, summary);
      return summary;

    } catch (error) {
      console.error(`[LaggingGuidelineService] Error calculating summary:`, error);
      throw error;
    }
  }

  private static calculateSummaryByGuideline(
    year: number,
    accidents: any[],
    victimsData: any[],
    propertyDamageData: any[],
    workingHoursData: any[],
    investigationVictimsData: any[]
  ) {
    // 1. 사고건수 계산 (가이드라인: 모든 사고)
    const accidentCount = {
      total: accidents.length,
      employee: accidents.filter(acc => !acc.is_contractor).length,
      contractor: accidents.filter(acc => acc.is_contractor).length
    };

    // 1-1. 사업장별 사고건수
    const siteAccidentCounts: Record<string, number> = {};
    accidents.forEach(acc => {
      const siteCode = this.parseSiteCode(acc.global_accident_no);
      const siteName = acc.site_name || siteCode;
      siteAccidentCounts[siteName] = (siteAccidentCounts[siteName] || 0) + 1;
    });

    // 2. 재해자수 계산 (재해자 테이블 기준)
    const accidentTypeMap = new Map(accidents.map(acc => [acc.accident_id, acc.is_contractor]));
    const victimCount = {
      total: victimsData.length,
      employee: 0,
      contractor: 0
    };

    victimsData.forEach(victim => {
      const isContractor = accidentTypeMap.get(victim.accident_id) || false;
      if (isContractor) {
        victimCount.contractor++;
      } else {
        victimCount.employee++;
      }
    });

    // 2-1. 상해유형별 재해자수
    const injuryTypeCounts = {
      사망: 0,
      중상: 0,
      경상: 0,
      병원치료: 0,
      응급처치: 0,
      기타: 0
    };

    victimsData.forEach(victim => {
      switch (victim.injury_type) {
        case '사망': injuryTypeCounts.사망++; break;
        case '중상': injuryTypeCounts.중상++; break;
        case '경상': injuryTypeCounts.경상++; break;
        case '병원치료': injuryTypeCounts.병원치료++; break;
        case '응급처치': injuryTypeCounts.응급처치++; break;
        default: injuryTypeCounts.기타++; break;
      }
    });

    // 3. 물적피해 계산 (물적, 복합 사고만)
    const propertyDamage = {
      direct: 0,
      indirect: 0,
      total: 0
    };

    const materialAccidents = accidents.filter(acc => 
      acc.accident_type_level1 === '물적' || acc.accident_type_level1 === '복합'
    );
    const materialAccidentIds = new Set(materialAccidents.map(acc => acc.accident_id));

    propertyDamageData.forEach(damage => {
      if (materialAccidentIds.has(damage.accident_id)) {
        const amount = damage.estimated_cost || 0;
        propertyDamage.direct += amount;
      }
    });

    propertyDamage.indirect = propertyDamage.direct * 4;
    propertyDamage.total = propertyDamage.direct + propertyDamage.indirect;

    // 4. 연간근로시간 계산
    let totalWorkingHours = 0;
    let employeeWorkingHours = 0;
    let contractorWorkingHours = 0;

    workingHoursData.forEach(wh => {
      totalWorkingHours += wh.total_hours || 0;
      employeeWorkingHours += wh.employee_hours || 0;
      contractorWorkingHours += (wh.partner_on_hours || 0) + (wh.partner_off_hours || 0);
    });

    const workingHours = {
      total: totalWorkingHours,
      employee: employeeWorkingHours,
      contractor: contractorWorkingHours
    };

    // 5. LTIR 계산 (사망, 중상, 경상, 기타 재해자가 발생한 사고건)
    const ltirTypes = new Set(['사망', '중상', '경상', '기타']);
    const ltirAccidentIds = new Set();
    const ltirEmployeeAccidentIds = new Set();
    const ltirContractorAccidentIds = new Set();

    victimsData.forEach(victim => {
      if (ltirTypes.has(victim.injury_type)) {
        ltirAccidentIds.add(victim.accident_id);
        const isContractor = accidentTypeMap.get(victim.accident_id);
        if (isContractor) {
          ltirContractorAccidentIds.add(victim.accident_id);
        } else {
          ltirEmployeeAccidentIds.add(victim.accident_id);
        }
      }
    });

    // 6. TRIR 계산 (사망, 중상, 경상, 기타, 병원치료 재해자가 발생한 사고건)
    const trirTypes = new Set(['사망', '중상', '경상', '기타', '병원치료']);
    const trirAccidentIds = new Set();
    const trirEmployeeAccidentIds = new Set();
    const trirContractorAccidentIds = new Set();

    victimsData.forEach(victim => {
      if (trirTypes.has(victim.injury_type)) {
        trirAccidentIds.add(victim.accident_id);
        const isContractor = accidentTypeMap.get(victim.accident_id);
        if (isContractor) {
          trirContractorAccidentIds.add(victim.accident_id);
        } else {
          trirEmployeeAccidentIds.add(victim.accident_id);
        }
      }
    });

    // 7. 강도율 계산 (근로손실일수)
    const lossDays = { total: 0, employee: 0, contractor: 0 };

    // 조사보고서 재해자 데이터로 먼저 계산
    const processedVictims = new Set();
    investigationVictimsData.forEach(invVictim => {
      processedVictims.add(`${invVictim.accident_id}-${invVictim.victim_id}`);
      
      let days = 0;
      if (invVictim.injury_type === '사망') {
        days = 7500;
      } else {
        // 실제 근로손실일 계산
        if (invVictim.absence_start_date && invVictim.return_expected_date) {
          const startDate = new Date(invVictim.absence_start_date);
          const endDate = new Date(invVictim.return_expected_date);
          const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
          days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } else {
          // 현재일 - 사고발생일로 대체
          const accident = accidents.find(acc => acc.accident_id === invVictim.accident_id);
          if (accident) {
            const accidentDate = new Date(accident.acci_time);
            const currentDate = new Date();
            const diffTime = Math.abs(currentDate.getTime() - accidentDate.getTime());
            days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }
        }
      }

      lossDays.total += days;
      const isContractor = accidentTypeMap.get(invVictim.accident_id);
      if (isContractor) {
        lossDays.contractor += days;
      } else {
        lossDays.employee += days;
      }
    });

    // 발생보고서만 있는 재해자들 처리
    victimsData.forEach(victim => {
      const key = `${victim.accident_id}-${victim.victim_id}`;
      if (!processedVictims.has(key)) {
        let days = 0;
        if (victim.injury_type === '사망') {
          days = 7500;
        } else {
          if (victim.absence_start_date && victim.expected_return_date) {
            const startDate = new Date(victim.absence_start_date);
            const endDate = new Date(victim.expected_return_date);
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          } else {
            // 현재일 - 사고발생일로 대체
            const accident = accidents.find(acc => acc.accident_id === victim.accident_id);
            if (accident) {
              const accidentDate = new Date(accident.acci_time);
              const currentDate = new Date();
              const diffTime = Math.abs(currentDate.getTime() - accidentDate.getTime());
              days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
          }
        }

        lossDays.total += days;
        const isContractor = accidentTypeMap.get(victim.accident_id);
        if (isContractor) {
          lossDays.contractor += days;
        } else {
          lossDays.employee += days;
        }
      }
    });

    // 8. 지표 계산 (상수: 200,000)
    const constant = 200000;
    const calculateRate = (count: number, hours: number) => {
      if (hours === 0) return 0;
      return (count / hours) * constant;
    };

    const calculateSeverity = (days: number, hours: number) => {
      if (hours === 0) return 0;
      return (days / hours) * 1000;
    };

    return {
      year,
      accidentCount,
      victimCount,
      propertyDamage,
      workingHours,
      lossDays,
      injuryTypeCounts,
      siteAccidentCounts,
      ltirAccidentCounts: {
        total: ltirAccidentIds.size,
        employee: ltirEmployeeAccidentIds.size,
        contractor: ltirContractorAccidentIds.size
      },
      trirAccidentCounts: {
        total: trirAccidentIds.size,
        employee: trirEmployeeAccidentIds.size,
        contractor: trirContractorAccidentIds.size
      },
      ltir: {
        total: calculateRate(ltirAccidentIds.size, workingHours.total),
        employee: calculateRate(ltirEmployeeAccidentIds.size, workingHours.employee),
        contractor: calculateRate(ltirContractorAccidentIds.size, workingHours.contractor),
      },
      trir: {
        total: calculateRate(trirAccidentIds.size, workingHours.total),
        employee: calculateRate(trirEmployeeAccidentIds.size, workingHours.employee),
        contractor: calculateRate(trirContractorAccidentIds.size, workingHours.contractor),
      },
      severityRate: {
        total: calculateSeverity(lossDays.total, workingHours.total),
        employee: calculateSeverity(lossDays.employee, workingHours.employee),
        contractor: calculateSeverity(lossDays.contractor, workingHours.contractor),
      },
    };
  }

  static clearCache(): void {
    cache.clear();
    console.log('[LaggingGuidelineService] Cache cleared');
  }
}