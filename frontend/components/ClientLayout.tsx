"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// 인증 관련 훅과 가드 주석처리 (개발 중 인증 비활성화)
// import { useAuthPro } from '../hooks/useAuthPro';
// import { AuthGuard } from './AuthGuard';

/**
 * @file ClientLayout.tsx
 * @description
 *  - 전체 애플리케이션의 레이아웃 컴포넌트
 *  - 헤더, 사이드바, 메인 콘텐츠 영역 구성
 *  - 중앙 로그인 시스템과 연동하는 인증 기능 포함
 *  - 새로운 색상 팔레트 적용 (Slate/Emerald 계열)
 *  - 반응형 디자인 지원
 *  - tailwind 기반, 한글 주석 포함
 */

// 네비게이션 아이템 정의 (사고지표 추가)
const navigationItems = [
  { href: '/', label: '대시보드', icon: '📊' },
  { href: '/occurrence', label: '발생보고', icon: '🚨' },
  { href: '/investigation', label: '사고조사', icon: '🔍' },
  { href: '/history', label: '사고이력', icon: '📋' },
  { href: '/lagging', label: '사고지표', icon: '📊' }, // 사고지표 메뉴 추가
  { href: '/settings', label: '설정', icon: '⚙️' },
];

interface ClientLayoutProps {
  children: React.ReactNode;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  // 인증 관련 상태 주석처리 (개발 중 인증 비활성화)
  // const { user, isAuthenticated, logout } = useAuthPro();
  const user = null;
  const isAuthenticated = true; // 개발 중에는 항상 인증된 것으로 간주
  const logout = () => {}; // 빈 함수

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

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  // 로그인 페이지인 경우 인증 가드 적용하지 않음
  const isAuthPage = pathname === '/auth';

  if (isAuthPage) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          {children}
        </main>
      </div>
    );
  }

  return (
    // <AuthGuard> // 인증 가드 주석처리 (개발 중 인증 비활성화)
      <div className="flex min-h-screen flex-col">
        {/* ====================== Header ====================== */}
        <header className="bg-primary-800 text-white p-4 flex justify-between items-center relative z-50">
          {/* 로고 또는 시스템명 */}
          <h1 className="text-lg font-bold">사고 관리 시스템</h1>

          {/* 우측 버튼 영역 통일 */}
          <div className="flex items-center space-x-2">
            {/* 데스크탑/태블릿 화면에서 보이는 네비게이션 메뉴 */}
            <nav className="hidden md:flex space-x-6">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-primary-700 text-white ${
                    isActivePage(item.href) ? 'bg-primary-700' : ''
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* 사용자 정보 및 로그아웃 버튼 */}
            {isAuthenticated && user && (
              <div className="hidden md:flex items-center space-x-4 ml-6">
                <div className="text-sm">
                  <span className="text-primary-200">안녕하세요, </span>
                  <span className="font-medium">{user.firstName || user.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 text-sm bg-primary-700 hover:bg-primary-600 rounded transition-colors"
                >
                  로그아웃
                </button>
              </div>
            )}

            {/* 모바일 토글 버튼 (햄버거 ↔ X 애니메이션) */}
            <button
              className="md:hidden p-2 rounded-md hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-300"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center">
                {/* 햄버거 → X 애니메이션 */}
                <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                <span className={`block w-5 h-0.5 bg-white transition-all duration-300 mt-1 ${menuOpen ? 'opacity-0' : ''}`} />
                <span className={`block w-5 h-0.5 bg-white transition-all duration-300 mt-1 ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
              </div>
            </button>
          </div>
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
                {isAuthenticated && user && (
                  <div className="text-sm text-primary-200 mt-2">
                    {user.firstName || user.username}님
                  </div>
                )}
              </div>

              {/* 모바일 메뉴 아이템 */}
              <div className="py-4">
                {navigationItems.map((item, index) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className={`flex items-center px-6 py-4 transition-colors border-b border-gray-100 ${
                      isActivePage(item.href) 
                        ? 'bg-primary-700 text-white border-l-4 border-l-primary-300' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className={`text-xl mr-4 ${
                      isActivePage(item.href) ? 'text-white' : 'text-gray-600'
                    }`}>
                      {item.icon}
                    </span>
                    <div className="flex-1">
                      <span className={`text-base font-medium ${
                        isActivePage(item.href) ? 'text-white' : 'text-gray-700'
                      }`}>
                        {item.label}
                      </span>
                      {isActivePage(item.href) && (
                        <div className="text-xs text-primary-200 mt-1">현재 페이지</div>
                      )}
                    </div>
                    <svg className={`w-5 h-5 ${
                      isActivePage(item.href) ? 'text-white' : 'text-gray-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}

                {/* 모바일 로그아웃 버튼 */}
                {isAuthenticated && (
                  <button
                    onClick={() => {
                      closeMenu();
                      handleLogout();
                    }}
                    className="flex items-center px-6 py-4 w-full text-left text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors border-b border-gray-100"
                  >
                    <span className="text-xl mr-4 text-gray-600">🚪</span>
                    <span className="text-base font-medium">로그아웃</span>
                  </button>
                )}
              </div>

              {/* 메뉴 푸터 */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-50 border-t border-gray-200">
                <div className="text-center text-sm text-gray-600">
                  사고 관리 시스템 v1.0
                </div>
                {isAuthenticated && user && (
                  <div className="text-center text-xs text-gray-500 mt-1">
                    중앙 로그인 시스템 연동
                  </div>
                )}
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
    // </AuthGuard> // 인증 가드 주석처리 (개발 중 인증 비활성화)
  );
};

export default ClientLayout; 