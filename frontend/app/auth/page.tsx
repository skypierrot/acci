"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

/**
 * @file app/auth/page.tsx
 * @description
 *  - 로그인 페이지 컴포넌트
 *  - 관리자(aadmin) 및 사용자(uuser) 계정을 테스트용으로 제공
 *  - 로그인 성공 시 JWT와 role을 localStorage에 저장하고 대시보드로 리다이렉트
 */

export default function LoginPage() {
  // 상태 변수: 사용자명, 비밀번호, 에러 메시지
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  /**
   * @function handleSubmit
   * @description
   *  - 로그인 폼 제출 이벤트 핸들러
   *  - POST /api/auth/login 호출 후 JWT, role을 수신
   *  - 성공 시 localStorage에 저장하고 대시보드('/')로 이동
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 백엔드 로그인 API 호출
      const res = await axios.post("/api/auth/login", { username, password });
      const { token, role } = res.data;
      // JWT와 role을 로컬 스토리지에 저장
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      // 대시보드 페이지로 리다이렉트
      router.push("/");
    } catch (err: any) {
      // 에러 발생 시 에러 메시지 출력
      setError(err.response?.data?.error || "로그인 실패");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow rounded p-6 w-full max-w-sm"
      >
        <h2 className="text-xl font-semibold mb-4">로그인</h2>
        {error && <p className="text-red-500 mb-2">{error}</p>}

        {/* 사용자명 입력 */}
        <label className="block mb-2">
          <span className="text-gray-700">아이디</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded px-2 py-1"
          />
        </label>

        {/* 비밀번호 입력 */}
        <label className="block mb-4">
          <span className="text-gray-700">비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded px-2 py-1"
          />
        </label>

        {/* 로그인 버튼 */}
        <button type="submit" className="w-full bg-[#2563EB] text-white py-2 rounded">
          로그인
        </button>
      </form>
    </div>
  );
}
