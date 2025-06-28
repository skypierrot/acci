"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * @file ClientLayout.tsx
 * @description
 *  - 모든 페이지의 공통 레이아웃을 담당합니다.
 *  - Header, 네비게이션 메뉴, Footer를 포함하며,
 *    모바일/데스크탑 반응형 구조를 지원합니다.
 */

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  // 모바일에서 햄버거 메뉴 토글 상태
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      {/* ====================== Header ====================== */}
      <header className="bg-[#1E3A8A] text-white p-4 flex justify-between items-center">
        {/* 로고 또는 시스템명 */}
        <h1 className="text-lg font-bold">사고 관리 시스템</h1>

        {/* 모바일 햄버거 버튼 (md 미만에서만 보임) */}
        <button
          className="md:hidden"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          ☰
        </button>

        {/* 데스크탑/태블릿 화면에서 보이는 네비게이션 메뉴 */}
        <nav className="hidden md:flex space-x-4">
          <Link href="/">대시보드</Link>
          <Link href="/occurrence">사고 등록</Link>
          <Link href="/investigation">사고 조사</Link>
          <Link href="/history">사고 이력</Link>
          <Link href="/settings">설정</Link>
          <Link href="/auth">로그인</Link>
        </nav>
      </header>

      {/* ================= Mobile Nav (토글) ================= */}
      {menuOpen && (
        <nav className="bg-gray-100 md:hidden p-4 space-y-2">
          <Link href="/" onClick={() => setMenuOpen(false)}>대시보드</Link>
          <Link href="/occurrence" onClick={() => setMenuOpen(false)}>사고 등록</Link>
          <Link href="/investigation" onClick={() => setMenuOpen(false)}>사고 조사</Link>
          <Link href="/history" onClick={() => setMenuOpen(false)}>사고 이력</Link>
          <Link href="/settings" onClick={() => setMenuOpen(false)}>설정</Link>
          <Link href="/auth" onClick={() => setMenuOpen(false)}>로그인</Link>
        </nav>
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