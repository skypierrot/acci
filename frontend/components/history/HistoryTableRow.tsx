/**
 * @file components/history/HistoryTableRow.tsx
 * @description 데스크톱 뷰용 사고 이력 테이블 행 컴포넌트
 */

import React, { useMemo } from 'react';
import Link from 'next/link';
import { HistoryTableRowProps } from '../../types/history.types';

/**
 * 데스크톱 뷰용 사고 이력 테이블 행 컴포넌트
 * - 사고 정보를 테이블 행 형태로 표시
 * - 확장/축소 기능 지원
 * - 조사보고서 및 발생보고서 링크 제공
 */
const HistoryTableRow: React.FC<HistoryTableRowProps> = React.memo(({
  report,
  investigationMap,
  getDisplayStatus,
  getStatusBadgeClass,
  getAccidentTypeDisplay,
  isExpanded,
  onToggleExpansion,
  formatDate,
  ExpandedRowDetails
}) => {
  // 성능 최적화: 계산된 값들을 useMemo로 메모이제이션
  const accidentTypeInfo = useMemo(() => getAccidentTypeDisplay(report), [getAccidentTypeDisplay, report]);
  const displayStatus = useMemo(() => getDisplayStatus(report), [getDisplayStatus, report]);
  const investigation = useMemo(() => investigationMap && investigationMap.get(report.accident_id), [investigationMap, report.accident_id]);

  // 성능 최적화: 사고 타입 배지 클래스를 useMemo로 메모이제이션
  const accidentTypeBadgeClass = useMemo(() => {
    return accidentTypeInfo.type === '복합' ? 'bg-purple-100 text-purple-800' :
           accidentTypeInfo.type === '인적' ? 'bg-blue-100 text-blue-800' :
           accidentTypeInfo.type === '물적' ? 'bg-orange-100 text-orange-800' :
           'bg-gray-100 text-gray-800';
  }, [accidentTypeInfo.type]);

  return (
    <React.Fragment>
      <tr className="hover:bg-gray-50">
        <td className="border p-2 text-center">
          <button
            onClick={() => onToggleExpansion(report.accident_id)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title={isExpanded ? "상세 정보 접기" : "상세 정보 펼치기"}
          >
            <svg 
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </td>
        <td className="border p-2 text-center">
          <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(displayStatus)}`}>
            {displayStatus}
          </span>
        </td>
        <td className="border p-2 text-center text-sm font-mono">
          {report.global_accident_no}
        </td>
        <td className="border p-2 text-center text-sm">
          {report.site_name}
        </td>
        <td className="border p-2 text-center text-sm">
          {report.final_accident_name || report.accident_name || '미입력'}
        </td>
        <td className="border p-2 text-center text-sm">
          {formatDate ? formatDate(report.final_acci_time || report.acci_time) : ''}
        </td>
        <td className="border p-2 text-center">
          <span className={`px-2 py-1 rounded text-xs ${accidentTypeBadgeClass}`}>
            {accidentTypeInfo.type}
          </span>
        </td>
        <td className="border p-2 text-center align-middle">
          <div className="flex flex-col items-center gap-1 w-full">
            {investigation && investigation.accident_id ? (
              <Link
                href={`/investigation/${investigation.accident_id}`}
                className="w-20 px-2 py-1 bg-gray-800 text-white rounded text-xs font-medium hover:bg-gray-900 transition-colors text-center"
              >
                조사보고서
              </Link>
            ) : null}
            <Link
              href={`/occurrence/${report.accident_id}`}
              className="w-20 px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors text-center"
            >
              발생보고서
            </Link>
          </div>
        </td>
      </tr>
      {isExpanded && ExpandedRowDetails && (
        <tr>
          <td colSpan={8} className="border-l border-r border-b bg-gray-50 p-4">
            <ExpandedRowDetails report={report} isMobile={false} />
          </td>
        </tr>
      )}
    </React.Fragment>
  );
});

HistoryTableRow.displayName = 'HistoryTableRow';

export default HistoryTableRow; 