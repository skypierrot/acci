"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * @file ClientLayout.tsx
 * @description
 *  - 모든 페이지의 공통 레이아웃을 담당합니다.
 *  - Header, 네비게이션 메뉴, Footer를 포함하며,
 *    모바일/데스크탑 반응형 구조를 지원합니다.
 */

// 네비게이션 메뉴 아이템 정의
const navigationItems = [
  { href: "/", label: "대시보드", icon: "📊" },
  { href: "/occurrence", label: "사고 등록", icon: "📝" },
  { href: "/investigation", label: "사고 조사", icon: "🔍" },
  { href: "/history", label: "사고 이력", icon: "📋" },
  { href: "/settings", label: "설정", icon: "⚙️" },
  { href: "/auth", label: "로그인", icon: "👤" },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  // 모바일에서 햄버거 메뉴 토글 상태
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // 메뉴가 열려있을 때 스크롤 방지
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // 컴포넌트 언마운트 시 스크롤 복원
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [menuOpen]);

  // 현재 페이지인지 확인하는 함수
  const isActivePage = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  // 메뉴 닫기 함수
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="flex min-h-screen flex-col">
      {/* ====================== Header ====================== */}
      <header className="bg-[#1E3A8A] text-white p-4 flex justify-between items-center relative z-50">
        {/* 로고 또는 시스템명 */}
        <h1 className="text-lg font-bold">사고 관리 시스템</h1>

        {/* 모바일 햄버거 버튼 (md 미만에서만 보임) */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
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
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-blue-700 ${
                isActivePage(item.href) ? 'bg-blue-700' : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* ================= Mobile Nav Overlay ================= */}
      {menuOpen && (
        <>
          {/* 배경 오버레이 */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={closeMenu}
          />
          
          {/* 모바일 네비게이션 메뉴 */}
          <nav className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white z-50 md:hidden transform transition-transform duration-300 ease-in-out ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
            {/* 메뉴 헤더 */}
            <div className="bg-[#1E3A8A] text-white p-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold">메뉴</h2>
              <button
                onClick={closeMenu}
                className="p-2 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
                aria-label="메뉴 닫기"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 메뉴 아이템들 */}
            <div className="py-4">
              {navigationItems.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className={`flex items-center px-6 py-4 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-gray-100 ${
                    isActivePage(item.href) ? 'bg-blue-50 text-blue-700 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <span className="text-xl mr-4">{item.icon}</span>
                  <div className="flex-1">
                    <span className="text-base font-medium">{item.label}</span>
                    {isActivePage(item.href) && (
                      <div className="text-xs text-blue-600 mt-1">현재 페이지</div>
                    )}
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>

            {/* 메뉴 푸터 */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-50 border-t border-gray-200">
              <div className="text-center text-sm text-gray-500">
                사고 관리 시스템 v1.0
              </div>
            </div>
          </nav>
        </>
      )}

      {/* ================= Main Content ================= */}
      <main className="flex-1 bg-gray-100 p-4 sm:p-6 md:p-8">
        {children}
      </main>

      {/* ====================== Footer ====================== */}
      <footer className="bg-gray-800 text-gray-300 p-2 text-center text-sm">
        © 2025 Accident Management
      </footer>
    </div>
  );
} 