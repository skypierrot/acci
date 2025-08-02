/**
 * @file components/history/HistoryTableEmpty.tsx
 * @description 사고 이력 테이블의 빈 상태 컴포넌트
 */

import React from 'react';

interface HistoryTableEmptyProps {
  isMobile?: boolean;
  message?: string;
}

/**
 * 사고 이력 테이블의 빈 상태 컴포넌트
 * - 조회된 데이터가 없을 때 표시
 * - 모바일과 데스크톱 뷰 모두 지원
 */
const HistoryTableEmpty: React.FC<HistoryTableEmptyProps> = React.memo(({
  isMobile = false,
  message = "조회된 사고 발생보고서가 없습니다."
}) => {
  if (isMobile) {
    return (
      <div className="text-center py-8 text-gray-500">
        {message}
      </div>
    );
  }

  return (
    <tr>
      <td colSpan={8} className="border p-4 text-center">
        {message}
      </td>
    </tr>
  );
});

HistoryTableEmpty.displayName = 'HistoryTableEmpty';

export default HistoryTableEmpty; 