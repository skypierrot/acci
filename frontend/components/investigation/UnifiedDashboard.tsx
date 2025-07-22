import React, { useState } from 'react';

/**
 * @file UnifiedDashboard.tsx
 * @description
 *  - 컴팩트한 칸반 스타일의 사고조사/개선조치 대시보드
 *  - 정보 밀도를 높이고 화면 공간을 효율적으로 사용
 *  - 그라데이션 배경, 그림자 효과, 호버 애니메이션 유지
 *  - 기존 기능 100% 유지 (탭, 연도 선택, 상태별 카운트)
 *  - 새로운 색상 팔레트 적용 (Slate/Emerald 계열)
 *  - 한글 주석 포함
 *  - 카드 클릭 시 필터링 기능 추가
 */

const TABS = [
  { key: 'investigation', label: '사고조사현황', icon: '🔍' },
  { key: 'corrective', label: '개선조치 진행현황', icon: '⚡' },
];

// 새로운 색상 팔레트 기반 상태별 색상 정의 (붙여쓰기 통일)
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  '전체': { 
    bg: 'bg-gradient-to-br from-slate-50 to-slate-100', 
    text: 'text-slate-700', 
    border: 'border-slate-200',
    gradient: 'from-slate-400 to-slate-500'
  },
  '대기': { 
    bg: 'bg-gradient-to-br from-slate-50 to-slate-100', 
    text: 'text-slate-700', 
    border: 'border-slate-200',
    gradient: 'from-slate-400 to-slate-500'
  },
  '조사진행': { 
    bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100', 
    text: 'text-yellow-700', 
    border: 'border-yellow-200',
    gradient: 'from-yellow-400 to-yellow-500'
  },
  '조사완료': { 
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100', 
    text: 'text-blue-700', 
    border: 'border-blue-200',
    gradient: 'from-blue-400 to-blue-500'
  },
  '대책이행': { 
    bg: 'bg-gradient-to-br from-purple-50 to-purple-100', 
    text: 'text-purple-700', 
    border: 'border-purple-200',
    gradient: 'from-purple-400 to-purple-500'
  },
  '조치완료': { 
    bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100', 
    text: 'text-emerald-700', 
    border: 'border-emerald-200',
    gradient: 'from-emerald-400 to-emerald-500'
  },
  '진행': { 
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100', 
    text: 'text-blue-700', 
    border: 'border-blue-200',
    gradient: 'from-blue-400 to-blue-500'
  },
  '지연': { 
    bg: 'bg-gradient-to-br from-red-50 to-red-100', 
    text: 'text-red-700', 
    border: 'border-red-200',
    gradient: 'from-red-400 to-red-500'
  },
  '완료': { 
    bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100', 
    text: 'text-emerald-700', 
    border: 'border-emerald-200',
    gradient: 'from-emerald-400 to-emerald-500'
  },
};

interface UnifiedDashboardProps {
  years: number[];
  selectedYear: number;
  onYearChange: (year: number) => void;
  sites: { code: string; name: string }[]; // site 목록
  selectedSite: string; // 선택된 site_code
  onSiteChange: (siteCode: string) => void;
  investigationSummary: any;
  correctiveSummary: any;
  onInvestigationFilter?: (status: string) => void;
  onCorrectiveFilter?: (status: string) => void;
  activeInvestigationFilter?: string;
  activeCorrectiveFilter?: string;
}

export default function UnifiedDashboard({
  years,
  selectedYear,
  onYearChange,
  sites,
  selectedSite,
  onSiteChange,
  investigationSummary,
  correctiveSummary,
  onInvestigationFilter,
  onCorrectiveFilter,
  activeInvestigationFilter,
  activeCorrectiveFilter,
}: UnifiedDashboardProps) {
  const [activeTab, setActiveTab] = useState('investigation');

  // 조사보고서 데이터 준비
  const investigationData = {
    total: investigationSummary?.total || 0,
    states: investigationSummary?.statusList?.map((status: string) => ({
      label: status,
      value: investigationSummary?.statusCounts?.[status] || 0,
    })) || [],
  };

  // 개선조치 데이터 준비
  const correctiveData = {
    total: correctiveSummary?.total || 0,
    states: [
      { label: '대기', value: correctiveSummary?.pending || 0 },
      { label: '진행', value: correctiveSummary?.in_progress || 0 },
      { label: '지연', value: correctiveSummary?.delayed || 0 },
      { label: '완료', value: correctiveSummary?.completed || 0 },
    ],
  };

  const currentData = activeTab === 'investigation' ? investigationData : correctiveData;

  // 카드 클릭 핸들러
  const handleCardClick = (status: string) => {
    if (activeTab === 'investigation') {
      onInvestigationFilter?.(status);
    } else {
      onCorrectiveFilter?.(status);
    }
  };

  // 전체 카드 클릭 핸들러 (필터 해제)
  const handleTotalClick = () => {
    if (activeTab === 'investigation') {
      onInvestigationFilter?.('');
    } else {
      onCorrectiveFilter?.('전체'); // 개선조치 현황에서는 '전체'를 명시적으로 전달
    }
  };

  // 탭 클릭 핸들러 (탭 변경 시 해당 탭의 전체 필터 적용)
  const handleTabClick = (tabKey: string) => {
    setActiveTab(tabKey);
    
    // 탭 변경 시 해당 탭의 전체 필터 적용
    if (tabKey === 'investigation') {
      onInvestigationFilter?.('');
    } else if (tabKey === 'corrective') {
      onCorrectiveFilter?.('전체');
    }
  };

  return (
    <div className="w-full bg-white shadow-md rounded-lg p-4 mb-4">
      {/* 헤더 및 탭 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-neutral-900">통합 대시보드</h2>
          
          {/* 탭 버튼 */}
          <div className="flex bg-neutral-100 rounded-md p-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all duration-200 flex items-center gap-1 ${
                  activeTab === tab.key
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-800'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* site + 연도 드롭다운 */}
        <div className="flex items-center gap-2">
          {/* [사업장 드롭다운] */}
          <span className="text-xs text-neutral-600">사업장:</span>
          <select
            value={selectedSite}
            onChange={e => onSiteChange(e.target.value)}
            className="px-2 py-1 border border-neutral-200 rounded text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">전체</option>
            {sites.map(site => (
              <option key={site.code} value={site.code}>{site.name}</option>
            ))}
          </select>
          {/* [연도 드롭다운] */}
          <span className="text-xs text-neutral-600">연도:</span>
          <select
            value={selectedYear}
            onChange={e => onYearChange(Number(e.target.value))}
            className="px-2 py-1 border border-neutral-200 rounded text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}년</option>
            ))}
          </select>
        </div>
      </div>

      {/* 전체 통계 */}
      <div className="mb-3">
        <div 
          className="flex items-center justify-between cursor-pointer hover:bg-neutral-50 p-2 rounded transition-colors"
          onClick={handleTotalClick}
        >
          <span className="text-xs text-neutral-500">전체</span>
          <div className="text-lg font-bold text-primary-700">{currentData.total}건</div>
        </div>
      </div>

      {/* 상태별 카드 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {currentData.states.map((state) => {
          const colorConfig = STATUS_COLORS[state.label] || STATUS_COLORS['대기'];
          const percentage = currentData.total > 0 ? Math.round((state.value / currentData.total) * 100) : 0;
          
          // 활성 필터 확인
          const isActive = activeTab === 'investigation' 
            ? activeInvestigationFilter === state.label
            : activeCorrectiveFilter === state.label;
          
          return (
            <div
              key={state.label}
              onClick={() => handleCardClick(state.label)}
              className={`${colorConfig.bg} rounded-md p-2 border ${colorConfig.border} shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group relative ${
                isActive ? 'ring-2 ring-primary-500 ring-offset-2' : ''
              }`}
            >
              {/* 활성 필터 표시 */}
              {isActive && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full"></div>
              )}
              
              {/* 카드 헤더 */}
              <div className="mb-1">
                <h4 className={`text-sm font-semibold ${colorConfig.text}`}>{state.label}</h4>
              </div>
              
              {/* 건수 표시 - 진행률 바 위쪽 중앙 */}
              <div className="text-center mb-1">
                <div className={`text-base font-bold ${colorConfig.text}`}>{state.value}건</div>
              </div>
              
              {/* 진행률 바 - 컴팩트 */}
              <div className="mb-1">
                <div className="flex justify-between text-xs text-neutral-600 mb-0.5">
                  <span>진행률</span>
                  <span>{percentage}%</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-1 overflow-hidden">
                  <div 
                    className={`h-1 rounded-full bg-gradient-to-r ${colorConfig.gradient} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 활성 필터 표시 */}
      {(activeInvestigationFilter || activeCorrectiveFilter) && (
        <div className="mt-3 pt-2 border-t border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="text-xs text-neutral-600">
              활성 필터: 
              <span className="ml-1 font-medium text-primary-700">
                {activeTab === 'investigation' ? activeInvestigationFilter : activeCorrectiveFilter}
              </span>
            </div>
            <button
              onClick={() => activeTab === 'investigation' ? onInvestigationFilter?.('') : onCorrectiveFilter?.('전체')}
              className="text-xs text-neutral-500 hover:text-neutral-700 underline"
            >
              필터 해제
            </button>
          </div>
        </div>
      )}

      {/* 추가 정보 */}
      <div className="mt-3 pt-2 border-t border-neutral-200">
        <div className="text-xs text-neutral-500 text-center">
          {activeTab === 'investigation' ? '사고조사 진행상황' : '개선조치 진행상황'} - {selectedYear}년 기준
        </div>
      </div>
    </div>
  );
} 