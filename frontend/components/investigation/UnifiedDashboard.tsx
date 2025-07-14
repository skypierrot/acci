import React, { useState } from 'react';

/**
 * @file UnifiedDashboard.tsx
 * @description
 *  - 컴팩트한 칸반 스타일의 사고조사/개선조치 대시보드
 *  - 정보 밀도를 높이고 화면 공간을 효율적으로 사용
 *  - 그라데이션 배경, 그림자 효과, 호버 애니메이션 유지
 *  - 기존 기능 100% 유지 (탭, 연도 선택, 상태별 카운트)
 *  - 한글 주석 포함
 */

const TABS = [
  { key: 'investigation', label: '사고조사현황', icon: '🔍' },
  { key: 'corrective', label: '개선조치 진행현황', icon: '⚡' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  '전체': { 
    bg: 'bg-gradient-to-br from-blue-50 to-indigo-100', 
    text: 'text-blue-700', 
    border: 'border-blue-200',
    gradient: 'from-blue-400 to-indigo-500'
  },
  '대기': { 
    bg: 'bg-gradient-to-br from-gray-50 to-slate-100', 
    text: 'text-gray-600', 
    border: 'border-gray-200',
    gradient: 'from-gray-400 to-slate-500'
  },
  '조사 착수': { 
    bg: 'bg-gradient-to-br from-yellow-50 to-amber-100', 
    text: 'text-yellow-700', 
    border: 'border-yellow-200',
    gradient: 'from-yellow-400 to-amber-500'
  },
  '조사 진행': { 
    bg: 'bg-gradient-to-br from-blue-50 to-cyan-100', 
    text: 'text-blue-700', 
    border: 'border-blue-200',
    gradient: 'from-blue-400 to-cyan-500'
  },
  '대책 이행중': { 
    bg: 'bg-gradient-to-br from-purple-50 to-violet-100', 
    text: 'text-purple-700', 
    border: 'border-purple-200',
    gradient: 'from-purple-400 to-violet-500'
  },
  '완료': { 
    bg: 'bg-gradient-to-br from-green-50 to-emerald-100', 
    text: 'text-green-700', 
    border: 'border-green-200',
    gradient: 'from-green-400 to-emerald-500'
  },
  '진행': { 
    bg: 'bg-gradient-to-br from-blue-50 to-cyan-100', 
    text: 'text-blue-700', 
    border: 'border-blue-200',
    gradient: 'from-blue-400 to-cyan-500'
  },
  '지연': { 
    bg: 'bg-gradient-to-br from-red-50 to-rose-100', 
    text: 'text-red-700', 
    border: 'border-red-200',
    gradient: 'from-red-400 to-rose-500'
  },
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
  const cardCount = 1 + states.length; // 전체 + 상태별 카드 개수

  return (
    <div className="w-full max-w-6xl mx-auto mb-4">
      {/* 컴팩트한 메인 대시보드 카드 */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
        {/* 헤더 섹션 - 탭 + 연도 선택 (컴팩트) */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {/* 탭 버튼 - 컴팩트 스타일 */}
            <div className="flex gap-1">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-1.5 ${
                    tab === t.key 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md' 
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setTab(t.key as any)}
                >
                  <span className="text-sm">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
            
            {/* 연도 선택 - 컴팩트 */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600">연도:</span>
              <select
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                value={selectedYear}
                onChange={e => onYearChange(Number(e.target.value))}
              >
                {years.map(y => <option key={y} value={y}>{y}년</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* 컴팩트한 대시보드 섹션 */}
        <div className="p-4">
          {/* 전체 건수 + 상태별 카드 한 줄에 배치 (카드 개수만큼 열 생성) */}
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${cardCount}, minmax(0, 1fr))` }}
          >
            {/* 전체 건수 카드 - 컴팩트 */}
            <div className={`${STATUS_COLORS['전체'].bg} rounded-lg p-3 border ${STATUS_COLORS['전체'].border} shadow-md hover:shadow-lg transition-all duration-200`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${STATUS_COLORS['전체'].gradient} flex items-center justify-center text-white text-sm font-bold`}>
                    📊
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">전체</h3>
                    <p className="text-xs text-gray-600">{selectedYear}년</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-700">{total}</div>
                  <div className="text-xs text-gray-500">건</div>
                </div>
              </div>
            </div>

            {/* 상태별 카드 - 컴팩트 */}
            {states.map((state) => {
              const colorConfig = STATUS_COLORS[state.label] || STATUS_COLORS['대기'];
              const percentage = total > 0 ? Math.round((state.value / total) * 100) : 0;
              
              return (
                <div
                  key={state.label}
                  className={`${colorConfig.bg} rounded-lg p-3 border ${colorConfig.border} shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer group relative`}
                >
                  {/* 카드 헤더 */}
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`text-sm font-semibold ${colorConfig.text}`}>{state.label}</h4>
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${colorConfig.gradient} flex items-center justify-center text-white text-xs font-bold`}>
                      {state.value}
                    </div>
                  </div>
                  
                  {/* 진행률 바 - 컴팩트 */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>진행률</span>
                      <span>{percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full bg-gradient-to-r ${colorConfig.gradient} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* 상세 정보 - 컴팩트 */}
                  <div className="text-center">
                    <div className={`text-lg font-bold ${colorConfig.text}`}>{state.value}</div>
                    <div className="text-xs text-gray-500">건</div>
                  </div>
                  
                  {/* 호버 효과 - 상세 정보 표시 */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="bg-white rounded-lg p-2 text-center">
                      <div className="text-xs font-semibold text-gray-800">{state.label}</div>
                      <div className="text-sm font-bold text-blue-600">{state.value}건</div>
                      <div className="text-xs text-gray-500">전체의 {percentage}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 