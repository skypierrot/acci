import React from 'react';

/**
 * @file CorrectiveActionsDashboard.tsx
 * @description
 *  - 개선조치(재발방지대책) 진행현황 대시보드 컴포넌트
 *  - 연도별 전체/상태별(대기, 진행, 지연, 완료) 건수 표시
 *  - 기존 사고조사현황 대시보드 스타일 참고
 */

// 상태별 색상 정의
const statusColors: Record<string, string> = {
  대기: 'bg-gray-200 text-gray-700',
  진행: 'bg-blue-100 text-blue-800',
  지연: 'bg-red-100 text-red-800',
  완료: 'bg-green-100 text-green-800',
};

interface CorrectiveActionsDashboardProps {
  years: number[];
  selectedYear: number;
  onYearChange: (year: number) => void;
  total: number;
  대기: number;
  진행: number;
  지연: number;
  완료: number;
}

/**
 * 개선조치 진행현황 대시보드
 * @param years 연도 목록
 * @param selectedYear 선택된 연도
 * @param onYearChange 연도 변경 핸들러
 * @param total 전체 건수
 * @param 대기 대기 건수
 * @param 진행 진행 건수
 * @param 지연 지연 건수
 * @param 완료 완료 건수
 */
const CorrectiveActionsDashboard: React.FC<CorrectiveActionsDashboardProps> = ({
  years,
  selectedYear,
  onYearChange,
  total,
  대기,
  진행,
  지연,
  완료,
}) => {
  return (
    <div className="w-full bg-white shadow rounded-lg p-4 mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg text-green-700">개선조치 진행현황</span>
          <select
            className="ml-2 px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-green-400"
            value={selectedYear}
            onChange={e => onYearChange(Number(e.target.value))}
          >
            {years.map(year => (
              <option key={year} value={year}>{year}년</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-sm">전체</span>
          <span className="text-2xl font-bold text-green-700">{total}건</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-between md:justify-start mt-2">
        <div className={`px-4 py-2 rounded font-semibold text-sm ${statusColors['대기']}`}>대기 {대기}건</div>
        <div className={`px-4 py-2 rounded font-semibold text-sm ${statusColors['진행']}`}>진행 {진행}건</div>
        <div className={`px-4 py-2 rounded font-semibold text-sm ${statusColors['지연']}`}>지연 {지연}건</div>
        <div className={`px-4 py-2 rounded font-semibold text-sm ${statusColors['완료']}`}>완료 {완료}건</div>
      </div>
    </div>
  );
};

export default CorrectiveActionsDashboard; 