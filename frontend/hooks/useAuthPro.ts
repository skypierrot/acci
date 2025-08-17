/**
 * @file hooks/useAuthPro.ts
 * @description 중앙 로그인 시스템(auth_pro)과 연동하는 인증 훅
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import authProService from '../services/auth-pro.service';

// 사용자 정보 타입
interface AuthUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isVerified: boolean;
  mfaEnabled: boolean;
}

// 인증 상태 타입
interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * 중앙 로그인 시스템 인증 훅
 */
export const useAuthPro = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const router = useRouter();

  /**
   * 로그인 함수
   */
  const login = useCallback(async (username: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authProService.login(username, password);
      
      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return response;
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || '로그인에 실패했습니다.',
      }));
      throw error;
    }
  }, []);

  /**
   * MFA 인증 함수
   */
  const verifyMFA = useCallback(async (tempToken: string, mfaToken: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authProService.verifyMFA(tempToken, mfaToken);
      
      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return response;
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'MFA 인증에 실패했습니다.',
      }));
      throw error;
    }
  }, []);

  /**
   * 로그아웃 함수
   */
  const logout = useCallback(async () => {
    try {
      await authProService.logout();
    } catch (error) {
      console.error('로그아웃 오류:', error);
    } finally {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      
      // 로그인 페이지로 리다이렉트
      router.push('/auth');
    }
  }, [router]);

  /**
   * 사용자 정보 새로고침
   */
  const refreshUserInfo = useCallback(async () => {
    if (!authProService.isAuthenticated()) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      return;
    }

    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      const userInfo = await authProService.getUserInfo();
      setAuthState({
        user: userInfo,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('사용자 정보 조회 오류:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message || '사용자 정보 조회에 실패했습니다.',
      });
    }
  }, []);

  /**
   * 토큰 검증
   */
  const verifyToken = useCallback(async () => {
    try {
      const result = await authProService.verifyToken();
      return result.valid;
    } catch (error) {
      console.error('토큰 검증 오류:', error);
      return false;
    }
  }, []);

  /**
   * 초기 인증 상태 확인
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 로컬 스토리지에서 사용자 정보 확인
        const storedUser = localStorage.getItem('auth_user');
        const authProEnabled = localStorage.getItem('auth_pro_enabled');

        if (storedUser && authProEnabled === 'true') {
          const user = JSON.parse(storedUser);
          
          // 토큰 유효성 검증
          const isValid = await verifyToken();
          
          if (isValid) {
            setAuthState({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            // 토큰이 유효하지 않으면 자동 갱신 시도
            const newToken = await authProService.autoRefreshToken();
            if (newToken) {
              // 토큰 갱신 성공 시 사용자 정보 새로고침
              await refreshUserInfo();
            } else {
              // 토큰 갱신 실패 시 로그아웃
              setAuthState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
              });
            }
          }
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('인증 초기화 오류:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: '인증 초기화 중 오류가 발생했습니다.',
        });
      }
    };

    initializeAuth();
  }, [verifyToken, refreshUserInfo]);

  /**
   * 주기적 토큰 갱신 (5분마다)
   */
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const interval = setInterval(async () => {
      try {
        await authProService.autoRefreshToken();
      } catch (error) {
        console.error('자동 토큰 갱신 오류:', error);
      }
    }, 5 * 60 * 1000); // 5분

    return () => clearInterval(interval);
  }, [authState.isAuthenticated]);

  return {
    ...authState,
    login,
    verifyMFA,
    logout,
    refreshUserInfo,
    verifyToken,
  };
}; 