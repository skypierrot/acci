// /lagging 사고지표 페이지
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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

// 🔧 로깅 중복 방지를 위한 유틸리티 함수
const createLogger = (componentName: string) => {
  const logCache = new Map<string, number>();
  const LOG_THROTTLE_MS = 1000; // 1초 내 동일 로그 중복 방지
  
  return {
    log: (message: string, data?: any) => {
      const now = Date.now();
      const lastLogTime = logCache.get(message) || 0;
      
      if (now - lastLogTime > LOG_THROTTLE_MS) {
        console.log(`[${componentName}] ${message}`, data);
        logCache.set(message, now);
      }
    },
    
    error: (message: string, error?: any) => {
      const now = Date.now();
      const lastLogTime = logCache.get(`ERROR:${message}`) || 0;
      
      if (now - lastLogTime > LOG_THROTTLE_MS) {
        console.error(`[${componentName}] ${message}`, error);
        logCache.set(`ERROR:${message}`, now);
      }
    },
    
    warn: (message: string, data?: any) => {
      const now = Date.now();
      const lastLogTime = logCache.get(`WARN:${message}`) || 0;
      
      if (now - lastLogTime > LOG_THROTTLE_MS) {
        console.warn(`[${componentName}] ${message}`, data);
        logCache.set(`WARN:${message}`, now);
      }
    }
  };
};

// 로딩 단계 타입
type LoadingStage = 'initial' | 'data' | 'charts' | 'complete';

// 탭 타입 정의
type TabType = 'overview' | 'charts';

// 모바일 탭 네비게이션 컴포넌트
const MobileTabNavigation = ({ 
  activeTab, 
  onTabChange 
}: { 
  activeTab: TabType; 
  onTabChange: (tab: TabType) => void; 
}) => {
  const tabs = [
    { id: 'overview' as TabType, label: '주요지표', icon: '📊' },
    { id: 'charts' as TabType, label: '차트분석', icon: '📈' }
  ];

  return (
    <div className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex flex-col items-center">
              <span className="text-lg mb-1">{tab.icon}</span>
              <span>{tab.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// 전체 페이지 로딩 오버레이 컴포넌트
const FullPageLoadingOverlay = ({ 
  stage,
  isVisible 
}: { 
  stage: LoadingStage;
  isVisible: boolean;
}) => {
  const stageMessages = {
    initial: '페이지를 초기화하는 중...',
    data: '지표 데이터를 불러오는 중...',
    charts: '차트 데이터를 준비하는 중...',
    complete: '완료'
  };

  const stageProgress = {
    initial: 25,
    data: 60,
    charts: 90,
    complete: 100
  };

  const stageIcons = {
    initial: (
      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    data: (
      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    charts: (
      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    complete: null
  };

  if (!isVisible || stage === 'complete') return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        {/* 로딩 아이콘 */}
        <div className="mb-6">
          {stageIcons[stage]}
        </div>
        
        {/* 로딩 스피너 */}
        <div className="mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
        
        {/* 메시지 */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          사고 지표 데이터 로딩 중
        </h2>
        <p className="text-gray-600 mb-6">
          {stageMessages[stage]}
        </p>
        
        {/* 진행률 바 */}
        <div className="w-64 mx-auto">
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${stageProgress[stage]}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500">
            {stageProgress[stage]}% 완료
          </p>
        </div>
        
        {/* 추가 정보 */}
        <div className="mt-8 text-sm text-gray-500">
          <p>잠시만 기다려주세요...</p>
        </div>
      </div>
    </div>
  );
};

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
  count,
  employeeAccidentCount,
  contractorAccidentCount,
  siteAccidentCounts,
  loading 
}: { 
  count: number;
  employeeAccidentCount: number;
  contractorAccidentCount: number;
  siteAccidentCounts: Record<string, number>;
  loading: boolean; 
}) => {
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
                <p className="text-3xl font-bold text-gray-900">{count.toLocaleString()}</p>
                {(employeeAccidentCount > 0 || contractorAccidentCount > 0) && (
                  <p className="text-sm text-gray-600">
                    (임직원 {employeeAccidentCount}, 협력업체 {contractorAccidentCount})
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
      {!loading && Object.keys(siteAccidentCounts).length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-500 mb-1">사업장별 사고 건수</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(siteAccidentCounts)
              .sort(([,a], [,b]) => b - a) // 사고 건수 내림차순 정렬
              .map(([siteName, count]) => (
                <div key={siteName} className="flex items-center px-2 py-0.5 bg-gray-50 rounded text-xs">
                  <span className="text-gray-700">{siteName}</span>
                  <span className="font-medium text-gray-900 ml-1">{count}건</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 물적피해금액 카드 컴포넌트
const PropertyDamageCard = ({
  directDamageAmount,
  indirectDamageAmount,
  loading
}: {
  directDamageAmount: number;
  indirectDamageAmount: number;
  loading: boolean;
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">물적피해금액</p>
          {loading ? (
            <div className="mt-2 h-8 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">{directDamageAmount.toLocaleString()}</p>
                <p className="text-sm text-gray-600">천원</p>
              </div>
            </div>
          )}
        </div>
        <div className="p-3 bg-orange-100 rounded-full">
          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
      </div>
      
      {/* 간접피해금액 */}
      {!loading && indirectDamageAmount > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-500 mb-1">간접피해금액 (직접피해금액×4)</p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold text-gray-900">{indirectDamageAmount.toLocaleString()}</span>
            <span className="text-sm text-gray-600">천원</span>
          </div>
        </div>
      )}
    </div>
  );
};

// 재해자 수 및 상해정도별 카운트 카드 컴포넌트
const VictimCountCard = ({
  count,
  employeeCount,
  contractorCount,
  injuryTypeCounts,
  loading
}: {
  count: number;
  employeeCount: number;
  contractorCount: number;
  injuryTypeCounts: Record<string, number>;
  loading: boolean;
}) => {
  // 상해정도별 색상 매핑 (괄호 제거된 이름)
  const colorMap: Record<string, string> = {
    '응급처치': 'bg-green-100 text-green-700',
    '병원치료': 'bg-blue-100 text-blue-700',
    '경상': 'bg-yellow-100 text-yellow-700',
    '중상': 'bg-orange-100 text-orange-700',
    '사망': 'bg-red-100 text-red-700',
    '기타': 'bg-gray-100 text-gray-700',
  };
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-rose-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">재해자 수</p>
          {loading ? (
            <div className="mt-2 h-8 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">{count.toLocaleString()}</p>
                {(employeeCount > 0 || contractorCount > 0) && (
                  <p className="text-sm text-gray-600">
                    (임직원 {employeeCount}, 협력업체 {contractorCount})
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="p-3 bg-rose-100 rounded-full">
          <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4V7a4 4 0 00-8 0v3m12 4a4 4 0 01-8 0m8 0a4 4 0 01-8 0" />
          </svg>
        </div>
      </div>
      {/* 상해정도별 카운트 (심각도 순서로 정렬) */}
      <div className="mt-3">
        <p className="text-xs font-medium text-gray-500 mb-1">상해정도</p>
        <div className="flex flex-wrap gap-2">
          {(() => {
            // 상해정도 표시 순서 정의 (심각도 순)
            const displayOrder = ['사망', '중상', '경상', '병원치료', '응급처치', '기타'];
            
            // 정의된 순서대로 정렬하여 표시
            return displayOrder
              .filter(type => injuryTypeCounts[type] && injuryTypeCounts[type] > 0)
              .map(type => (
                <span
                  key={type}
                  className={`px-2 py-1 rounded text-xs font-semibold ${colorMap[type] || 'bg-gray-100 text-gray-700'}`}
                >
                  {type}: {injuryTypeCounts[type]}
                </span>
              ));
          })()}
        </div>
      </div>
    </div>
  );
};

// LTIR 카드 컴포넌트
const LTIRCard = ({
  ltir,
  employeeLtir,
  contractorLtir,
  ltirBase,
  setLtirBase,
  loading
}: {
  ltir: number;
  employeeLtir: number;
  contractorLtir: number;
  ltirBase: number;
  setLtirBase: (v: number) => void;
  loading: boolean;
}) => {
  const handleCardClick = () => {
    if (!loading) {
      setLtirBase(ltirBase === 200000 ? 1000000 : 200000);
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500 ${!loading ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">LTIR</p>
          {loading ? (
            <div className="mt-2 h-8 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">{ltir.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>
        <div className="p-3 bg-indigo-100 rounded-full">
          <div className="w-6 h-6 flex items-center justify-center">
            <span className="text-indigo-600 text-xs font-bold text-center">
              {ltirBase === 200000 ? '20만시' : '100만시'}
            </span>
          </div>
        </div>
      </div>
      
      {/* 임직원/협력업체 LTIR */}
      {!loading && (
        <div className="mt-3">
          <div className="flex gap-8">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">임직원 LTIR</p>
              <span className="text-lg font-semibold text-gray-900">{employeeLtir.toFixed(2)}</span>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">협력업체 LTIR</p>
              <span className="text-lg font-semibold text-gray-900">{contractorLtir.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// TRIR 카드 컴포넌트 (LTIR과 동일하지만 기준이상 사고 건수에 경상, 병원치료 포함)
const TRIRCard = ({
  trir,
  employeeTrir,
  contractorTrir,
  trirBase,
  setTrirBase,
  loading
}: {
  trir: number;
  employeeTrir: number;
  contractorTrir: number;
  trirBase: number;
  setTrirBase: (v: number) => void;
  loading: boolean;
}) => {
  const handleCardClick = () => {
    if (!loading) {
      setTrirBase(trirBase === 200000 ? 1000000 : 200000);
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500 ${!loading ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">TRIR</p>
          {loading ? (
            <div className="mt-2 h-8 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">{trir.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>
        <div className="p-3 bg-purple-100 rounded-full">
          <div className="w-6 h-6 flex items-center justify-center">
            <span className="text-purple-600 text-xs font-bold text-center">
              {trirBase === 200000 ? '20만시' : '100만시'}
            </span>
          </div>
        </div>
      </div>
      
      {/* 임직원/협력업체 TRIR */}
      {!loading && (
        <div className="mt-3">
          <div className="flex gap-8">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">임직원 TRIR</p>
              <span className="text-lg font-semibold text-gray-900">{employeeTrir.toFixed(2)}</span>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">협력업체 TRIR</p>
              <span className="text-lg font-semibold text-gray-900">{contractorTrir.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 강도율 카드 컴포넌트
const SeverityRateCard = ({
  severityRate,
  employeeSeverityRate,
  contractorSeverityRate,
  totalLossDays,
  loading
}: {
  severityRate: number;
  employeeSeverityRate: number;
  contractorSeverityRate: number;
  totalLossDays: number;
  loading: boolean;
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">강도율</p>
          {loading ? (
            <div className="mt-2 h-8 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">{severityRate.toFixed(2)}</p>
                <p className="text-sm text-gray-600">(총 근로손실일 {totalLossDays}일)</p>
              </div>
            </div>
          )}
        </div>
        <div className="p-3 bg-green-100 rounded-full">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>
      
      {/* 임직원/협력업체 강도율 */}
      {!loading && (
        <div className="mt-3">
          <div className="flex gap-8">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">임직원 강도율</p>
              <span className="text-lg font-semibold text-gray-900">{employeeSeverityRate.toFixed(2)}</span>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">협력업체 강도율</p>
              <span className="text-lg font-semibold text-gray-900">{contractorSeverityRate.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 캐시 시스템 (컴포넌트 외부로 이동)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5분

// 캐시된 함수 래퍼
const withCache = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyGenerator: (...args: T) => string
) => {
  return async (...args: T): Promise<R> => {
    const key = keyGenerator(...args);
    const now = Date.now();
    
    // 캐시 확인
    const cached = cache.get(key);
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log(`[캐시] ${key} 캐시 사용`);
      return cached.data;
    }
    
    // 함수 실행
    console.log(`[캐시] ${key} API 호출`);
    const result = await fn(...args);
    
    // 캐시 저장
    cache.set(key, { data: result, timestamp: now });
    
    return result;
  };
};

export default function LaggingPage() {
  // 🔧 로거 인스턴스 생성
  const logger = createLogger('LaggingPage');
  
  // 상태 관리
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [yearOptions, setYearOptions] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [accidentCount, setAccidentCount] = useState<number>(0);
  const [employeeAccidentCount, setEmployeeAccidentCount] = useState<number>(0);
  const [contractorAccidentCount, setContractorAccidentCount] = useState<number>(0);
  const [siteAccidentCounts, setSiteAccidentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 전체 페이지 로딩 상태 관리
  const [loadingStage, setLoadingStage] = useState<LoadingStage>('initial');
  const showLoadingOverlay = loadingStage !== 'complete';
  
  // 통합 데이터 로딩 함수
  const loadAllData = async (year: number) => {
    try {
      setLoadingStage('data');
      logger.log(`${year}년도 통합 데이터 로딩 시작`);
      
      // 모든 데이터를 병렬로 로딩
      const [
        accidentData,
        victimData,
        propertyData,
        ltirData,
        trirData,
        severityData,
        chartData,
        detailedChartData
      ] = await Promise.all([
        fetchAccidentCountByYear(year),
        fetchVictimStatsByYear(year),
        fetchPropertyDamageByYear(year),
        calculateLTIR(year),
        calculateTRIR(year),
        calculateSeverityRate(year),
        fetchChartData(),
        fetchDetailedSafetyIndexData()
      ]);
      
      logger.log(`${year}년도 통합 데이터 로딩 완료`);
      setLoadingStage('complete');
      
    } catch (error) {
      logger.error('통합 데이터 로딩 오류:', error);
      setError('데이터를 불러오는데 실패했습니다.');
      setLoadingStage('complete');
    }
  };

  // 사업장 정보를 가져오는 함수
  const fetchSiteInfo = async () => {
    try {
      const response = await fetch('/api/companies');
      if (!response.ok) throw new Error('사업장 정보 조회 실패');
      const companies = await response.json();
      
      // 사업장 코드와 이름을 매핑하는 객체 생성
      const siteCodeToName: Record<string, string> = {};
      companies.forEach((company: any) => {
        if (company.sites && Array.isArray(company.sites)) {
          company.sites.forEach((site: any) => {
            siteCodeToName[site.code] = site.name;
          });
        }
      });
      
      return siteCodeToName;
    } catch (error) {
      logger.error('사업장 정보 조회 오류:', error);
      // 기본 매핑 반환
      return {
        'A': '가상사업장',
        'B': '나상사업장',
        'C': '다상사업장',
        'D': '라상사업장',
        'E': '마상사업장'
      };
    }
  };
  const [victimCount, setVictimCount] = useState<number>(0);
  const [employeeCount, setEmployeeCount] = useState<number>(0);
  const [contractorCount, setContractorCount] = useState<number>(0);
  const [injuryTypeCounts, setInjuryTypeCounts] = useState<Record<string, number>>({});
  const [victimLoading, setVictimLoading] = useState<boolean>(true);
  const [directDamageAmount, setDirectDamageAmount] = useState<number>(0);
  const [indirectDamageAmount, setIndirectDamageAmount] = useState<number>(0);
  const [propertyDamageLoading, setPropertyDamageLoading] = useState<boolean>(true);
  const [ltirBase, setLtirBase] = useState<number>(200000);
  const [ltir, setLtir] = useState<number>(0);
  const [employeeLtir, setEmployeeLtir] = useState<number>(0);
  const [contractorLtir, setContractorLtir] = useState<number>(0);
  const [ltirLoading, setLtirLoading] = useState<boolean>(true);
  
  // TRIR 관련 상태 (LTIR과 동일한 기준 사용)
  const [trir, setTrir] = useState<number>(0);
  const [employeeTrir, setEmployeeTrir] = useState<number>(0);
  const [contractorTrir, setContractorTrir] = useState<number>(0);
  const [trirLoading, setTrirLoading] = useState<boolean>(true);
  
  // 강도율 관련 상태
  const [severityRate, setSeverityRate] = useState<number>(0);
  const [employeeSeverityRate, setEmployeeSeverityRate] = useState<number>(0);
  const [contractorSeverityRate, setContractorSeverityRate] = useState<number>(0);
  const [totalLossDays, setTotalLossDays] = useState<number>(0);
  const [severityRateLoading, setSeverityRateLoading] = useState<boolean>(true);

  // 그래프 데이터 관련 상태
  const [accidentTrendData, setAccidentTrendData] = useState<AccidentTrendData[]>([]);
  const [safetyIndexData, setSafetyIndexData] = useState<SafetyIndexData[]>([]);
  const [chartLoading, setChartLoading] = useState<boolean>(false);
  const [chartType, setChartType] = useState<'combined' | 'alternative'>('combined');

  // 세부 데이터 차트 관련 상태
  const [siteAccidentData, setSiteAccidentData] = useState<SiteAccidentData[]>([]);
  const [injuryTypeData, setInjuryTypeData] = useState<InjuryTypeData[]>([]);
  const [employeeTypeData, setEmployeeTypeData] = useState<EmployeeTypeData[]>([]);
  const [propertyDamageData, setPropertyDamageData] = useState<PropertyDamageData[]>([]);
  const [detailChartLoading, setDetailChartLoading] = useState<boolean>(false);

  // 통합 차트 관련 상태
  const [integratedChartData, setIntegratedChartData] = useState<IntegratedAccidentData[]>([]);
  const [integratedChartLoading, setIntegratedChartLoading] = useState<boolean>(false);

  // 상세 차트 관련 상태
  const [detailedSafetyIndexData, setDetailedSafetyIndexData] = useState<DetailedSafetyIndexData[]>([]);
  const [detailedChartLoading, setDetailedChartLoading] = useState<boolean>(false);

  // 데이터 캐시 시스템 (연도별 임직원/협력업체 데이터)
  const [yearlyDataCache, setYearlyDataCache] = useState<Map<number, {
    ltir: { total: number; employee: number; contractor: number };
    trir: { total: number; employee: number; contractor: number };
    severityRate: { total: number; employee: number; contractor: number };
  }>>(new Map());

  // 컴포넌트 내부 캐시 시스템
  const componentCache = useMemo(() => new Map<string, { data: any; timestamp: number }>(), []);
  const CACHE_DURATION = 5 * 60 * 1000; // 5분

  // 캐시된 근로시간 조회
  const fetchAnnualWorkingHoursCached = useCallback(async (year: number) => {
    const key = `working_hours_${year}`;
    const now = Date.now();
    
    // 캐시 확인
    const cached = componentCache.get(key);
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log(`[캐시] ${key} 캐시 사용`);
      return cached.data;
    }
    
    // API 호출
    console.log(`[캐시] ${key} API 호출`);
    try {
      const response = await fetch('/api/companies');
      if (!response.ok) throw new Error('회사 정보 조회 실패');
      const companies = await response.json();
      
      if (companies.length === 0) {
        console.log('[LTIR] 회사 정보가 없습니다.');
        return { total: 0, employee: 0, contractor: 0 };
      }

      const companyId = companies[0].id;
      const hoursResponse = await fetch(`/api/settings/annual-working-hours?company_id=${companyId}&year=${year}`);
      if (!hoursResponse.ok) throw new Error('연간 근로시간 조회 실패');
      const hoursData = await hoursResponse.json();

      // 전사-종합 데이터 찾기 (site_id가 null인 경우)
      const totalData = hoursData.find((item: any) => !item.site_id);
      if (!totalData) {
        console.log('[LTIR] 전사-종합 근로시간 데이터가 없습니다.');
        return { total: 0, employee: 0, contractor: 0 };
      }

      console.log('[LTIR] 연간 근로시간 데이터:', totalData);
      
      const result = {
        total: totalData.total_hours || 0,
        employee: totalData.employee_hours || 0,
        contractor: (totalData.partner_on_hours || 0) + (totalData.partner_off_hours || 0)
      };
      
      // 캐시 저장
      componentCache.set(key, { data: result, timestamp: now });
      
      return result;
    } catch (error) {
      console.error('[LTIR] 연간 근로시간 조회 오류:', error);
      return { total: 0, employee: 0, contractor: 0 };
    }
  }, [componentCache]);

  // 사고발생보고서에서 연도 추출 함수 (글로벌 사고 코드 기준)
  const extractYearsFromReports = useCallback((reports: any[]) => {
    const years = new Set<number>();
    
    reports.forEach(report => {
      if (report.global_accident_no) {
        const parts = report.global_accident_no.split('-');
        if (parts.length >= 2) {
          const year = parseInt(parts[1], 10);
          if (!isNaN(year)) {
            years.add(year);
          }
        }
      }
    });
    
    // 년도를 내림차순으로 정렬 (최신 년도부터)
    return Array.from(years).sort((a, b) => b - a);
  }, []);

  // 기준이상 인적사고 건수 계산 함수
  const calculateLTIRAccidentCounts = useCallback(async (year: number) => {
    try {
      const response = await fetch(`/api/occurrence/all?year=${year}`);
      if (!response.ok) throw new Error('사고 목록 조회 실패');
      const data = await response.json();
      const reports = data.reports || [];

      // 인적 또는 복합 사고만 필터링
      const humanAccidents = reports.filter((r: any) =>
        r.accident_type_level1 === '인적' || r.accident_type_level1 === '복합'
      );

      console.log(`[LTIR] 전체 사고: ${reports.length}건, 인적/복합 사고: ${humanAccidents.length}건`);

      let totalSevereAccidents = 0;
      let employeeSevereAccidents = 0;
      let contractorSevereAccidents = 0;

      for (const report of humanAccidents) {
        let hasSevereInjury = false;
        
        // 재해자 정보 확인 (조사보고서 우선, 없으면 발생보고서)
        let victims: any[] = [];
        
        // 조사보고서 확인
        try {
          const invResponse = await fetch(`/api/investigation/${report.accident_id}/exists`);
          if (invResponse.ok) {
            const existsData = await invResponse.json();
            if (existsData.exists) {
              const invDataResponse = await fetch(`/api/investigation/${report.accident_id}`);
              if (invDataResponse.ok) {
                const invData = await invDataResponse.json();
                const investigationData = invData.data || invData;
                victims = investigationData.investigation_victims || investigationData.victims || [];
              }
            }
          }
        } catch (e) {
          console.log(`[LTIR] 조사보고서 확인 실패: ${report.accident_id}`);
        }

        // 조사보고서에 재해자 정보가 없으면 발생보고서에서 확인
        if (victims.length === 0) {
          if (report.victims && Array.isArray(report.victims)) {
            victims = report.victims;
          } else if (report.victims_json) {
            try {
              const arr = JSON.parse(report.victims_json);
              if (Array.isArray(arr)) victims = arr;
            } catch (e) {}
          }
        }

        // 중상, 사망, 기타 상해정도가 있는지 확인
        victims.forEach((victim: any) => {
          let injuryType = victim.injury_type || '';
          injuryType = injuryType.replace(/\([^)]*\)/g, '').trim();
          if (['중상', '사망', '기타'].includes(injuryType)) {
            hasSevereInjury = true;
          }
        });

        if (hasSevereInjury) {
          totalSevereAccidents++;
          if (report.is_contractor) {
            contractorSevereAccidents++;
          } else {
            employeeSevereAccidents++;
          }
        }
      }

      console.log(`[LTIR] 기준이상 사고 건수 - 전체: ${totalSevereAccidents}, 임직원: ${employeeSevereAccidents}, 협력업체: ${contractorSevereAccidents}`);
      
      return {
        total: totalSevereAccidents,
        employee: employeeSevereAccidents,
        contractor: contractorSevereAccidents
      };
    } catch (error) {
      console.error('[LTIR] 기준이상 사고 건수 계산 오류:', error);
      return { total: 0, employee: 0, contractor: 0 };
    }
  }, []);

  // TRIR용 기준이상 사고 건수 계산 (중상, 사망, 기타, 경상, 병원치료)
  const calculateTRIRAccidentCounts = useCallback(async (year: number) => {
    try {
      const response = await fetch(`/api/occurrence/all?year=${year}`);
      if (!response.ok) throw new Error('사고 목록 조회 실패');
      const data = await response.json();
      const reports = data.reports || [];

      // 인적 또는 복합 사고만 필터링
      const humanAccidents = reports.filter((r: any) =>
        r.accident_type_level1 === '인적' || r.accident_type_level1 === '복합'
      );

      console.log(`[TRIR] 전체 사고: ${reports.length}건, 인적/복합 사고: ${humanAccidents.length}건`);

      let totalSevereAccidents = 0;
      let employeeSevereAccidents = 0;
      let contractorSevereAccidents = 0;

      for (const report of humanAccidents) {
        let hasSevereInjury = false;
        
        // 재해자 정보 확인 (조사보고서 우선, 없으면 발생보고서)
        let victims: any[] = [];
        
        // 조사보고서 확인
        try {
          const invResponse = await fetch(`/api/investigation/${report.accident_id}/exists`);
          if (invResponse.ok) {
            const existsData = await invResponse.json();
            if (existsData.exists) {
              const invDataResponse = await fetch(`/api/investigation/${report.accident_id}`);
              if (invDataResponse.ok) {
                const invData = await invDataResponse.json();
                const investigationData = invData.data || invData;
                victims = investigationData.investigation_victims || investigationData.victims || [];
              }
            }
          }
        } catch (e) {
          console.log(`[TRIR] 조사보고서 확인 실패: ${report.accident_id}`);
        }

        // 조사보고서에 재해자 정보가 없으면 발생보고서에서 확인
        if (victims.length === 0) {
          if (report.victims && Array.isArray(report.victims)) {
            victims = report.victims;
          } else if (report.victims_json) {
            try {
              const arr = JSON.parse(report.victims_json);
              if (Array.isArray(arr)) victims = arr;
            } catch (e) {}
          }
        }

        // 중상, 사망, 기타, 경상, 병원치료 상해정도가 있는지 확인
        victims.forEach((victim: any) => {
          let injuryType = victim.injury_type || '';
          injuryType = injuryType.replace(/\([^)]*\)/g, '').trim();
          if (['중상', '사망', '기타', '경상', '병원치료'].includes(injuryType)) {
            hasSevereInjury = true;
          }
        });

        if (hasSevereInjury) {
          totalSevereAccidents++;
          if (report.is_contractor) {
            contractorSevereAccidents++;
          } else {
            employeeSevereAccidents++;
          }
        }
      }

      console.log(`[TRIR] 기준이상 사고 건수 - 전체: ${totalSevereAccidents}, 임직원: ${employeeSevereAccidents}, 협력업체: ${contractorSevereAccidents}`);
      
      return {
        total: totalSevereAccidents,
        employee: employeeSevereAccidents,
        contractor: contractorSevereAccidents
      };
    } catch (error) {
      console.error('[TRIR] 기준이상 사고 건수 계산 오류:', error);
      return { total: 0, employee: 0, contractor: 0 };
    }
  }, []);

  // 강도율용 근로손실일수 계산 함수
  const calculateSeverityRateLossDays = useCallback(async (year: number) => {
    try {
      const response = await fetch(`/api/occurrence/all?year=${year}`);
      if (!response.ok) throw new Error('사고 목록 조회 실패');
      const data = await response.json();
      const reports = data.reports || [];

      // 인적 또는 복합 사고만 필터링
      const humanAccidents = reports.filter((r: any) =>
        r.accident_type_level1 === '인적' || r.accident_type_level1 === '복합'
      );
      
      console.log(`[강도율] 전체 사고: ${reports.length}건, 인적/복합 사고: ${humanAccidents.length}건`);

      let totalLossDays = 0;
      let employeeLossDays = 0;
      let contractorLossDays = 0;

      for (const report of humanAccidents) {
        // 재해자 정보 확인 (조사보고서 우선, 없으면 발생보고서)
        let victims: any[] = [];
        
        // 조사보고서 확인
        try {
          const invResponse = await fetch(`/api/investigation/${report.accident_id}/exists`);
          if (invResponse.ok) {
            const existsData = await invResponse.json();
            if (existsData.exists) {
              const invDataResponse = await fetch(`/api/investigation/${report.accident_id}`);
              if (invDataResponse.ok) {
                const invData = await invDataResponse.json();
                const investigationData = invData.data || invData;
                victims = investigationData.investigation_victims || investigationData.victims || [];
              }
            }
          }
        } catch (e) {
          console.log(`[강도율] 조사보고서 확인 실패: ${report.accident_id}`);
        }

        // 조사보고서에 재해자 정보가 없으면 발생보고서에서 확인
        if (victims.length === 0) {
          if (report.victims && Array.isArray(report.victims)) {
            victims = report.victims;
          } else if (report.victims_json) {
            try {
              const arr = JSON.parse(report.victims_json);
              if (Array.isArray(arr)) victims = arr;
            } catch (e) {}
          }
        }

        // 각 재해자의 근로손실일수 계산
        victims.forEach((victim: any) => {
          let lossDays = 0;
          
          // absence_loss_days가 있으면 사용
          if (victim.absence_loss_days && !isNaN(victim.absence_loss_days)) {
            lossDays = Number(victim.absence_loss_days);
          } else {
            // absence_start_date와 return_expected_date로 계산
            if (victim.absence_start_date && victim.return_expected_date) {
              const startDate = new Date(victim.absence_start_date);
              const returnDate = new Date(victim.return_expected_date);
              const diffTime = returnDate.getTime() - startDate.getTime();
              lossDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
          }

          if (lossDays > 0) {
            totalLossDays += lossDays;
            if (report.is_contractor) {
              contractorLossDays += lossDays;
            } else {
              employeeLossDays += lossDays;
            }
            console.log(`[강도율] 재해자 ${victim.name || '이름없음'}: ${lossDays}일 손실`);
          }
        });
      }

      console.log(`[강도율] 근로손실일수 - 전체: ${totalLossDays}일, 임직원: ${employeeLossDays}일, 협력업체: ${contractorLossDays}일`);
      
      return {
        total: totalLossDays,
        employee: employeeLossDays,
        contractor: contractorLossDays
      };
    } catch (error) {
      console.error('[강도율] 근로손실일수 계산 오류:', error);
      return { total: 0, employee: 0, contractor: 0 };
    }
  }, []);

  // 연도별 사고 건수 조회 함수
  const fetchAccidentCountByYear = async (year: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // 백엔드 API 호출
      const response = await fetch(`/api/occurrence/all?year=${year}`);
      
      if (!response.ok) {
        throw new Error(`API 오류 (${response.status}): ${response.statusText}`);
      }
      
      const data = await response.json();
      const reports = data.reports || [];
      
      // 임직원과 협력업체 사고 건수 구분
      const employeeAccidents = reports.filter((r: any) => !r.is_contractor);
      const contractorAccidents = reports.filter((r: any) => r.is_contractor);
      
      // 사업장 정보 가져오기
      const siteCodeToName = await fetchSiteInfo();
      
      // 사업장별 사고 건수 집계
      const siteCounts: Record<string, number> = {};
      reports.forEach((report: any) => {
        // 사업장명 추출 (사업장사고코드에서 추출)
        let siteName = '기타';
        if (report.accident_id) {
          const parts = report.accident_id.split('-');
          if (parts.length >= 3) {
            // 사업장사고코드: [회사코드]-[사업장코드]-[연도]-[순번]
            const siteCode = parts[1];
            // 실제 사업장명으로 매핑
            siteName = siteCodeToName[siteCode] || `${siteCode}공장`;
          }
        }
        siteCounts[siteName] = (siteCounts[siteName] || 0) + 1;
      });
      
      setAccidentCount(reports.length);
      setEmployeeAccidentCount(employeeAccidents.length);
      setContractorAccidentCount(contractorAccidents.length);
      setSiteAccidentCounts(siteCounts);
    } catch (err: any) {
      console.error('연도별 사고 건수 조회 중 오류:', err);
      setError(err.message || '사고 건수를 불러오는 중 오류가 발생했습니다.');
      setAccidentCount(0);
      setEmployeeAccidentCount(0);
      setContractorAccidentCount(0);
      setSiteAccidentCounts({});
    } finally {
      setLoading(false);
    }
  };

  // 연도 옵션 로드 (최초 1회)
  useEffect(() => {
    const loadYearOptions = async () => {
      try {
        // 전체 사고발생보고서를 가져와서 연도 추출
        const response = await fetch('/api/occurrence?page=1&limit=10000');
        
        if (!response.ok) {
          throw new Error(`API 오류 (${response.status}): ${response.statusText}`);
        }
        
        const data = await response.json();
        const reports = data.reports || [];
        
        const years = extractYearsFromReports(reports);
        setYearOptions(years);
        
        // 기본 선택 연도를 가장 최신 연도로 설정
        if (years.length > 0) {
          const latestYear = years[0];
          setSelectedYear(latestYear);
          
          // 초기 데이터 로딩을 통합 함수로 실행
          loadAllData(latestYear);
        }
      } catch (err: any) {
        console.error('연도 옵션 로드 중 오류:', err);
        setError(err.message || '연도 목록을 불러오는 중 오류가 발생했습니다.');
      }
    };
    
    loadYearOptions();
  }, []);

  // 연도별 재해자 수 및 상해정도별 카운트 집계 함수
  const fetchVictimStatsByYear = async (year: number) => {
    // 초기 로딩 시에만 로딩 상태 설정 (중복 방지)
    if (!victimLoading) {
      setVictimLoading(true);
    }
    try {
      // 1. 연도별 사고 목록 조회
      const response = await fetch(`/api/occurrence/all?year=${year}`);
      if (!response.ok) throw new Error('사고 목록 조회 실패');
      const data = await response.json();
      const reports = data.reports || [];

      // 2. 인적/복합 사고만 필터링
      const filtered = reports.filter((r: any) =>
        r.accident_type_level1 === '인적' || r.accident_type_level1 === '복합'
      );
      
      console.log(`[재해자 통계] 전체 사고: ${reports.length}건, 인적/복합 사고: ${filtered.length}건`);

      // 3. 각 사고별로 조사보고서 존재여부 확인 및 재해자 정보 집계
      let totalVictims = 0;
      let totalEmployees = 0;
      let totalContractors = 0;
      const injuryTypeMap: Record<string, number> = {};

      // 병렬 fetch를 위해 Promise.all 사용
      await Promise.all(filtered.map(async (report: any) => {
        // 조사보고서 존재여부 확인
        let hasInvestigation = false;
        try {
          const res = await fetch(`/api/investigation/${report.accident_id}/exists`);
          if (res.ok) {
            const existsData = await res.json();
            hasInvestigation = existsData.exists;
          }
        } catch (e) {
          // ignore
        }

        let victims: any[] = [];
        // 조사보고서가 있으면 조사보고서에서 재해자 정보 조회
        if (hasInvestigation) {
          try {
            const res = await fetch(`/api/investigation/${report.accident_id}`);
            if (res.ok) {
              const invData = await res.json();
              // 조사보고서 API는 { success: true, data: {...} } 구조로 반환
              const investigationData = invData.data || invData;
              // investigation_victims 또는 victims 필드 사용
              victims = investigationData.investigation_victims || investigationData.victims || [];
              console.log(`[재해자 통계] 조사보고서 ${report.accident_id}에서 재해자 정보:`, victims);
            }
          } catch (e) {
            console.error(`[재해자 통계] 조사보고서 ${report.accident_id} 조회 오류:`, e);
          }
        } else {
          // 없으면 발생보고서의 재해자 정보 사용 (백엔드에서 이미 포함되어 반환됨)
          if (report.victims && Array.isArray(report.victims)) {
            victims = report.victims;
          } else if (report.victims_json) {
            try {
              const arr = JSON.parse(report.victims_json);
              if (Array.isArray(arr)) victims = arr;
            } catch (e) {}
          }
        }
        // 재해자 수 합산 및 임직원/협력업체 구분
        totalVictims += victims.length;
        
        // 협력업체 여부에 따라 구분
        if (report.is_contractor) {
          totalContractors += victims.length;
        } else {
          totalEmployees += victims.length;
        }
        
        // 상해정도별 카운트 집계 (괄호 제거)
        victims.forEach((v) => {
          let type = v.injury_type || '정보없음';
          // 괄호와 그 안의 내용 제거 (예: "경상(1일 이상 휴업)" → "경상")
          type = type.replace(/\([^)]*\)/g, '').trim();
          injuryTypeMap[type] = (injuryTypeMap[type] || 0) + 1;
        });
        
        console.log(`[재해자 통계] 사고 ${report.accident_id}: 재해자 ${victims.length}명, 조사보고서: ${hasInvestigation ? '있음' : '없음'}`);
      }));
      console.log(`[재해자 통계] 최종 결과: 총 재해자 ${totalVictims}명 (임직원 ${totalEmployees}명, 협력업체 ${totalContractors}명), 상해정도별:`, injuryTypeMap);
      setVictimCount(totalVictims);
      setEmployeeCount(totalEmployees);
      setContractorCount(totalContractors);
      setInjuryTypeCounts(injuryTypeMap);
    } catch (err) {
      setVictimCount(0);
      setEmployeeCount(0);
      setContractorCount(0);
      setInjuryTypeCounts({});
    } finally {
      setVictimLoading(false);
    }
  };

  // 캐시 데이터 업데이트 함수
  const updateYearlyDataCache = useCallback((year: number, data: {
    ltir: { total: number; employee: number; contractor: number };
    trir: { total: number; employee: number; contractor: number };
    severityRate: { total: number; employee: number; contractor: number };
  }) => {
    setYearlyDataCache(prev => {
      const newCache = new Map(prev);
      const existing = newCache.get(year) || {
        ltir: { total: 0, employee: 0, contractor: 0 },
        trir: { total: 0, employee: 0, contractor: 0 },
        severityRate: { total: 0, employee: 0, contractor: 0 }
      };
      newCache.set(year, { ...existing, ...data });
      return newCache;
    });
  }, []);

  // 🔧 중복 API 호출 방지를 위한 통합 계산 함수 (최적화됨)
  const calculateAllIndicatorsOnce = useCallback(async (year: number, forceRecalculate: boolean = false) => {
    // 강제 재계산이 아닌 경우 캐시된 데이터 확인
    if (!forceRecalculate) {
      const cachedData = yearlyDataCache.get(year);
      if (cachedData) {
        logger.log(`${year}년 캐시된 데이터 사용:`, cachedData);
        
        // 현재 선택된 연도인 경우에만 카드 상태 업데이트 (중복 방지)
        if (year === selectedYear) {
          // 🔧 상태가 실제로 변경된 경우에만 업데이트 (불필요한 리렌더링 방지)
          setLtir(prev => prev !== cachedData.ltir.total ? cachedData.ltir.total : prev);
          setEmployeeLtir(prev => prev !== cachedData.ltir.employee ? cachedData.ltir.employee : prev);
          setContractorLtir(prev => prev !== cachedData.ltir.contractor ? cachedData.ltir.contractor : prev);
          setTrir(prev => prev !== cachedData.trir.total ? cachedData.trir.total : prev);
          setEmployeeTrir(prev => prev !== cachedData.trir.employee ? cachedData.trir.employee : prev);
          setContractorTrir(prev => prev !== cachedData.trir.contractor ? cachedData.trir.contractor : prev);
          setSeverityRate(prev => prev !== cachedData.severityRate.total ? cachedData.severityRate.total : prev);
          setEmployeeSeverityRate(prev => prev !== cachedData.severityRate.employee ? cachedData.severityRate.employee : prev);
          setContractorSeverityRate(prev => prev !== cachedData.severityRate.contractor ? cachedData.severityRate.contractor : prev);
        }
        
        return cachedData;
      }
    }

    logger.log(`${year}년 모든 지표 계산 시작`);
    
    try {
      // 모든 계산을 병렬로 실행
      const [workingHours, ltirAccidentCounts, trirAccidentCounts, lossDays] = await Promise.all([
        fetchAnnualWorkingHoursCached(year),
        calculateLTIRAccidentCounts(year),
        calculateTRIRAccidentCounts(year),
        calculateSeverityRateLossDays(year)
      ]);

      logger.log(`${year}년 기본 데이터 수집 완료:`, {
        workingHours,
        ltirAccidentCounts,
        trirAccidentCounts,
        lossDays
      });

      // LTIR 계산
      const calculateSingleLTIR = (accidentCount: number, workingHours: number) => {
        if (workingHours === 0) return 0;
        return (accidentCount / workingHours) * ltirBase;
      };

      const totalLtir = calculateSingleLTIR(ltirAccidentCounts.total, workingHours.total);
      const employeeLtir = calculateSingleLTIR(ltirAccidentCounts.employee, workingHours.employee);
      const contractorLtir = calculateSingleLTIR(ltirAccidentCounts.contractor, workingHours.contractor);

      // TRIR 계산
      const calculateSingleTRIR = (accidentCount: number, workingHours: number) => {
        if (workingHours === 0) return 0;
        return (accidentCount / workingHours) * ltirBase;
      };

      const totalTrir = calculateSingleTRIR(trirAccidentCounts.total, workingHours.total);
      const employeeTrir = calculateSingleTRIR(trirAccidentCounts.employee, workingHours.employee);
      const contractorTrir = calculateSingleTRIR(trirAccidentCounts.contractor, workingHours.contractor);

      // 강도율 계산
      const calculateSingleSeverityRate = (lossDays: number, workingHours: number) => {
        if (workingHours === 0) return 0;
        return (lossDays / workingHours) * 1000;
      };

      const totalSeverityRate = calculateSingleSeverityRate(lossDays.total, workingHours.total);
      const employeeSeverityRate = calculateSingleSeverityRate(lossDays.employee, workingHours.employee);
      const contractorSeverityRate = calculateSingleSeverityRate(lossDays.contractor, workingHours.contractor);

      // 캐시에 모든 데이터 저장
      const cacheData = {
        ltir: { total: totalLtir, employee: employeeLtir, contractor: contractorLtir },
        trir: { total: totalTrir, employee: employeeTrir, contractor: contractorTrir },
        severityRate: { total: totalSeverityRate, employee: employeeSeverityRate, contractor: contractorSeverityRate }
      };

      updateYearlyDataCache(year, cacheData);

      logger.log(`${year}년 모든 지표 계산 완료:`, cacheData);

      // 현재 선택된 연도인 경우에만 카드 상태 업데이트 (중복 방지)
      if (year === selectedYear) {
        // 🔧 상태가 실제로 변경된 경우에만 업데이트 (불필요한 리렌더링 방지)
        setLtir(prev => prev !== totalLtir ? totalLtir : prev);
        setEmployeeLtir(prev => prev !== employeeLtir ? employeeLtir : prev);
        setContractorLtir(prev => prev !== contractorLtir ? contractorLtir : prev);
        setTrir(prev => prev !== totalTrir ? totalTrir : prev);
        setEmployeeTrir(prev => prev !== employeeTrir ? employeeTrir : prev);
        setContractorTrir(prev => prev !== contractorTrir ? contractorTrir : prev);
        setSeverityRate(prev => prev !== totalSeverityRate ? totalSeverityRate : prev);
        setEmployeeSeverityRate(prev => prev !== employeeSeverityRate ? employeeSeverityRate : prev);
        setContractorSeverityRate(prev => prev !== contractorSeverityRate ? contractorSeverityRate : prev);
        setTotalLossDays(prev => prev !== lossDays.total ? lossDays.total : prev);
      }

      return cacheData;
    } catch (error) {
      logger.error(`${year}년 계산 오류:`, error);
      return null;
    }
  }, [ltirBase, selectedYear, updateYearlyDataCache, yearlyDataCache, logger]);

  // 🔧 기존 calculateAllIndicators 함수는 하위 호환성을 위해 유지 (사용하지 않음)
  const calculateAllIndicators = useCallback(async (year: number) => {
    logger.log(`${year}년 모든 지표 계산 시작 (기존 함수)`);
    
    try {
      // 모든 계산을 병렬로 실행
      const [workingHours, ltirAccidentCounts, trirAccidentCounts, lossDays] = await Promise.all([
        fetchAnnualWorkingHoursCached(year),
        calculateLTIRAccidentCounts(year),
        calculateTRIRAccidentCounts(year),
        calculateSeverityRateLossDays(year)
      ]);

      logger.log(`${year}년 기본 데이터 수집 완료:`, {
        workingHours,
        ltirAccidentCounts,
        trirAccidentCounts,
        lossDays
      });

      // LTIR 계산
      const calculateSingleLTIR = (accidentCount: number, workingHours: number) => {
        if (workingHours === 0) return 0;
        return (accidentCount / workingHours) * ltirBase;
      };

      const totalLtir = calculateSingleLTIR(ltirAccidentCounts.total, workingHours.total);
      const employeeLtir = calculateSingleLTIR(ltirAccidentCounts.employee, workingHours.employee);
      const contractorLtir = calculateSingleLTIR(ltirAccidentCounts.contractor, workingHours.contractor);

      // TRIR 계산
      const calculateSingleTRIR = (accidentCount: number, workingHours: number) => {
        if (workingHours === 0) return 0;
        return (accidentCount / workingHours) * ltirBase;
      };

      const totalTrir = calculateSingleTRIR(trirAccidentCounts.total, workingHours.total);
      const employeeTrir = calculateSingleTRIR(trirAccidentCounts.employee, workingHours.employee);
      const contractorTrir = calculateSingleTRIR(trirAccidentCounts.contractor, workingHours.contractor);

      // 강도율 계산
      const calculateSingleSeverityRate = (lossDays: number, workingHours: number) => {
        if (workingHours === 0) return 0;
        return (lossDays / workingHours) * 1000;
      };

      const totalSeverityRate = calculateSingleSeverityRate(lossDays.total, workingHours.total);
      const employeeSeverityRate = calculateSingleSeverityRate(lossDays.employee, workingHours.employee);
      const contractorSeverityRate = calculateSingleSeverityRate(lossDays.contractor, workingHours.contractor);

      // 캐시에 모든 데이터 저장
      const cacheData = {
        ltir: { total: totalLtir, employee: employeeLtir, contractor: contractorLtir },
        trir: { total: totalTrir, employee: employeeTrir, contractor: contractorTrir },
        severityRate: { total: totalSeverityRate, employee: employeeSeverityRate, contractor: contractorSeverityRate }
      };

      updateYearlyDataCache(year, cacheData);

      logger.log(`${year}년 모든 지표 계산 완료:`, cacheData);

      // 현재 선택된 연도인 경우 카드 상태도 업데이트
      if (year === selectedYear) {
        setLtir(totalLtir);
        setEmployeeLtir(employeeLtir);
        setContractorLtir(contractorLtir);
        setTrir(totalTrir);
        setEmployeeTrir(employeeTrir);
        setContractorTrir(contractorTrir);
        setSeverityRate(totalSeverityRate);
        setEmployeeSeverityRate(employeeSeverityRate);
        setContractorSeverityRate(contractorSeverityRate);
        setTotalLossDays(lossDays.total);
      }

      return cacheData;
    } catch (error) {
      logger.error(`${year}년 계산 오류:`, error);
      return null;
    }
  }, [ltirBase, selectedYear, updateYearlyDataCache, logger]);

  // 🔧 LTIR 계산 함수 (통합 계산 함수 사용 - 중복 호출 방지)
  const calculateLTIR = async (year: number) => {
    // 🔧 통합 함수를 사용하여 중복 계산 방지
    const result = await calculateAllIndicatorsOnce(year);
    if (result) {
      // 상태는 이미 calculateAllIndicatorsOnce에서 업데이트됨
      logger.log(`LTIR 계산 완료: ${year}년`, result.ltir);
    }
  };

  // 🔧 TRIR 계산 함수 (통합 계산 함수 사용 - 중복 호출 방지)
  const calculateTRIR = async (year: number) => {
    // 🔧 통합 함수를 사용하여 중복 계산 방지
    const result = await calculateAllIndicatorsOnce(year);
    if (result) {
      // 상태는 이미 calculateAllIndicatorsOnce에서 업데이트됨
      logger.log(`TRIR 계산 완료: ${year}년`, result.trir);
    }
  };

  // 🔧 강도율 계산 함수 (통합 계산 함수 사용 - 중복 호출 방지)
  const calculateSeverityRate = async (year: number) => {
    // 🔧 통합 함수를 사용하여 중복 계산 방지
    const result = await calculateAllIndicatorsOnce(year);
    if (result) {
      // 상태는 이미 calculateAllIndicatorsOnce에서 업데이트됨
      logger.log(`강도율 계산 완료: ${year}년`, result.severityRate);
    }
  };

  // 물적피해금액 조회 함수
  const fetchPropertyDamageByYear = async (year: number) => {
    setPropertyDamageLoading(true);
    setDirectDamageAmount(0);
    setIndirectDamageAmount(0);
    try {
      const response = await fetch(`/api/occurrence/all?year=${year}`);
      if (!response.ok) throw new Error('사고 목록 조회 실패');
      const data = await response.json();
      const reports = data.reports || [];

      // 물적 또는 복합 사고만 필터링
      const propertyAccidents = reports.filter((r: any) =>
        r.accident_type_level1 === '물적' || r.accident_type_level1 === '복합'
      );
      
      console.log(`[물적피해] 전체 사고: ${reports.length}건, 물적/복합 사고: ${propertyAccidents.length}건`);

      // 사고피해금액 합산 (property_damage 테이블의 estimated_cost 사용)
      let totalDamageAmount = 0;
      for (const report of propertyAccidents) {
        console.log(`[물적피해] 사고 ${report.accident_id}: property_damages =`, report.property_damages);
        if (report.property_damages && Array.isArray(report.property_damages)) {
          report.property_damages.forEach((damage: any) => {
            console.log(`[물적피해] 피해 정보:`, damage);
            if (damage.estimated_cost && !isNaN(damage.estimated_cost)) {
              totalDamageAmount += Number(damage.estimated_cost);
              console.log(`[물적피해] 피해금액 추가: ${damage.estimated_cost}천원`);
            }
          });
        }
      }

      // 간접피해금액 계산 (직접피해금액 × 4)
      const indirectAmount = totalDamageAmount * 4;

      console.log(`[물적피해] 직접피해금액: ${totalDamageAmount}천원, 간접피해금액: ${indirectAmount}천원`);
      
      setDirectDamageAmount(totalDamageAmount);
      setIndirectDamageAmount(indirectAmount);
    } catch (err) {
      console.error('물적피해금액 조회 중 오류:', err);
      setDirectDamageAmount(0);
      setIndirectDamageAmount(0);
    } finally {
      setPropertyDamageLoading(false);
    }
  };

  // 🔧 기존 개별 useEffect 제거됨 (중복 실행 방지)
  // 모든 데이터 로딩은 통합 useEffect에서 처리

  // 선택된 연도 변경 시 세부 차트 데이터 수집 (fetchDetailChartData 함수 선언 후에 추가됨)

  // 그래프 데이터 수집 함수 (전체 연도 지원)
  const fetchChartData = async () => {
    setChartLoading(true);
    try {
      const trendData: AccidentTrendData[] = [];
      const safetyData: SafetyIndexData[] = [];

      console.log('[그래프] 차트 데이터 수집 시작 (전체 연도 지원)');

      // 전체 연도 데이터 수집 (스크롤 바로 범위 조정 가능)
      const chartYears = [...yearOptions]; // 모든 연도 포함
      console.log(`[그래프] 차트 연도 범위: 전체 ${chartYears.length}개 연도 (${Math.min(...chartYears)}년 ~ ${Math.max(...chartYears)}년)`);
      
      // 모든 연도의 데이터를 병렬로 수집 (더 빠른 처리)
      const yearDataPromises = chartYears.map(async (year) => {
        console.log(`[그래프] ${year}년 데이터 수집 중...`);

        try {
          // 단순화된 데이터 수집 - 전체 차트용으로 최적화
          const response = await fetch(`/api/occurrence/all?year=${year}`);
          if (!response.ok) {
            throw new Error(`API 오류: ${response.status}`);
          }
          
          const data = await response.json();
          const reports = data.reports || [];
          
          // 🔧 기본 계산 - 실제 데이터 사용 (하드코딩된 값 제거)
          const accidentCount = reports.length;
          
          // 🔧 재해자 수 - 실제 데이터 사용
          let victimCount = 0;
          const humanAccidents = reports.filter((r: any) =>
            r.accident_type_level1 === '인적' || r.accident_type_level1 === '복합'
          );
          
          for (const report of humanAccidents) {
            let victims: any[] = [];
            
            // 조사보고서 확인
            try {
              const invResponse = await fetch(`/api/investigation/${report.accident_id}/exists`);
              if (invResponse.ok) {
                const existsData = await invResponse.json();
                if (existsData.exists) {
                  const invDataResponse = await fetch(`/api/investigation/${report.accident_id}`);
                  if (invDataResponse.ok) {
                    const invData = await invDataResponse.json();
                    const investigationData = invData.data || invData;
                    victims = investigationData.investigation_victims || investigationData.victims || [];
                  }
                }
              }
            } catch (e) {
              // 조사보고서 조회 실패 시 무시
            }

            // 조사보고서에 재해자 정보가 없으면 발생보고서에서 확인
            if (victims.length === 0) {
              if (report.victims && Array.isArray(report.victims)) {
                victims = report.victims;
              } else if (report.victims_json) {
                try {
                  const arr = JSON.parse(report.victims_json);
                  if (Array.isArray(arr)) victims = arr;
                } catch (e) {}
              }
            }
            
            victimCount += victims.length;
          }
          
          // 🔧 물적피해 - 실제 데이터 사용
          let propertyDamage = 0;
          const propertyAccidents = reports.filter((r: any) =>
            r.accident_type_level1 === '물적' || r.accident_type_level1 === '복합'
          );
          
          for (const report of propertyAccidents) {
            if (report.property_damages && Array.isArray(report.property_damages)) {
              report.property_damages.forEach((damage: any) => {
                if (damage.estimated_cost && !isNaN(damage.estimated_cost)) {
                  propertyDamage += Number(damage.estimated_cost);
                }
              });
            }
          }
          
          // 🔧 안전 지수 계산 - 실제 연간 근로시간 데이터 사용 (KPI 카드와 일관성 확보)
          const workingHoursData = await fetchAnnualWorkingHoursCached(year);
          const workingHours = workingHoursData.total || 0;
          
          // 연간 근로시간이 0이면 안전지수도 0으로 계산 (KPI 카드와 동일한 로직)
          let ltir = 0, trir = 0, severityRate = 0;
          
          if (workingHours > 0) {
            // LTIR 계산 (기준이상 사고 건수 / 연간 근로시간 × 기준값)
            const ltirAccidentCounts = await calculateLTIRAccidentCounts(year);
            ltir = (ltirAccidentCounts.total / workingHours) * ltirBase;
            
            // TRIR 계산 (기준이상 사고 건수 / 연간 근로시간 × 기준값)
            const trirAccidentCounts = await calculateTRIRAccidentCounts(year);
            trir = (trirAccidentCounts.total / workingHours) * ltirBase;
            
            // 강도율 계산 (근로손실일수 / 연간 근로시간 × 1000)
            const lossDays = await calculateSeverityRateLossDays(year);
            severityRate = (lossDays.total / workingHours) * 1000;
          }

          return {
            year,
            accidentCount,
            victimCount,
            propertyDamage,
            ltir,
            trir,
            severityRate
          };
        } catch (error) {
          console.error(`[그래프] ${year}년 데이터 수집 오류:`, error);
          return {
            year,
            accidentCount: 0,
            victimCount: 0,
            propertyDamage: 0,
            ltir: 0,
            trir: 0,
            severityRate: 0
          };
        }
      });

      // 모든 연도 데이터 수집 완료 대기
      const yearDataResults = await Promise.all(yearDataPromises);

      // 결과를 적절한 배열로 분리
      yearDataResults.forEach(result => {
        trendData.push({
          year: result.year,
          accidentCount: result.accidentCount,
          victimCount: result.victimCount,
          propertyDamage: result.propertyDamage
        });

        safetyData.push({
          year: result.year,
          ltir: result.ltir,
          trir: result.trir,
          severityRate: result.severityRate
        });
      });

      // 연도순으로 정렬
      trendData.sort((a, b) => a.year - b.year);
      safetyData.sort((a, b) => a.year - b.year);

      // 전체 데이터 저장 (스크롤용)
      setAccidentTrendData(trendData);
      setSafetyIndexData(safetyData);

      console.log('[그래프] 데이터 수집 완료 (전체 연도 지원):', { trendData, safetyData });
    } catch (error) {
      console.error('[그래프] 데이터 수집 오류:', error);
    } finally {
      setChartLoading(false);
    }
  };

  // 연도별 사고 건수 조회 (그래프용)
  const fetchAccidentCountForYear = async (year: number) => {
    try {
      console.log(`[통합차트] ${year}년 사고 건수 조회 시작`);
      
      const response = await fetch(`/api/occurrence/all?year=${year}`);
      if (!response.ok) {
        console.error(`[통합차트] ${year}년 사고 목록 조회 실패:`, response.status);
        return { total: 0 };
      }
      
      const data = await response.json();
      const reports = data.reports || [];
      
      console.log(`[통합차트] ${year}년 사고 보고서 수:`, reports.length);
      return { total: reports.length };
    } catch (error) {
      console.error(`[통합차트] ${year}년 사고 건수 조회 오류:`, error);
      return { total: 0 };
    }
  };

  // 연도별 재해자 수 조회 (그래프용)
  const fetchVictimCountForYear = async (year: number) => {
    try {
      console.log(`[통합차트] ${year}년 재해자 수 조회 시작`);
      
      const response = await fetch(`/api/occurrence/all?year=${year}`);
      if (!response.ok) {
        console.error(`[통합차트] ${year}년 사고 목록 조회 실패:`, response.status);
        return { total: 0 };
      }
      
      const data = await response.json();
      const reports = data.reports || [];

      const filtered = reports.filter((r: any) =>
        r.accident_type_level1 === '인적' || r.accident_type_level1 === '복합'
      );

      console.log(`[통합차트] ${year}년 인적/복합 사고 수:`, filtered.length);

      let totalVictims = 0;
      for (const report of filtered) {
        let victims: any[] = [];
        
        // 조사보고서 확인
        try {
          const invResponse = await fetch(`/api/investigation/${report.accident_id}/exists`);
          if (invResponse.ok) {
            const existsData = await invResponse.json();
            if (existsData.exists) {
              const invDataResponse = await fetch(`/api/investigation/${report.accident_id}`);
              if (invDataResponse.ok) {
                const invData = await invDataResponse.json();
                const investigationData = invData.data || invData;
                victims = investigationData.investigation_victims || investigationData.victims || [];
              }
            }
          }
        } catch (e) {
          console.warn(`[통합차트] ${year}년 조사보고서 조회 실패:`, e);
        }

        // 조사보고서에 재해자 정보가 없으면 발생보고서에서 확인
        if (victims.length === 0) {
          if (report.victims && Array.isArray(report.victims)) {
            victims = report.victims;
          } else if (report.victims_json) {
            try {
              const arr = JSON.parse(report.victims_json);
              if (Array.isArray(arr)) victims = arr;
            } catch (e) {
              console.warn(`[통합차트] ${year}년 재해자 JSON 파싱 실패:`, e);
            }
          }
        }

        totalVictims += victims.length;
      }

      console.log(`[통합차트] ${year}년 총 재해자 수:`, totalVictims);
      return { total: totalVictims };
    } catch (error) {
      console.error(`[통합차트] ${year}년 재해자 수 조회 오류:`, error);
      return { total: 0 };
    }
  };

  // 연도별 물적피해 조회 (그래프용)
  const fetchPropertyDamageForYear = async (year: number) => {
    try {
      const response = await fetch(`/api/occurrence/all?year=${year}`);
      if (!response.ok) throw new Error('사고 목록 조회 실패');
      const data = await response.json();
      const reports = data.reports || [];

      const propertyAccidents = reports.filter((r: any) =>
        r.accident_type_level1 === '물적' || r.accident_type_level1 === '복합'
      );

      let totalDamageAmount = 0;
      for (const report of propertyAccidents) {
        if (report.property_damages && Array.isArray(report.property_damages)) {
          report.property_damages.forEach((damage: any) => {
            if (damage.estimated_cost && !isNaN(damage.estimated_cost)) {
              totalDamageAmount += Number(damage.estimated_cost);
            }
          });
        }
      }

      return { direct: totalDamageAmount };
    } catch (error) {
      console.error(`[그래프] ${year}년 물적피해 조회 오류:`, error);
      return { direct: 0 };
    }
  };

          // 연도별 LTIR 계산 (그래프용)
        const calculateLTIRForYear = async (year: number) => {
          try {
            const [workingHours, accidentCounts] = await Promise.all([
              fetchAnnualWorkingHoursCached(year),
              calculateLTIRAccidentCounts(year)
            ]);

            const calculateSingleLTIR = (accidentCount: number, workingHours: number) => {
              if (workingHours === 0) return 0;
              return (accidentCount / workingHours) * ltirBase;
            };

            const totalLtir = calculateSingleLTIR(accidentCounts.total, workingHours.total);

            return { total: totalLtir };
          } catch (error) {
            console.error(`[그래프] ${year}년 LTIR 계산 오류:`, error);
            return { total: 0 };
          }
        };

          // 연도별 TRIR 계산 (그래프용)
        const calculateTRIRForYear = async (year: number) => {
          try {
            const [workingHours, accidentCounts] = await Promise.all([
              fetchAnnualWorkingHoursCached(year),
              calculateTRIRAccidentCounts(year)
            ]);

            const calculateSingleTRIR = (accidentCount: number, workingHours: number) => {
              if (workingHours === 0) return 0;
              return (accidentCount / workingHours) * ltirBase;
            };

            const totalTrir = calculateSingleTRIR(accidentCounts.total, workingHours.total);

            return { total: totalTrir };
          } catch (error) {
            console.error(`[그래프] ${year}년 TRIR 계산 오류:`, error);
            return { total: 0 };
          }
        };

          // 연도별 강도율 계산 (그래프용)
        const calculateSeverityRateForYear = async (year: number) => {
          try {
            const [workingHours, lossDays] = await Promise.all([
              fetchAnnualWorkingHoursCached(year),
              calculateSeverityRateLossDays(year)
            ]);

            const calculateSingleSeverityRate = (lossDays: number, workingHours: number) => {
              if (workingHours === 0) return 0;
              return (lossDays / workingHours) * 1000;
            };

            const totalSeverityRate = calculateSingleSeverityRate(lossDays.total, workingHours.total);

            return { total: totalSeverityRate };
          } catch (error) {
            console.error(`[그래프] ${year}년 강도율 계산 오류:`, error);
            return { total: 0 };
          }
        };

  // 사업장별 피해금액 데이터 수집 함수
  const fetchSitePropertyDamageData = useCallback(async (year: number) => {
    try {
      const response = await fetch(`/api/occurrence/all?year=${year}`);
      if (!response.ok) throw new Error('사고 목록 조회 실패');
      const data = await response.json();
      const reports = data.reports || [];

      // 물적 또는 복합 사고만 필터링
      const propertyAccidents = reports.filter((r: any) =>
        r.accident_type_level1 === '물적' || r.accident_type_level1 === '복합'
      );

      // 사업장별 피해금액 집계
      const siteDamageMap = new Map<string, { direct: number; indirect: number }>();
      
      for (const report of propertyAccidents) {
        const siteName = report.site_name || '미분류';
        
        if (!siteDamageMap.has(siteName)) {
          siteDamageMap.set(siteName, { direct: 0, indirect: 0 });
        }
        
        if (report.property_damages && Array.isArray(report.property_damages)) {
          report.property_damages.forEach((damage: any) => {
            if (damage.estimated_cost && !isNaN(damage.estimated_cost)) {
              const current = siteDamageMap.get(siteName)!;
              current.direct += Number(damage.estimated_cost);
              current.indirect = current.direct * 4; // 간접피해는 직접피해의 4배
            }
          });
        }
      }

      // PropertyDamageData 형태로 변환
      const propertyData: PropertyDamageData[] = Array.from(siteDamageMap.entries()).map(([siteName, damage]) => ({
        name: siteName,
        directDamage: damage.direct,
        indirectDamage: damage.indirect
      }));

      setPropertyDamageData(propertyData);
      console.log('[사업장별 피해금액] 데이터 수집 완료:', propertyData);
    } catch (error) {
      console.error('[사업장별 피해금액] 데이터 수집 오류:', error);
      setPropertyDamageData([]);
    }
  }, []);

  // 세부 데이터 차트 데이터 수집 함수들
  const fetchDetailChartData = useCallback(async (year: number) => {
    setDetailChartLoading(true);
    try {
      console.log(`[세부차트] ${year}년 세부 데이터 수집 시작`);
      
      // 1. 사업장별 사고건수 데이터 수집
      const siteData: SiteAccidentData[] = [];
      const siteCounts = siteAccidentCounts;
      
      for (const [siteName, totalCount] of Object.entries(siteCounts)) {
        // 임직원/협력업체 구분은 전체 비율로 추정 (실제로는 사업장별 구분 데이터가 필요)
        const employeeRatio = employeeAccidentCount / (employeeAccidentCount + contractorAccidentCount) || 0.5;
        const contractorRatio = 1 - employeeRatio;
        
        siteData.push({
          siteName,
          accidentCount: totalCount,
          employeeCount: Math.round(totalCount * employeeRatio),
          contractorCount: Math.round(totalCount * contractorRatio)
        });
      }
      setSiteAccidentData(siteData);

      // 2. 상해정도별 분포 데이터 수집
      const injuryData: InjuryTypeData[] = [];
      const injuryColors = {
        '사망': '#ef4444',
        '중상': '#f97316',
        '경상': '#eab308',
        '병원치료': '#3b82f6',
        '응급처치': '#10b981',
        '기타': '#6b7280'
      };
      
      for (const [injuryType, count] of Object.entries(injuryTypeCounts)) {
        if (count > 0) {
          injuryData.push({
            name: injuryType,
            value: count,
            color: injuryColors[injuryType as keyof typeof injuryColors] || '#6b7280'
          });
        }
      }
      setInjuryTypeData(injuryData);

      // 3. 임직원/협력업체 구분 데이터 수집
      const employeeData: EmployeeTypeData[] = [
        {
          name: '임직원',
          value: employeeAccidentCount,
          color: '#3b82f6'
        },
        {
          name: '협력업체',
          value: contractorAccidentCount,
          color: '#f59e0b'
        }
      ].filter(item => item.value > 0);
      setEmployeeTypeData(employeeData);

      // 4. 사업장별 물적피해금액 데이터 수집 (실제 데이터 사용)
      await fetchSitePropertyDamageData(year);

      console.log('[세부차트] 데이터 수집 완료');
    } catch (error) {
      console.error('[세부차트] 데이터 수집 오류:', error);
    } finally {
      setDetailChartLoading(false);
    }
  }, [siteAccidentCounts, employeeAccidentCount, contractorAccidentCount, injuryTypeCounts, fetchSitePropertyDamageData]);

  // 통합 차트 데이터 수집 함수
  const fetchIntegratedChartData = useCallback(async () => {
    setIntegratedChartLoading(true);
    try {
      console.log('[통합차트] 데이터 수집 시작');
      
      const integratedData: IntegratedAccidentData[] = [];
      
      // 사용 가능한 연도들에 대해 데이터 수집
      for (const year of yearOptions) {
        console.log(`[통합차트] ${year}년 데이터 수집 중...`);
        
        try {
          // 병렬로 데이터 수집
          const [accidentCountResult, victimResult, siteDataResult] = await Promise.all([
            fetchAccidentCountForYear(year),
            fetchVictimCountForYear(year),
            fetchSiteAccidentDataForYear(year)
          ]);

          console.log(`[통합차트] ${year}년 데이터 수집 결과:`, {
            accidentCount: accidentCountResult.total,
            victimCount: victimResult.total,
            siteDataCount: siteDataResult.length
          });

          integratedData.push({
            year,
            accidentCount: accidentCountResult.total || 0,
            victimCount: victimResult.total || 0,
            siteData: siteDataResult || []
          });
        } catch (yearError) {
          console.error(`[통합차트] ${year}년 데이터 수집 실패:`, yearError);
          // 개별 연도 실패 시에도 기본 데이터 추가
          integratedData.push({
            year,
            accidentCount: 0,
            victimCount: 0,
            siteData: []
          });
        }
      }

      // 연도순으로 정렬
      integratedData.sort((a, b) => a.year - b.year);
      
      console.log('[통합차트] 최종 데이터:', integratedData);
      setIntegratedChartData(integratedData);
      console.log('[통합차트] 데이터 수집 완료:', integratedData);
    } catch (error) {
      console.error('[통합차트] 데이터 수집 오류:', error);
      // 오류 발생 시 빈 데이터 설정
      setIntegratedChartData([]);
    } finally {
      setIntegratedChartLoading(false);
    }
  }, [yearOptions]);

  // 연도별 사업장별 사고건수 데이터 수집 함수
  const fetchSiteAccidentDataForYear = async (year: number) => {
    try {
      console.log(`[통합차트] ${year}년 사업장별 사고건수 조회 시작`);
      
      const response = await fetch(`/api/occurrence/all?year=${year}`);
      if (!response.ok) {
        console.error(`[통합차트] ${year}년 사고 목록 조회 실패:`, response.status);
        return [];
      }
      
      const data = await response.json();
      const reports = data.reports || [];
      
      console.log(`[통합차트] ${year}년 사고 보고서 수:`, reports.length);

      // 사업장별 사고건수 집계
      const siteMap = new Map<string, { employeeCount: number; contractorCount: number }>();
      
      for (const report of reports) {
        const siteName = report.site_name || '미분류';
        
        if (!siteMap.has(siteName)) {
          siteMap.set(siteName, { employeeCount: 0, contractorCount: 0 });
        }
        
        const current = siteMap.get(siteName)!;
        if (report.is_contractor) {
          current.contractorCount++;
        } else {
          current.employeeCount++;
        }
      }

      // IntegratedAccidentData.siteData 형태로 변환
      const siteData = Array.from(siteMap.entries()).map(([siteName, counts]) => ({
        siteName,
        employeeCount: counts.employeeCount,
        contractorCount: counts.contractorCount
      }));

      console.log(`[통합차트] ${year}년 사업장별 사고건수:`, siteData);
      return siteData;
    } catch (error) {
      console.error(`[통합차트] ${year}년 사업장별 사고건수 조회 오류:`, error);
      return [];
    }
  };

  // 선택된 연도 변경 시 세부 차트 데이터 수집
  useEffect(() => {
    if (selectedYear && !loading && !victimLoading && !propertyDamageLoading) {
      fetchDetailChartData(selectedYear);
    }
  }, [selectedYear, loading, victimLoading, propertyDamageLoading, fetchDetailChartData]);

  // 상세 차트 데이터 수집 함수 (전체 연도 지원)
  const fetchDetailedSafetyIndexData = useCallback(async () => {
    setDetailedChartLoading(true);
    try {
      console.log('[상세차트] 데이터 수집 시작 (전체 연도 지원)');
      
      const detailedData: DetailedSafetyIndexData[] = [];
      
      // 전체 연도 데이터 수집 (스크롤 바로 범위 조정 가능)
      const chartYears = [...yearOptions]; // 모든 연도 포함
      console.log(`[상세차트] 차트 연도 범위: 전체 ${chartYears.length}개 연도 (${Math.min(...chartYears)}년 ~ ${Math.max(...chartYears)}년)`);
      
      // 모든 연도의 데이터를 병렬로 수집
      const yearDataPromises = chartYears.map(async (year) => {
        console.log(`[상세차트] ${year}년 데이터 수집 중...`);
        
        try {
          // 단순화된 계산으로 성능 향상
          const response = await fetch(`/api/occurrence/all?year=${year}`);
          if (!response.ok) {
            throw new Error(`API 오류: ${response.status}`);
          }
          
          const data = await response.json();
          const reports = data.reports || [];
          
          // 🔧 기본 계산 - 실제 데이터 사용 (하드코딩된 값 제거)
          const accidentCount = reports.length;
          
          // 🔧 실제 연간 근로시간 데이터 사용
          const workingHoursData = await fetchAnnualWorkingHoursCached(year);
          const workingHours = workingHoursData.total || 0;
          
          // 🔧 실제 사고 데이터로 임직원/협력업체 구분
          const employeeAccidents = reports.filter((r: any) => !r.is_contractor);
          const contractorAccidents = reports.filter((r: any) => r.is_contractor);
          const employeeCount = employeeAccidents.length;
          const contractorCount = contractorAccidents.length;
          
          // 🔧 안전 지수 계산 - 실제 데이터 사용 (KPI 카드와 일관성 확보)
          let totalLtir = 0, employeeLtir = 0, contractorLtir = 0;
          let totalTrir = 0, employeeTrir = 0, contractorTrir = 0;
          let totalSeverityRate = 0, employeeSeverityRate = 0, contractorSeverityRate = 0;
          
          if (workingHours > 0) {
            // LTIR 계산 (기준이상 사고 건수 / 연간 근로시간 × 기준값)
            const ltirAccidentCounts = await calculateLTIRAccidentCounts(year);
            totalLtir = (ltirAccidentCounts.total / workingHours) * ltirBase;
            employeeLtir = (ltirAccidentCounts.employee / workingHours) * ltirBase;
            contractorLtir = (ltirAccidentCounts.contractor / workingHours) * ltirBase;
            
            // TRIR 계산 (기준이상 사고 건수 / 연간 근로시간 × 기준값)
            const trirAccidentCounts = await calculateTRIRAccidentCounts(year);
            totalTrir = (trirAccidentCounts.total / workingHours) * ltirBase;
            employeeTrir = (trirAccidentCounts.employee / workingHours) * ltirBase;
            contractorTrir = (trirAccidentCounts.contractor / workingHours) * ltirBase;
            
            // 강도율 계산 (근로손실일수 / 연간 근로시간 × 1000)
            const lossDays = await calculateSeverityRateLossDays(year);
            totalSeverityRate = (lossDays.total / workingHours) * 1000;
            employeeSeverityRate = (lossDays.employee / workingHours) * 1000;
            contractorSeverityRate = (lossDays.contractor / workingHours) * 1000;
          }
          
          return {
            year,
            ltir: totalLtir,
            trir: totalTrir,
            severityRate: totalSeverityRate,
            employeeLtir,
            contractorLtir,
            employeeTrir,
            contractorTrir,
            employeeSeverityRate,
            contractorSeverityRate
          };
        } catch (error) {
          console.error(`[상세차트] ${year}년 데이터 수집 오류:`, error);
          return {
            year,
            ltir: 0,
            trir: 0,
            severityRate: 0,
            employeeLtir: 0,
            contractorLtir: 0,
            employeeTrir: 0,
            contractorTrir: 0,
            employeeSeverityRate: 0,
            contractorSeverityRate: 0
          };
        }
      });

      // 모든 연도 데이터 수집 완료 대기
      const yearDataResults = await Promise.all(yearDataPromises);

      // 결과를 배열에 추가
      yearDataResults.forEach(result => {
        detailedData.push(result);
      });

      // 연도순으로 정렬
      detailedData.sort((a, b) => a.year - b.year);
      
      setDetailedSafetyIndexData(detailedData);
      console.log('[상세차트] 데이터 수집 완료 (전체 연도 지원):', detailedData);
    } catch (error) {
      console.error('[상세차트] 데이터 수집 오류:', error);
    } finally {
      setDetailedChartLoading(false);
    }
  }, [yearOptions]);

  // 연도 옵션이 로드되면 통합 차트 데이터 수집
  useEffect(() => {
    if (yearOptions.length > 0) {
      console.log('[통합차트] 연도 옵션 로드됨, 통합 차트 데이터 수집 시작:', yearOptions);
      fetchIntegratedChartData();
    }
  }, [yearOptions, fetchIntegratedChartData]);

  // 연도 옵션이 로드되면 상세 차트 데이터 수집 (지연 로딩)
  useEffect(() => {
    if (yearOptions.length > 0) {
      console.log('[상세차트] 연도 옵션 로드됨, 상세 차트 데이터 수집 시작:', yearOptions);
      // 기본 차트 로딩 후 상세 차트 로딩 (우선순위 조정)
      setTimeout(() => {
        fetchDetailedSafetyIndexData();
      }, 500);
    }
  }, [yearOptions, fetchDetailedSafetyIndexData]);

  // 연도 변경 핸들러 (성능 최적화)
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    loadAllData(year);
  };

  // 연도 옵션이 로드되면 그래프 데이터 수집 (성능 최적화)
  useEffect(() => {
    if (yearOptions.length > 0) {
      console.log('[그래프] 연도 옵션 로드됨, 그래프 데이터 수집 시작:', yearOptions);
      // 차트 데이터 로딩을 비동기로 처리하여 UI 블로킹 방지
      setTimeout(() => {
        fetchChartData();
      }, 100);
    }
  }, [yearOptions, ltirBase]);

  // 🔧 중복 렌더링 방지를 위한 통합 useEffect
  useEffect(() => {
    if (selectedYear) {
      logger.log(`선택된 연도 변경: ${selectedYear}년`);
      
      // 모든 데이터를 한 번에 로딩 (중복 API 호출 방지)
      const loadYearData = async () => {
        try {
          // 로딩 상태 통합 관리
          setLoading(true);
          setVictimLoading(true);
          setPropertyDamageLoading(true);
          setLtirLoading(true);
          setTrirLoading(true);
          setSeverityRateLoading(true);
          
          // 모든 데이터를 병렬로 로딩 (통합 함수 사용)
          await Promise.all([
            fetchAccidentCountByYear(selectedYear),
            fetchVictimStatsByYear(selectedYear),
            fetchPropertyDamageByYear(selectedYear),
            calculateAllIndicatorsOnce(selectedYear) // 🔧 통합 함수로 모든 지표 계산
          ]);
          
          logger.log(`${selectedYear}년 데이터 로딩 완료`);
        } catch (error) {
          logger.error(`${selectedYear}년 데이터 로딩 오류:`, error);
          setError('데이터를 불러오는데 실패했습니다.');
        } finally {
          // 모든 로딩 상태를 한 번에 해제
          setLoading(false);
          setVictimLoading(false);
          setPropertyDamageLoading(false);
          setLtirLoading(false);
          setTrirLoading(false);
          setSeverityRateLoading(false);
        }
      };
      
      loadYearData();
    }
  }, [selectedYear]); // 🔧 ltirBase 의존성 제거 (불필요한 재계산 방지)

  // 🔧 ltirBase 변경 시에만 재계산 (중복 렌더링 방지)
  useEffect(() => {
    if (selectedYear) {
      logger.log(`ltirBase 변경: ${ltirBase}, ${selectedYear}년 재계산`);
      
      // 강제 재계산으로 캐시 무시하고 새로 계산
      calculateAllIndicatorsOnce(selectedYear, true);
    }
  }, [ltirBase, selectedYear]); // 🔧 ltirBase 변경 시에만 실행

  return (
    <div className="max-w-7xl mx-auto bg-white rounded-lg shadow p-8 mt-8">
      {/* 전체 페이지 로딩 오버레이 */}
      <FullPageLoadingOverlay stage={loadingStage} isVisible={showLoadingOverlay} />
      
      {/* 모바일 탭 네비게이션 */}
      <MobileTabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* 헤더 섹션 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">사고지표 (Lagging Indicator)</h1>
          <p className="text-gray-700 mt-2 hidden md:block">
            사고지표(Lagging Indicator)는 과거에 발생한 사고, 재해, 손실 등의 결과를 측정하는 지표입니다.<br />
            본 페이지에서는 최근 사고 건수, 유형별 통계, 발생 추이 등 다양한 사고지표를 시각화합니다.
          </p>
          <p className="text-gray-700 mt-2 md:hidden">
            과거 사고, 재해, 손실 등의 결과를 측정하는 지표입니다.
          </p>
        </div>
        <div className="flex-shrink-0">
          <YearSelector 
            selectedYear={selectedYear}
            onYearChange={handleYearChange}
            yearOptions={yearOptions}
          />
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* 탭별 컨텐츠 */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 🔧 모바일에서는 카드 설명만 표시하고, 실제 카드는 통합 섹션에서 표시 */}
          <div className="md:hidden">
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📊</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">주요 지표 요약</h2>
              <p className="text-gray-600">
                아래에서 선택된 연도의 사고지표를 확인할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'charts' && (
        <div className="space-y-6">
          {/* 차트 컨트롤 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">년도별 지표 변화 추이</h2>
              <p className="text-gray-600 text-sm">
                각 연도별 사고지표의 변화 추이를 분석하여 안전관리 성과를 시각적으로 확인할 수 있습니다.
              </p>
            </div>
            
            {/* 차트 타입 선택과 새로고침 버튼 */}
            <div className="flex items-center gap-3">
              {/* 새로고침 버튼 */}
              <button
                onClick={async () => {
                  logger.log('모든 연도 데이터 계산 시작');
                  for (const year of yearOptions) {
                    await calculateAllIndicatorsOnce(year);
                  }
                  fetchChartData();
                  fetchDetailedSafetyIndexData();
                }}
                disabled={chartLoading || detailedChartLoading || ltirLoading || trirLoading || severityRateLoading}
                className="inline-flex items-center px-3 py-2 bg-primary-700 text-white text-sm font-medium rounded-md hover:bg-primary-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {(chartLoading || detailedChartLoading || ltirLoading || trirLoading || severityRateLoading) ? '데이터 수집 중...' : '새로고침'}
              </button>
              
              {/* 차트 타입 선택 */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">차트 타입:</label>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setChartType('combined')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        chartType === 'combined'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      기본 차트
                    </button>
                    <button
                      onClick={() => setChartType('alternative')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        chartType === 'alternative'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      상세 차트
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 그래프 그리드 */}
          {chartType === 'combined' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 재해건수, 재해자수, 물적피해 추이 그래프 */}
              <AccidentTrendChart 
                data={accidentTrendData} 
                loading={chartLoading} 
              />
              
              {/* LTIR, TRIR, 강도율 추이 그래프 */}
              <SafetyIndexChart 
                data={safetyIndexData} 
                loading={chartLoading}
                ltirBase={ltirBase}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* 통합 사고 분석 차트 */}
              <IntegratedAccidentChart 
                data={integratedChartData} 
                loading={integratedChartLoading} 
              />
              
              {/* LTIR, TRIR, 강도율 상세 추이 그래프 (임직원/협력업체 구분) */}
              <DetailedSafetyIndexChart 
                data={detailedSafetyIndexData} 
                loading={detailedChartLoading}
                ltirBase={ltirBase}
              />
            </div>
          )}
        </div>
      )}

      {/* 🔧 통합된 사고지표 카드 섹션 - 모바일과 데스크탑 모두에서 한 번만 표시 */}
      <div className="mt-8">
        {/* 🔧 모바일에서는 overview 탭일 때만 표시, 데스크탑에서는 항상 표시 */}
        <div className={`${activeTab === 'overview' ? 'block' : 'hidden md:block'}`}>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">주요 지표 요약</h2>
            <p className="text-gray-600 text-sm">
              선택된 연도의 사고지표를 한눈에 확인할 수 있습니다.
            </p>
          </div>
          
          {/* 사고지표 카드 그리드 - 반응형으로 모바일/데스크탑 모두 지원 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {/* 사고 건수 카드 */}
            <AccidentCountCard 
              count={accidentCount}
              employeeAccidentCount={employeeAccidentCount}
              contractorAccidentCount={contractorAccidentCount}
              siteAccidentCounts={siteAccidentCounts}
              loading={loading} 
            />
            
            {/* 재해자 수 카드 */}
            <VictimCountCard
              count={victimCount}
              employeeCount={employeeCount}
              contractorCount={contractorCount}
              injuryTypeCounts={injuryTypeCounts}
              loading={victimLoading}
            />
            
            {/* 물적피해금액 카드 */}
            <PropertyDamageCard
              directDamageAmount={directDamageAmount}
              indirectDamageAmount={indirectDamageAmount}
              loading={propertyDamageLoading}
            />
            
            {/* LTIR 카드 */}
            <LTIRCard
              ltir={ltir}
              employeeLtir={employeeLtir}
              contractorLtir={contractorLtir}
              ltirBase={ltirBase}
              setLtirBase={setLtirBase}
              loading={ltirLoading}
            />
            
            {/* TRIR 카드 */}
            <TRIRCard
              trir={trir}
              employeeTrir={employeeTrir}
              contractorTrir={contractorTrir}
              trirBase={ltirBase}
              setTrirBase={setLtirBase}
              loading={trirLoading}
            />
            
            {/* 강도율 카드 */}
            <SeverityRateCard
              severityRate={severityRate}
              employeeSeverityRate={employeeSeverityRate}
              contractorSeverityRate={contractorSeverityRate}
              totalLossDays={totalLossDays}
              loading={severityRateLoading}
            />
          </div>
        </div>

        {/* 🔧 년도별 추이 그래프 섹션 - 데스크탑에서만 표시 (모바일에서는 charts 탭에서 표시) */}
        <div className="hidden md:block mt-16">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">년도별 지표 변화 추이</h2>
                <p className="text-gray-600 text-sm">
                  각 연도별 사고지표의 변화 추이를 분석하여 안전관리 성과를 시각적으로 확인할 수 있습니다.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    logger.log('모든 연도 데이터 계산 시작');
                    for (const year of yearOptions) {
                      await calculateAllIndicatorsOnce(year);
                    }
                    fetchChartData();
                    fetchDetailedSafetyIndexData();
                  }}
                  disabled={chartLoading || detailedChartLoading || ltirLoading || trirLoading || severityRateLoading}
                  className="inline-flex items-center px-3 py-2 bg-primary-700 text-white text-sm font-medium rounded-md hover:bg-primary-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {(chartLoading || detailedChartLoading || ltirLoading || trirLoading || severityRateLoading) ? '데이터 수집 중...' : '새로고침'}
                </button>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">차트 타입:</label>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setChartType('combined')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          chartType === 'combined'
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        기본 차트
                      </button>
                      <button
                        onClick={() => setChartType('alternative')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          chartType === 'alternative'
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        상세 차트
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {chartType === 'combined' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AccidentTrendChart 
                data={accidentTrendData} 
                loading={chartLoading} 
              />
              <SafetyIndexChart 
                data={safetyIndexData} 
                loading={chartLoading}
                ltirBase={ltirBase}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <IntegratedAccidentChart 
                data={integratedChartData} 
                loading={integratedChartLoading} 
              />
              <DetailedSafetyIndexChart 
                data={detailedSafetyIndexData} 
                loading={detailedChartLoading}
                ltirBase={ltirBase}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 