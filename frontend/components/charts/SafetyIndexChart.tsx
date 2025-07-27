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

// 차트 Props 타입 정의
export interface SafetyIndexChartProps {
  data: SafetyIndexData[];
  loading?: boolean;
  ltirBase?: number;      // LTIR/TRIR 기준값 (기본값: 200000)
}

// 커스텀 툴팁 컴포넌트
const CustomTooltip = ({ active, payload, label, ltirBase = 200000 }: any) => {
  if (active && payload && payload.length) {
    // 기준값을 만시 단위로 변환
    const baseInManHours = ltirBase / 10000; // 200000 -> 20, 1000000 -> 100
    
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-800 mb-2">{label}년</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value.toFixed(2)}
            {entry.dataKey === 'severityRate' ? '' : ` (${baseInManHours}만시 기준)`}
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
    { name: 'LTIR', color: '#A5C882', type: 'circle' },
    { name: 'TRIR', color: '#F28482', type: 'triangle' },
    { name: '강도율', color: '#9BC1BC', type: 'bar' }
  ];

  return (
    <div className="flex justify-center gap-6 mt-4">
      {orderedLegend.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3"
            style={{ 
              backgroundColor: item.color,
              borderRadius: item.type === 'circle' ? '50%' : item.type === 'square' ? '0%' : '2px',
              clipPath: item.type === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none'
            }}
          />
          <span className="text-sm text-gray-600">{item.name}</span>
        </div>
      ))}
    </div>
  );
};

const SafetyIndexChart: React.FC<SafetyIndexChartProps> = ({ 
  data, 
  loading = false,
  ltirBase = 200000
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
          LTIR, TRIR, 강도율 추이
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
            label={{ 
              value: '연도', 
              position: 'bottom',
              offset: 0,
              style: { textAnchor: 'middle', fontSize: '12px', fill: '#666' }
            }}
          />
          
          {/* 좌측 Y축 (LTIR, TRIR) */}
          <YAxis 
            yAxisId="left"
            stroke="#A5C882"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value.toFixed(1)}`}
            label={{ 
              value: 'LTIR/TRIR', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle', fontSize: '12px', fill: '#A5C882' }
            }}
          />
          
          {/* 우측 Y축 (강도율) */}
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#9BC1BC"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value.toFixed(1)}`}
            label={{ 
              value: '강도율', 
              angle: 90, 
              position: 'insideRight',
              style: { textAnchor: 'middle', fontSize: '12px', fill: '#9BC1BC' }
            }}
          />
          
          {/* 강도율 막대 (우측 y축) - 뒤쪽에 표시 */}
          <Bar
            yAxisId="right"
            dataKey="severityRate"
            fill="#9BC1BC"
            opacity={0.7}
            name="강도율"
            radius={[2, 2, 0, 0]}
            barSize={20}
          />
          
          {/* LTIR 라인 (좌측 y축) - 앞쪽에 표시 */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="ltir"
            stroke="#A5C882"
            strokeWidth={2.5}
            dot={<CircleDot fill="#A5C882" stroke="#A5C882" strokeWidth={2} r={5} />}
            activeDot={<CircleDot fill="#A5C882" stroke="#A5C882" strokeWidth={2} r={6} />}
            name="LTIR"
          />
          
          {/* TRIR 라인 (좌측 y축) - 앞쪽에 표시 */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="trir"
            stroke="#F28482"
            strokeWidth={2.5}
            strokeDasharray="5 5"
            dot={<TriangleDot fill="#F28482" stroke="#F28482" strokeWidth={2} r={5} />}
            activeDot={<TriangleDot fill="#F28482" stroke="#F28482" strokeWidth={2} r={6} />}
            name="TRIR"
          />
          
          <Tooltip content={(props) => <CustomTooltip {...props} ltirBase={ltirBase} />} />
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
        <p>• <span className="text-green-500 font-medium">LTIR (Lost Time Injury Rate)</span>: 근로손실 재해율 (실선 그래프, {ltirBase / 10000}만시 기준)</p>
        <p>• <span className="text-red-400 font-medium">TRIR (Total Recordable Injury Rate)</span>: 총 기록 가능 재해율 (점선 그래프, {ltirBase / 10000}만시 기준)</p>
        <p>• <span className="text-cyan-400 font-medium">강도율</span>: 근로손실일수 / 연간근로시간 × 1000 (막대 그래프)</p>
        <p className="text-xs text-gray-500 mt-2">💡 차트 하단의 스크롤바를 드래그하여 연도 범위를 조정할 수 있습니다.</p>
      </div>
    </div>
  );
};

export default SafetyIndexChart; 