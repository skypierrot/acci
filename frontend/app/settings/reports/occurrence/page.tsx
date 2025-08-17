"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * @file app/settings/reports/occurrence/page.tsx
 * @description
 *  - 발생보고서 양식 설정 리다이렉트 페이지
 *  - /settings/reports 페이지로 리다이렉트합니다.
 */

export default function OccurrenceReportSettingsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // 메인 보고서 설정 페이지로 리다이렉트
    router.replace("/settings/reports");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-700">리다이렉트 중입니다...</p>
      </div>
    </div>
  );
} 