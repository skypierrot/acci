"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import HistoryTable from '../components/history/HistoryTable';
import { ExpandedRowDetails } from './history/client';
import { getAccidentTypeDisplay, getCompletionRateColor } from '../utils/statusUtils';

/**
 * @file app/page.tsx
 * @description
 *  - 메인 페이지 (대시보드)
 *  - 사고 통계 및 최근 사고 목록 표시
 */

interface AccidentStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

interface RecentAccident {
  id: string;
  date: string;
  company: string;
  location: string;
  type: string;
  status: string;
}

export default function Dashboard() {
  const router = useRouter();
  // 실제 사고 이력 데이터 상태
  const [reports, setReports] = useState<any[]>([]);
  const [investigationMap, setInvestigationMap] = useState(new Map());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [yearOptions, setYearOptions] = useState<number[]>([]);

  // 사고발생보고서에서 년도 추출 함수
  const extractYearsFromReports = (reports: any[]) => {
    const years = new Set<number>();
    
    reports.forEach(report => {
      if (report.occurrence_date) {
        try {
          const year = new Date(report.occurrence_date).getFullYear();
          years.add(year);
        } catch (e) {
          console.warn('Invalid date format:', report.occurrence_date);
        }
      }
    });
    
    // 년도를 내림차순으로 정렬 (최신 년도부터)
    return Array.from(years).sort((a, b) => b - a);
  };

  // 상태 표기 함수 등은 /history에서 복사
  const getDisplayStatus = (report: any) => {
    const investigation = investigationMap.get(report.accident_id);
    if (!investigation) return '발생';
    if (investigation.investigation_status === '대기') return '조사 대기';
    const rawStatus = investigation.investigation_status;
    if (rawStatus === '조사 진행') return '조사 진행';
    if (rawStatus === '조사 완료') return '조사 완료';
    if (rawStatus === '대책 이행') return '대책 이행';
    if (rawStatus === '조치완료') return '종결';
    return rawStatus;
  };
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case '발생': return 'bg-red-100 text-red-800';
      case '조사 대기': return 'bg-slate-100 text-slate-800';
      case '조사 진행': return 'bg-yellow-100 text-yellow-800';
      case '조사 완료': return 'bg-blue-100 text-blue-800';
      case '대책 이행': return 'bg-purple-100 text-purple-800';
      case '종결': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const getAccidentTypeDisplay = (report: any) => {
    const accidentType = report.final_accident_type_level1 || report.accident_type_level1;
    const hasVictims = report.victims_info && report.victims_info.length > 0;
    const hasPropertyDamages = report.property_damages_info && report.property_damages_info.length > 0;
    if (hasVictims && hasPropertyDamages) return { type: '복합', displayType: 'both' };
    if (hasVictims) return { type: '인적', displayType: 'human' };
    if (hasPropertyDamages) return { type: '물적', displayType: 'property' };
    return { type: accidentType, displayType: 'unknown' };
  };
  const toggleRowExpansion = (accidentId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accidentId)) newSet.delete(accidentId);
      else newSet.add(accidentId);
      return newSet;
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/history?size=5&page=1').then(res => res.json()),
      fetch('/api/investigation?offset=0&limit=10000').then(res => res.json())
    ]).then(([historyData, investigationData]) => {
      const reportsData = historyData.reports || [];
      setReports(reportsData);
      
      // 년도 옵션 추출 및 설정
      const years = extractYearsFromReports(reportsData);
      setYearOptions(years);
      
      // 기본 선택 년도를 가장 최신 년도로 설정
      if (years.length > 0 && !years.includes(selectedYear)) {
        setSelectedYear(years[0]);
      }
      
      const map = new Map();
      (investigationData.reports || []).forEach((inv: any) => {
        if (inv.accident_id) map.set(inv.accident_id, inv);
      });
      setInvestigationMap(map);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">데이터 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="year-select" className="text-sm font-medium text-gray-700">
              년도:
            </label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              disabled={yearOptions.length === 0}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:text-gray-500"
            >
              {yearOptions.length === 0 ? (
                <option value="">데이터 없음</option>
              ) : (
                yearOptions.map(year => (
                  <option key={year} value={year}>
                    {year}년
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>
      
      {/* 사고 지표 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-lg font-semibold text-gray-700">전체 사고건</div>
          <div className="text-3xl font-bold text-emerald-600 mt-2">{reports.length}</div>
          <div className="text-sm text-gray-500 mt-1">건</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-lg font-semibold text-gray-700">중대재해</div>
          <div className="text-3xl font-bold text-red-600 mt-2">0</div>
          <div className="text-sm text-gray-500 mt-1">건</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-lg font-semibold text-gray-700">LTIR</div>
          <div className="text-3xl font-bold text-orange-600 mt-2">0.00</div>
          <div className="text-sm text-gray-500 mt-1">%</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-lg font-semibold text-gray-700">TRIR</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">0.00</div>
          <div className="text-sm text-gray-500 mt-1">%</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-lg font-semibold text-gray-700">강도율</div>
          <div className="text-3xl font-bold text-purple-600 mt-2">0.00</div>
          <div className="text-sm text-gray-500 mt-1">%</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-lg font-semibold text-gray-700">재해자 수</div>
          <div className="text-3xl font-bold text-indigo-600 mt-2">0</div>
          <div className="text-sm text-gray-500 mt-1">명</div>
        </div>
      </div>
      
      {/* 최근 사고 목록 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">최근 사고 발생</h2>
          <Link href="/history" className="text-emerald-600 hover:underline">
            모두 보기
          </Link>
        </div>
        <HistoryTable
          reports={reports}
          investigationMap={investigationMap}
          getDisplayStatus={getDisplayStatus}
          getStatusBadgeClass={getStatusBadgeClass}
          getAccidentTypeDisplay={getAccidentTypeDisplay}
          expandedRows={expandedRows}
          toggleRowExpansion={toggleRowExpansion}
          router={router}
          ExpandedRowDetails={ExpandedRowDetails}
          formatDate={formatDate}
        />
      </div>
    </div>
  );
} 