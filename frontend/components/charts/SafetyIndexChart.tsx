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

// 차트 데이터 타입 정의
export interface SafetyIndexData {
  year: number;
  ltir: number;           // LTIR (선형 그래프, 좌측 y축)
  trir: number;           // TRIR (선형 그래프, 좌측 y축)
  severityRate: number;   // 강도율 (막대 그래프, 우측 y축)
}

// 상세 차트용 확장된 데이터 타입
export interface DetailedSafetyIndexData {
  year: number;
  ltir: number;           // 전체 LTIR
  trir: number;           // 전체 TRIR
  severityRate: number;   // 전체 강도율
  employeeLtir: number;   // 임직원 LTIR
  contractorLtir: number; // 협력업체 LTIR
  employeeTrir: number;   // 임직원 TRIR
  contractorTrir: number; // 협력업체 TRIR
  employeeSeverityRate: number;   // 임직원 강도율
  contractorSeverityRate: number; // 협력업체 강도율
}

interface SafetyIndexChartProps {
  data: SafetyIndexData[];
  loading?: boolean;
}

// 커스텀 툴팁 컴포넌트
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-800 mb-2">{label}년</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value.toFixed(2)}
            {entry.dataKey === 'severityRate' ? '' : ' (20만시 기준)'}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// 커스텀 범례 컴포넌트
const CustomLegend = ({ payload }: any) => {
  // 원하는 순서로 범례 항목 정렬
  const orderedLegend = [
    { name: 'LTIR', color: '#6366f1', type: 'line' },
    { name: 'TRIR', color: '#a855f7', type: 'line' },
    { name: '강도율', color: '#10b981', type: 'bar' }
  ];

  return (
    <div className="flex justify-center gap-6 mt-4">
      {orderedLegend.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded ${item.type === 'bar' ? '' : 'rounded-full'}`}
            style={{ backgroundColor: item.color }}
          />
          <span className="text-sm text-gray-600">{item.name}</span>
        </div>
      ))}
    </div>
  );
};

const SafetyIndexChart: React.FC<SafetyIndexChartProps> = ({ 
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
          LTIR, TRIR, 강도율 추이
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
        LTIR, TRIR, 강도율 추이
      </h3>
      
      <ResponsiveContainer width="100%" height={400}>
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
          
          {/* 강도율 막대 (우측 y축) - 뒤쪽에 표시 */}
          <Bar
            yAxisId="right"
            dataKey="severityRate"
            fill="#10b981"
            opacity={0.8}
            name="강도율"
            radius={[2, 2, 0, 0]}
            barSize={20}
          />
          
          {/* LTIR 라인 (좌측 y축) - 앞쪽에 표시 */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="ltir"
            stroke="#6366f1"
            strokeWidth={3}
            dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2 }}
            name="LTIR"
          />
          
          {/* TRIR 라인 (좌측 y축) - 앞쪽에 표시 */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="trir"
            stroke="#a855f7"
            strokeWidth={3}
            dot={{ fill: '#a855f7', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#a855f7', strokeWidth: 2 }}
            name="TRIR"
          />
          
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* 차트 설명 */}
      <div className="mt-4 text-sm text-gray-600">
        <p>• <span className="text-indigo-600 font-medium">LTIR (Lost Time Injury Rate)</span>: 근로손실 재해율 (선형 그래프, 20만시 기준)</p>
        <p>• <span className="text-purple-600 font-medium">TRIR (Total Recordable Injury Rate)</span>: 총 기록 가능 재해율 (선형 그래프, 20만시 기준)</p>
        <p>• <span className="text-green-600 font-medium">강도율</span>: 근로손실일수 / 연간근로시간 × 1000 (막대 그래프)</p>
      </div>
    </div>
  );
};

export default SafetyIndexChart; 