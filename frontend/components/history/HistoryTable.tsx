import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { getKoreanStatus } from '../../utils/statusUtils';

interface HistoryTableProps {
  reports: any[];
  investigationMap: Map<string, any>;
  getDisplayStatus: (report: any) => string;
  getStatusBadgeClass: (status: string) => string;
  getAccidentTypeDisplay: (report: any) => any;
  expandedRows: Set<string>;
  toggleRowExpansion: (accidentId: string) => void;
  router: any;
  formatDate?: (dateStr: string) => string;
  getCompletionRateColor?: (rate: number) => string;
  ExpandedRowDetails?: React.FC<{ report: any; isMobile?: boolean }>;
}

// 성능 최적화: 모바일 카드 컴포넌트를 React.memo로 감싸기
const HistoryCard: React.FC<{
  report: any;
  investigationMap: Map<string, any>;
  getDisplayStatus: (report: any) => string;
  getStatusBadgeClass: (status: string) => string;
  getAccidentTypeDisplay: (report: any) => any;
  isExpanded: boolean;
  onToggleExpansion: (accidentId: string) => void;
  formatDate?: (dateStr: string) => string;
  ExpandedRowDetails?: React.FC<{ report: any; isMobile?: boolean }>;
}> = React.memo(({
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

// 성능 최적화: HistoryTable 컴포넌트를 React.memo로 감싸기
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
        <div className="text-center py-8 text-gray-500">
          조회된 사고 발생보고서가 없습니다.
        </div>
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
            reports.map((report) => {
              const accidentTypeInfo = getAccidentTypeDisplay(report);
              const isExpanded = expandedRows.has(report.accident_id);
              const displayStatus = getDisplayStatus(report);
              return (
                <React.Fragment key={report.accident_id}>
                  <tr className="hover:bg-gray-50">
                    <td className="border p-2 text-center">
                      <button
                        onClick={() => toggleRowExpansion(report.accident_id)}
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
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(displayStatus)}`}>{displayStatus}</span>
                    </td>
                    <td className="border p-2 text-center text-sm font-mono">{report.global_accident_no}</td>
                    <td className="border p-2 text-center text-sm">{report.site_name}</td>
                    <td className="border p-2 text-center text-sm">{report.final_accident_name || report.accident_name || '미입력'}</td>
                    <td className="border p-2 text-center text-sm">{formatDate ? formatDate(report.final_acci_time || report.acci_time) : ''}</td>
                    <td className="border p-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${
                        accidentTypeInfo.type === '복합' ? 'bg-purple-100 text-purple-800' :
                        accidentTypeInfo.type === '인적' ? 'bg-blue-100 text-blue-800' :
                        accidentTypeInfo.type === '물적' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {accidentTypeInfo.type}
                      </span>
                    </td>
                    <td className="border p-2 text-center align-middle">
                      <div className="flex flex-col items-center gap-1 w-full">
                        {(() => {
                          const investigation = investigationMap && investigationMap.get(report.accident_id);
                          return investigation && investigation.accident_id ? (
                            <Link
                              href={`/investigation/${investigation.accident_id}`}
                              className="w-20 px-2 py-1 bg-gray-800 text-white rounded text-xs font-medium hover:bg-gray-900 transition-colors text-center"
                            >
                              조사보고서
                            </Link>
                          ) : null;
                        })()}
                        <Link
                          href={`/occurrence/${report.accident_id}`}
                          className="w-20 px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors text-center"
                        >
                          발생보고서
                        </Link>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && ExpandedRowDetails && <ExpandedRowDetails report={report} isMobile={false} />}
                </React.Fragment>
              );
            })
          ) : (
            <tr><td colSpan={8} className="border p-4 text-center">조회된 사고 발생보고서가 없습니다.</td></tr>
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