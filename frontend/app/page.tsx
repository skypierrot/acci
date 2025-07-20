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
      setReports(historyData.reports || []);
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
        <div className="flex space-x-4">
          <Link href="/settings" className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-gray-800 font-medium transition-colors">
            시스템 관리
          </Link>
        </div>
      </div>
      
      {/* 통계 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xl font-semibold">전체 사고</div>
          {/* [색상 일관성 작업] 파란색 계열 → slate/emerald/neutral 계열로 교체 */}
          {/* 통계 숫자 색상 변경 */}
          <div className="text-3xl font-bold text-emerald-600 mt-2">{reports.length}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xl font-semibold">미착수</div>
          <div className="text-3xl font-bold text-red-500 mt-2">{reports.filter(r => getDisplayStatus(r) === '발생').length}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xl font-semibold">진행 중</div>
          <div className="text-3xl font-bold text-yellow-500 mt-2">{reports.filter(r => getDisplayStatus(r) === '조사 진행').length}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xl font-semibold">완료</div>
          <div className="text-3xl font-bold text-green-600 mt-2">{reports.filter(r => getDisplayStatus(r) === '조사 완료').length}</div>
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
      
      {/* 바로가기 버튼 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/occurrence" className="block">
          <div className="bg-primary-700 text-white rounded-lg shadow p-6 hover:bg-primary-800 transition-colors">
            <div className="text-xl font-semibold">사고 발생보고 등록</div>
            <div className="mt-2">새로운 사고 발생을 보고합니다.</div>
          </div>
        </Link>
        
        <Link href="/occurrence/list" className="block">
          <div className="bg-secondary-700 text-white rounded-lg shadow p-6 hover:bg-secondary-800 transition-colors">
            <div className="text-xl font-semibold">사고 발생보고 목록</div>
            <div className="mt-2">등록된 모든 사고 발생보고를 확인합니다.</div>
          </div>
        </Link>
        
        <Link href="/investigation" className="block">
          <div className="bg-primary-600 text-white rounded-lg shadow p-6 hover:bg-primary-700 transition-colors">
            <div className="text-xl font-semibold">사고 조사보고 작성</div>
            <div className="mt-2">등록된 사고에 대한 조사 결과를 작성합니다.</div>
          </div>
        </Link>
      </div>
    </div>
  );
} 