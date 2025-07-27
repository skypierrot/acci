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
  ResponsiveContainer
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

// 통합 차트 데이터 타입 정의
export interface IntegratedAccidentData {
  year: number;
  accidentCount: number;      // 재해건수 (선형)
  victimCount: number;        // 재해자수 (선형)
  siteData: {
    siteName: string;
    employeeCount: number;
    contractorCount: number;
  }[];
}

interface IntegratedAccidentChartProps {
  data: IntegratedAccidentData[];
  loading?: boolean;
}

// 사업장별 색상 매핑 (세련된 파스텔 톤)
const SITE_COLORS = [
  '#A8D5BA', // 소프트 민트
  '#F4C2A1', // 피치
  '#C7B7D1', // 소프트 라벤더
  '#B8D4E3', // 소프트 블루
  '#F7D794', // 소프트 옐로우
  '#D4A5A5', // 소프트 로즈
  '#A8C6DF', // 소프트 스카이
  '#C8E6C9', // 소프트 그린
];

// 색상을 진하게/연하게 만드는 함수
const darkenColor = (color: string, amount: number = 0.3) => {
  const hex = color.replace('#', '');
  const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - Math.round(255 * amount));
  const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - Math.round(255 * amount));
  const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - Math.round(255 * amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const lightenColor = (color: string, amount: number = 0.3) => {
  const hex = color.replace('#', '');
  const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + Math.round(255 * amount));
  const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + Math.round(255 * amount));
  const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + Math.round(255 * amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// 커스텀 툴팁 컴포넌트
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-800 mb-2">{label}년</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value.toLocaleString()}건
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// 커스텀 범례 컴포넌트
const CustomLegend = ({ payload }: any) => {
  // 선형 그래프 범례 (재해건수, 재해자수)
  const lineLegend = [
    { name: '재해건수', color: '#5B9BD5', type: 'circle' },
    { name: '재해자수', color: '#C55A11', type: 'square' }
  ];

  // 사업장별 막대 범례는 동적으로 생성
  const barLegend = payload?.filter((entry: any) => entry.type === 'bar') || [];

  // 사업장별로 그룹화 (임직원/협력업체 구분)
  const siteGroups = new Map();
  barLegend.forEach((entry: any) => {
    const siteName = entry.name.replace(' (임직원)', '').replace(' (협력업체)', '');
    if (!siteGroups.has(siteName)) {
      siteGroups.set(siteName, { 
        name: siteName, 
        employeeColor: '', 
        contractorColor: '' 
      });
    }
    const group = siteGroups.get(siteName);
    if (entry.name.includes('임직원')) {
      group.employeeColor = entry.color;
    } else if (entry.name.includes('협력업체')) {
      group.contractorColor = entry.color;
    }
  });

  return (
    <div className="mt-0">
      {/* 선형 그래프 범례 */}
      <div className="flex justify-center gap-4 mb-0">
        {lineLegend.map((item, index) => (
          <div key={index} className="flex items-center gap-1">
            <div
              className="w-3 h-3"
              style={{ 
                backgroundColor: item.color,
                borderRadius: item.type === 'circle' ? '50%' : '0%'
              }}
            />
            <span className="text-sm text-gray-600">{item.name}</span>
          </div>
        ))}
      </div>
      
      {/* 사업장별 막대 범례 */}
      {siteGroups.size > 0 && (
        <div className="border-t pt-0">
          <div className="bg-gray-50 p-2 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-1 text-center">사업장별 사고건수</p>
            <div className="flex flex-wrap justify-center gap-3">
              {Array.from(siteGroups.values()).map((group: any, index: number) => (
                <div key={index} className="flex items-center gap-1">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded mr-1"
                      style={{ backgroundColor: group.employeeColor }}
                    />
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: group.contractorColor }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">{group.name}</span>
                </div>
              ))}
            </div>
            <div className="mt-1 text-xs text-gray-500 text-center">
              <span>진한색: 임직원, 연한색: 협력업체</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const IntegratedAccidentChart: React.FC<IntegratedAccidentChartProps> = ({ 
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
          통합 사고 분석 차트
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          표시할 데이터가 없습니다.
        </div>
      </div>
    );
  }

  // 차트 데이터 준비 - 연도별 데이터와 사업장별 데이터를 통합
  const chartData = data.map(yearData => {
    const baseData = {
      year: yearData.year,
      accidentCount: yearData.accidentCount,
      victimCount: yearData.victimCount
    };

    // 사업장별 데이터를 동적으로 추가
    const siteData: any = {};
    yearData.siteData.forEach(site => {
      siteData[`${site.siteName}_임직원`] = site.employeeCount;
      siteData[`${site.siteName}_협력업체`] = site.contractorCount;
    });

    return { ...baseData, ...siteData };
  });

  // 사업장 목록 추출 (첫 번째 연도 데이터에서)
  const sites = data[0]?.siteData.map(site => site.siteName) || [];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        통합 사고 분석 차트
      </h3>
      
      <ResponsiveContainer width="100%" height={500}>
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          
          {/* X축 (년도) */}
          <XAxis 
            dataKey="year" 
            stroke="#666"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          
          {/* 좌측 Y축 (재해건수, 재해자수) */}
          <YAxis 
            yAxisId="left"
            stroke="#5B9BD5"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}건`}
            label={{ 
              value: '재해건수/재해자수 (건)', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle', fontSize: '12px', fill: '#5B9BD5' }
            }}
          />
          
          {/* 우측 Y축 (사업장별 사고건수) */}
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#70AD47"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}건`}
            label={{ 
              value: '사업장별 사고건수 (건)', 
              angle: 90, 
              position: 'insideRight',
              style: { textAnchor: 'middle', fontSize: '12px', fill: '#70AD47' }
            }}
          />
          
          {/* 사업장별 사고건수 막대 (우측 y축) - 스택 형태로 표시 */}
          {sites.map((siteName, siteIndex) => {
            const baseColor = SITE_COLORS[siteIndex % SITE_COLORS.length];
            const darkColor = darkenColor(baseColor, 0.2); // 임직원용 진한색
            const lightColor = lightenColor(baseColor, 0.3); // 협력업체용 연한색
            
            return (
              <React.Fragment key={siteName}>
                {/* 임직원 사고건수 (진한색, 아래쪽) */}
                <Bar
                  yAxisId="right"
                  dataKey={`${siteName}_임직원`}
                  fill={darkColor}
                  name={`${siteName} (임직원)`}
                  radius={[2, 0, 0, 2]}
                  barSize={25}
                  stackId={`site_${siteIndex}`}
                  opacity={0.8}
                />
                {/* 협력업체 사고건수 (연한색, 위쪽) */}
                <Bar
                  yAxisId="right"
                  dataKey={`${siteName}_협력업체`}
                  fill={lightColor}
                  name={`${siteName} (협력업체)`}
                  radius={[0, 2, 2, 0]}
                  barSize={25}
                  stackId={`site_${siteIndex}`}
                  opacity={0.7}
                />
              </React.Fragment>
            );
          })}
          
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
            stroke="#C55A11"
            strokeWidth={2.5}
            strokeDasharray="5 5"
            dot={<SquareDot fill="#C55A11" stroke="#C55A11" strokeWidth={2} r={5} />}
            activeDot={<SquareDot fill="#C55A11" stroke="#C55A11" strokeWidth={2} r={6} />}
            name="재해자수"
          />
          
          <Tooltip content={<CustomTooltip />} />
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* 범례를 차트 외부로 이동 */}
      <div className="mt-1">
        <CustomLegend payload={sites.map((siteName, siteIndex) => {
          const baseColor = SITE_COLORS[siteIndex % SITE_COLORS.length];
          const darkColor = darkenColor(baseColor, 0.2);
          const lightColor = lightenColor(baseColor, 0.3);
          
          return [
            {
              type: 'bar',
              name: `${siteName} (임직원)`,
              color: darkColor
            },
            {
              type: 'bar',
              name: `${siteName} (협력업체)`,
              color: lightColor
            }
          ];
        }).flat()} />
      </div>
      

      
      {/* 차트 설명 */}
      <div className="mt-2 text-sm text-gray-600">
        <p>• <span className="text-blue-600 font-medium">재해건수</span>: 해당 연도의 총 사고 발생 건수 (실선 그래프, 좌측 Y축)</p>
        <p>• <span className="text-orange-600 font-medium">재해자수</span>: 해당 연도의 총 재해자 수 (점선 그래프, 좌측 Y축)</p>
        <p>• <span className="text-green-600 font-medium">사업장별 막대</span>: 각 사업장의 임직원(진한색)과 협력업체(연한색) 사고건수 (스택 막대 그래프, 우측 Y축)</p>
        <p>• <span className="text-gray-600 font-medium">색상 구분</span>: 각 사업장마다 다른 소프트 색상으로 구분되며, 임직원은 진한색, 협력업체는 연한색으로 표시됩니다.</p>
      </div>
    </div>
  );
};

export default IntegratedAccidentChart; 