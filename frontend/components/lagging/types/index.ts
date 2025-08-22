export interface AccidentCount {
  total: number;
  employee: number;
  contractor: number;
}

export interface VictimCount {
  total: number;
  employee: number;
  contractor: number;
}

export interface PropertyDamage {
  direct: number;
  indirect: number;
  total: number;
}

export interface WorkingHours {
  total: number;
  employee: number;
  contractor: number;
}

export interface LossDays {
  total: number;
  employee: number;
  contractor: number;
}

export interface InjuryTypeCounts {
  death: number;
  serious: number;
  minor: number;
  hospital: number;
  firstAid: number;
  other: number;
}

export interface SiteAccidentCounts {
  [siteName: string]: number;
}

export interface LaggingSummary {
  year: number;
  accidentCount: AccidentCount;
  victimCount: VictimCount;
  propertyDamage: PropertyDamage;
  workingHours: WorkingHours;
  lossDays: LossDays;
  injuryTypeCounts: InjuryTypeCounts;
  siteAccidentCounts: SiteAccidentCounts;
  ltir: {
    total: number;
    employee: number;
    contractor: number;
  };
  trir: {
    total: number;
    employee: number;
    contractor: number;
  };
  severityRate: {
    total: number;
    employee: number;
    contractor: number;
  };
}

export interface ChartDataPoint {
  year: number;
  value: number;
}

export interface TrendChartData {
  year: number;
  accidentCount: number;
  victimCount: number;
  propertyDamage: number;
}

export interface SafetyIndexChartData {
  year: number;
  ltir: number;
  trir: number;
  severityRate: number;
}

export interface DetailedChartData {
  year: number;
  total: number;
  employee: number;
  contractor: number;
  bysite?: SiteAccidentCounts;
}

export type ChartType = 'basic' | 'detailed';
export type ConstantType = 200000 | 1000000;