import React from 'react';
import Link from 'next/link';

/**
 * @file app/settings/layout.tsx
 * @description 설정 페이지 레이아웃 컴포넌트
 */

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">시스템 설정</h1>
            </div>
            <div>
              <Link href="/" className="text-slate-600 hover:text-slate-800">
                ← 메인으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* 설정 메뉴 */}
          <div className="w-full md:w-64 shrink-0">
            <nav className="bg-white p-4 rounded-md shadow">
              <h2 className="font-semibold text-lg mb-4">설정 메뉴</h2>
              <ul className="space-y-2">
                {/* 회사 및 사업장 관리 메뉴 */}
                <li>
                  <Link 
                    href="/settings/companies"
                    className="block p-2 rounded hover:bg-slate-50 text-gray-700 hover:text-slate-700"
                  >
                    회사 및 사업장 관리
                  </Link>
                </li>
                {/* 사용자 관리 메뉴 */}
                <li>
                  <Link 
                    href="/settings/users"
                    className="block p-2 rounded hover:bg-slate-50 text-gray-700 hover:text-slate-700"
                  >
                    사용자 관리
                  </Link>
                </li>
                {/* 보고서 설정 메뉴 */}
                <li>
                  <Link 
                    href="/settings/reports"
                    className="block p-2 rounded hover:bg-slate-50 text-gray-700 hover:text-slate-700"
                  >
                    보고서 설정
                  </Link>
                </li>
                {/* 시스템 설정 메뉴 */}
                <li>
                  <Link 
                    href="/settings/system"
                    className="block p-2 rounded hover:bg-slate-50 text-gray-700 hover:text-slate-700"
                  >
                    시스템 설정
                  </Link>
                </li>
                {/* 연간 근로시간 관리 메뉴 - 신규 추가 */}
                <li>
                  <Link 
                    href="/settings/annual-working-hours"
                    className="block p-2 rounded hover:bg-slate-50 text-gray-700 hover:text-slate-700"
                  >
                    연간 근로시간 관리
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          
          {/* 메인 콘텐츠 영역 */}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 