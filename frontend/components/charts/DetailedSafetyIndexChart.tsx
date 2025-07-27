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
  Label
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
                stroke="#1e40af"
                strokeWidth={3}
                dot={<CircleDot fill="#1e40af" stroke="#1e40af" strokeWidth={2} r={5} />}
                activeDot={<CircleDot fill="#1e40af" stroke="#1e40af" strokeWidth={2} r={7} />}
                name="전체 LTIR"
                label={{ 
                  position: 'top', 
                  content: (props: any) => {
                    const { x, y, value } = props;
                    return value ? (
                      <g>
                        <line x1={x} y1={y} x2={x - 15} y2={y - 20} stroke="#1e40af" strokeWidth={1} />
                        <text x={x - 15} y={y - 25} textAnchor="end" fill="#1e40af" fontSize="10" fontWeight="bold">
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
                stroke="#059669"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={<SquareDot fill="#059669" stroke="#059669" strokeWidth={2} r={4} />}
                activeDot={<SquareDot fill="#059669" stroke="#059669" strokeWidth={2} r={6} />}
                name="임직원 LTIR"
                label={{ 
                  position: 'top', 
                  content: (props: any) => {
                    const { x, y, value } = props;
                    return value ? (
                      <g>
                        <line x1={x} y1={y} x2={x + 15} y2={y - 20} stroke="#059669" strokeWidth={1} />
                        <text x={x + 15} y={y - 25} textAnchor="start" fill="#059669" fontSize="9" fontWeight="bold">
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
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={<TriangleDot fill="#f59e0b" stroke="#f59e0b" strokeWidth={2} r={4} />}
                activeDot={<TriangleDot fill="#f59e0b" stroke="#f59e0b" strokeWidth={2} r={6} />}
                name="협력업체 LTIR"
                label={{ 
                  position: 'top', 
                  content: (props: any) => {
                    const { x, y, value } = props;
                    return value ? (
                      <g>
                        <line x1={x} y1={y} x2={x} y2={y - 30} stroke="#f59e0b" strokeWidth={1} />
                        <text x={x} y={y - 35} textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="bold">
                          {value.toFixed(2)}
                        </text>
                      </g>
                    ) : null;
                  }
                }}
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
                stroke="#7c3aed"
                strokeWidth={3}
                dot={<CircleDot fill="#7c3aed" stroke="#7c3aed" strokeWidth={2} r={5} />}
                activeDot={<CircleDot fill="#7c3aed" stroke="#7c3aed" strokeWidth={2} r={7} />}
                name="전체 TRIR"
                label={{ 
                  position: 'top', 
                  content: (props: any) => {
                    const { x, y, value } = props;
                    return value ? (
                      <g>
                        <line x1={x} y1={y} x2={x - 15} y2={y - 20} stroke="#7c3aed" strokeWidth={1} />
                        <text x={x - 15} y={y - 25} textAnchor="end" fill="#7c3aed" fontSize="10" fontWeight="bold">
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
                stroke="#0891b2"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={<SquareDot fill="#0891b2" stroke="#0891b2" strokeWidth={2} r={4} />}
                activeDot={<SquareDot fill="#0891b2" stroke="#0891b2" strokeWidth={2} r={6} />}
                name="임직원 TRIR"
                label={{ 
                  position: 'top', 
                  content: (props: any) => {
                    const { x, y, value } = props;
                    return value ? (
                      <g>
                        <line x1={x} y1={y} x2={x + 15} y2={y - 20} stroke="#0891b2" strokeWidth={1} />
                        <text x={x + 15} y={y - 25} textAnchor="start" fill="#0891b2" fontSize="9" fontWeight="bold">
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
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={<TriangleDot fill="#ef4444" stroke="#ef4444" strokeWidth={2} r={4} />}
                activeDot={<TriangleDot fill="#ef4444" stroke="#ef4444" strokeWidth={2} r={6} />}
                name="협력업체 TRIR"
                label={{ 
                  position: 'top', 
                  content: (props: any) => {
                    const { x, y, value } = props;
                    return value ? (
                      <g>
                        <line x1={x} y1={y} x2={x} y2={y - 30} stroke="#ef4444" strokeWidth={1} />
                        <text x={x} y={y - 35} textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="bold">
                          {value.toFixed(2)}
                        </text>
                      </g>
                    ) : null;
                  }
                }}
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
                fill="#047857"
                opacity={0.6}
                name="전체 강도율"
                radius={[2, 2, 0, 0]}
                barSize={20}
                label={{ 
                  position: 'top', 
                  content: (props: any) => {
                    const { x, y, value } = props;
                    return value ? (
                      <g>
                        <line x1={x} y1={y} x2={x - 15} y2={y - 15} stroke="#047857" strokeWidth={1} />
                        <text x={x - 15} y={y - 20} textAnchor="end" fill="#047857" fontSize="10" fontWeight="bold">
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
                    const { x, y, value } = props;
                    return value ? (
                      <g>
                        <line x1={x} y1={y} x2={x + 15} y2={y - 15} stroke="#34d399" strokeWidth={1} />
                        <text x={x + 15} y={y - 20} textAnchor="start" fill="#34d399" fontSize="9" fontWeight="bold">
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
                    const { x, y, value } = props;
                    return value ? (
                      <g>
                        <line x1={x} y1={y} x2={x} y2={y - 25} stroke="#dc2626" strokeWidth={1} />
                        <text x={x} y={y - 30} textAnchor="middle" fill="#dc2626" fontSize="9" fontWeight="bold">
                          {value.toFixed(2)}
                        </text>
                      </g>
                    ) : null;
                  }
                }}
              />
              
              <Tooltip content={<CustomBarTooltip />} />
              <Legend content={<CustomSeverityLegend />} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* 차트 설명 */}
      <div className="mt-6 text-sm text-gray-600">
        <p>• <span className="text-blue-800 font-medium">LTIR</span>: 근로손실 재해율 (20만시 기준)</p>
        <p>• <span className="text-purple-700 font-medium">TRIR</span>: 총 기록 가능 재해율 (20만시 기준)</p>
        <p>• <span className="text-emerald-700 font-medium">강도율</span>: 근로손실일수 / 연간근로시간 × 1000</p>
        <p>• <span className="text-gray-600 font-medium">실선</span>: 전체 지표, <span className="text-gray-600 font-medium">점선</span>: 임직원/협력업체 구분 지표</p>
        <p>• <span className="text-blue-600 font-medium">도형 구분</span>: ● 전체, ■ 임직원, ▲ 협력업체로 구분하여 시각적 식별력을 향상시켰습니다.</p>
        <p>• <span className="text-blue-600 font-medium">값 표기</span>: 각 데이터 포인트에 연결선과 함께 실제 값을 표시하여 정확한 수치를 확인할 수 있습니다.</p>
        <p>• <span className="text-blue-600 font-medium">차트 분리</span>: 식별력 향상을 위해 LTIR, TRIR, 강도율을 별도 차트로 분리했습니다.</p>
      </div>
    </div>
  );
};

export default DetailedSafetyIndexChart; 