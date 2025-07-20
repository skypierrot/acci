import React from 'react';
import Link from 'next/link';

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
  ExpandedRowDetails?: React.FC<{ report: any }>;
}

const HistoryTable: React.FC<HistoryTableProps> = ({
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
  // 데스크톱 테이블 뷰
  return (
    <div className="overflow-x-auto">
      {/* 데스크톱 테이블 */}
      <div className="hidden lg:block">
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
                    {isExpanded && ExpandedRowDetails && <ExpandedRowDetails report={report} />}
                  </React.Fragment>
                );
              })
            ) : (
              <tr><td colSpan={8} className="border p-4 text-center">조회된 사고 발생보고서가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {/* 태블릿/모바일 뷰도 동일하게 구현 가능 (생략) */}
    </div>
  );
};

export default HistoryTable; 