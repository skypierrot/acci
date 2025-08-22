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

export const TRIRCard: React.FC<Props> = ({ data, constant, onConstantChange, loading }) => {
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
        <h3 className="text-lg font-semibold text-gray-800">TRIR</h3>
        <button
          onClick={() => onConstantChange(constant === 200000 ? 1000000 : 200000)}
          className="flex items-center justify-center w-10 h-10 bg-purple-100 hover:bg-purple-200 rounded-full border-2 border-purple-300 transition-colors cursor-pointer group"
          title={`현재: ${constant === 200000 ? '20만시' : '100만시'} (클릭하여 변경)`}
        >
          <div className="text-xs font-semibold text-purple-700 text-center leading-tight">
            <div>{constant === 200000 ? '20' : '100'}</div>
            <div className="text-xs">만시</div>
          </div>
        </button>
      </div>
      
      <div className="mb-4">
        <div className="text-3xl font-bold text-purple-600">
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
          * Total Recordable Injury Rate
          <br />
          * 기준: 사망, 중상, 경상, 병원치료, 기타
        </div>
      </div>
    </div>
  );
};