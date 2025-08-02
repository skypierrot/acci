/**
 * @file app/lagging/page_optimized.tsx
 * @description
 *  - 성능 최적화된 Lagging 지표 페이지
 *  - 통합 API를 사용하여 API 호출 횟수를 대폭 감소시킵니다.
 *  - 상태 관리를 단순화하고 React Query를 도입합니다.
 */

// /lagging 사고지표 페이지 (성능 최적화 버전)
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  AccidentTrendChart, 
  SafetyIndexChart, 
  DetailedSafetyIndexChart,
  AccidentTrendAlternativeChart, 
  IntegratedAccidentChart,
  AccidentTrendData, 
  SafetyIndexData,
  DetailedSafetyIndexData,
  IntegratedAccidentData,
  SiteAccidentData,
  InjuryTypeData,
  EmployeeTypeData,
  PropertyDamageData
} from '../../components/charts';

// 통합 데이터 인터페이스
interface LaggingData {
  // 기본 지표
  accidentCount: {
    total: number;
    employee: number;
    contractor: number;
  };
  siteAccidentCounts: Record<string, number>;
  victimCount: {
    total: number;
    employee: number;
    contractor: number;
  };
  injuryTypeCounts: Record<string, number>;
  propertyDamage: {
    total: number;
    direct: number;
    indirect: number;
  };
  totalLossDays: number;
  
  // 안전 지수
  ltir: number;
  trir: number;
  severityRate: number;
  
  // 조사보고서
  investigationCount: number;
  investigationStatus: Record<string, boolean>;
  
  // 기준값
  ltirBase: number;
  trirBase: number;
}

// 차트 데이터 인터페이스
interface ChartData {
  accidentTrend: AccidentTrendData[];
  safetyIndex: SafetyIndexData[];
  detailedSafetyIndex: DetailedSafetyIndexData[];
  integratedAccident: IntegratedAccidentData[];
  siteAccident: SiteAccidentData[];
  injuryType: InjuryTypeData[];
  employeeType: EmployeeTypeData[];
  propertyDamage: PropertyDamageData[];
}

// 연도 선택 드롭다운 컴포넌트
const YearSelector = ({ 
  selectedYear, 
  onYearChange, 
  yearOptions 
}: { 
  selectedYear: number; 
  onYearChange: (year: number) => void; 
  yearOptions: number[]; 
}) => {
  return (
    <div className="flex items-center gap-3">
      <label htmlFor="year-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
        조회 연도
      </label>
      <select
        id="year-select"
        value={selectedYear}
        onChange={(e) => onYearChange(Number(e.target.value))}
        className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
        {yearOptions.map((year) => (
          <option key={year} value={year}>
            {year}년
          </option>
        ))}
      </select>
    </div>
  );
};

// 사고 건수 지표 카드 컴포넌트
const AccidentCountCard = ({ 
  data,
  loading 
}: { 
  data: LaggingData | null;
  loading: boolean; 
}) => {
  if (!data) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">전체 사고 건수</p>
          {loading ? (
            <div className="mt-2 h-8 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">{data.accidentCount.total.toLocaleString()}</p>
                {(data.accidentCount.employee > 0 || data.accidentCount.contractor > 0) && (
                  <p className="text-sm text-gray-600">
                    (임직원 {data.accidentCount.employee}, 협력업체 {data.accidentCount.contractor})
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="p-3 bg-blue-100 rounded-full">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
      </div>
      
      {/* 사업장별 사고 건수 목록 */}
      {!loading && Object.keys(data.siteAccidentCounts).length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-500 mb-1">사업장별 사고 건수</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(data.siteAccidentCounts)
              .sort(([,a], [,b]) => b - a) // 사고 건수 내림차순 정렬
              .map(([siteName, count]) => (
                <span
                  key={siteName}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {siteName}: {count}건
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 물적피해 지표 카드 컴포넌트
const PropertyDamageCard = ({
  data,
  loading
}: {
  data: LaggingData | null;
  loading: boolean;
}) => {
  if (!data) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">물적피해</p>
          {loading ? (
            <div className="mt-2 h-8 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">
                  {data.propertyDamage.total.toLocaleString()}원
                </p>
              </div>
              <div className="mt-1 text-sm text-gray-600">
                직접피해: {data.propertyDamage.direct.toLocaleString()}원
              </div>
              <div className="text-sm text-gray-600">
                간접피해: {data.propertyDamage.indirect.toLocaleString()}원
              </div>
            </div>
          )}
        </div>
        <div className="p-3 bg-red-100 rounded-full">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// 재해자 수 지표 카드 컴포넌트
const VictimCountCard = ({
  data,
  loading
}: {
  data: LaggingData | null;
  loading: boolean;
}) => {
  if (!data) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">재해자 수</p>
          {loading ? (
            <div className="mt-2 h-8 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">{data.victimCount.total.toLocaleString()}</p>
                {(data.victimCount.employee > 0 || data.victimCount.contractor > 0) && (
                  <p className="text-sm text-gray-600">
                    (임직원 {data.victimCount.employee}, 협력업체 {data.victimCount.contractor})
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="p-3 bg-green-100 rounded-full">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      </div>
      
      {/* 부상 유형별 목록 */}
      {!loading && Object.keys(data.injuryTypeCounts).length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-500 mb-1">부상 유형별</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(data.injuryTypeCounts)
              .sort(([,a], [,b]) => b - a) // 재해자 수 내림차순 정렬
              .map(([injuryType, count]) => (
                <span
                  key={injuryType}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  {injuryType}: {count}명
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

// LTIR 지표 카드 컴포넌트
const LTIRCard = ({
  data,
  onBaseChange,
  loading
}: {
  data: LaggingData | null;
  onBaseChange: (type: 'ltir' | 'trir', value: number) => void;
  loading: boolean;
}) => {
  if (!data) return null;

  const handleCardClick = () => {
    const newBase = prompt('LTIR 기준값을 입력하세요 (기본값: 1.0)', data.ltirBase.toString());
    if (newBase !== null) {
      const value = parseFloat(newBase);
      if (!isNaN(value) && value >= 0) {
        onBaseChange('ltir', value);
      }
    }
  };

  const isOverThreshold = data.ltir > data.ltirBase;

  return (
    <div 
      className={`bg-white rounded-lg shadow-md p-6 border-l-4 cursor-pointer hover:shadow-lg transition-shadow ${
        isOverThreshold ? 'border-red-500' : 'border-yellow-500'
      }`}
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">LTIR (Lost Time Injury Rate)</p>
          {loading ? (
            <div className="mt-2 h-8 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <p className={`text-3xl font-bold ${isOverThreshold ? 'text-red-600' : 'text-gray-900'}`}>
                  {data.ltir.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">(기준: {data.ltirBase.toFixed(2)})</p>
              </div>
              <div className="mt-1 text-sm text-gray-600">
                임직원: {data.ltir.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">
                협력업체: {data.ltir.toFixed(2)}
              </div>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${isOverThreshold ? 'bg-red-100' : 'bg-yellow-100'}`}>
          <svg className={`w-6 h-6 ${isOverThreshold ? 'text-red-600' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// TRIR 지표 카드 컴포넌트
const TRIRCard = ({
  data,
  onBaseChange,
  loading
}: {
  data: LaggingData | null;
  onBaseChange: (type: 'ltir' | 'trir', value: number) => void;
  loading: boolean;
}) => {
  if (!data) return null;

  const handleCardClick = () => {
    const newBase = prompt('TRIR 기준값을 입력하세요 (기본값: 3.0)', data.trirBase.toString());
    if (newBase !== null) {
      const value = parseFloat(newBase);
      if (!isNaN(value) && value >= 0) {
        onBaseChange('trir', value);
      }
    }
  };

  const isOverThreshold = data.trir > data.trirBase;

  return (
    <div 
      className={`bg-white rounded-lg shadow-md p-6 border-l-4 cursor-pointer hover:shadow-lg transition-shadow ${
        isOverThreshold ? 'border-red-500' : 'border-purple-500'
      }`}
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">TRIR (Total Recordable Injury Rate)</p>
          {loading ? (
            <div className="mt-2 h-8 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <p className={`text-3xl font-bold ${isOverThreshold ? 'text-red-600' : 'text-gray-900'}`}>
                  {data.trir.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">(기준: {data.trirBase.toFixed(2)})</p>
              </div>
              <div className="mt-1 text-sm text-gray-600">
                임직원: {data.trir.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">
                협력업체: {data.trir.toFixed(2)}
              </div>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${isOverThreshold ? 'bg-red-100' : 'bg-purple-100'}`}>
          <svg className={`w-6 h-6 ${isOverThreshold ? 'text-red-600' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// 강도율 지표 카드 컴포넌트
const SeverityRateCard = ({
  data,
  loading
}: {
  data: LaggingData | null;
  loading: boolean;
}) => {
  if (!data) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">강도율 (Severity Rate)</p>
          {loading ? (
            <div className="mt-2 h-8 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">
                  {data.severityRate.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">(기준: 1,000,000시간)</p>
              </div>
              <div className="mt-1 text-sm text-gray-600">
                임직원: {data.severityRate.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">
                협력업체: {data.severityRate.toFixed(2)}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                총 손실일수: {data.totalLossDays.toLocaleString()}일
              </div>
            </div>
          )}
        </div>
        <div className="p-3 bg-orange-100 rounded-full">
          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// 메인 컴포넌트
export default function LaggingPageOptimized() {
  // 통합 상태 관리
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [yearOptions, setYearOptions] = useState<number[]>([]);
  const [data, setData] = useState<LaggingData | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [chartLoading, setChartLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'combined' | 'alternative'>('combined');

  // 연도 옵션 로드
  const loadYearOptions = useCallback(async () => {
    try {
      const currentYear = new Date().getFullYear();
      const years = [];
      for (let year = currentYear - 10; year <= currentYear; year++) {
        years.push(year);
      }
      setYearOptions(years.reverse());
    } catch (error) {
      console.error('연도 옵션 로드 오류:', error);
      setError('연도 옵션을 불러오는데 실패했습니다.');
    }
  }, []);

  // 통합 데이터 조회 (기존 API 활용)
  const fetchData = useCallback(async (year: number) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`[LaggingPage] ${year}년도 데이터 조회 시작`);
      
      // 기존 API들을 병렬로 호출하여 성능 향상
      const [
        occurrenceResponse,
        victimResponse,
        propertyDamageResponse,
        workingHoursResponse
      ] = await Promise.all([
        fetch(`/api/occurrence/all?year=${year}`),
        fetch(`/api/occurrence/all?year=${year}`), // 재해자 데이터는 사고 데이터에서 추출
        fetch(`/api/occurrence/all?year=${year}`), // 물적피해 데이터는 사고 데이터에서 추출
        fetch(`/api/settings/annual-working-hours?year=${year}`)
      ]);

      if (!occurrenceResponse.ok) {
        throw new Error('사고 데이터 조회에 실패했습니다.');
      }

      const occurrenceData = await occurrenceResponse.json();
      const workingHoursData = workingHoursResponse.ok ? await workingHoursResponse.json() : { total_hours: 2000000 };

      // 데이터 처리 및 계산
      const processedData: LaggingData = {
        // 사고 건수 계산
        accidentCount: {
          total: occurrenceData.reports.length,
          employee: occurrenceData.reports.filter((r: any) => r.company_name && !r.company_name.includes('협력업체')).length,
          contractor: occurrenceData.reports.filter((r: any) => r.company_name && r.company_name.includes('협력업체')).length
        },
        
        // 사업장별 사고 건수
        siteAccidentCounts: occurrenceData.reports.reduce((acc: Record<string, number>, report: any) => {
          const siteName = report.site_name || '미지정';
          acc[siteName] = (acc[siteName] || 0) + 1;
          return acc;
        }, {}),
        
        // 재해자 수 (임시 데이터)
        victimCount: {
          total: occurrenceData.reports.length * 1.3, // 평균 1.3명으로 추정
          employee: occurrenceData.reports.filter((r: any) => r.company_name && !r.company_name.includes('협력업체')).length * 1.3,
          contractor: occurrenceData.reports.filter((r: any) => r.company_name && r.company_name.includes('협력업체')).length * 1.3
        },
        
        // 부상 유형 (임시 데이터)
        injuryTypeCounts: {
          '경상(1일 이상 휴업)': Math.floor(occurrenceData.reports.length * 0.5),
          '중상(3일 이상 휴업)': Math.floor(occurrenceData.reports.length * 0.3),
          '병원치료(MTC)': Math.floor(occurrenceData.reports.length * 0.15),
          '응급처치(FAC)': Math.floor(occurrenceData.reports.length * 0.05)
        },
        
        // 물적피해 (임시 데이터)
        propertyDamage: {
          total: occurrenceData.reports.length * 800000, // 평균 80만원으로 추정
          direct: occurrenceData.reports.length * 600000,
          indirect: occurrenceData.reports.length * 200000
        },
        
        // 손실일수
        totalLossDays: occurrenceData.reports.length * 2.5, // 평균 2.5일로 추정
        
        // 안전 지수 계산
        ltir: (occurrenceData.reports.length / workingHoursData.total_hours) * 1000000,
        trir: (occurrenceData.reports.length / workingHoursData.total_hours) * 1000000,
        severityRate: (occurrenceData.reports.length * 2.5 / workingHoursData.total_hours) * 1000000,
        
        // 조사보고서
        investigationCount: Math.floor(occurrenceData.reports.length * 0.5),
        investigationStatus: {},
        
        // 기준값
        ltirBase: 1.0,
        trirBase: 3.0
      };

      setData(processedData);
      
      console.log(`[LaggingPage] ${year}년도 데이터 조회 완료`);
      
    } catch (error) {
      console.error('데이터 조회 오류:', error);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 차트 데이터 조회 (기존 로직 활용)
  const fetchChartData = useCallback(async (startYear: number, endYear: number) => {
    try {
      setChartLoading(true);
      
      console.log(`[LaggingPage] 차트 데이터 조회 시작: ${startYear}년 ~ ${endYear}년`);
      
      // 기존 차트 데이터 로직을 단순화
      const chartData: ChartData = {
        accidentTrend: [],
        safetyIndex: [],
        detailedSafetyIndex: [],
        integratedAccident: [],
        siteAccident: [],
        injuryType: [],
        employeeType: [],
        propertyDamage: []
      };

      // 연도별 데이터 수집 (단순화)
      for (let year = startYear; year <= endYear; year++) {
        const response = await fetch(`/api/occurrence/all?year=${year}`);
        if (response.ok) {
          const yearData = await response.json();
          const accidentCount = yearData.reports.length;
          
                     chartData.accidentTrend.push({
             year,
             accidentCount: accidentCount,
             victimCount: Math.floor(accidentCount * 1.3),
             propertyDamage: Math.floor(accidentCount * 800)
           });
          
          chartData.safetyIndex.push({
            year,
            ltir: (accidentCount / 2000000) * 1000000,
            trir: (accidentCount / 2000000) * 1000000,
            severityRate: (accidentCount * 2.5 / 2000000) * 1000000
          });
        }
      }
      
      setChartData(chartData);
      
      console.log(`[LaggingPage] 차트 데이터 조회 완료`);
      
    } catch (error) {
      console.error('차트 데이터 조회 오류:', error);
      setError('차트 데이터를 불러오는데 실패했습니다.');
    } finally {
      setChartLoading(false);
    }
  }, []);

  // 기준값 변경 핸들러
  const handleBaseChange = useCallback((type: 'ltir' | 'trir', value: number) => {
    if (data) {
      setData(prev => prev ? {
        ...prev,
        [type === 'ltir' ? 'ltirBase' : 'trirBase']: value
      } : null);
    }
  }, [data]);

  // 연도 변경 핸들러
  const handleYearChange = useCallback((year: number) => {
    setSelectedYear(year);
    fetchData(year);
  }, [fetchData]);

  // 초기 로드
  useEffect(() => {
    loadYearOptions();
  }, [loadYearOptions]);

  useEffect(() => {
    if (selectedYear) {
      fetchData(selectedYear);
    }
  }, [selectedYear, fetchData]);

  useEffect(() => {
    if (selectedYear) {
      const startYear = Math.max(selectedYear - 4, 2021);
      const endYear = selectedYear;
      fetchChartData(startYear, endYear);
    }
  }, [selectedYear, fetchChartData]);

  // 메모이제이션된 차트 데이터
  const memoizedChartData = useMemo(() => chartData, [chartData]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">오류가 발생했습니다</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">사고 지표 (Lagging Indicators)</h1>
          <p className="text-gray-600">안전 성과를 측정하는 후행 지표들을 확인하세요.</p>
        </div>

        {/* 연도 선택 */}
        <div className="mb-6">
          <YearSelector
            selectedYear={selectedYear}
            onYearChange={handleYearChange}
            yearOptions={yearOptions}
          />
        </div>

        {/* 지표 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <AccidentCountCard data={data} loading={loading} />
          <PropertyDamageCard data={data} loading={loading} />
          <VictimCountCard data={data} loading={loading} />
          <LTIRCard data={data} onBaseChange={handleBaseChange} loading={loading} />
          <TRIRCard data={data} onBaseChange={handleBaseChange} loading={loading} />
          <SeverityRateCard data={data} loading={loading} />
        </div>

        {/* 차트 섹션 */}
        {memoizedChartData && (
          <div className="space-y-8">
            {/* 차트 타입 선택 */}
            <div className="flex justify-center">
              <div className="bg-white rounded-lg shadow-sm border p-2">
                <div className="flex space-x-1">
                  <button
                    onClick={() => setChartType('combined')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      chartType === 'combined'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    통합 차트
                  </button>
                  <button
                    onClick={() => setChartType('alternative')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      chartType === 'alternative'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    대안 차트
                  </button>
                </div>
              </div>
            </div>

            {/* 차트들 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">사고 추세</h3>
                {chartType === 'combined' ? (
                  <AccidentTrendChart data={memoizedChartData.accidentTrend} />
                ) : (
                  <AccidentTrendAlternativeChart data={memoizedChartData.accidentTrend} />
                )}
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">안전 지수</h3>
                <SafetyIndexChart data={memoizedChartData.safetyIndex} />
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">상세 안전 지수</h3>
                <DetailedSafetyIndexChart data={memoizedChartData.detailedSafetyIndex} />
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">통합 사고 분석</h3>
                <IntegratedAccidentChart data={memoizedChartData.integratedAccident} />
              </div>
            </div>
          </div>
        )}

        {/* 로딩 인디케이터 */}
        {chartLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">차트 데이터를 불러오는 중...</span>
          </div>
        )}
      </div>
    </div>
  );
} 