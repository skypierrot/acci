/**
 * @file components/history/HistoryTable.tsx
 * @description 사고 이력 테이블 메인 컴포넌트
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { HistoryTableProps } from '../../types/history.types';
import HistoryCard from './HistoryCard';
import HistoryTableRow from './HistoryTableRow';
import HistoryTableEmpty from './HistoryTableEmpty';

/**
 * 사고 이력 테이블 메인 컴포넌트
 * - 모바일과 데스크톱 뷰를 자동으로 전환
 * - 반응형 디자인 지원
 * - 성능 최적화 적용
 */
const HistoryTable: React.FC<HistoryTableProps> = React.memo(({
  reports,
  getDisplayStatus,
  getStatusBadgeClass,
  getAccidentTypeDisplay,
  expandedRows,
  toggleRowExpansion,
  router,
  formatDate,
  getCompletionRateColor,
  ExpandedRowDetails,
  investigationMap,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  // 성능 최적화: 모바일 체크 함수를 useCallback으로 메모이제이션
  const checkMobile = useCallback(() => {
    setIsMobile(window.innerWidth < 1024); // lg 브레이크포인트
  }, []);

  useEffect(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [checkMobile]);

  // 성능 최적화: 모바일 뷰 컴포넌트를 useMemo로 메모이제이션
  const MobileView = useMemo(() => () => (
    <div className="lg:hidden space-y-4">
      {reports.length > 0 ? (
        reports.map((report) => (
          <HistoryCard
            key={report.accident_id}
            report={report}
            investigationMap={investigationMap}
            getDisplayStatus={getDisplayStatus}
            getStatusBadgeClass={getStatusBadgeClass}
            getAccidentTypeDisplay={getAccidentTypeDisplay}
            isExpanded={expandedRows.has(report.accident_id)}
            onToggleExpansion={toggleRowExpansion}
            formatDate={formatDate}
            ExpandedRowDetails={ExpandedRowDetails}
          />
        ))
      ) : (
        <HistoryTableEmpty isMobile={true} />
      )}
    </div>
  ), [reports, investigationMap, getDisplayStatus, getStatusBadgeClass, getAccidentTypeDisplay, expandedRows, toggleRowExpansion, formatDate, ExpandedRowDetails]);

  // 성능 최적화: 데스크톱 뷰 컴포넌트를 useMemo로 메모이제이션
  const DesktopView = useMemo(() => () => (
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-center w-8"></th>
            <th className="border p-2 text-center">상태</th>
            <th className="border p-2 text-center">사고코드</th>
            <th className="border p-2 text-center">사업장</th>
            <th className="border p-2 text-center">사고명</th>
            <th className="border p-2 text-center">발생일</th>
            <th className="border p-2 text-center">재해발생형태</th>
            <th className="border p-2 text-center">보고서확인</th>
          </tr>
        </thead>
        <tbody>
          {reports.length > 0 ? (
            reports.map((report) => (
              <HistoryTableRow
                key={report.accident_id}
                report={report}
                investigationMap={investigationMap}
                getDisplayStatus={getDisplayStatus}
                getStatusBadgeClass={getStatusBadgeClass}
                getAccidentTypeDisplay={getAccidentTypeDisplay}
                isExpanded={expandedRows.has(report.accident_id)}
                onToggleExpansion={toggleRowExpansion}
                formatDate={formatDate}
                ExpandedRowDetails={ExpandedRowDetails}
              />
            ))
          ) : (
            <HistoryTableEmpty isMobile={false} />
          )}
        </tbody>
      </table>
    </div>
  ), [reports, investigationMap, getDisplayStatus, getStatusBadgeClass, getAccidentTypeDisplay, expandedRows, toggleRowExpansion, formatDate, ExpandedRowDetails]);

  return (
    <div className="w-full">
      <MobileView />
      <DesktopView />
    </div>
  );
});

HistoryTable.displayName = 'HistoryTable';

export default HistoryTable;