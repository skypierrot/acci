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
      <div className="bg-white shadow rounded p-6 w-full max-w-sm text-center">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">🔒 인증 서비스 비활성화</h2>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            현재 개발 중으로 인증 서비스가 비활성화되어 있습니다.
          </p>
          <p className="text-sm text-gray-500">
            프로덕션 배포 시 인증 기능을 활성화해야 합니다.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
          <p className="text-sm text-blue-800">
            💡 <strong>개발 모드</strong><br/>
            인증 없이 모든 기능을 테스트할 수 있습니다.
          </p>
        </div>

        <button 
          onClick={() => window.location.href = '/'}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
        >
          대시보드로 이동
        </button>
      </div>
    </div>
  );
}
