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

// 커스텀 툴팁 컴포넌트 (상세 버전)
const CustomDetailedTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg max-w-xs">
        <p className="font-semibold text-gray-800 mb-3 text-center">{label}년</p>
        <div className="space-y-2">
          {/* 전체 지표 */}
          <div className="border-b border-gray-100 pb-2">
            <p className="text-xs font-medium text-gray-500 mb-1">전체</p>
            {payload
              .filter((entry: any) => !entry.name.includes('임직원') && !entry.name.includes('협력업체'))
              .map((entry: any, index: number) => (
                <p key={index} style={{ color: entry.color }} className="text-sm">
                  {entry.name}: {entry.value.toFixed(2)}
                  {entry.dataKey === 'severityRate' ? '' : ' (20만시 기준)'}
                </p>
              ))}
          </div>
          
          {/* 임직원/협력업체 구분 */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">구분별</p>
            {payload
              .filter((entry: any) => entry.name.includes('임직원') || entry.name.includes('협력업체'))
              .map((entry: any, index: number) => (
                <p key={index} style={{ color: entry.color }} className="text-sm">
                  {entry.name}: {entry.value.toFixed(2)}
                  {entry.dataKey.includes('SeverityRate') ? '' : ' (20만시 기준)'}
                </p>
              ))}
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// 커스텀 범례 컴포넌트 (상세 버전)
const CustomDetailedLegend = ({ payload }: any) => {
  // 원하는 순서로 범례 항목 정렬
  const orderedLegend = [
    // 전체 지표
    { name: '전체 LTIR', color: '#6366f1', type: 'line' },
    { name: '전체 TRIR', color: '#a855f7', type: 'line' },
    { name: '전체 강도율', color: '#10b981', type: 'bar' },
    // 임직원 지표
    { name: '임직원 LTIR', color: '#3b82f6', type: 'line' },
    { name: '임직원 TRIR', color: '#8b5cf6', type: 'line' },
    { name: '임직원 강도율', color: '#059669', type: 'bar' },
    // 협력업체 지표
    { name: '협력업체 LTIR', color: '#f59e0b', type: 'line' },
    { name: '협력업체 TRIR', color: '#ef4444', type: 'line' },
    { name: '협력업체 강도율', color: '#dc2626', type: 'bar' }
  ];

  return (
    <div className="mt-4">
      {/* 전체 지표 범례 */}
      <div className="flex justify-center gap-4 mb-3">
        <p className="text-xs font-medium text-gray-500 mr-2">전체:</p>
        {orderedLegend.slice(0, 3).map((item, index) => (
          <div key={index} className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded ${item.type === 'bar' ? '' : 'rounded-full'}`}
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-600">{item.name.replace('전체 ', '')}</span>
          </div>
        ))}
      </div>
      
      {/* 임직원/협력업체 범례 */}
      <div className="flex justify-center gap-4">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-gray-500">임직원:</p>
          {orderedLegend.slice(3, 6).map((item, index) => (
            <div key={index} className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded ${item.type === 'bar' ? '' : 'rounded-full'}`}
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-gray-600">{item.name.replace('임직원 ', '')}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-gray-500">협력업체:</p>
          {orderedLegend.slice(6, 9).map((item, index) => (
            <div key={index} className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded ${item.type === 'bar' ? '' : 'rounded-full'}`}
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-gray-600">{item.name.replace('협력업체 ', '')}</span>
            </div>
          ))}
        </div>
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
      
      <ResponsiveContainer width="100%" height={450}>
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          
          {/* X축 (년도) */}
          <XAxis 
            dataKey="year" 
            stroke="#666"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          
          {/* 좌측 Y축 (LTIR, TRIR) */}
          <YAxis 
            yAxisId="left"
            stroke="#6366f1"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value.toFixed(1)}`}
          />
          
          {/* 우측 Y축 (강도율) */}
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#10b981"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value.toFixed(1)}`}
          />
          
          {/* 전체 강도율 막대 (우측 y축) - 뒤쪽에 표시 */}
          <Bar
            yAxisId="right"
            dataKey="severityRate"
            fill="#10b981"
            opacity={0.6}
            name="전체 강도율"
            radius={[2, 2, 0, 0]}
            barSize={15}
          />
          
          {/* 임직원 강도율 막대 */}
          <Bar
            yAxisId="right"
            dataKey="employeeSeverityRate"
            fill="#059669"
            opacity={0.8}
            name="임직원 강도율"
            radius={[2, 2, 0, 0]}
            barSize={15}
          />
          
          {/* 협력업체 강도율 막대 */}
          <Bar
            yAxisId="right"
            dataKey="contractorSeverityRate"
            fill="#dc2626"
            opacity={0.8}
            name="협력업체 강도율"
            radius={[2, 2, 0, 0]}
            barSize={15}
          />
          
          {/* 전체 LTIR 라인 (좌측 y축) */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="ltir"
            stroke="#6366f1"
            strokeWidth={3}
            dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2 }}
            name="전체 LTIR"
          />
          
          {/* 전체 TRIR 라인 (좌측 y축) */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="trir"
            stroke="#a855f7"
            strokeWidth={3}
            dot={{ fill: '#a855f7', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#a855f7', strokeWidth: 2 }}
            name="전체 TRIR"
          />
          
          {/* 임직원 LTIR 라인 */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="employeeLtir"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2 }}
            name="임직원 LTIR"
          />
          
          {/* 임직원 TRIR 라인 */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="employeeTrir"
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5, stroke: '#8b5cf6', strokeWidth: 2 }}
            name="임직원 TRIR"
          />
          
          {/* 협력업체 LTIR 라인 */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="contractorLtir"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="3 3"
            dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5, stroke: '#f59e0b', strokeWidth: 2 }}
            name="협력업체 LTIR"
          />
          
          {/* 협력업체 TRIR 라인 */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="contractorTrir"
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="3 3"
            dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5, stroke: '#ef4444', strokeWidth: 2 }}
            name="협력업체 TRIR"
          />
          
          <Tooltip content={<CustomDetailedTooltip />} />
          <Legend content={<CustomDetailedLegend />} />
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* 차트 설명 */}
      <div className="mt-4 text-sm text-gray-600">
        <p>• <span className="text-indigo-600 font-medium">LTIR</span>: 근로손실 재해율 (20만시 기준)</p>
        <p>• <span className="text-purple-600 font-medium">TRIR</span>: 총 기록 가능 재해율 (20만시 기준)</p>
        <p>• <span className="text-green-600 font-medium">강도율</span>: 근로손실일수 / 연간근로시간 × 1000</p>
        <p>• <span className="text-gray-600 font-medium">실선</span>: 전체 지표, <span className="text-gray-600 font-medium">점선</span>: 임직원/협력업체 구분 지표</p>
      </div>
    </div>
  );
};

export default DetailedSafetyIndexChart; 