/**
 * @file services/lagging-v2.service.ts
 * @description
 *  - Refactored Lagging service with correct calculations according to guideline
 *  - Properly parses accident codes (HHH-AA-YYYY-NNN format)
 *  - Correct LTIR/TRIR constants (200,000 default)
 *  - Accurate loss days calculation
 */

import { db, tables } from "../orm/index";
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

export default class LaggingService {
  /**
   * Parse accident year from global accident code
   * 유연한 형식: [회사코드]-[사업장코드]-[연도]-[순번] 또는 [회사코드]-[연도]-[순번]
   */
  private static parseAccidentYear(globalAccidentNo: string): number | null {
    if (!globalAccidentNo) return null;
    
    const yearMatch = globalAccidentNo.match(/(\d{4})/);
    if (!yearMatch) return null;
    
    const year = parseInt(yearMatch[1], 10);
    // 유효한 연도 범위 체크 (1900-2100)
    return (year >= 1900 && year <= 2100) ? year : null;
  }

  /**
   * Parse site code from global accident code
   * 유연한 형식: [회사코드]-[사업장코드]-[연도]-[순번]에서 사업장코드 추출
   * 회사코드-연도-순번 형식인 경우 '미지정' 반환
   */
  private static parseSiteCode(globalAccidentNo: string): string {
    if (!globalAccidentNo) return '미지정';
    
    const parts = globalAccidentNo.split('-');
    if (parts.length === 4 && /^\d{4}$/.test(parts[2])) {
      // [회사코드]-[사업장코드]-[연도]-[순번] 형식
      return parts[1];
    } else if (parts.length === 3 && /^\d{4}$/.test(parts[1])) {
      // [회사코드]-[연도]-[순번] 형식 (사업장코드 없음)
      return '미지정';
    }
    
    return '미지정';
  }

  /**
   * Smart victim matching: name-based matching first, then index-based fallback
   * 이름 기반 매칭을 먼저 시도하고, 매칭되지 않은 경우 순서로 보완
   */
  private static smartVictimMatching(
    victimsData: any[], 
    investigationVictimsData: any[]
  ) {
    // Group victims by accident_id
    const victimsByAccident = new Map<string, any[]>();
    const investigationVictimsByAccident = new Map<string, any[]>();
    
    victimsData.forEach(victim => {
      if (!victimsByAccident.has(victim.accident_id)) {
        victimsByAccident.set(victim.accident_id, []);
      }
      victimsByAccident.get(victim.accident_id)!.push(victim);
    });

    investigationVictimsData.forEach(invVictim => {
      if (!investigationVictimsByAccident.has(invVictim.accident_id)) {
        investigationVictimsByAccident.set(invVictim.accident_id, []);
      }
      investigationVictimsByAccident.get(invVictim.accident_id)!.push(invVictim);
    });

    const mergedVictims: any[] = [];
    let victimCount = {
      total: 0,
      employee: 0,
      contractor: 0
    };

    // Process each accident separately
    for (const [accidentId, occVictims] of victimsByAccident) {
      const invVictims = investigationVictimsByAccident.get(accidentId) || [];
      
      // Sort victims by victim_id to ensure consistent ordering
      const sortedOccVictims = [...occVictims].sort((a, b) => a.victim_id - b.victim_id);
      const sortedInvVictims = [...invVictims].sort((a, b) => a.victim_id - b.victim_id);
      
      const matchedInvVictims = new Set<number>();
      const processedVictims: any[] = [];

      // Step 1: Name-based matching
      sortedOccVictims.forEach((occVictim, index) => {
        const matchedInvVictim = sortedInvVictims.find((invVictim, invIndex) => 
          !matchedInvVictims.has(invIndex) && 
          occVictim.name && invVictim.name && 
          occVictim.name === invVictim.name
        );

        if (matchedInvVictim) {
          const invIndex = sortedInvVictims.findIndex(v => v === matchedInvVictim);
          matchedInvVictims.add(invIndex);
          
          // Use investigation data with occurrence as fallback
          const mergedVictim = {
            ...occVictim,
            ...matchedInvVictim,
            uniqueKey: `${accidentId}-${index}`,
            source: 'investigation_priority'
          };
          processedVictims.push(mergedVictim);
        } else {
          // No name match found, use occurrence data
          const mergedVictim = {
            ...occVictim,
            uniqueKey: `${accidentId}-${index}`,
            source: 'occurrence_only'
          };
          processedVictims.push(mergedVictim);
        }
      });

      // Step 2: Handle remaining investigation victims (순서 기반 매칭)
      sortedInvVictims.forEach((invVictim, invIndex) => {
        if (!matchedInvVictims.has(invIndex)) {
          // Try to match by index with unmatched occurrence victims
          const occIndex = invIndex;
          if (occIndex < processedVictims.length && processedVictims[occIndex].source === 'occurrence_only') {
            // Update the occurrence-only victim with investigation data
            processedVictims[occIndex] = {
              ...processedVictims[occIndex],
              ...invVictim,
              source: 'investigation_priority'
            };
          } else {
            // New victim only in investigation
            const mergedVictim = {
              ...invVictim,
              uniqueKey: `${accidentId}-${processedVictims.length}`,
              source: 'investigation_only'
            };
            processedVictims.push(mergedVictim);
          }
        }
      });

      mergedVictims.push(...processedVictims);
    }

    // Calculate victim counts from merged data
    mergedVictims.forEach(victim => {
      victimCount.total++;
      if (victim.victim_is_contractor) {
        victimCount.contractor++;
      } else {
        victimCount.employee++;
      }
    });

    return { mergedVictims, victimCount };
  }

  /**
   * Get summary by year with correct calculations
   */
  static async getSummaryByYear(year: number) {
    const cacheKey = generateCacheKey('lagging_v2_summary', { year });
    const cached = getFromCache(cacheKey);
    if (cached) {
      console.log(`[LaggingService] Cache hit for year ${year}`);
      return cached;
    }

    console.log(`[LaggingService] Calculating summary for year ${year}`);

    try {
      // 1. Fetch accidents by year using accident code pattern
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

      console.log(`[LaggingService] Found ${accidentsQuery.length} accidents for year ${year}`);

      // 2. Get victim data
      const accidentIds = accidentsQuery.map(acc => acc.accident_id);
      const victimsQuery = accidentIds.length > 0
        ? await db()
            .select({
              accident_id: victims.accident_id,
              victim_id: victims.victim_id,
              name: victims.name,
              injury_type: victims.injury_type,
              belong: victims.belong,
              victim_is_contractor: victims.victim_is_contractor,
            })
            .from(victims)
            .where(inArray(victims.accident_id, accidentIds))
        : [];

      // 3. Get property damage data
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

      // 4. Get working hours
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

      // 5. Get investigation victims data for loss days calculation
      const investigationVictimsQuery = accidentIds.length > 0
        ? await db()
            .select({
              accident_id: investigationVictims.accident_id,
              victim_id: investigationVictims.victim_id,
              name: investigationVictims.name,
              injury_type: investigationVictims.injury_type,
              absence_start_date: investigationVictims.absence_start_date,
              return_expected_date: investigationVictims.return_expected_date,
              victim_is_contractor: investigationVictims.victim_is_contractor,
            })
            .from(investigationVictims)
            .where(inArray(investigationVictims.accident_id, accidentIds))
        : [];

      // Calculate summary
      const summary = this.calculateSummary(
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
      console.error(`[LaggingService] Error calculating summary:`, error);
      throw error;
    }
  }

  private static calculateSummary(
    year: number,
    accidents: any[],
    victimsData: any[],
    propertyDamageData: any[],
    workingHoursData: any[],
    investigationVictimsData: any[]
  ) {
    // Calculate accident counts (가이드라인: 모든 사고 포함)
    const accidentCount = {
      total: accidents.length,
      employee: accidents.filter(acc => !acc.is_contractor).length,
      contractor: accidents.filter(acc => acc.is_contractor).length
    };

    // Calculate site accident counts
    const siteAccidentCounts: Record<string, number> = {};
    accidents.forEach(acc => {
      const siteCode = this.parseSiteCode(acc.global_accident_no);
      const siteName = acc.site_name || siteCode;
      siteAccidentCounts[siteName] = (siteAccidentCounts[siteName] || 0) + 1;
    });

    // Smart victim matching: name-based matching first, then index-based fallback
    const { mergedVictims, victimCount } = this.smartVictimMatching(
      victimsData,
      investigationVictimsData
    );

    console.log(`[LaggingService] Smart matching results: ${mergedVictims.length} merged victims`);

    // 재해자별 소속 정보 Map 생성 (merged victims 기준)
    const victimContractorMap = new Map();
    mergedVictims.forEach(victim => {
      const key = victim.uniqueKey;
      victimContractorMap.set(key, victim.victim_is_contractor);
    });

    // Calculate injury type counts (가이드라인 형식에 맞게)
    const injuryTypeCounts = {
      사망: 0,
      중상: 0,
      경상: 0,
      병원치료: 0,
      응급처치: 0,
      기타: 0
    };

    mergedVictims.forEach(victim => {
      const injuryType = victim.injury_type;
      if (injuryType.includes('사망')) {
        injuryTypeCounts.사망++;
      } else if (injuryType.includes('중상')) {
        injuryTypeCounts.중상++;
      } else if (injuryType.includes('경상')) {
        injuryTypeCounts.경상++;
      } else if (injuryType.includes('병원치료')) {
        injuryTypeCounts.병원치료++;
      } else if (injuryType.includes('응급처치')) {
        injuryTypeCounts.응급처치++;
      } else {
        injuryTypeCounts.기타++;
      }
    });

    // Calculate property damage
    const propertyDamage = {
      direct: 0,
      indirect: 0,
      total: 0
    };

    // Only include property damage from material and complex accidents
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

    // Calculate working hours
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

    // Calculate LTIR/TRIR accident counts and loss days (가이드라인 기준)
    const ltirTypes = new Set(['사망', '중상', '경상', '기타']);
    const trirTypes = new Set(['사망', '중상', '경상', '병원치료', '기타']);

    const ltirAccidentIds = new Set();
    const ltirEmployeeAccidentIds = new Set();
    const ltirContractorAccidentIds = new Set();
    const trirAccidentIds = new Set();
    const trirEmployeeAccidentIds = new Set();
    const trirContractorAccidentIds = new Set();
    const lossDays = { total: 0, employee: 0, contractor: 0 };

    // LTIR/TRIR은 사고 건수 기준으로 계산 (사고의 is_contractor 사용)
    const accidentTypeMap = new Map(accidents.map(acc => [acc.accident_id, acc.is_contractor]));
    
    mergedVictims.forEach(victim => {
      const isContractor = accidentTypeMap.get(victim.accident_id) || false;
      const injuryType = victim.injury_type;
      
      // Check if injury type matches LTIR criteria (부분 문자열 매칭)
      const isLTIR = injuryType.includes('사망') || 
                     injuryType.includes('중상') || 
                     injuryType.includes('경상') || 
                     injuryType.includes('기타');
      
      if (isLTIR) {
        ltirAccidentIds.add(victim.accident_id);
        if (isContractor) {
          ltirContractorAccidentIds.add(victim.accident_id);
        } else {
          ltirEmployeeAccidentIds.add(victim.accident_id);
        }
      }

      // Check if injury type matches TRIR criteria (부분 문자열 매칭)
      const isTRIR = injuryType.includes('사망') || 
                     injuryType.includes('중상') || 
                     injuryType.includes('경상') || 
                     injuryType.includes('병원치료') ||
                     injuryType.includes('기타');
      
      if (isTRIR) {
        trirAccidentIds.add(victim.accident_id);
        if (isContractor) {
          trirContractorAccidentIds.add(victim.accident_id);
        } else {
          trirEmployeeAccidentIds.add(victim.accident_id);
        }
      }
    });

    // 강도율 계산 - 스마트 매칭된 재해자 데이터 사용
    mergedVictims.forEach(victim => {
      let days = 0;
      
      if (victim.injury_type === '사망') {
        days = 7500;
      } else {
        // 조사보고서 데이터가 있는 경우 (absence_start_date, return_expected_date)
        if (victim.absence_start_date && victim.return_expected_date) {
          const startDate = new Date(victim.absence_start_date);
          const endDate = new Date(victim.return_expected_date);
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
      if (victim.victim_is_contractor) {
        lossDays.contractor += days;
      } else {
        lossDays.employee += days;
      }
    });


    // Calculate indices with 200,000 constant
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
        contractor: ltirContractorAccidentIds.size,
      },
      trirAccidentCounts: {
        total: trirAccidentIds.size,
        employee: trirEmployeeAccidentIds.size,
        contractor: trirContractorAccidentIds.size,
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

  /**
   * 대시보드용 간소화된 지표 계산 (메인 지표만)
   */
  static async getDashboardSummary(year: number) {
    const cacheKey = generateCacheKey('dashboard', { year });
    const cached = getFromCache(cacheKey);
    if (cached) {
      console.log(`[LaggingService] Dashboard cache hit for year ${year}`);
      return cached;
    }

    console.log(`[LaggingService] Dashboard 계산 시작: ${year}년`);
    
    // 전체 지표를 계산하되, 필요한 정보만 추출
    const fullSummary = await this.getSummaryByYear(year);
    
    // 대시보드에 필요한 메인 지표만 추출
    const dashboardSummary = {
      year,
      accidentCount: fullSummary.accidentCount.total,
      employeeAccidentCount: fullSummary.accidentCount.employee,
      contractorAccidentCount: fullSummary.accidentCount.contractor,
      victimCount: fullSummary.victimCount.total,
      employeeVictimCount: fullSummary.victimCount.employee,
      contractorVictimCount: fullSummary.victimCount.contractor,
      directDamageAmount: fullSummary.propertyDamage.direct, // 직접피해만
      indirectDamageAmount: fullSummary.propertyDamage.indirect, // 간접피해만 (이미 직접피해 x 4로 계산됨)
      ltir: fullSummary.ltir.total,
      trir: fullSummary.trir.total,
      severityRate: fullSummary.severityRate.total,
      totalLossDays: fullSummary.lossDays.total
    };

    setCache(cacheKey, dashboardSummary);
    console.log(`[LaggingService] Dashboard 계산 완료: ${year}년`);
    
    return dashboardSummary;
  }

  static clearCache(): void {
    cache.clear();
    console.log('[LaggingService] Cache cleared');
  }
}