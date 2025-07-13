import React, { useState } from 'react';

/**
 * @file UnifiedDashboard.tsx
 * @description
 *  - 미니멀+정렬+도트 스타일의 사고조사/개선조치 대시보드
 *  - 탭+연도 한 줄, 상태별 카운트+전체건수(●) 한 줄로 배치
 *  - 전체건수는 상태별 카운트 줄의 맨 왼쪽에 ● 도트와 함께 표시
 *  - 한글 주석 포함
 */

const TABS = [
  { key: 'investigation', label: '사고조사현황' },
  { key: 'corrective', label: '개선조치 진행현황' },
];

const STATUS_COLORS: Record<string, string> = {
  '전체': 'text-black',
  '대기': 'text-gray-400',
  '조사 착수': 'text-yellow-400',
  '조사 진행': 'text-blue-400',
  '대책 이행중': 'text-purple-400',
  '완료': 'text-green-400',
  '진행': 'text-blue-400',
  '지연': 'text-red-400',
};

interface UnifiedDashboardProps {
  years: number[];
  selectedYear: number;
  onYearChange: (year: number) => void;
  investigationSummary: any;
  correctiveSummary: any;
}

export default function UnifiedDashboard({
  years,
  selectedYear,
  onYearChange,
  investigationSummary,
  correctiveSummary,
}: UnifiedDashboardProps) {
  const [tab, setTab] = useState<'investigation' | 'corrective'>('investigation');

  // 사고조사현황 상태값별 동적 카운트 렌더링
  const investigationStates = investigationSummary.statusList.map((status: string) => ({
    label: status,
    value: investigationSummary.statusCounts[status] || 0,
  }));
  const correctiveStates = [
    { label: '대기', value: correctiveSummary.pending },
    { label: '진행', value: correctiveSummary.in_progress },
    { label: '지연', value: correctiveSummary.delayed },
    { label: '완료', value: correctiveSummary.completed },
  ];

  const states = tab === 'investigation' ? investigationStates : correctiveStates;
  const total = tab === 'investigation' ? investigationSummary.total : correctiveSummary.total;

  return (
    <div className="w-full max-w-4xl mx-auto mb-4">
      {/* 탭 + 연도 한 줄 flex row */}
      <div className="flex items-center justify-between gap-2 mb-1">
        {/* 탭 버튼 */}
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`px-3 py-1 rounded-t font-semibold text-sm transition-colors ${tab === t.key ? 'bg-blue-100 text-blue-700 border border-blue-400' : 'bg-gray-100 text-gray-500 border border-transparent'}`}
              onClick={() => setTab(t.key as any)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {/* 연도 선택 */}
        <div className="flex items-center gap-2">
          <select
            className="border border-gray-200 rounded px-1 py-0.5 text-xs focus:outline-none"
            value={selectedYear}
            onChange={e => onYearChange(Number(e.target.value))}
          >
            {years.map(y => <option key={y} value={y}>{y}년</option>)}
          </select>
        </div>
      </div>
      {/* 전체건수(●) + 상태별 카운트 한 줄 */}
      <div className="flex flex-wrap items-center gap-3 text-sm font-medium min-h-[32px]">
        <span className="flex items-center gap-1">
          <span className={`text-base align-middle ${STATUS_COLORS['전체']}`}>●</span>
          <span>전체 <span className="font-bold text-blue-700">{total}</span>건</span>
        </span>
        {states.map((s) => (
          <span key={s.label} className="flex items-center gap-1">
            <span className={`text-base align-middle ${STATUS_COLORS[s.label]}`}>●</span>
            <span>{s.label} <span className="font-semibold">{s.value}</span>건</span>
          </span>
        ))}
      </div>
    </div>
  );
} 