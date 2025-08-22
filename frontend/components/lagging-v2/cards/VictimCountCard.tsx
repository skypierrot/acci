import React from 'react';
import { VictimCount, InjuryTypeCounts } from '../types';

interface Props {
  data: VictimCount;
  injuryTypes: InjuryTypeCounts;
  loading?: boolean;
}

export const VictimCountCard: React.FC<Props> = ({ data, injuryTypes, loading }) => {
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

  const injuryTypeLabels = {
    death: '사망',
    serious: '중상',
    minor: '경상',
    hospital: '병원치료',
    firstAid: '응급처치',
    other: '기타',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">재해자수</h3>
        <span className="text-2xl">🤕</span>
      </div>
      
      <div className="mb-4">
        <div className="text-3xl font-bold text-orange-600">{data.total}</div>
        <div className="text-sm text-gray-500">명</div>
      </div>

      <div className="space-y-2 border-t pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">임직원</span>
          <span className="font-medium">{data.employee}명</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">협력업체</span>
          <span className="font-medium">{data.contractor}명</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="text-xs font-semibold text-gray-700 mb-2">상해유형별</div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(injuryTypes).map(([key, value]) => (
            <div key={key} className="flex justify-between text-xs">
              <span className="text-gray-600">
                {injuryTypeLabels[key as keyof typeof injuryTypeLabels]}
              </span>
              <span className="font-medium">{value}명</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};