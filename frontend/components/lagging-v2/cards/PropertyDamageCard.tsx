import React from 'react';
import { PropertyDamage } from '../types';
import { CalculationService } from '../services/calculation.service';

interface Props {
  data: PropertyDamage;
  loading?: boolean;
}

export const PropertyDamageCard: React.FC<Props> = ({ data, loading }) => {
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

  const indirectDamage = CalculationService.calculateIndirectDamage(data.direct);
  const totalDamage = data.direct + indirectDamage;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">물적피해</h3>
        <span className="text-2xl">💰</span>
      </div>
      
      <div className="mb-4">
        <div className="text-3xl font-bold text-red-600">
          {CalculationService.formatCurrency(totalDamage)}
        </div>
        <div className="text-sm text-gray-500">종합</div>
      </div>

      <div className="space-y-2 border-t pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">직접피해</span>
          <span className="font-medium">
            {CalculationService.formatCurrency(data.direct)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">간접피해</span>
          <span className="font-medium text-gray-500">
            {CalculationService.formatCurrency(indirectDamage)}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="text-xs text-gray-500">
          * 간접피해 = 직접피해 × 4
        </div>
      </div>
    </div>
  );
};