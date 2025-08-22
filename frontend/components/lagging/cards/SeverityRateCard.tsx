import React from 'react';
import { CalculationService } from '../services/calculation.service';

interface Props {
  data: {
    total: number;
    employee: number;
    contractor: number;
  };
  totalLossDays: number;
  lossDaysBreakdown: {
    total: number;
    employee: number;
    contractor: number;
  };
  loading?: boolean;
}

export const SeverityRateCard: React.FC<Props> = ({ data, totalLossDays, lossDaysBreakdown, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-24 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">강도율</h3>
        <span className="text-2xl">⚡</span>
      </div>
      
      <div className="mb-4">
        <div className="text-3xl font-bold text-indigo-600">
          {CalculationService.formatNumber(data.total, 2)}
        </div>
        <div className="text-sm text-gray-500">종합</div>
      </div>

      <div className="space-y-2 border-t pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">임직원</span>
          <span className="font-medium">
            {CalculationService.formatNumber(data.employee, 2)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">협력업체</span>
          <span className="font-medium">
            {CalculationService.formatNumber(data.contractor, 2)}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="text-xs text-gray-500">
          * 총 근로손실일수: {lossDaysBreakdown.total.toLocaleString()}일 
          (임직원 {lossDaysBreakdown.employee.toLocaleString()}일 + 협력업체 {lossDaysBreakdown.contractor.toLocaleString()}일)
          <br />
          * 계산: 근로손실일수 / 근로시간 × 1,000
        </div>
      </div>
    </div>
  );
};