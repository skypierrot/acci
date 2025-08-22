import React from 'react';
import { ConstantType } from '../types';
import { CalculationService } from '../services/calculation.service';

interface Props {
  data: {
    total: number;
    employee: number;
    contractor: number;
  };
  constant: ConstantType;
  onConstantChange: (value: ConstantType) => void;
  loading?: boolean;
}

export const LTIRCard: React.FC<Props> = ({ data, constant, onConstantChange, loading }) => {
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
        <h3 className="text-lg font-semibold text-gray-800">LTIR</h3>
        <div className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          <select
            value={constant}
            onChange={(e) => onConstantChange(Number(e.target.value) as ConstantType)}
            className="text-xs border rounded px-2 py-1"
          >
            <option value={200000}>20만시</option>
            <option value={1000000}>100만시</option>
          </select>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="text-3xl font-bold text-green-600">
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
          * Lost Time Injury Rate
          <br />
          * 기준: 사망, 중상, 경상, 기타
        </div>
      </div>
    </div>
  );
};