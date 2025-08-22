import React from 'react';
import { AccidentCount, SiteAccidentCounts } from '../types';

interface Props {
  data: AccidentCount;
  siteData: SiteAccidentCounts;
  loading?: boolean;
}

export const AccidentCountCard: React.FC<Props> = ({ data, siteData, loading }) => {
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
        <h3 className="text-lg font-semibold text-gray-800">사고건수</h3>
        <span className="text-2xl">🚨</span>
      </div>
      
      <div className="mb-4">
        <div className="text-3xl font-bold text-blue-600">{data.total}건</div>
        <div className="text-sm text-gray-500">총 사고건수</div>
      </div>

      <div className="space-y-2 border-t pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">임직원</span>
          <span className="font-medium">{data.employee}건</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">협력업체</span>
          <span className="font-medium">{data.contractor}건</span>
        </div>
      </div>

      {Object.keys(siteData).length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="text-xs font-semibold text-gray-700 mb-2">사업장별</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 max-h-32 overflow-y-auto">
            {Object.entries(siteData)
              .sort(([, a], [, b]) => b - a)
              .map(([site, count]) => (
                <div key={site} className="flex justify-between text-xs">
                  <span className="text-gray-600 truncate mr-1">{site}</span>
                  <span className="font-medium">{count}건</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};