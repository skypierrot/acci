/**
 * @file components/history/HistoryCard.tsx
 * @description 모바일 뷰용 사고 이력 카드 컴포넌트
 */

import React, { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { HistoryCardProps } from '../../types/history.types';

/**
 * 모바일 뷰용 사고 이력 카드 컴포넌트
 * - 사고 정보를 카드 형태로 표시
 * - 확장/축소 기능 지원
 * - 조사보고서 및 발생보고서 링크 제공
 */
const HistoryCard: React.FC<HistoryCardProps> = React.memo(({
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

  // 성능 최적화: 이벤트 핸들러를 useCallback으로 메모이제이션
  const handleToggleExpansion = useCallback(() => {
    onToggleExpansion(report.accident_id);
  }, [onToggleExpansion, report.accident_id]);

  // 성능 최적화: 날짜 포맷팅을 useMemo로 메모이제이션
  const formattedDate = useMemo(() => {
    return formatDate ? formatDate(report.final_acci_time || report.acci_time) : '';
  }, [formatDate, report.final_acci_time, report.acci_time]);

  // 성능 최적화: 사고 타입 배지 클래스를 useMemo로 메모이제이션
  const accidentTypeBadgeClass = useMemo(() => {
    return accidentTypeInfo.type === '복합' ? 'bg-purple-100 text-purple-800' :
           accidentTypeInfo.type === '인적' ? 'bg-blue-100 text-blue-800' :
           accidentTypeInfo.type === '물적' ? 'bg-orange-100 text-orange-800' :
           'bg-gray-100 text-gray-800';
  }, [accidentTypeInfo.type]);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-4 overflow-hidden">
      {/* 카드 헤더 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(displayStatus)}`}>
                {displayStatus}
              </span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {report.global_accident_no}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm mb-1">
              {report.final_accident_name || report.accident_name || '미입력'}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              📍 {report.site_name}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>📅 {formattedDate}</span>
              <span className={`px-2 py-1 rounded text-xs ${accidentTypeBadgeClass}`}>
                {accidentTypeInfo.type}
              </span>
            </div>
          </div>
          <button
            onClick={handleToggleExpansion}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            title={isExpanded ? "상세 정보 접기" : "상세 정보 펼치기"}
          >
            <svg 
              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 카드 액션 버튼 */}
      <div className="px-4 pb-4">
        <div className="flex gap-2">
          {investigation && investigation.accident_id ? (
            <Link
              href={`/investigation/${investigation.accident_id}`}
              className="flex-1 px-3 py-2 bg-gray-800 text-white rounded text-sm font-medium hover:bg-gray-900 transition-colors text-center"
            >
              📋 조사보고서 보기
            </Link>
          ) : null}
          <Link
            href={`/occurrence/${report.accident_id}`}
            className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors text-center"
          >
            📄 발생보고서 보기
          </Link>
        </div>
      </div>

      {/* 확장 상세 정보 */}
      {isExpanded && ExpandedRowDetails && (
        <div className="border-t border-gray-100 bg-gray-50">
          <div className="p-4">
            <ExpandedRowDetails report={report} isMobile={true} />
          </div>
        </div>
      )}
    </div>
  );
});

HistoryCard.displayName = 'HistoryCard';

export default HistoryCard; 