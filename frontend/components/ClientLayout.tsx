"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * @file ClientLayout.tsx
 * @description
 *  - 전체 애플리케이션의 레이아웃 컴포넌트
 *  - 헤더, 사이드바, 메인 콘텐츠 영역 구성
 *  - 새로운 색상 팔레트 적용 (Slate/Emerald 계열)
 *  - 반응형 디자인 지원
 *  - tailwind 기반, 한글 주석 포함
 */

// 네비게이션 아이템 정의
const navigationItems = [
  { href: '/', label: '대시보드', icon: '📊' },
  { href: '/occurrence', label: '사고 발생', icon: '🚨' },
  { href: '/investigation', label: '조사보고서', icon: '🔍' },
  { href: '/history', label: '이력 관리', icon: '📋' },
  { href: '/settings', label: '설정', icon: '⚙️' },
];

interface ClientLayoutProps {
  children: React.ReactNode;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // 현재 페이지 확인
  const isActivePage = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  // 모바일 메뉴 닫기
  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* ====================== Header ====================== */}
      <header className="bg-primary-800 text-white p-4 flex justify-between items-center relative z-50">
        {/* 로고 또는 시스템명 */}
        <h1 className="text-lg font-bold">사고 관리 시스템</h1>

        {/* 모바일 햄버거 버튼 (md 미만에서만 보임) */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-300"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="메뉴 열기/닫기"
        >
          <div className="w-6 h-6 flex flex-col justify-center items-center">
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 mt-1 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 mt-1 ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </div>
        </button>

        {/* 데스크탑/태블릿 화면에서 보이는 네비게이션 메뉴 */}
        <nav className="hidden md:flex space-x-6">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-primary-700 ${
                isActivePage(item.href) ? 'bg-primary-700' : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* 모바일 메뉴 닫기 버튼 */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-300"
          onClick={closeMenu}
          aria-label="메뉴 닫기"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      {/* ====================== Mobile Navigation ====================== */}
      {menuOpen && (
        <>
          {/* 모바일 메뉴 오버레이 */}
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={closeMenu} />
          
          {/* 모바일 메뉴 */}
          <nav className="fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 md:hidden transform transition-transform duration-300">
            {/* 모바일 메뉴 헤더 */}
            <div className="bg-primary-800 text-white p-4">
              <h2 className="text-lg font-bold">메뉴</h2>
            </div>

            {/* 모바일 메뉴 아이템 */}
            <div className="py-4">
              {navigationItems.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className={`flex items-center px-6 py-4 text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors border-b border-neutral-100 ${
                    isActivePage(item.href) ? 'bg-primary-50 text-primary-700 border-l-4 border-l-primary-600' : ''
                  }`}
                >
                  <span className="text-xl mr-4">{item.icon}</span>
                  <div className="flex-1">
                    <span className="text-base font-medium">{item.label}</span>
                    {isActivePage(item.href) && (
                      <div className="text-xs text-primary-600 mt-1">현재 페이지</div>
                    )}
                  </div>
                  <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>

            {/* 메뉴 푸터 */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-neutral-50 border-t border-neutral-200">
              <div className="text-center text-sm text-neutral-500">
                사고 관리 시스템 v1.0
              </div>
            </div>
          </nav>
        </>
      )}

      {/* ================= Main Content ================= */}
      <main className="flex-1 bg-neutral-100 p-4 sm:p-6 md:p-8">
        {children}
      </main>

      {/* ====================== Footer ====================== */}
      <footer className="bg-neutral-800 text-white p-4 text-center">
        <div className="container mx-auto">
          <p className="text-sm text-neutral-300">
            © 2024 사고 관리 시스템. 모든 권리 보유.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ClientLayout; 