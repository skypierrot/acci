"use client";

import Link from 'next/link';
import { useServerTime } from '@/hooks/useServerTime';
import { useEffect, useState } from 'react';

/**
 * @file app/settings/page.tsx
 * @description 설정 메인 페이지
 */

// 한국 표준시 표시 컴포넌트
const KoreanStandardTimeDisplay = () => {
  const { serverTime, lastSync, isLoading, syncServerTime, getCurrentTime } = useServerTime();
  const [tick, setTick] = useState(0);

  // 분이 바뀔 때만 리렌더링
  useEffect(() => {
    const now = getCurrentTime();
    const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    const timeout = setTimeout(() => setTick(t => t + 1), msToNextMinute);
    return () => clearTimeout(timeout);
  }, [tick, getCurrentTime]);

  // 분까지만 포맷
  const formatKoreanTimeMinute = (date: Date): string => {
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  };

  const handleManualSync = () => {
    syncServerTime();
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">한국 표준시 (KST)</h3>
          <p className="text-sm text-slate-600">
            서버 시간을 기준으로 표시됩니다
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-900 font-mono mb-2">
            {serverTime ? formatKoreanTimeMinute(getCurrentTime()) : '로딩 중...'}
          </div>
          <button
            onClick={handleManualSync}
            disabled={isLoading}
            className="px-3 py-1 bg-slate-600 text-white text-sm rounded hover:bg-slate-700 disabled:opacity-50"
          >
            {isLoading ? '동기화 중...' : '수동 동기화'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function SettingsPage() {
  return (
    <div className="bg-white p-6 rounded-md shadow">
      <h1 className="text-2xl font-bold mb-6">시스템 설정</h1>
      
      {/* 한국 표준시 표시 */}
      <KoreanStandardTimeDisplay />
      
      <p className="text-gray-600 mb-8">
        시스템 설정을 통해 회사 및 사업장 정보, 사용자 관리, 보고서 설정 등을 관리할 수 있습니다.
        왼쪽 메뉴에서 원하는 설정 항목을 선택하세요.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-md p-4 hover:bg-slate-50 transition-colors">
          <h2 className="text-xl font-semibold mb-2">회사 및 사업장 관리</h2>
          <p className="text-gray-600 mb-4">
            회사 정보와 사업장 정보를 등록, 수정, 삭제할 수 있습니다.
          </p>
          <Link 
            href="/settings/companies"
            className="text-slate-600 hover:text-slate-800 font-medium"
          >
            관리하기 →
          </Link>
        </div>
        
        <div className="border border-gray-200 rounded-md p-4 hover:bg-slate-50 transition-colors">
          <h2 className="text-xl font-semibold mb-2">사용자 관리</h2>
          <p className="text-gray-600 mb-4">
            시스템 사용자를 등록하고 권한을 설정할 수 있습니다.
          </p>
          <Link 
            href="/settings/users"
            className="text-slate-600 hover:text-slate-800 font-medium"
          >
            관리하기 →
          </Link>
        </div>
        
        <div className="border border-gray-200 rounded-md p-4 hover:bg-slate-50 transition-colors">
          <h2 className="text-xl font-semibold mb-2">보고서 설정</h2>
          <p className="text-gray-600 mb-4">
            보고서 템플릿과 자동화 규칙을 설정할 수 있습니다.
          </p>
          <Link 
            href="/settings/reports"
            className="text-slate-600 hover:text-slate-800 font-medium"
          >
            관리하기 →
          </Link>
        </div>
        
        <div className="border border-gray-200 rounded-md p-4 hover:bg-slate-50 transition-colors">
          <h2 className="text-xl font-semibold mb-2">시스템 설정</h2>
          <p className="text-gray-600 mb-4">
            시스템 전반적인 설정을 관리할 수 있습니다.
          </p>
          <Link 
            href="/settings/system"
            className="text-slate-600 hover:text-slate-800 font-medium"
          >
            관리하기 →
          </Link>
        </div>
      </div>
    </div>
  );
} 