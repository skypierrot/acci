import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
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
  accidentCount: number;      // 재해건수
  victimCount: number;        // 재해자수
  propertyDamage: number;     // 물적피해 (천원 단위)
}

interface AccidentTrendAlternativeChartProps {
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

const AccidentTrendAlternativeChart: React.FC<AccidentTrendAlternativeChartProps> = ({ 
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
          재해건수, 재해자수, 물적피해 추이 (대안 차트)
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
        재해건수, 재해자수, 물적피해 추이 (대안 차트)
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 재해건수, 재해자수 선형 차트 */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">재해건수 및 재해자수</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="year" 
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#3b82f6"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}건`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="accidentCount" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                name="재해건수"
              />
              <Line 
                type="monotone" 
                dataKey="victimCount" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
                name="재해자수"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 물적피해 영역 차트 */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">물적피해 추이</h4>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="year" 
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#f59e0b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}천원`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="propertyDamage" 
                stroke="#f59e0b" 
                fill="#f59e0b" 
                fillOpacity={0.3}
                name="물적피해"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* 차트 설명 */}
      <div className="mt-4 text-sm text-gray-600">
        <p>• <span className="text-blue-600 font-medium">재해건수</span>: 해당 연도의 총 사고 발생 건수 (선형 그래프)</p>
        <p>• <span className="text-purple-600 font-medium">재해자수</span>: 해당 연도의 총 재해자 수 (선형 그래프)</p>
        <p>• <span className="text-orange-600 font-medium">물적피해</span>: 해당 연도의 총 물적피해금액 (영역 그래프, 천원)</p>
      </div>
    </div>
  );
};

export default AccidentTrendAlternativeChart; 