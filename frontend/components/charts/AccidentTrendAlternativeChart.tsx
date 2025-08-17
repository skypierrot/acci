import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Brush
} from 'recharts';

// 차트 데이터 타입 정의
export interface AccidentTrendData {
  year: number;
  accidentCount: number;      // 재해건수
  victimCount: number;        // 재해자수
  propertyDamage: number;     // 물적피해 (천원 단위)
}

// 세부 데이터 타입 정의
export interface SiteAccidentData {
  siteName: string;
  accidentCount: number;
  employeeCount: number;
  contractorCount: number;
}

export interface InjuryTypeData {
  name: string;
  value: number;
  color: string;
}

export interface EmployeeTypeData {
  name: string;
  value: number;
  color: string;
}

export interface PropertyDamageData {
  name: string;
  directDamage: number;
  indirectDamage: number;
}

interface AccidentTrendAlternativeChartProps {
  data: AccidentTrendData[];
  siteAccidentData?: SiteAccidentData[];
  injuryTypeData?: InjuryTypeData[];
  employeeTypeData?: EmployeeTypeData[];
  propertyDamageData?: PropertyDamageData[];
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

// 파이 차트용 색상 배열
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B'];

// 파이 차트용 툴팁
const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-800 mb-2">{data.name}</p>
        <p style={{ color: data.color }} className="text-sm">
          {data.value}건 ({data.payload.percent}%)
        </p>
      </div>
    );
  }
  return null;
};

const AccidentTrendAlternativeChart: React.FC<AccidentTrendAlternativeChartProps> = ({ 
  data, 
  siteAccidentData = [],
  injuryTypeData = [],
  employeeTypeData = [],
  propertyDamageData = [],
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
          재해건수, 재해자수, 물적피해 추이 및 세부 분석
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
        재해건수, 재해자수, 물적피해 추이 및 세부 분석
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
                fill="#fbbf24"
                fillOpacity={0.6}
                strokeWidth={2}
                name="물적피해"
              />
              
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
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 사업장별 사고건수 차트 */}
        {siteAccidentData.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">사업장별 사고건수</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={siteAccidentData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="siteName" 
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={80}
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
                <Bar
                  dataKey="employeeCount"
                  fill="#3b82f6"
                  name="임직원"
                  radius={[2, 2, 0, 0]}
                  barSize={20}
                />
                <Bar
                  dataKey="contractorCount"
                  fill="#f59e0b"
                  name="협력업체"
                  radius={[2, 2, 0, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 상해정도별 분포 파이 차트 */}
        {injuryTypeData.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">상해정도별 분포</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={injuryTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {injuryTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 임직원/협력업체 구분 파이 차트 */}
        {employeeTypeData.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">임직원/협력업체 구분</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={employeeTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {employeeTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 물적피해 유형별 분포 파이 차트 */}
        {propertyDamageData.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">물적피해 유형별 분포</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={propertyDamageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {propertyDamageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      
      {/* 차트 설명 */}
      <div className="mt-4 text-sm text-gray-600">
        <p>• <span className="text-blue-500 font-medium">재해건수</span>: 해당 연도의 총 사고 발생 건수 (실선 그래프)</p>
        <p>• <span className="text-purple-500 font-medium">재해자수</span>: 해당 연도의 총 재해자 수 (실선 그래프)</p>
        <p>• <span className="text-yellow-500 font-medium">물적피해</span>: 해당 연도의 총 물적피해금액 (영역 그래프, 천원)</p>
        <p className="text-xs text-gray-500 mt-2">💡 선형 차트와 영역 차트 하단의 스크롤바를 드래그하여 연도 범위를 조정할 수 있습니다.</p>
      </div>
    </div>
  );
};

export default AccidentTrendAlternativeChart; 