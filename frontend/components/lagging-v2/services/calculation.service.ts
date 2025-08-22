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
    const ltirAccidentCounts = this.getLTIRAccidentCounts(summary);
    const trirAccidentCounts = this.getTRIRAccidentCounts(summary);

    return {
      ...summary,
      ltir: {
        total: this.calculateLTIR(ltirAccidentCounts.total, summary.workingHours.total, constant),
        employee: this.calculateLTIR(ltirAccidentCounts.employee, summary.workingHours.employee, constant),
        contractor: this.calculateLTIR(ltirAccidentCounts.contractor, summary.workingHours.contractor, constant),
      },
      trir: {
        total: this.calculateTRIR(trirAccidentCounts.total, summary.workingHours.total, constant),
        employee: this.calculateTRIR(trirAccidentCounts.employee, summary.workingHours.employee, constant),
        contractor: this.calculateTRIR(trirAccidentCounts.contractor, summary.workingHours.contractor, constant),
      },
    };
  }

  private static getLTIRAccidentCounts(summary: LaggingSummary) {
    const ltirInjuries = 
      summary.injuryTypeCounts.death +
      summary.injuryTypeCounts.serious +
      summary.injuryTypeCounts.minor +
      summary.injuryTypeCounts.other;

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
    const trirInjuries = 
      summary.injuryTypeCounts.death +
      summary.injuryTypeCounts.serious +
      summary.injuryTypeCounts.minor +
      summary.injuryTypeCounts.hospital +
      summary.injuryTypeCounts.other;

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