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
 */

const TABS = [
  { key: 'investigation', label: '사고조사현황', icon: '🔍' },
  { key: 'corrective', label: '개선조치 진행현황', icon: '⚡' },
];

// 새로운 색상 팔레트 기반 상태별 색상 정의
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  '전체': { 
    bg: 'bg-gradient-to-br from-primary-50 to-primary-100', 
    text: 'text-primary-700', 
    border: 'border-primary-200',
    gradient: 'from-primary-400 to-primary-500'
  },
  '대기': { 
    bg: 'bg-gradient-to-br from-status-pending-50 to-status-pending-100', 
    text: 'text-status-pending-700', 
    border: 'border-status-pending-200',
    gradient: 'from-status-pending-400 to-status-pending-500'
  },
  '조사 진행': { 
    bg: 'bg-gradient-to-br from-status-progress-50 to-status-progress-100', 
    text: 'text-status-progress-700', 
    border: 'border-status-progress-200',
    gradient: 'from-status-progress-400 to-status-progress-500'
  },
  '조사 완료': { 
    bg: 'bg-gradient-to-br from-status-info-50 to-status-info-100', 
    text: 'text-status-info-700', 
    border: 'border-status-info-200',
    gradient: 'from-status-info-400 to-status-info-500'
  },
  '대책 이행': { 
    bg: 'bg-gradient-to-br from-primary-50 to-primary-100', 
    text: 'text-primary-700', 
    border: 'border-primary-200',
    gradient: 'from-primary-400 to-primary-500'
  },
  '조치완료': { 
    bg: 'bg-gradient-to-br from-status-success-50 to-status-success-100', 
    text: 'text-status-success-700', 
    border: 'border-status-success-200',
    gradient: 'from-status-success-400 to-status-success-500'
  },
  '진행중': { 
    bg: 'bg-gradient-to-br from-status-info-50 to-status-info-100', 
    text: 'text-status-info-700', 
    border: 'border-status-info-200',
    gradient: 'from-status-info-400 to-status-info-500'
  },
  '지연': { 
    bg: 'bg-gradient-to-br from-status-error-50 to-status-error-100', 
    text: 'text-status-error-700', 
    border: 'border-status-error-200',
    gradient: 'from-status-error-400 to-status-error-500'
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
      { label: '진행중', value: correctiveSummary?.in_progress || 0 },
      { label: '지연', value: correctiveSummary?.delayed || 0 },
      { label: '완료', value: correctiveSummary?.completed || 0 },
    ],
  };

  const currentData = activeTab === 'investigation' ? investigationData : correctiveData;

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
                onClick={() => setActiveTab(tab.key)}
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

        {/* 연도 선택 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-600">연도:</span>
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
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
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-500">전체</span>
          <div className="text-lg font-bold text-primary-700">{currentData.total}건</div>
        </div>
      </div>

      {/* 상태별 카드 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {currentData.states.map((state) => {
          const colorConfig = STATUS_COLORS[state.label] || STATUS_COLORS['대기'];
          const percentage = currentData.total > 0 ? Math.round((state.value / currentData.total) * 100) : 0;
          
          return (
            <div
              key={state.label}
              className={`${colorConfig.bg} rounded-md p-2 border ${colorConfig.border} shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group relative`}
            >
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

      {/* 추가 정보 */}
      <div className="mt-3 pt-2 border-t border-neutral-200">
        <div className="text-xs text-neutral-500 text-center">
          {activeTab === 'investigation' ? '사고조사 진행상황' : '개선조치 진행상황'} - {selectedYear}년 기준
        </div>
      </div>
    </div>
  );
} 