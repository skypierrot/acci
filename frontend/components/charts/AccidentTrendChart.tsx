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
export interface AccidentTrendData {
  year: number;
  accidentCount: number;      // 재해건수 (선형 그래프, 좌측 y축)
  victimCount: number;        // 재해자수 (선형 그래프, 좌측 y축)
  propertyDamage: number;     // 물적피해 (막대 그래프, 우측 y축, 천원 단위)
}

interface AccidentTrendChartProps {
  data: AccidentTrendData[];
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
            {entry.name}: {entry.value.toLocaleString()}
            {entry.dataKey === 'propertyDamage' ? '천원' : '건'}
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
    { name: '재해건수', color: '#3b82f6', type: 'line' },
    { name: '재해자수', color: '#8b5cf6', type: 'line' },
    { name: '물적피해', color: '#f59e0b', type: 'bar' }
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

const AccidentTrendChart: React.FC<AccidentTrendChartProps> = ({ 
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
          재해건수, 재해자수, 물적피해 추이
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
        재해건수, 재해자수, 물적피해 추이
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
          
          {/* 좌측 Y축 (재해건수, 재해자수) */}
          <YAxis 
            yAxisId="left"
            stroke="#3b82f6"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}건`}
          />
          
          {/* 우측 Y축 (물적피해) */}
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#f59e0b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}천원`}
          />
          
          {/* 물적피해 막대 (우측 y축) - 뒤쪽에 표시 */}
          <Bar
            yAxisId="right"
            dataKey="propertyDamage"
            fill="#f59e0b"
            opacity={0.8}
            name="물적피해"
            radius={[2, 2, 0, 0]}
            barSize={20}
          />
          
          {/* 재해건수 라인 (좌측 y축) - 앞쪽에 표시 */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="accidentCount"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            name="재해건수"
          />
          
          {/* 재해자수 라인 (좌측 y축) - 앞쪽에 표시 */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="victimCount"
            stroke="#8b5cf6"
            strokeWidth={3}
            dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
            name="재해자수"
          />
          
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* 차트 설명 */}
      <div className="mt-4 text-sm text-gray-600">
        <p>• <span className="text-blue-600 font-medium">재해건수</span>: 해당 연도의 총 사고 발생 건수 (선형 그래프)</p>
        <p>• <span className="text-purple-600 font-medium">재해자수</span>: 해당 연도의 총 재해자 수 (선형 그래프)</p>
        <p>• <span className="text-orange-600 font-medium">물적피해</span>: 해당 연도의 총 물적피해금액 (막대 그래프, 천원)</p>
      </div>
    </div>
  );
};

export default AccidentTrendChart; 