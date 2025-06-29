import HistoryClient from "../../history/client";

/**
 * @file app/occurrence/history/page.tsx
 * @description
 *  - 사고 이력 페이지 (서버 컴포넌트)
 *  - 모든 사고 발생보고서 목록을 조회
 */

export default async function HistoryPage() {
  return <HistoryClient />;
} 