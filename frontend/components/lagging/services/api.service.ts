import { LaggingSummary } from '../types';

export class LaggingApiService {
  private static baseUrl = '/api/lagging';

  static async fetchSummaryByYear(year: number): Promise<LaggingSummary> {
    try {
      const response = await fetch(`${this.baseUrl}/summary/${year}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch summary for year ${year}: ${response.statusText}`);
      }
      const data = await response.json();
      return this.transformSummaryData(data, year);
    } catch (error) {
      console.error('[LaggingApiService] Error fetching summary:', error);
      throw error;
    }
  }

  static async fetchMultiYearSummaries(years: number[]): Promise<LaggingSummary[]> {
    try {
      const promises = years.map(year => this.fetchSummaryByYear(year));
      return await Promise.all(promises);
    } catch (error) {
      console.error('[LaggingApiService] Error fetching multi-year summaries:', error);
      throw error;
    }
  }

  static async fetchAvailableYears(): Promise<number[]> {
    try {
      console.log('[LaggingApiService] Fetching occurrence reports...');
      const response = await fetch('/api/occurrence?page=1&limit=10000');
      if (!response.ok) {
        throw new Error(`Failed to fetch occurrence reports: ${response.statusText}`);
      }
      
      const data = await response.json();
      const reports = data.reports || [];
      console.log('[LaggingApiService] Total reports:', reports.length);
      
      const years = new Set<number>();
      reports.forEach((report: any, index: number) => {
        if (report.global_accident_no) {
          // 유연한 형식 지원: [회사코드]-[사업장코드]-[연도]-[순번] 또는 [회사코드]-[연도]-[순번]
          // 연도(4자리 숫자)를 찾아서 추출
          const yearMatch = report.global_accident_no.match(/(\d{4})/);
          if (yearMatch) {
            const year = parseInt(yearMatch[1], 10);
            // 유효한 연도 범위 체크 (1900-2100)
            if (year >= 1900 && year <= 2100) {
              years.add(year);
              if (index < 5) { // Log first 5 for debugging
                console.log(`[LaggingApiService] Code: ${report.global_accident_no} -> Year: ${year}`);
              }
            }
          } else if (index < 5) {
            console.log(`[LaggingApiService] No year match for: ${report.global_accident_no}`);
          }
        }
      });
      
      const yearArray = Array.from(years).sort((a, b) => b - a);
      console.log('[LaggingApiService] Extracted years:', yearArray);
      return yearArray;
    } catch (error) {
      console.error('[LaggingApiService] Error fetching available years:', error);
      throw error;
    }
  }

  private static transformSummaryData(data: any, year: number): LaggingSummary {
    const injuryTypeCounts = {
      death: data.injuryTypeCounts?.['사망'] || 0,
      serious: data.injuryTypeCounts?.['중상'] || 0,
      minor: data.injuryTypeCounts?.['경상'] || 0,
      hospital: data.injuryTypeCounts?.['병원치료'] || 0,
      firstAid: data.injuryTypeCounts?.['응급처치'] || 0,
      other: data.injuryTypeCounts?.['기타'] || 0,
    };

    return {
      year,
      accidentCount: {
        total: data.accidentCount?.total || 0,
        employee: data.accidentCount?.employee || 0,
        contractor: data.accidentCount?.contractor || 0,
      },
      victimCount: {
        total: data.victimCount?.total || 0,
        employee: data.victimCount?.employee || 0,
        contractor: data.victimCount?.contractor || 0,
      },
      propertyDamage: {
        direct: (data.propertyDamage?.direct || 0) * 1000, // 천원 → 원 변환
        indirect: (data.propertyDamage?.indirect || 0) * 1000, // 천원 → 원 변환
        total: (data.propertyDamage?.total || 0) * 1000, // 천원 → 원 변환
      },
      workingHours: {
        total: data.workingHours?.total || 0,
        employee: data.workingHours?.employee || 0,
        contractor: data.workingHours?.contractor || 0,
      },
      lossDays: {
        total: data.lossDays?.total || 0,
        employee: data.lossDays?.employee || 0,
        contractor: data.lossDays?.contractor || 0,
      },
      injuryTypeCounts,
      siteAccidentCounts: data.siteAccidentCounts || {},
      ltir: {
        total: data.ltir?.total || data.ltir || 0,
        employee: data.ltir?.employee || data.employeeLtir || 0,
        contractor: data.ltir?.contractor || data.contractorLtir || 0,
      },
      trir: {
        total: data.trir?.total || data.trir || 0,
        employee: data.trir?.employee || data.employeeTrir || 0,
        contractor: data.trir?.contractor || data.contractorTrir || 0,
      },
      severityRate: {
        total: data.severityRate?.total || data.severityRate || 0,
        employee: data.severityRate?.employee || data.employeeSeverityRate || 0,
        contractor: data.severityRate?.contractor || data.contractorSeverityRate || 0,
      },
    };
  }
}