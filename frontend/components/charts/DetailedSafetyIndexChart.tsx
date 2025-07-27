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
  Label,
  Brush
} from 'recharts';

// 커스텀 도형 컴포넌트들
const CircleDot = (props: any) => {
  const { cx, cy, fill, stroke, strokeWidth, r } = props;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r || 4}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
};

const SquareDot = (props: any) => {
  const { cx, cy, fill, stroke, strokeWidth, r } = props;
  const size = (r || 4) * 2;
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
  const size = (r || 4) * 2;
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
    { name: '전체 LTIR', color: '#1e40af', type: 'circle' },
    { name: '임직원 LTIR', color: '#059669', type: 'square' },
    { name: '협력업체 LTIR', color: '#f59e0b', type: 'triangle' }
  ];

  return (
    <div className="mt-4">
      <div className="flex justify-center gap-4">
        {orderedLegend.map((item, index) => (
          <div key={index} className="flex items-center gap-1">
            <div
              className="w-3 h-3"
              style={{ 
                backgroundColor: item.color,
                borderRadius: item.type === 'circle' ? '50%' : '0%',
                clipPath: item.type === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none'
              }}
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
    { name: '전체 TRIR', color: '#7c3aed', type: 'circle' },
    { name: '임직원 TRIR', color: '#0891b2', type: 'square' },
    { name: '협력업체 TRIR', color: '#ef4444', type: 'triangle' }
  ];

  return (
    <div className="mt-4">
      <div className="flex justify-center gap-4">
        {orderedLegend.map((item, index) => (
          <div key={index} className="flex items-center gap-1">
            <div
              className="w-3 h-3"
              style={{ 
                backgroundColor: item.color,
                borderRadius: item.type === 'circle' ? '50%' : '0%',
                clipPath: item.type === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none'
              }}
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
    { name: '전체 강도율', color: '#047857', type: 'bar' },
    { name: '임직원 강도율', color: '#34d399', type: 'bar' },
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
  // 기본 표시 범위 계산 (최근 10개년)
  const getDefaultBrushRange = () => {
    if (!data || data.length === 0) return { startIndex: 0, endIndex: 0 };
    
    const sortedData = [...data].sort((a, b) => a.year - b.year);
    const totalYears = sortedData.length;
    const startIndex = Math.max(0, totalYears - 10); // 최근 10개년
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
          LTIR, TRIR, 강도율 상세 추이 (임직원/협력업체 구분)
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          표시할 데이터가 없습니다.
        </div>
      </div>
    );
  }

  const { startIndex, endIndex } = getDefaultBrushRange();

  // 라벨 위치를 동적으로 결정하는 함수
  const getLabelPosition = (index: number, totalPoints: number, value: number, yAxisRange: { min: number, max: number }) => {
    const isFirstPoint = index === 0;
    const isLastPoint = index === totalPoints - 1;
    const isHighValue = value > (yAxisRange.max + yAxisRange.min) / 2;
    
    // 첫 번째나 마지막 포인트이거나 높은 값인 경우 아래쪽에 표시
    if (isFirstPoint || isLastPoint || isHighValue) {
      return 'bottom';
    }
    return 'top';
  };

  // 강도율 차트용 라벨 위치 계산 (막대 그래프 특성 반영)
  const getSeverityLabelPosition = (index: number, totalPoints: number, value: number, yAxisRange: { min: number, max: number }) => {
    const isFirstPoint = index === 0;
    const isLastPoint = index === totalPoints - 1;
    const isHighValue = value > (yAxisRange.max + yAxisRange.min) / 2;

    // 막대 그래프: 높은 값(상단부)은 아래로, 낮은 값(하단부)은 위로
    if (isFirstPoint || isLastPoint || isHighValue) {
      return 'bottom';
    }
    return 'top';
  };

  // Y축 범위 계산
  const ltirYAxisRange = {
    min: Math.min(...data.map(d => Math.min(d.ltir || 0, d.employeeLtir || 0, d.contractorLtir || 0))),
    max: Math.max(...data.map(d => Math.max(d.ltir || 0, d.employeeLtir || 0, d.contractorLtir || 0)))
  };
  
  const trirYAxisRange = {
    min: Math.min(...data.map(d => Math.min(d.trir || 0, d.employeeTrir || 0, d.contractorTrir || 0))),
    max: Math.max(...data.map(d => Math.max(d.trir || 0, d.employeeTrir || 0, d.contractorTrir || 0)))
  };
  
  const severityYAxisRange = {
    min: Math.min(...data.map(d => Math.min(d.severityRate || 0, d.employeeSeverityRate || 0, d.contractorSeverityRate || 0))),
    max: Math.max(...data.map(d => Math.max(d.severityRate || 0, d.employeeSeverityRate || 0, d.contractorSeverityRate || 0)))
  };

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
                dot={<CircleDot fill="#6366f1" stroke="#6366f1" strokeWidth={2} r={5} />}
                activeDot={<CircleDot fill="#6366f1" stroke="#6366f1" strokeWidth={2} r={7} />}
                name="전체 LTIR"
                label={{ 
                  position: 'top', 
                  content: (props: any) => {
                    const { x, y, value, index } = props;
                    const position = getLabelPosition(index, data.length, value, ltirYAxisRange);
                    const isBottom = position === 'bottom';
                    
                    return value ? (
                      <g>
                        <line 
                          x1={x} y1={y} 
                          x2={x - 15} y2={y + (isBottom ? 20 : -20)} 
                          stroke="#6366f1" strokeWidth={1} 
                        />
                        <text 
                          x={x - 15} y={y + (isBottom ? 25 : -25)} 
                          textAnchor="end" fill="#6366f1" fontSize="10" fontWeight="bold"
                        >
                          {value.toFixed(2)}
                        </text>
                      </g>
                    ) : null;
                  }
                }}
              />
              
              {/* 임직원 LTIR 라인 */}
              <Line
                type="monotone"
                dataKey="employeeLtir"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={<CircleDot fill="#10b981" stroke="#10b981" strokeWidth={2} r={4} />}
                activeDot={<CircleDot fill="#10b981" stroke="#10b981" strokeWidth={2} r={6} />}
                name="임직원 LTIR"
                label={{ 
                  position: 'top', 
                  content: (props: any) => {
                    const { x, y, value, index } = props;
                    const position = getLabelPosition(index, data.length, value, ltirYAxisRange);
                    const isBottom = position === 'bottom';
                    
                    return value ? (
                      <g>
                        <line 
                          x1={x} y1={y} 
                          x2={x + 15} y2={y + (isBottom ? 20 : -20)} 
                          stroke="#10b981" strokeWidth={1} 
                        />
                        <text 
                          x={x + 15} y={y + (isBottom ? 25 : -25)} 
                          textAnchor="start" fill="#10b981" fontSize="9" fontWeight="bold"
                        >
                          {value.toFixed(2)}
                        </text>
                      </g>
                    ) : null;
                  }
                }}
              />
              
              {/* 협력업체 LTIR 라인 */}
              <Line
                type="monotone"
                dataKey="contractorLtir"
                stroke="#dc2626"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={<CircleDot fill="#dc2626" stroke="#dc2626" strokeWidth={2} r={4} />}
                activeDot={<CircleDot fill="#dc2626" stroke="#dc2626" strokeWidth={2} r={6} />}
                name="협력업체 LTIR"
                label={{ 
                  position: 'top', 
                  content: (props: any) => {
                    const { x, y, value, index } = props;
                    const position = getLabelPosition(index, data.length, value, ltirYAxisRange);
                    const isBottom = position === 'bottom';
                    
                    return value ? (
                      <g>
                        <line 
                          x1={x} y1={y} 
                          x2={x} y2={y + (isBottom ? 25 : -25)} 
                          stroke="#dc2626" strokeWidth={1} 
                        />
                        <text 
                          x={x} y={y + (isBottom ? 30 : -30)} 
                          textAnchor="middle" fill="#dc2626" fontSize="9" fontWeight="bold"
                        >
                          {value.toFixed(2)}
                        </text>
                      </g>
                    ) : null;
                  }
                }}
              />
              
              <Tooltip content={<CustomLineTooltip />} />
              <Legend content={<CustomLTIRLegend />} />
              
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
                stroke="#7c3aed"
                strokeWidth={3}
                dot={<CircleDot fill="#7c3aed" stroke="#7c3aed" strokeWidth={2} r={5} />}
                activeDot={<CircleDot fill="#7c3aed" stroke="#7c3aed" strokeWidth={2} r={7} />}
                name="전체 TRIR"
                label={{ 
                  position: 'top', 
                  content: (props: any) => {
                    const { x, y, value, index } = props;
                    const position = getLabelPosition(index, data.length, value, trirYAxisRange);
                    const isBottom = position === 'bottom';
                    
                    return value ? (
                      <g>
                        <line 
                          x1={x} y1={y} 
                          x2={x - 15} y2={y + (isBottom ? 20 : -20)} 
                          stroke="#7c3aed" strokeWidth={1} 
                        />
                        <text 
                          x={x - 15} y={y + (isBottom ? 25 : -25)} 
                          textAnchor="end" fill="#7c3aed" fontSize="10" fontWeight="bold"
                        >
                          {value.toFixed(2)}
                        </text>
                      </g>
                    ) : null;
                  }
                }}
              />
              
              {/* 임직원 TRIR 라인 */}
              <Line
                type="monotone"
                dataKey="employeeTrir"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={<CircleDot fill="#10b981" stroke="#10b981" strokeWidth={2} r={4} />}
                activeDot={<CircleDot fill="#10b981" stroke="#10b981" strokeWidth={2} r={6} />}
                name="임직원 TRIR"
                label={{ 
                  position: 'top', 
                  content: (props: any) => {
                    const { x, y, value, index } = props;
                    const position = getLabelPosition(index, data.length, value, trirYAxisRange);
                    const isBottom = position === 'bottom';
                    
                    return value ? (
                      <g>
                        <line 
                          x1={x} y1={y} 
                          x2={x + 15} y2={y + (isBottom ? 20 : -20)} 
                          stroke="#10b981" strokeWidth={1} 
                        />
                        <text 
                          x={x + 15} y={y + (isBottom ? 25 : -25)} 
                          textAnchor="start" fill="#10b981" fontSize="9" fontWeight="bold"
                        >
                          {value.toFixed(2)}
                        </text>
                      </g>
                    ) : null;
                  }
                }}
              />
              
              {/* 협력업체 TRIR 라인 */}
              <Line
                type="monotone"
                dataKey="contractorTrir"
                stroke="#dc2626"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={<CircleDot fill="#dc2626" stroke="#dc2626" strokeWidth={2} r={4} />}
                activeDot={<CircleDot fill="#dc2626" stroke="#dc2626" strokeWidth={2} r={6} />}
                name="협력업체 TRIR"
                label={{ 
                  position: 'top', 
                  content: (props: any) => {
                    const { x, y, value, index } = props;
                    const position = getLabelPosition(index, data.length, value, trirYAxisRange);
                    const isBottom = position === 'bottom';
                    
                    return value ? (
                      <g>
                        <line 
                          x1={x} y1={y} 
                          x2={x} y2={y + (isBottom ? 25 : -25)} 
                          stroke="#dc2626" strokeWidth={1} 
                        />
                        <text 
                          x={x} y={y + (isBottom ? 30 : -30)} 
                          textAnchor="middle" fill="#dc2626" fontSize="9" fontWeight="bold"
                        >
                          {value.toFixed(2)}
                        </text>
                      </g>
                    ) : null;
                  }
                }}
              />
              
              <Tooltip content={<CustomLineTooltip />} />
              <Legend content={<CustomTRIRLegend />} />
              
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
                fill="#047857"
                opacity={0.6}
                name="전체 강도율"
                radius={[2, 2, 0, 0]}
                barSize={20}
                label={{ 
                  position: 'top', 
                  content: (props: any) => {
                    const { x, y, value, index } = props;
                    const position = getSeverityLabelPosition(index, data.length, value, severityYAxisRange);
                    const isBottom = position === 'bottom';
                    
                    return value ? (
                      <g>
                        <line 
                          x1={x} y1={y} 
                          x2={x - 15} y2={y + (isBottom ? 15 : -15)} 
                          stroke="#047857" strokeWidth={1} 
                        />
                        <text 
                          x={x - 15} y={y + (isBottom ? 20 : -20)} 
                          textAnchor="end" fill="#047857" fontSize="10" fontWeight="bold"
                        >
                          {value.toFixed(2)}
                        </text>
                      </g>
                    ) : null;
                  }
                }}
              />
              
              {/* 임직원 강도율 막대 */}
              <Bar
                dataKey="employeeSeverityRate"
                fill="#34d399"
                opacity={0.8}
                name="임직원 강도율"
                radius={[2, 2, 0, 0]}
                barSize={20}
                label={{ 
                  position: 'top', 
                  content: (props: any) => {
                    const { x, y, value, index } = props;
                    const position = getSeverityLabelPosition(index, data.length, value, severityYAxisRange);
                    const isBottom = position === 'bottom';
                    
                    return value ? (
                      <g>
                        <line 
                          x1={x} y1={y} 
                          x2={x + 15} y2={y + (isBottom ? 15 : -15)} 
                          stroke="#34d399" strokeWidth={1} 
                        />
                        <text 
                          x={x + 15} y={y + (isBottom ? 20 : -20)} 
                          textAnchor="start" fill="#34d399" fontSize="9" fontWeight="bold"
                        >
                          {value.toFixed(2)}
                        </text>
                      </g>
                    ) : null;
                  }
                }}
              />
              
              {/* 협력업체 강도율 막대 */}
              <Bar
                dataKey="contractorSeverityRate"
                fill="#dc2626"
                opacity={0.8}
                name="협력업체 강도율"
                radius={[2, 2, 0, 0]}
                barSize={20}
                label={{ 
                  position: 'top', 
                  content: (props: any) => {
                    const { x, y, value, index } = props;
                    const position = getSeverityLabelPosition(index, data.length, value, severityYAxisRange);
                    const isBottom = position === 'bottom';
                    
                    return value ? (
                      <g>
                        <line 
                          x1={x} y1={y} 
                          x2={x - 15} y2={y + (isBottom ? 15 : -15)} 
                          stroke="#dc2626" strokeWidth={1} 
                        />
                        <text 
                          x={x - 15} y={y + (isBottom ? 20 : -20)} 
                          textAnchor="end" fill="#dc2626" fontSize="9" fontWeight="bold"
                        >
                          {value.toFixed(2)}
                        </text>
                      </g>
                    ) : null;
                  }
                }}
              />
              
              <Tooltip content={<CustomBarTooltip />} />
              <Legend content={<CustomSeverityLegend />} />
              
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
        </div>
      </div>
      
      {/* 차트 설명 */}
      <div className="mt-4 text-sm text-gray-600">
        <p>• <span className="text-indigo-500 font-medium">LTIR</span>: 근로손실 재해율 (20만시 기준)</p>
        <p>• <span className="text-purple-500 font-medium">TRIR</span>: 총 기록 가능 재해율 (20만시 기준)</p>
        <p>• <span className="text-emerald-500 font-medium">강도율</span>: 근로손실일수 / 연간근로시간 × 1000</p>
        <p className="text-xs text-gray-500 mt-2">💡 각 차트 하단의 스크롤바를 드래그하여 연도 범위를 조정할 수 있습니다.</p>
      </div>
    </div>
  );
};

export default DetailedSafetyIndexChart; 