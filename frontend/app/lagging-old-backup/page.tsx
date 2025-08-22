// /lagging 사고지표 페이지
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  AccidentTrendChart, 
  SafetyIndexChart, 
  DetailedSafetyIndexChart,
  AccidentTrendData, 
  SafetyIndexData,
  DetailedSafetyIndexData
} from '../../components/charts';
import {
  MobileTabNavigation,
  FullPageLoadingOverlay,
  YearSelector,
  AccidentCountCard,
  PropertyDamageCard,
  VictimCountCard,
  LTIRCard,
  TRIRCard,
  SeverityRateCard,
  createLogger
} from '../../components/lagging';
import type { LoadingStage, TabType } from '../../components/lagging';

export default function LaggingPage() {
  // 로거 인스턴스 생성
  const logger = createLogger('LaggingPage');
  
  // Hydration 안전성을 위한 클라이언트 마운트 상태
  const [isMounted, setIsMounted] = useState(false);
  
  // 상태 관리
  const [selectedYear, setSelectedYear] = useState<number>(2025);
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

  // 재해자 관련 상태
  const [victimCount, setVictimCount] = useState<number>(0);
  const [employeeCount, setEmployeeCount] = useState<number>(0);
  const [contractorCount, setContractorCount] = useState<number>(0);
  const [injuryTypeCounts, setInjuryTypeCounts] = useState<Record<string, number>>({});
  const [victimLoading, setVictimLoading] = useState<boolean>(true);

  // 물적피해 관련 상태
  const [directDamageAmount, setDirectDamageAmount] = useState<number>(0);
  const [indirectDamageAmount, setIndirectDamageAmount] = useState<number>(0);
  const [propertyDamageLoading, setPropertyDamageLoading] = useState<boolean>(true);

  // LTIR 관련 상태
  const [ltirBase, setLtirBase] = useState<number>(200000);
  const [ltir, setLtir] = useState<number>(0);
  const [employeeLtir, setEmployeeLtir] = useState<number>(0);
  const [contractorLtir, setContractorLtir] = useState<number>(0);
  const [ltirLoading, setLtirLoading] = useState<boolean>(true);
  
  // TRIR 관련 상태
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
  const [chartLoading, setChartLoading] = useState<boolean>(true);
  const [chartType, setChartType] = useState<'combined' | 'alternative'>('combined');


  // 상세 차트 관련 상태
  const [detailedSafetyIndexData, setDetailedSafetyIndexData] = useState<DetailedSafetyIndexData[]>([]);
  const [detailedChartLoading, setDetailedChartLoading] = useState<boolean>(true);

  // 배치 API를 사용한 통합 데이터 로딩 함수
  const loadAllData = useCallback(async (year: number) => {
    try {
      setLoadingStage('data');
      logger.log(`${year}년도 배치 API를 통한 통합 데이터 로딩 시작`);
      
      // 배치 API 호출
      const response = await fetch(`/api/lagging/summary/${year}`);
      if (!response.ok) {
        throw new Error(`배치 API 오류 (${response.status}): ${response.statusText}`);
      }
      
      const batchData = await response.json();
      logger.log(`${year}년도 배치 API 응답:`, batchData);
      
      // 배치 데이터를 상태에 설정
      if (batchData.accidentCount) {
        setAccidentCount(batchData.accidentCount.total || 0);
        setEmployeeAccidentCount(batchData.accidentCount.employee || 0);
        setContractorAccidentCount(batchData.accidentCount.contractor || 0);
        setSiteAccidentCounts(batchData.siteAccidentCounts || {});
      }
      
      if (batchData.victimCount) {
        setVictimCount(batchData.victimCount.total || 0);
        setEmployeeCount(batchData.victimCount.employee || 0);
        setContractorCount(batchData.victimCount.contractor || 0);
      }
      
      if (batchData.injuryTypeCounts) {
        setInjuryTypeCounts(batchData.injuryTypeCounts);
      }
      
      if (batchData.propertyDamage) {
        setDirectDamageAmount(batchData.propertyDamage.direct || 0);
        setIndirectDamageAmount(batchData.propertyDamage.indirect || 0);
      }
      
      // 백엔드에서 계산된 지표 값 사용
      if (batchData.workingHours && batchData.ltirAccidentCounts && batchData.trirAccidentCounts) {
        const workingHours = batchData.workingHours;
        const ltirCounts = batchData.ltirAccidentCounts;
        const trirCounts = batchData.trirAccidentCounts;
        
        // LTIR 계산 (ltirBase 적용)
        const calculateLTIR = (accidents: number, hours: number) => {
          if (hours === 0) return 0;
          return (accidents / hours) * ltirBase;
        };
        
        // 전체 LTIR
        const totalLtir = calculateLTIR(ltirCounts.total, workingHours.total);
        const employeeLtir = calculateLTIR(ltirCounts.employee, workingHours.employee);
        const contractorLtir = calculateLTIR(ltirCounts.contractor, workingHours.contractor);
        
        setLtir(totalLtir);
        setEmployeeLtir(employeeLtir);
        setContractorLtir(contractorLtir);
        
        // TRIR 계산
        const totalTrir = calculateLTIR(trirCounts.total, workingHours.total);
        const employeeTrir = calculateLTIR(trirCounts.employee, workingHours.employee);
        const contractorTrir = calculateLTIR(trirCounts.contractor, workingHours.contractor);
        
        setTrir(totalTrir);
        setEmployeeTrir(employeeTrir);
        setContractorTrir(contractorTrir);
      }
      
      // 강도율 계산
      if (batchData.lossDays && batchData.workingHours) {
        const lossDays = batchData.lossDays;
        const workingHours = batchData.workingHours;
        
        const calculateSeverityRate = (days: number, hours: number) => {
          if (hours === 0) return 0;
          return (days / hours) * 1000;
        };
        
        const totalSeverity = calculateSeverityRate(lossDays.total, workingHours.total);
        const employeeSeverity = calculateSeverityRate(lossDays.employee, workingHours.employee);
        const contractorSeverity = calculateSeverityRate(lossDays.contractor, workingHours.contractor);
        
        setSeverityRate(totalSeverity);
        setEmployeeSeverityRate(employeeSeverity);
        setContractorSeverityRate(contractorSeverity);
        setTotalLossDays(lossDays.total);
      }
      
      // 로딩 상태 업데이트
      setVictimLoading(false);
      setPropertyDamageLoading(false);
      setLtirLoading(false);
      setTrirLoading(false);
      setSeverityRateLoading(false);
      
      logger.log(`${year}년도 배치 API를 통한 통합 데이터 로딩 완료`);
      setLoadingStage('complete');
      
    } catch (error) {
      logger.error('배치 API를 통한 데이터 로딩 오류:', error);
      setError('데이터를 불러오는데 실패했습니다.');
      setLoadingStage('complete');
    }
  }, [ltirBase, logger]);

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

  // Hydration 안전성을 위한 클라이언트 마운트 감지
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
  }, [extractYearsFromReports, loadAllData]);

  // 그래프 데이터 수집 함수 (배치 API 사용)
  const fetchChartData = useCallback(async () => {
    setChartLoading(true);
    try {
      const trendData: AccidentTrendData[] = [];
      const safetyData: SafetyIndexData[] = [];

      console.log('[그래프] 배치 API를 통한 차트 데이터 수집 시작');

      // 모든 연도에 대해 배치 API로 데이터 수집
      const yearDataPromises = yearOptions.map(async (year) => {
        try {
          const batchResponse = await fetch(`/api/lagging/summary/${year}`);
          if (!batchResponse.ok) {
            throw new Error(`배치 API 오류: ${batchResponse.status}`);
          }
          
          const batchData = await batchResponse.json();
          
          // 사고 건수 및 재해자 수
          const accidentCount = batchData.accidentCount?.total || 0;
          const victimCount = batchData.victimCount?.total || 0;
          
          // 물적피해 금액
          const propertyDamage = batchData.propertyDamage?.direct || 0;
          
          // 안전 지수 (이미 계산된 값 사용)
          let ltir = 0, trir = 0, severityRate = 0;
          
          if (batchData.workingHours && batchData.ltirAccidentCounts && batchData.trirAccidentCounts) {
            const workingHours = batchData.workingHours.total;
            const ltirCounts = batchData.ltirAccidentCounts.total;
            const trirCounts = batchData.trirAccidentCounts.total;
            
            if (workingHours > 0) {
              ltir = (ltirCounts / workingHours) * ltirBase;
              trir = (trirCounts / workingHours) * ltirBase;
            }
          }
          
          if (batchData.lossDays && batchData.workingHours) {
            const lossDays = batchData.lossDays.total;
            const workingHours = batchData.workingHours.total;
            
            if (workingHours > 0) {
              severityRate = (lossDays / workingHours) * 1000;
            }
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
          console.error(`[그래프] ${year}년 배치 API 오류:`, error);
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

      const yearDataResults = await Promise.all(yearDataPromises);

      // 결과를 차트 데이터로 변환
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

      setAccidentTrendData(trendData);
      setSafetyIndexData(safetyData);

      console.log('[그래프] 배치 API 데이터 수집 완료:', { trendData, safetyData });
    } catch (error) {
      console.error('[그래프] 데이터 수집 오류:', error);
    } finally {
      setChartLoading(false);
    }
  }, [yearOptions, ltirBase]);

  // 상세 차트 데이터 수집 함수 (배치 API 사용)
  const fetchDetailedSafetyIndexData = useCallback(async () => {
    setDetailedChartLoading(true);
    try {
      console.log('[상세차트] 배치 API를 통한 데이터 수집 시작');
      
      const detailedData: DetailedSafetyIndexData[] = [];
      
      // 모든 연도에 대해 배치 API로 데이터 수집
      const yearDataPromises = yearOptions.map(async (year) => {
        try {
          const batchResponse = await fetch(`/api/lagging/summary/${year}`);
          if (!batchResponse.ok) {
            throw new Error(`배치 API 오류: ${batchResponse.status}`);
          }
          
          const batchData = await batchResponse.json();
          
          // 배치 API를 통한 안전 지수 데이터 수집
          let totalLtir = 0, employeeLtir = 0, contractorLtir = 0;
          let totalTrir = 0, employeeTrir = 0, contractorTrir = 0;
          let totalSeverityRate = 0, employeeSeverityRate = 0, contractorSeverityRate = 0;
          
          if (batchData.workingHours && batchData.ltirAccidentCounts && batchData.trirAccidentCounts) {
            const workingHoursData = batchData.workingHours;
            const ltirCounts = batchData.ltirAccidentCounts;
            const trirCounts = batchData.trirAccidentCounts;
            
            // LTIR 계산
            if (workingHoursData.total > 0) {
              totalLtir = (ltirCounts.total / workingHoursData.total) * ltirBase;
            }
            if (workingHoursData.employee > 0) {
              employeeLtir = (ltirCounts.employee / workingHoursData.employee) * ltirBase;
            }
            if (workingHoursData.contractor > 0) {
              contractorLtir = (ltirCounts.contractor / workingHoursData.contractor) * ltirBase;
            }
            
            // TRIR 계산
            if (workingHoursData.total > 0) {
              totalTrir = (trirCounts.total / workingHoursData.total) * ltirBase;
            }
            if (workingHoursData.employee > 0) {
              employeeTrir = (trirCounts.employee / workingHoursData.employee) * ltirBase;
            }
            if (workingHoursData.contractor > 0) {
              contractorTrir = (trirCounts.contractor / workingHoursData.contractor) * ltirBase;
            }
          }
          
          // 강도율 계산
          if (batchData.lossDays && batchData.workingHours) {
            const lossDays = batchData.lossDays;
            const workingHoursData = batchData.workingHours;
            
            if (workingHoursData.total > 0) {
              totalSeverityRate = (lossDays.total / workingHoursData.total) * 1000;
            }
            if (workingHoursData.employee > 0) {
              employeeSeverityRate = (lossDays.employee / workingHoursData.employee) * 1000;
            }
            if (workingHoursData.contractor > 0) {
              contractorSeverityRate = (lossDays.contractor / workingHoursData.contractor) * 1000;
            }
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
          console.error(`[상세차트] ${year}년 배치 API 오류:`, error);
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

      const yearDataResults = await Promise.all(yearDataPromises);

      // 결과를 배열에 추가
      yearDataResults.forEach(result => {
        detailedData.push(result);
      });

      // 연도순으로 정렬
      detailedData.sort((a, b) => a.year - b.year);
      
      setDetailedSafetyIndexData(detailedData);
      console.log('[상세차트] 배치 API 데이터 수집 완료:', detailedData);
    } catch (error) {
      console.error('[상세차트] 데이터 수집 오류:', error);
    } finally {
      setDetailedChartLoading(false);
    }
  }, [yearOptions, ltirBase]);

  // 연도 변경 핸들러
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    loadAllData(year);
  };

  // 선택된 연도 변경 시 데이터 로딩
  useEffect(() => {
    if (selectedYear) {
      logger.log(`선택된 연도 변경: ${selectedYear}년`);
      
      const loadYearData = async () => {
        try {
          setLoading(true);
          setVictimLoading(true);
          setPropertyDamageLoading(true);
          setLtirLoading(true);
          setTrirLoading(true);
          setSeverityRateLoading(true);
          
          await loadAllData(selectedYear);
          
          logger.log(`${selectedYear}년 배치 데이터 로딩 완료`);
        } catch (error) {
          logger.error(`${selectedYear}년 배치 데이터 로딩 오류:`, error);
          setError('데이터를 불러오는데 실패했습니다.');
        } finally {
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
  }, [selectedYear, ltirBase, loadAllData, logger]);

  // 연도 옵션이 로드되면 그래프 데이터 수집
  useEffect(() => {
    if (yearOptions.length > 0) {
      console.log('[그래프] 연도 옵션 로드됨, 그래프 데이터 수집 시작:', yearOptions);
      setTimeout(() => {
        fetchChartData();
        fetchDetailedSafetyIndexData();
      }, 100);
    }
  }, [yearOptions, fetchChartData, fetchDetailedSafetyIndexData]);

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
              <button
                onClick={() => {
                  fetchChartData();
                  fetchDetailedSafetyIndexData();
                }}
                disabled={!isMounted || chartLoading || detailedChartLoading}
                className={`inline-flex items-center px-3 py-2 text-white text-sm font-medium rounded-md transition-colors shadow-sm hover:shadow-md ${
                  (!isMounted || chartLoading || detailedChartLoading)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary-700 hover:bg-primary-800'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {(!isMounted || chartLoading || detailedChartLoading) ? '데이터 수집 중...' : '새로고침'}
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
              <DetailedSafetyIndexChart 
                data={detailedSafetyIndexData} 
                loading={detailedChartLoading}
                ltirBase={ltirBase}
              />
            </div>
          )}
        </div>
      )}

      {/* 통합된 사고지표 카드 섹션 */}
      <div className="mt-8">
        <div className={`${activeTab === 'overview' ? 'block' : 'hidden md:block'}`}>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">주요 지표 요약</h2>
            <p className="text-gray-600 text-sm">
              선택된 연도의 사고지표를 한눈에 확인할 수 있습니다.
            </p>
          </div>
          
          {/* 사고지표 카드 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <AccidentCountCard 
              count={accidentCount}
              employeeAccidentCount={employeeAccidentCount}
              contractorAccidentCount={contractorAccidentCount}
              siteAccidentCounts={siteAccidentCounts}
              loading={loading} 
            />
            
            <VictimCountCard
              count={victimCount}
              employeeCount={employeeCount}
              contractorCount={contractorCount}
              injuryTypeCounts={injuryTypeCounts}
              loading={victimLoading}
            />
            
            <PropertyDamageCard
              directDamageAmount={directDamageAmount}
              indirectDamageAmount={indirectDamageAmount}
              loading={propertyDamageLoading}
            />
            
            <LTIRCard
              ltir={ltir}
              employeeLtir={employeeLtir}
              contractorLtir={contractorLtir}
              ltirBase={ltirBase}
              setLtirBase={setLtirBase}
              loading={ltirLoading}
            />
            
            <TRIRCard
              trir={trir}
              employeeTrir={employeeTrir}
              contractorTrir={contractorTrir}
              trirBase={ltirBase}
              setTrirBase={setLtirBase}
              loading={trirLoading}
            />
            
            <SeverityRateCard
              severityRate={severityRate}
              employeeSeverityRate={employeeSeverityRate}
              contractorSeverityRate={contractorSeverityRate}
              totalLossDays={totalLossDays}
              loading={severityRateLoading}
            />
          </div>
        </div>

        {/* 년도별 추이 그래프 섹션 - 데스크탑에서만 표시 */}
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
                  onClick={() => {
                    fetchChartData();
                    fetchDetailedSafetyIndexData();
                  }}
                  disabled={chartLoading || detailedChartLoading}
                  className="inline-flex items-center px-3 py-2 bg-primary-700 text-white text-sm font-medium rounded-md hover:bg-primary-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {(chartLoading || detailedChartLoading) ? '데이터 수집 중...' : '새로고침'}
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