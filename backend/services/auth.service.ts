/**
 * @file services/auth.service.ts
 * @description 중앙 로그인 시스템(auth_pro)과 연동하는 인증 서비스
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import jwt from 'jsonwebtoken';

// 중앙 로그인 시스템 API 응답 타입 정의
interface AuthProLoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_verified: boolean;
    mfa_enabled: boolean;
  };
}

interface AuthProUserResponse {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_verified: boolean;
  mfa_enabled: boolean;
}

interface AuthProTokenResponse {
  access: string;
  refresh: string;
}

interface AuthProErrorResponse {
  error: string;
  detail?: string;
}

/**
 * 중앙 로그인 시스템 API 클라이언트
 */
class AuthProClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Docker 네트워크 내에서 컨테이너 이름으로 접근
    this.baseURL = process.env.AUTH_PRO_API_URL || 'http://authpro-backend:8000';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 요청 인터셉터 - 토큰 자동 추가
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 응답 인터셉터 - 토큰 갱신 처리
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const newToken = await this.refreshToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // 토큰 갱신 실패 시 로그아웃 처리
            this.clearStoredTokens();
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * 로그인 요청
   */
  async login(username: string, password: string): Promise<AuthProLoginResponse> {
    try {
      console.log(`[DEBUG] 중앙 로그인 시스템 연결 시도: ${this.baseURL}/auth/login/`);
      console.log(`[DEBUG] 요청 데이터:`, { username, password: '***' });
      
      const response: AxiosResponse<AuthProLoginResponse> = await this.client.post('/auth/login/', {
        username,
        password,
      });

      console.log(`[DEBUG] 중앙 로그인 시스템 응답 성공:`, response.data);

      // 토큰 저장
      this.storeTokens(response.data.access_token, response.data.refresh_token);
      
      return response.data;
    } catch (error: any) {
      console.error(`[DEBUG] 중앙 로그인 시스템 오류 상세:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
      });
      
      if (error.response?.data) {
        throw new Error(error.response.data.error || '로그인에 실패했습니다.');
      }
      throw new Error('네트워크 오류가 발생했습니다.');
    }
  }

  /**
   * MFA 인증
   */
  async verifyMFA(tempToken: string, mfaToken: string): Promise<AuthProLoginResponse> {
    try {
      const response: AxiosResponse<AuthProLoginResponse> = await this.client.post('/auth/mfa/verify/', {
        temp_token: tempToken,
        token: mfaToken,
      });

      // 토큰 저장
      this.storeTokens(response.data.access_token, response.data.refresh_token);
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.error || 'MFA 인증에 실패했습니다.');
      }
      throw new Error('네트워크 오류가 발생했습니다.');
    }
  }

  /**
   * 토큰 검증
   */
  async verifyToken(token: string): Promise<AuthProUserResponse> {
    try {
      const response: AxiosResponse<AuthProUserResponse> = await this.client.get('/auth/verify/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('유효하지 않은 토큰입니다.');
      }
      throw new Error('토큰 검증 중 오류가 발생했습니다.');
    }
  }

  /**
   * 토큰 갱신
   */
  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = this.getStoredRefreshToken();
      if (!refreshToken) {
        return null;
      }

      const response: AxiosResponse<AuthProTokenResponse> = await this.client.post('/auth/token/refresh/', {
        refresh: refreshToken,
      });

      // 새로운 토큰 저장
      this.storeTokens(response.data.access, response.data.refresh);
      
      return response.data.access;
    } catch (error: any) {
      // 토큰 갱신 실패 시 저장된 토큰 삭제
      this.clearStoredTokens();
      return null;
    }
  }

  /**
   * 로그아웃
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = this.getStoredRefreshToken();
      if (refreshToken) {
        await this.client.post('/auth/logout/', {
          refresh_token: refreshToken,
        });
      }
    } catch (error) {
      // 로그아웃 실패해도 클라이언트에서는 토큰 삭제
      console.error('로그아웃 중 오류:', error);
    } finally {
      this.clearStoredTokens();
    }
  }

  /**
   * 사용자 정보 조회
   */
  async getUserInfo(): Promise<AuthProUserResponse> {
    try {
      const response: AxiosResponse<AuthProUserResponse> = await this.client.get('/auth/user/');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('인증이 필요합니다.');
      }
      throw new Error('사용자 정보 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 토큰 저장 (메모리 또는 세션)
   */
  private storeTokens(accessToken: string, refreshToken: string): void {
    // 실제 구현에서는 Redis나 세션 스토리지 사용 권장
    global.authTokens = {
      access: accessToken,
      refresh: refreshToken,
      timestamp: Date.now(),
    };
  }

  /**
   * 저장된 액세스 토큰 조회
   */
  private getStoredToken(): string | null {
    return global.authTokens?.access || null;
  }

  /**
   * 저장된 리프레시 토큰 조회
   */
  private getStoredRefreshToken(): string | null {
    return global.authTokens?.refresh || null;
  }

  /**
   * 저장된 토큰 삭제
   */
  private clearStoredTokens(): void {
    global.authTokens = null;
  }

  /**
   * 토큰 만료 시간 확인
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return true;
      }
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  }
}

// 전역 타입 선언
declare global {
  var authTokens: {
    access: string;
    refresh: string;
    timestamp: number;
  } | null;
}

// 싱글톤 인스턴스 생성
const authProClient = new AuthProClient();

// =============================
// [로컬 인증/로그인 관련 코드 주석처리]
// acci_kpi는 auth_pro만 사용하므로, 아래 기존 로컬 인증 코드는 비활성화합니다.
// =============================

/*
// 기존 로그인 함수
// export async function localLogin(username: string, password: string) {
//   // ...로컬 DB에서 사용자 조회 및 비밀번호 검증...
// }

// 기존 JWT 발급 함수
// export function issueJwt(user) {
//   // ...jwt.sign(...)
// }

// 기타 자체 인증 관련 함수들...
*/

// =============================
// [auth_pro 연동 코드만 유지]
// =============================

export default authProClient; // auth_pro 클라이언트만 export 