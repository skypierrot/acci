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
  ReferenceLine,
  Brush
} from 'recharts';

// 커스텀 도형 컴포넌트들
const CircleDot = (props: any) => {
  const { cx, cy, fill, stroke, strokeWidth, r } = props;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r || 5}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
};

const SquareDot = (props: any) => {
  const { cx, cy, fill, stroke, strokeWidth, r } = props;
  const size = (r || 5) * 2;
  return (
    <rect
      x={cx - size / 2}
      y={cy - size / 2}
      width={size}
      height={size}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
};

const TriangleDot = (props: any) => {
  const { cx, cy, fill, stroke, strokeWidth, r } = props;
  const size = (r || 5) * 2;
  const points = `${cx},${cy - size / 2} ${cx - size / 2},${cy + size / 2} ${cx + size / 2},${cy + size / 2}`;
  return (
    <polygon
      points={points}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
};

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
    { name: '재해건수', color: '#6BC5C5', type: 'circle' },
    { name: '재해자수', color: '#F7B267', type: 'square' },
    { name: '물적피해', color: '#CDB4DB', type: 'bar' }
  ];

  return (
    <div className="flex justify-center gap-6 mt-4">
      {orderedLegend.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3"
            style={{ 
              backgroundColor: item.color,
              borderRadius: item.type === 'circle' ? '50%' : item.type === 'triangle' ? '0%' : '2px',
              clipPath: item.type === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none'
            }}
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
  // 기본 표시 범위 계산 (최근 5개년)
  const getDefaultBrushRange = () => {
    if (!data || data.length === 0) return { startIndex: 0, endIndex: 0 };
    
    const sortedData = [...data].sort((a, b) => a.year - b.year);
    const totalYears = sortedData.length;
    const startIndex = Math.max(0, totalYears - 5); // 최근 5개년
    const endIndex = totalYears - 1;
    
    return { startIndex, endIndex };
  };

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

  const { startIndex, endIndex } = getDefaultBrushRange();

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
            label={{ 
              value: '연도', 
              position: 'bottom',
              offset: 0,
              style: { textAnchor: 'middle', fontSize: '12px', fill: '#666' }
            }}
          />
          
          {/* 좌측 Y축 (재해건수, 재해자수) */}
          <YAxis 
            yAxisId="left"
            stroke="#5B9BD5"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value.toLocaleString()}건`}
            label={{ 
              value: '재해건수/재해자수 (건)', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle', fontSize: '12px', fill: '#5B9BD5' }
            }}
          />
          
          {/* 우측 Y축 (물적피해) */}
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#CDB4DB"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value.toLocaleString()}천원`}
            label={{ 
              value: '물적피해 (천원)', 
              angle: 90, 
              position: 'insideRight',
              style: { textAnchor: 'middle', fontSize: '12px', fill: '#CDB4DB' }
            }}
          />
          
          {/* 물적피해 막대 (우측 y축) - 뒤쪽에 표시 */}
          <Bar
            yAxisId="right"
            dataKey="propertyDamage"
            fill="#CDB4DB"
            opacity={0.7}
            name="물적피해"
            radius={[2, 2, 0, 0]}
            barSize={20}
          />
          
          {/* 재해건수 라인 (좌측 y축) - 앞쪽에 표시 */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="accidentCount"
            stroke="#5B9BD5"
            strokeWidth={2.5}
            dot={<CircleDot fill="#5B9BD5" stroke="#5B9BD5" strokeWidth={2} r={5} />}
            activeDot={<CircleDot fill="#5B9BD5" stroke="#5B9BD5" strokeWidth={2} r={6} />}
            name="재해건수"
          />
          
          {/* 재해자수 라인 (좌측 y축) - 앞쪽에 표시 */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="victimCount"
            stroke="#F7B267"
            strokeWidth={2.5}
            strokeDasharray="5 5"
            dot={<SquareDot fill="#F7B267" stroke="#F7B267" strokeWidth={2} r={5} />}
            activeDot={<SquareDot fill="#F7B267" stroke="#F7B267" strokeWidth={2} r={6} />}
            name="재해자수"
          />
          
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          
          {/* 스크롤 기능을 위한 Brush 컴포넌트 */}
          <Brush 
            dataKey="year" 
            height={15} 
            stroke="#8884d8"
            startIndex={startIndex}
            endIndex={endIndex}
            fill="#f0f0f0"
            strokeDasharray="3 3"
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* 차트 설명 */}
      <div className="mt-4 text-sm text-gray-600">
        <p>• <span className="text-teal-500 font-medium">재해건수</span>: 해당 연도의 총 사고 발생 건수 (실선 그래프)</p>
        <p>• <span className="text-orange-400 font-medium">재해자수</span>: 해당 연도의 총 재해자 수 (점선 그래프)</p>
        <p>• <span className="text-purple-300 font-medium">물적피해</span>: 해당 연도의 총 물적피해금액 (막대 그래프, 천원)</p>
        <p className="text-xs text-gray-500 mt-2">💡 차트 하단의 스크롤바를 드래그하여 연도 범위를 조정할 수 있습니다.</p>
      </div>
    </div>
  );
};

export default AccidentTrendChart; 