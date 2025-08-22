import { LaggingSummary } from '../types';

export class LaggingApiService {
  private static baseUrl = '/api/lagging/v2';

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
      const response = await fetch('/api/occurrence?page=1&limit=10000');
      if (!response.ok) {
        throw new Error(`Failed to fetch occurrence reports: ${response.statusText}`);
      }
      
      const data = await response.json();
      const reports = data.reports || [];
      
      const years = new Set<number>();
      reports.forEach((report: any) => {
        if (report.global_accident_no) {
          const match = report.global_accident_no.match(/^[A-Z]{3}-[A-Z]{2}-(\d{4})-\d{3}$/);
          if (match) {
            years.add(parseInt(match[1], 10));
          }
        }
      });
      
      return Array.from(years).sort((a, b) => b - a);
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
        direct: data.propertyDamage?.direct || 0,
        indirect: data.propertyDamage?.indirect || 0,
        total: data.propertyDamage?.total || 0,
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
        total: data.ltir || 0,
        employee: data.employeeLtir || 0,
        contractor: data.contractorLtir || 0,
      },
      trir: {
        total: data.trir || 0,
        employee: data.employeeTrir || 0,
        contractor: data.contractorTrir || 0,
      },
      severityRate: {
        total: data.severityRate || 0,
        employee: data.employeeSeverityRate || 0,
        contractor: data.contractorSeverityRate || 0,
      },
    };
  }
}