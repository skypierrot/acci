import React from 'react';
import { ChartType } from '../types';

interface Props {
  chartType: ChartType;
  onChange: (type: ChartType) => void;
}

export const ChartTypeSelector: React.FC<Props> = ({ chartType, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">차트 타입:</label>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
        <div className="flex space-x-1">
          <button
            onClick={() => onChange('basic')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              chartType === 'basic'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            기본 차트
          </button>
          <button
            onClick={() => onChange('detailed')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              chartType === 'detailed'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            상세 차트
          </button>
        </div>
      </div>
    </div>
  );
};