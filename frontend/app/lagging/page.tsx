'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  LaggingSummary, 
  ChartType, 
  ConstantType,
  TrendChartData,
  SafetyIndexChartData,
  DetailedChartData
} from '../../components/lagging/types';
import { LaggingApiService } from '../../components/lagging/services/api.service';
import { CalculationService } from '../../components/lagging/services/calculation.service';

// Cards
import { AccidentCountCard } from '../../components/lagging/cards/AccidentCountCard';
import { VictimCountCard } from '../../components/lagging/cards/VictimCountCard';
import { PropertyDamageCard } from '../../components/lagging/cards/PropertyDamageCard';
import { LTIRCard } from '../../components/lagging/cards/LTIRCard';
import { TRIRCard } from '../../components/lagging/cards/TRIRCard';
import { SeverityRateCard } from '../../components/lagging/cards/SeverityRateCard';

// Charts
import { BasicTrendChart } from '../../components/lagging/charts/BasicTrendChart';
import { BasicSafetyIndexChart } from '../../components/lagging/charts/BasicSafetyIndexChart';
import { DetailedAccidentChart } from '../../components/lagging/charts/DetailedAccidentChart';
import { DetailedSafetyIndexChart } from '../../components/lagging/charts/DetailedSafetyIndexChart';
import { DetailedSeverityRateChart } from '../../components/lagging/charts/DetailedSeverityRateChart';

// Common
import { YearSelector } from '../../components/lagging/common/YearSelector';
import { ChartTypeSelector } from '../../components/lagging/common/ChartTypeSelector';
import { LoadingOverlay } from '../../components/lagging/common/LoadingOverlay';
import { MobileTabNavigation, TabType } from '../../components/lagging/common/MobileTabNavigation';

export default function LaggingPage() {
  // State management
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [currentSummary, setCurrentSummary] = useState<LaggingSummary | null>(null);
  const [multiYearSummaries, setMultiYearSummaries] = useState<LaggingSummary[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<ChartType>('basic');
  const [constant, setConstant] = useState<ConstantType>(200000);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [basicYearRange, setBasicYearRange] = useState(5);
  const [detailedYearRange, setDetailedYearRange] = useState(10);

  // Initialize available years
  useEffect(() => {
    const initializeYears = async () => {
      try {
        setLoading(true);
        console.log('[LaggingPage] Fetching available years...');
        const years = await LaggingApiService.fetchAvailableYears();
        console.log('[LaggingPage] Available years:', years);
        setAvailableYears(years);
        
        if (years.length > 0) {
          const latestYear = years[0];
          console.log('[LaggingPage] Setting selected year to:', latestYear);
          setSelectedYear(latestYear);
        } else {
          console.log('[LaggingPage] No years found!');
          setError('사용 가능한 연도가 없습니다.');
        }
      } catch (err) {
        console.error('Failed to initialize years:', err);
        setError('연도 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    initializeYears();
  }, []);

  // Load data for selected year
  useEffect(() => {
    console.log('[LaggingPage] Load data effect - selectedYear:', selectedYear, 'availableYears.length:', availableYears.length);
    if (!selectedYear) return;

    const loadYearData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('[LaggingPage] Loading data for year:', selectedYear);
        const summary = await LaggingApiService.fetchSummaryByYear(selectedYear);
        console.log('[LaggingPage] Raw summary:', summary);
        
        const recalculated = CalculationService.recalculateIndices(summary, constant);
        console.log('[LaggingPage] Final summary:', recalculated);
        
        setCurrentSummary(recalculated);
      } catch (err) {
        console.error('Failed to load year data:', err);
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadYearData();
  }, [selectedYear, constant]);

  // Load multi-year data for charts
  useEffect(() => {
    if (availableYears.length === 0) return;

    const loadChartData = async () => {
      try {
        setChartLoading(true);
        const summaries = await LaggingApiService.fetchMultiYearSummaries(availableYears);
        const recalculated = summaries.map(s => 
          CalculationService.recalculateIndices(s, constant)
        );
        setMultiYearSummaries(recalculated);
      } catch (err) {
        console.error('Failed to load chart data:', err);
      } finally {
        setChartLoading(false);
      }
    };

    loadChartData();
  }, [availableYears, constant]);

  // Transform data for charts
  const getTrendChartData = useCallback((): TrendChartData[] => {
    return multiYearSummaries.map(s => ({
      year: s.year,
      accidentCount: s.accidentCount.total,
      victimCount: s.victimCount.total,
      propertyDamage: s.propertyDamage.direct,
    }));
  }, [multiYearSummaries]);

  const getSafetyIndexChartData = useCallback((): SafetyIndexChartData[] => {
    return multiYearSummaries.map(s => ({
      year: s.year,
      ltir: s.ltir.total,
      trir: s.trir.total,
      severityRate: s.severityRate.total,
    }));
  }, [multiYearSummaries]);

  const getDetailedAccidentData = useCallback((): DetailedChartData[] => {
    return multiYearSummaries.map(s => ({
      year: s.year,
      total: s.accidentCount.total,
      employee: s.accidentCount.employee,
      contractor: s.accidentCount.contractor,
      bysite: s.siteAccidentCounts,
    }));
  }, [multiYearSummaries]);

  const getDetailedVictimData = useCallback((): DetailedChartData[] => {
    return multiYearSummaries.map(s => ({
      year: s.year,
      total: s.victimCount.total,
      employee: s.victimCount.employee,
      contractor: s.victimCount.contractor,
    }));
  }, [multiYearSummaries]);

  const getDetailedSafetyData = useCallback(() => {
    return multiYearSummaries.map(s => ({
      year: s.year,
      ltir: s.ltir,
      trir: s.trir,
    }));
  }, [multiYearSummaries]);

  const getDetailedSeverityData = useCallback(() => {
    return multiYearSummaries.map(s => ({
      year: s.year,
      severityRate: s.severityRate,
      lossDays: s.lossDays,
    }));
  }, [multiYearSummaries]);

  const handleRefreshCharts = useCallback(async () => {
    try {
      setChartLoading(true);
      const summaries = await LaggingApiService.fetchMultiYearSummaries(availableYears);
      const recalculated = summaries.map(s => 
        CalculationService.recalculateIndices(s, constant)
      );
      setMultiYearSummaries(recalculated);
    } catch (err) {
      console.error('Failed to refresh charts:', err);
    } finally {
      setChartLoading(false);
    }
  }, [availableYears, constant]);

  return (
    <div className="min-h-screen bg-gray-50">
      <LoadingOverlay isVisible={loading && !currentSummary} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                사고지표 (Lagging Indicator)
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                과거에 발생한 사고, 재해, 손실 등의 결과를 측정하는 지표입니다.
              </p>
            </div>
            <YearSelector
              selectedYear={selectedYear}
              years={availableYears}
              onChange={setSelectedYear}
              loading={loading}
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Mobile Tab Navigation */}
        <MobileTabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* KPI Cards Section */}
        <div className={`${activeTab === 'overview' ? 'block' : 'hidden md:block'} mb-8`}>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">주요 지표 요약</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentSummary && (
              <>
                <AccidentCountCard
                  data={currentSummary.accidentCount}
                  siteData={currentSummary.siteAccidentCounts}
                  loading={loading}
                />
                <VictimCountCard
                  data={currentSummary.victimCount}
                  injuryTypes={currentSummary.injuryTypeCounts}
                  loading={loading}
                />
                <PropertyDamageCard
                  data={currentSummary.propertyDamage}
                  loading={loading}
                />
                <LTIRCard
                  data={currentSummary.ltir}
                  constant={constant}
                  onConstantChange={setConstant}
                  loading={loading}
                />
                <TRIRCard
                  data={currentSummary.trir}
                  constant={constant}
                  onConstantChange={setConstant}
                  loading={loading}
                />
                <SeverityRateCard
                  data={currentSummary.severityRate}
                  totalLossDays={currentSummary.lossDays.total}
                  lossDaysBreakdown={currentSummary.lossDays}
                  loading={loading}
                />
              </>
            )}
          </div>
        </div>

        {/* Charts Section */}
        <div className={`${activeTab === 'charts' ? 'block' : 'hidden md:block'}`}>
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-800">
                년도별 지표 변화 추이
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleRefreshCharts}
                  disabled={chartLoading}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {chartLoading ? '새로고침 중...' : '새로고침'}
                </button>
                <ChartTypeSelector chartType={chartType} onChange={setChartType} />
              </div>
            </div>
          </div>

          {chartType === 'basic' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BasicTrendChart
                data={getTrendChartData()}
                yearRange={basicYearRange}
                onYearRangeChange={setBasicYearRange}
                loading={chartLoading}
              />
              <BasicSafetyIndexChart
                data={getSafetyIndexChartData()}
                yearRange={basicYearRange}
                onYearRangeChange={setBasicYearRange}
                constant={constant}
                loading={chartLoading}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <DetailedAccidentChart
                accidentData={getDetailedAccidentData()}
                victimData={getDetailedVictimData()}
                yearRange={detailedYearRange}
                loading={chartLoading}
              />
              <DetailedSafetyIndexChart
                data={getDetailedSafetyData()}
                yearRange={detailedYearRange}
                constant={constant}
                loading={chartLoading}
              />
              <DetailedSeverityRateChart
                data={getDetailedSeverityData()}
                yearRange={detailedYearRange}
                loading={chartLoading}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}