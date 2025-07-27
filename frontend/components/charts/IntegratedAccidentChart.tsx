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
  // 디버깅을 위한 데이터 로깅
  React.useEffect(() => {
    console.log('[통합차트] 데이터 변경 감지:', {
      dataLength: data?.length,
      data: data,
      loading
    });
  }, [data, loading]);

  if (loading) {
    console.log('[통합차트] 로딩 상태');
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
    console.log('[통합차트] 데이터 없음');
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          통합 사고 분석 차트
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <p className="mb-2">표시할 데이터가 없습니다.</p>
            <p className="text-sm text-gray-400">연도별 사고 데이터를 확인해주세요.</p>
          </div>
        </div>
      </div>
    );
  }

  // 데이터 유효성 검사
  const validData = data.filter(item => 
    item && 
    typeof item.year === 'number' && 
    (typeof item.accidentCount === 'number' || typeof item.victimCount === 'number')
  );

  if (validData.length === 0) {
    console.log('[통합차트] 유효한 데이터 없음');
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          통합 사고 분석 차트
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <p className="mb-2">유효한 데이터가 없습니다.</p>
            <p className="text-sm text-gray-400">데이터 형식을 확인해주세요.</p>
          </div>
        </div>
      </div>
    );
  }

  // 기본 표시 범위 계산 (전체 데이터 표시)
  const getDefaultBrushRange = () => {
    if (!validData || validData.length === 0) return { startIndex: 0, endIndex: 0 };
    
    const sortedData = [...validData].sort((a, b) => a.year - b.year);
    const totalYears = sortedData.length;
    // 전체 데이터를 표시하도록 수정 (최근 10개년 제한 제거)
    const startIndex = 0;
    const endIndex = totalYears - 1;
    
    console.log('[통합차트] 스크롤바 범위 계산:', { startIndex, endIndex, totalYears });
    return { startIndex, endIndex };
  };

  // 선 그래프용 라벨 위치 계산
  const getLineLabelPosition = (index: number, totalPoints: number, value: number, yAxisRange: { min: number, max: number }) => {
    const isFirstPoint = index === 0;
    const isLastPoint = index === totalPoints - 1;
    const isHighValue = value > (yAxisRange.max + yAxisRange.min) / 2;

    if (isFirstPoint || isLastPoint || isHighValue) {
      return 'bottom';
    }
    return 'top';
  };

  // 막대 그래프용 라벨 위치 계산
  const getBarLabelPosition = (index: number, totalPoints: number, value: number, yAxisRange: { min: number, max: number }) => {
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
  const accidentYAxisRange = React.useMemo(() => {
    if (!validData || validData.length === 0) {
      return { min: 0, max: 10 };
    }
    
    const allAccidentCounts = validData.map(d => d.accidentCount || 0);
    const allVictimCounts = validData.map(d => d.victimCount || 0);
    
    const min = Math.min(...allAccidentCounts, ...allVictimCounts);
    const max = Math.max(...allAccidentCounts, ...allVictimCounts);
    
    // 최소값이 0이 아닌 경우 여백 추가
    const adjustedMin = min > 0 ? Math.max(0, min - Math.ceil(max * 0.1)) : 0;
    const adjustedMax = max > 0 ? max + Math.ceil(max * 0.1) : 10;
    
    console.log('[통합차트] Y축 범위 계산:', {
      min: adjustedMin,
      max: adjustedMax,
      originalMin: min,
      originalMax: max
    });
    
    return { min: adjustedMin, max: adjustedMax };
  }, [validData]);

  // 차트 데이터 준비 - 연도별 데이터와 사업장별 데이터를 통합
  const chartData = React.useMemo(() => {
    if (!validData || validData.length === 0) return [];
    
    return validData.map(yearData => {
      const baseData = {
        year: yearData.year,
        accidentCount: yearData.accidentCount || 0,
        victimCount: yearData.victimCount || 0
      };

      // 사업장별 데이터를 동적으로 추가
      const siteData: any = {};
      if (yearData.siteData && Array.isArray(yearData.siteData)) {
        yearData.siteData.forEach(site => {
          if (site.siteName) {
            siteData[`${site.siteName}_임직원`] = site.employeeCount || 0;
            siteData[`${site.siteName}_협력업체`] = site.contractorCount || 0;
          }
        });
      }

      return { ...baseData, ...siteData };
    });
  }, [validData]);

  console.log('[통합차트] 차트 데이터 준비 완료:', chartData);

  // 사업장 목록 추출 (모든 연도 데이터에서 사업장 정보 수집)
  const sites = React.useMemo(() => {
    const allSites = new Set<string>();
    if (validData && Array.isArray(validData)) {
      validData.forEach(yearData => {
        if (yearData.siteData && Array.isArray(yearData.siteData)) {
          yearData.siteData.forEach(site => {
            if (site.siteName) {
              allSites.add(site.siteName);
            }
          });
        }
      });
    }
    return Array.from(allSites);
  }, [validData]);
  
  console.log('[통합차트] 사업장 목록:', sites);
  
  const { startIndex, endIndex } = getDefaultBrushRange();

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
            domain={[accidentYAxisRange.min, accidentYAxisRange.max]}
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
            domain={[0, 'dataMax + 1']}
            label={{ 
              value: '사업장별 사고건수 (건)', 
              angle: 90, 
              position: 'insideRight',
              style: { textAnchor: 'middle', fontSize: '12px', fill: '#70AD47' }
            }}
          />
          
          {/* 사업장별 사고건수 막대 (우측 y축) - 스택 형태로 표시 */}
          {sites.length > 0 ? sites.map((siteName, siteIndex) => {
            // 기본 색상 팔레트에서 사업장별 색상 추출
            const baseColor = SITE_COLORS[siteIndex % SITE_COLORS.length];
            // 임직원용 진한색 (기존과 동일)
            const darkColor = darkenColor(baseColor, 0.2);
            // 협력업체용 덜 연한색(기존 0.3 → 0.15로 조정)
            const lightColor = lightenColor(baseColor, 0.15);
            // opacity도 0.85로 조정하여 더 진하게 표시
            
            // 디버깅용 로그
            console.log(`[통합차트] 사업장 ${siteName} 렌더링:`, {
              siteIndex,
              baseColor,
              darkColor,
              lightColor,
              dataKey1: `${siteName}_임직원`,
              dataKey2: `${siteName}_협력업체`
            });
            
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
                  opacity={0.85} // 임직원도 더 진하게
                />
                {/* 협력업체 사고건수 (덜 연한색, 위쪽) */}
                <Bar
                  yAxisId="right"
                  dataKey={`${siteName}_협력업체`}
                  fill={lightColor}
                  name={`${siteName} (협력업체)`}
                  radius={[0, 2, 2, 0]}
                  barSize={25}
                  stackId={`site_${siteIndex}`}
                  opacity={0.85} // 협력업체도 더 진하게
                />
              </React.Fragment>
            );
          }) : (
            // 사업장 데이터가 없을 때 안내 메시지
            <text x="50%" y="50%" textAnchor="middle" fill="#999" fontSize="14">
              사업장별 데이터가 없습니다
            </text>
          )}
          
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
            label={{ 
              position: 'top', 
              content: (props: any) => {
                const { x, y, value, index } = props;
                if (value === undefined || value === null || value === 0) return null;
                
                const position = getLineLabelPosition(index, chartData.length, value, accidentYAxisRange);
                const isBottom = position === 'bottom';
                
                return (
                  <g>
                    <line 
                      x1={x} y1={y} 
                      x2={x - 15} y2={y + (isBottom ? 20 : -20)} 
                      stroke="#5B9BD5" strokeWidth={1} 
                    />
                    <text 
                      x={x - 15} y={y + (isBottom ? 25 : -25)} 
                      textAnchor="end" fill="#5B9BD5" fontSize="10" fontWeight="bold"
                    >
                      {value}
                    </text>
                  </g>
                );
              }
            }}
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
            label={{ 
              position: 'top', 
              content: (props: any) => {
                const { x, y, value, index } = props;
                if (value === undefined || value === null || value === 0) return null;
                
                const position = getLineLabelPosition(index, chartData.length, value, accidentYAxisRange);
                const isBottom = position === 'bottom';
                
                return (
                  <g>
                    <line 
                      x1={x} y1={y} 
                      x2={x + 15} y2={y + (isBottom ? 20 : -20)} 
                      stroke="#C55A11" strokeWidth={1} 
                    />
                    <text 
                      x={x + 15} y={y + (isBottom ? 25 : -25)} 
                      textAnchor="start" fill="#C55A11" fontSize="10" fontWeight="bold"
                    >
                      {value}
                    </text>
                  </g>
                );
              }
            }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          {/* 스크롤 기능을 위한 Brush 컴포넌트 */}
          <Brush 
            dataKey="year" 
            height={15} 
            stroke="#8884d8"
            startIndex={startIndex}
            endIndex={endIndex}
            fill="#f0f0f0"
            strokeDasharray="3 3"
            // 스크롤바 변경 시 콜백 추가
            onChange={(brushData: any) => {
              console.log('[통합차트] 스크롤바 범위 변경:', {
                brushData,
                startIndex,
                endIndex,
                totalDataPoints: chartData.length
              });
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* 범례를 차트 외부로 이동 */}
      <div className="mt-1">
        <CustomLegend payload={sites.length > 0 ? sites.map((siteName, siteIndex) => {
          const baseColor = SITE_COLORS[siteIndex % SITE_COLORS.length];
          const darkColor = darkenColor(baseColor, 0.2);
          const lightColor = lightenColor(baseColor, 0.3);
          
          console.log(`[통합차트] 범례 생성 - ${siteName}:`, {
            siteIndex,
            baseColor,
            darkColor,
            lightColor
          });
          
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
        }).flat() : []} />
      </div>
      

      
      {/* 차트 설명 */}
      <div className="mt-4 text-sm text-gray-600">
        <p>• <span className="text-blue-500 font-medium">재해건수</span>: 해당 연도의 총 사고 발생 건수 (실선 그래프)</p>
        <p>• <span className="text-orange-500 font-medium">재해자수</span>: 해당 연도의 총 재해자 수 (점선 그래프)</p>
        <p>• <span className="text-green-500 font-medium">사업장별 사고건수</span>: 각 사업장별 임직원/협력업체 구분 사고건수 (스택 막대 그래프)</p>
        <p className="text-xs text-gray-500 mt-2">💡 차트 하단의 스크롤바를 드래그하여 연도 범위를 조정할 수 있습니다.</p>
      </div>
    </div>
  );
};

export default IntegratedAccidentChart; 