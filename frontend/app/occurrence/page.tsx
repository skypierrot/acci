"use client";

import OccurrenceForm from "../../components/occurrence/OccurrenceForm";

/**
 * @file app/occurrence/page.tsx
 * @description
 *  - 사고 발생보고서 작성 페이지 (리팩토링된 버전)
 *  - 기능별로 분리된 컴포넌트들을 조합하여 구성
 *  - 커스텀 훅을 통한 상태 관리
 */

export default function OccurrenceReportPage() {
  return <OccurrenceForm />;
} 