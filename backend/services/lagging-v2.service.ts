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

export default class LaggingV2Service {
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
   * Get summary by year with correct calculations
   */
  static async getSummaryByYear(year: number) {
    const cacheKey = generateCacheKey('lagging_v2_summary', { year });
    const cached = getFromCache(cacheKey);
    if (cached) {
      console.log(`[LaggingV2Service] Cache hit for year ${year}`);
      return cached;
    }

    console.log(`[LaggingV2Service] Calculating summary for year ${year}`);

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

      console.log(`[LaggingV2Service] Found ${accidentsQuery.length} accidents for year ${year}`);

      // 2. Get victim data
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

      // 5. Get investigation data for loss days calculation
      const investigationQuery = accidentIds.length > 0
        ? await db()
            .select({
              accident_id: investigationReport.accident_id,
              victim_id: investigationReport.victim_id,
              absence_start_date: investigationReport.absence_start_date,
              expected_return_date: investigationReport.expected_return_date,
            })
            .from(investigationReport)
            .where(inArray(investigationReport.accident_id, accidentIds))
        : [];

      // Calculate summary
      const summary = this.calculateSummary(
        year,
        accidentsQuery,
        victimsQuery,
        propertyDamageQuery,
        workingHoursQuery,
        investigationQuery
      );

      setCache(cacheKey, summary);
      return summary;

    } catch (error) {
      console.error(`[LaggingV2Service] Error calculating summary:`, error);
      throw error;
    }
  }

  private static calculateSummary(
    year: number,
    accidents: any[],
    victimsData: any[],
    propertyDamageData: any[],
    workingHoursData: any[],
    investigationData: any[]
  ) {
    // Filter human/complex accidents only
    const humanAccidents = accidents.filter(acc => 
      acc.accident_type_level1 === '인적' || acc.accident_type_level1 === '복합'
    );

    // Calculate accident counts
    const accidentCount = {
      total: humanAccidents.length,
      employee: humanAccidents.filter(acc => !acc.is_contractor).length,
      contractor: humanAccidents.filter(acc => acc.is_contractor).length
    };

    // Calculate site accident counts
    const siteAccidentCounts: Record<string, number> = {};
    accidents.forEach(acc => {
      const siteCode = this.parseSiteCode(acc.global_accident_no);
      const siteName = acc.site_name || siteCode;
      siteAccidentCounts[siteName] = (siteAccidentCounts[siteName] || 0) + 1;
    });

    // Filter victims for human/complex accidents
    const humanAccidentIds = new Set(humanAccidents.map(acc => acc.accident_id));
    const humanVictims = victimsData.filter(v => humanAccidentIds.has(v.accident_id));

    // Calculate victim counts
    const accidentTypeMap = new Map(humanAccidents.map(acc => [acc.accident_id, acc.is_contractor]));
    const victimCount = {
      total: humanVictims.length,
      employee: 0,
      contractor: 0
    };

    humanVictims.forEach(victim => {
      const isContractor = accidentTypeMap.get(victim.accident_id) || false;
      if (isContractor) {
        victimCount.contractor++;
      } else {
        victimCount.employee++;
      }
    });

    // Calculate injury type counts
    const injuryTypeCounts = {
      death: 0,
      serious: 0,
      minor: 0,
      hospital: 0,
      firstAid: 0,
      other: 0
    };

    humanVictims.forEach(victim => {
      switch (victim.injury_type) {
        case '사망': injuryTypeCounts.death++; break;
        case '중상': injuryTypeCounts.serious++; break;
        case '경상': injuryTypeCounts.minor++; break;
        case '병원치료': injuryTypeCounts.hospital++; break;
        case '응급처치': injuryTypeCounts.firstAid++; break;
        default: injuryTypeCounts.other++; break;
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

    // Calculate LTIR/TRIR accident counts and loss days
    const ltirTypes = new Set(['사망', '중상', '경상', '기타']);
    const trirTypes = new Set(['사망', '중상', '경상', '병원치료', '기타']);

    const ltirAccidentCounts = { total: 0, employee: 0, contractor: 0 };
    const trirAccidentCounts = { total: 0, employee: 0, contractor: 0 };
    const lossDays = { total: 0, employee: 0, contractor: 0 };

    // Process each accident
    humanAccidents.forEach(accident => {
      const accidentVictims = humanVictims.filter(v => v.accident_id === accident.accident_id);
      
      let hasLtirInjury = false;
      let hasTrirInjury = false;
      let accidentLossDays = 0;

      accidentVictims.forEach(victim => {
        // Check LTIR/TRIR
        if (ltirTypes.has(victim.injury_type)) hasLtirInjury = true;
        if (trirTypes.has(victim.injury_type)) hasTrirInjury = true;

        // Calculate loss days
        if (victim.injury_type === '사망') {
          accidentLossDays += 7500;
        } else {
          // Try to get actual loss days from investigation data
          const investigation = investigationData.find(inv => 
            inv.accident_id === victim.accident_id && inv.victim_id === victim.victim_id
          );

          let startDate = investigation?.absence_start_date || victim.absence_start_date;
          let returnDate = investigation?.expected_return_date || victim.expected_return_date;

          if (startDate && returnDate) {
            const start = new Date(startDate);
            const end = new Date(returnDate);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            accidentLossDays += diffDays;
          } else {
            // Fallback to accident date to today
            const accidentDate = new Date(accident.acci_time);
            const today = new Date();
            const diffTime = Math.abs(today.getTime() - accidentDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            accidentLossDays += Math.min(diffDays, 180); // Cap at 180 days
          }
        }
      });

      // Update counts
      if (hasLtirInjury) {
        ltirAccidentCounts.total++;
        if (accident.is_contractor) {
          ltirAccidentCounts.contractor++;
        } else {
          ltirAccidentCounts.employee++;
        }
      }

      if (hasTrirInjury) {
        trirAccidentCounts.total++;
        if (accident.is_contractor) {
          trirAccidentCounts.contractor++;
        } else {
          trirAccidentCounts.employee++;
        }
      }

      // Update loss days
      lossDays.total += accidentLossDays;
      if (accident.is_contractor) {
        lossDays.contractor += accidentLossDays;
      } else {
        lossDays.employee += accidentLossDays;
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
      ltirAccidentCounts,
      trirAccidentCounts,
      ltir: calculateRate(ltirAccidentCounts.total, workingHours.total),
      trir: calculateRate(trirAccidentCounts.total, workingHours.total),
      severityRate: calculateSeverity(lossDays.total, workingHours.total),
      employeeLtir: calculateRate(ltirAccidentCounts.employee, workingHours.employee),
      contractorLtir: calculateRate(ltirAccidentCounts.contractor, workingHours.contractor),
      employeeTrir: calculateRate(trirAccidentCounts.employee, workingHours.employee),
      contractorTrir: calculateRate(trirAccidentCounts.contractor, workingHours.contractor),
      employeeSeverityRate: calculateSeverity(lossDays.employee, workingHours.employee),
      contractorSeverityRate: calculateSeverity(lossDays.contractor, workingHours.contractor),
    };
  }

  static clearCache(): void {
    cache.clear();
    console.log('[LaggingV2Service] Cache cleared');
  }
}