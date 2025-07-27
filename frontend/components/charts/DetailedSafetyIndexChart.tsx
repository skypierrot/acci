import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { DetailedSafetyIndexData } from './SafetyIndexChart';

interface DetailedSafetyIndexChartProps {
  data: DetailedSafetyIndexData[];
  loading?: boolean;
}

// 커스텀 툴팁 컴포넌트 (LTIR/TRIR용)
const CustomLineTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg max-w-xs">
        <p className="font-semibold text-gray-800 mb-3 text-center">{label}년</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value.toFixed(2)} (20만시 기준)
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// 커스텀 툴팁 컴포넌트 (강도율용)
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg max-w-xs">
        <p className="font-semibold text-gray-800 mb-3 text-center">{label}년</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// 커스텀 범례 컴포넌트 (LTIR용)
const CustomLTIRLegend = ({ payload }: any) => {
  const orderedLegend = [
    { name: '전체 LTIR', color: '#6366f1', type: 'line' },
    { name: '임직원 LTIR', color: '#3b82f6', type: 'line' },
    { name: '협력업체 LTIR', color: '#f59e0b', type: 'line' }
  ];

  return (
    <div className="mt-4">
      <div className="flex justify-center gap-4">
        {orderedLegend.map((item, index) => (
          <div key={index} className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-600">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 커스텀 범례 컴포넌트 (TRIR용)
const CustomTRIRLegend = ({ payload }: any) => {
  const orderedLegend = [
    { name: '전체 TRIR', color: '#a855f7', type: 'line' },
    { name: '임직원 TRIR', color: '#8b5cf6', type: 'line' },
    { name: '협력업체 TRIR', color: '#ef4444', type: 'line' }
  ];

  return (
    <div className="mt-4">
      <div className="flex justify-center gap-4">
        {orderedLegend.map((item, index) => (
          <div key={index} className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-600">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 커스텀 범례 컴포넌트 (강도율용)
const CustomSeverityLegend = ({ payload }: any) => {
  const orderedLegend = [
    { name: '전체 강도율', color: '#10b981', type: 'bar' },
    { name: '임직원 강도율', color: '#059669', type: 'bar' },
    { name: '협력업체 강도율', color: '#dc2626', type: 'bar' }
  ];

  return (
    <div className="mt-4">
      <div className="flex justify-center gap-4">
        {orderedLegend.map((item, index) => (
          <div key={index} className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-600">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const DetailedSafetyIndexChart: React.FC<DetailedSafetyIndexChartProps> = ({ 
  data, 
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          LTIR, TRIR, 강도율 상세 추이 (임직원/협력업체 구분)
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          표시할 데이터가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        LTIR, TRIR, 강도율 상세 추이 (임직원/협력업체 구분)
      </h3>
      
      <div className="space-y-6">
        {/* LTIR 차트 */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3 text-center">LTIR (근로손실 재해율)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="year" 
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#6366f1"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value.toFixed(1)}`}
              />
              
              {/* 전체 LTIR 라인 */}
              <Line
                type="monotone"
                dataKey="ltir"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ fill: '#6366f1', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: '#6366f1', strokeWidth: 2 }}
                name="전체 LTIR"
              />
              
              {/* 임직원 LTIR 라인 */}
              <Line
                type="monotone"
                dataKey="employeeLtir"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                name="임직원 LTIR"
              />
              
              {/* 협력업체 LTIR 라인 */}
              <Line
                type="monotone"
                dataKey="contractorLtir"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
                name="협력업체 LTIR"
              />
              
              <Tooltip content={<CustomLineTooltip />} />
              <Legend content={<CustomLTIRLegend />} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* TRIR 차트 */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3 text-center">TRIR (총 기록 가능 재해율)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="year" 
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#a855f7"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value.toFixed(1)}`}
              />
              
              {/* 전체 TRIR 라인 */}
              <Line
                type="monotone"
                dataKey="trir"
                stroke="#a855f7"
                strokeWidth={3}
                dot={{ fill: '#a855f7', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: '#a855f7', strokeWidth: 2 }}
                name="전체 TRIR"
              />
              
              {/* 임직원 TRIR 라인 */}
              <Line
                type="monotone"
                dataKey="employeeTrir"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
                name="임직원 TRIR"
              />
              
              {/* 협력업체 TRIR 라인 */}
              <Line
                type="monotone"
                dataKey="contractorTrir"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
                name="협력업체 TRIR"
              />
              
              <Tooltip content={<CustomLineTooltip />} />
              <Legend content={<CustomTRIRLegend />} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 강도율 차트 */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3 text-center">강도율 (근로손실일수 / 연간근로시간 × 1000)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="year" 
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#10b981"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value.toFixed(1)}`}
              />
              
              {/* 전체 강도율 막대 */}
              <Bar
                dataKey="severityRate"
                fill="#10b981"
                opacity={0.6}
                name="전체 강도율"
                radius={[2, 2, 0, 0]}
                barSize={20}
              />
              
              {/* 임직원 강도율 막대 */}
              <Bar
                dataKey="employeeSeverityRate"
                fill="#059669"
                opacity={0.8}
                name="임직원 강도율"
                radius={[2, 2, 0, 0]}
                barSize={20}
              />
              
              {/* 협력업체 강도율 막대 */}
              <Bar
                dataKey="contractorSeverityRate"
                fill="#dc2626"
                opacity={0.8}
                name="협력업체 강도율"
                radius={[2, 2, 0, 0]}
                barSize={20}
              />
              
              <Tooltip content={<CustomBarTooltip />} />
              <Legend content={<CustomSeverityLegend />} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* 차트 설명 */}
      <div className="mt-6 text-sm text-gray-600">
        <p>• <span className="text-indigo-600 font-medium">LTIR</span>: 근로손실 재해율 (20만시 기준)</p>
        <p>• <span className="text-purple-600 font-medium">TRIR</span>: 총 기록 가능 재해율 (20만시 기준)</p>
        <p>• <span className="text-green-600 font-medium">강도율</span>: 근로손실일수 / 연간근로시간 × 1000</p>
        <p>• <span className="text-gray-600 font-medium">실선</span>: 전체 지표, <span className="text-gray-600 font-medium">점선</span>: 임직원/협력업체 구분 지표</p>
        <p>• <span className="text-blue-600 font-medium">차트 분리</span>: 식별력 향상을 위해 LTIR, TRIR, 강도율을 별도 차트로 분리했습니다.</p>
      </div>
    </div>
  );
};

export default DetailedSafetyIndexChart; 