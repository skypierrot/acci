import { ConstantType, LaggingSummary } from '../types';

export class CalculationService {
  static calculateLTIR(
    accidentCount: number,
    workingHours: number,
    constant: ConstantType = 200000
  ): number {
    if (workingHours === 0) return 0;
    return (accidentCount / workingHours) * constant;
  }

  static calculateTRIR(
    accidentCount: number,
    workingHours: number,
    constant: ConstantType = 200000
  ): number {
    if (workingHours === 0) return 0;
    return (accidentCount / workingHours) * constant;
  }

  static calculateSeverityRate(
    lossDays: number,
    workingHours: number
  ): number {
    if (workingHours === 0) return 0;
    return (lossDays / workingHours) * 1000;
  }

  static calculateIndirectDamage(directDamage: number): number {
    return directDamage * 4;
  }

  static recalculateIndices(
    summary: LaggingSummary,
    constant: ConstantType
  ): LaggingSummary {
    console.log('[CalculationService] Input summary:', summary);
    console.log('[CalculationService] Constant:', constant);
    
    // Backend provides values based on 200,000 (20만시) constant
    // For 1,000,000 (100만시), multiply by 5 since 1,000,000 / 200,000 = 5
    const ratio = constant === 200000 ? 1 : (constant / 200000);
    
    console.log('[CalculationService] Ratio:', ratio);

    return {
      ...summary,
      ltir: {
        total: summary.ltir.total * ratio,
        employee: summary.ltir.employee * ratio,
        contractor: summary.ltir.contractor * ratio,
      },
      trir: {
        total: summary.trir.total * ratio,
        employee: summary.trir.employee * ratio,
        contractor: summary.trir.contractor * ratio,
      },
      severityRate: summary.severityRate, // Severity rate doesn't change with constant
    };
  }

  private static getLTIRAccidentCounts(summary: LaggingSummary) {
    console.log('[CalculationService] getLTIRAccidentCounts - injuryTypeCounts:', summary.injuryTypeCounts);
    
    const ltirInjuries = 
      (summary.injuryTypeCounts?.death || 0) +
      (summary.injuryTypeCounts?.serious || 0) +
      (summary.injuryTypeCounts?.minor || 0) +
      (summary.injuryTypeCounts?.other || 0);

    const ratio = summary.accidentCount.total > 0 
      ? ltirInjuries / summary.victimCount.total 
      : 0;

    return {
      total: Math.round(summary.accidentCount.total * ratio),
      employee: Math.round(summary.accidentCount.employee * ratio),
      contractor: Math.round(summary.accidentCount.contractor * ratio),
    };
  }

  private static getTRIRAccidentCounts(summary: LaggingSummary) {
    console.log('[CalculationService] getTRIRAccidentCounts - injuryTypeCounts:', summary.injuryTypeCounts);
    
    const trirInjuries = 
      (summary.injuryTypeCounts?.death || 0) +
      (summary.injuryTypeCounts?.serious || 0) +
      (summary.injuryTypeCounts?.minor || 0) +
      (summary.injuryTypeCounts?.hospital || 0) +
      (summary.injuryTypeCounts?.other || 0);

    const ratio = summary.accidentCount.total > 0 
      ? trirInjuries / summary.victimCount.total 
      : 0;

    return {
      total: Math.round(summary.accidentCount.total * ratio),
      employee: Math.round(summary.accidentCount.employee * ratio),
      contractor: Math.round(summary.accidentCount.contractor * ratio),
    };
  }

  static formatNumber(value: number, decimals: number = 2): string {
    if (isNaN(value)) return '0';
    return value.toFixed(decimals);
  }

  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
}