/**
 * @file components/AuthGuard.tsx
 * @description 중앙 로그인 시스템과 연동하는 인증 가드 컴포넌트
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthPro } from '../hooks/useAuthPro';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * 인증 가드 컴포넌트
 * 인증이 필요한 페이지를 보호하고, 인증되지 않은 사용자를 로그인 페이지로 리다이렉트
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback 
}) => {
  const { isAuthenticated, isLoading, error } = useAuthPro();
  const router = useRouter();

  useEffect(() => {
    // 로딩 중이 아니고 인증되지 않은 경우 로그인 페이지로 리다이렉트
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, isLoading, router]);

  // 로딩 중인 경우 로딩 화면 표시
  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700 mx-auto mb-4"></div>
          <p className="text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우 아무것도 렌더링하지 않음 (리다이렉트 처리됨)
  if (!isAuthenticated) {
    return null;
  }

  // 인증된 경우 자식 컴포넌트 렌더링
  return <>{children}</>;
};

/**
 * 선택적 인증 가드 컴포넌트
 * 인증이 있으면 사용자 정보를 제공하고, 없어도 페이지 접근 가능
 */
export const OptionalAuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback 
}) => {
  const { isAuthenticated, isLoading } = useAuthPro();

  // 로딩 중인 경우 로딩 화면 표시
  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 인증 상태와 관계없이 자식 컴포넌트 렌더링
  return <>{children}</>;
};

/**
 * 관리자 권한 가드 컴포넌트
 * 관리자 권한이 있는 사용자만 접근 가능
 */
export const AdminGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback 
}) => {
  const { isAuthenticated, isLoading, user } = useAuthPro();
  const router = useRouter();

  useEffect(() => {
    // 로딩 중이 아니고 인증되지 않은 경우 로그인 페이지로 리다이렉트
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
      return;
    }

    // 인증되었지만 관리자가 아닌 경우 홈페이지로 리다이렉트
    if (isAuthenticated && user && !isAdmin(user)) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, user, router]);

  // 로딩 중인 경우 로딩 화면 표시
  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700 mx-auto mb-4"></div>
          <p className="text-gray-600">권한 확인 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않았거나 관리자가 아닌 경우 아무것도 렌더링하지 않음
  if (!isAuthenticated || !user || !isAdmin(user)) {
    return null;
  }

  // 관리자인 경우 자식 컴포넌트 렌더링
  return <>{children}</>;
};

/**
 * 관리자 권한 확인 함수
 * 실제 구현에서는 사용자 역할이나 권한을 확인
 */
function isAdmin(user: any): boolean {
  // 여기서는 간단히 사용자 ID나 특정 필드로 관리자 여부를 판단
  // 실제로는 사용자 역할(role) 필드를 확인해야 함
  return user.id === 1 || user.username === 'admin';
} 