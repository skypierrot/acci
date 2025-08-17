/**
 * @file services/auth-pro.service.ts
 * @description 중앙 로그인 시스템(auth_pro)과 연동하는 인증 서비스
 */

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

interface AuthProMFARequest {
  temp_token: string;
  token: string;
}

interface AuthProRefreshRequest {
  refresh: string;
}

interface AuthProUserInfo {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_verified: boolean;
  mfa_enabled: boolean;
}

interface AuthProVerifyResponse {
  valid: boolean;
  user?: AuthProUserInfo;
  error?: string;
}

/**
 * 중앙 로그인 시스템 API 클라이언트
 */
class AuthProService {
  private baseURL: string;

  constructor() {
    // AuthPro 백엔드 서버 URL (Docker 컨테이너 포트)
    this.baseURL = process.env.NEXT_PUBLIC_AUTH_PRO_URL || 'http://localhost:47291';
  }

  /**
   * 로그인 요청
   */
  async login(username: string, password: string): Promise<AuthProLoginResponse> {
    try {
      console.log(`[DEBUG] 중앙 로그인 시스템 연결 시도: ${this.baseURL}/auth/login/`);
      
      const response = await fetch(`${this.baseURL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '로그인에 실패했습니다.');
      }

      console.log(`[DEBUG] 중앙 로그인 시스템 응답 성공:`, data);

      // 토큰 저장
      this.storeTokens(data.access_token, data.refresh_token);
      
      return data;
    } catch (error: any) {
      console.error(`[DEBUG] 중앙 로그인 시스템 오류:`, error);
      throw error;
    }
  }

  /**
   * MFA 인증
   */
  async verifyMFA(tempToken: string, mfaToken: string): Promise<AuthProLoginResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/mfa/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          temp_token: tempToken,
          token: mfaToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'MFA 인증에 실패했습니다.');
      }

      // 토큰 저장
      this.storeTokens(data.access_token, data.refresh_token);
      
      return data;
    } catch (error: any) {
      console.error('MFA 인증 오류:', error);
      throw error;
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

      const response = await fetch(`${this.baseURL}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '토큰 갱신에 실패했습니다.');
      }

      // 새로운 토큰 저장
      this.storeTokens(data.access, data.refresh);
      
      return data.access;
    } catch (error: any) {
      console.error('토큰 갱신 오류:', error);
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
        await fetch(`${this.baseURL}/auth/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      }
    } catch (error) {
      console.error('로그아웃 중 오류:', error);
    } finally {
      this.clearStoredTokens();
    }
  }

  /**
   * 사용자 정보 조회
   */
  async getUserInfo(): Promise<AuthProUserInfo> {
    try {
      const token = this.getStoredToken();
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const response = await fetch(`${this.baseURL}/api/me/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '사용자 정보 조회에 실패했습니다.');
      }

      return data;
    } catch (error: any) {
      console.error('사용자 정보 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 토큰 검증
   */
  async verifyToken(token?: string): Promise<AuthProVerifyResponse> {
    try {
      const tokenToVerify = token || this.getStoredToken();
      if (!tokenToVerify) {
        return { valid: false, error: '토큰이 없습니다.' };
      }

      // 사용자 정보 조회를 통해 토큰 유효성 검증
      const response = await fetch(`${this.baseURL}/api/me/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return { valid: false, error: data.error || '토큰 검증에 실패했습니다.' };
      }

      return { valid: true, user: data };
    } catch (error: any) {
      console.error('토큰 검증 오류:', error);
      return { valid: false, error: '토큰 검증 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 자동 토큰 갱신 (인터셉터용)
   */
  async autoRefreshToken(): Promise<string | null> {
    try {
      const currentToken = this.getStoredToken();
      if (!currentToken) {
        return null;
      }

      // 토큰 만료 확인 (간단한 체크)
      const isExpired = this.isTokenExpired(currentToken);
      if (!isExpired) {
        return currentToken;
      }

      // 토큰 갱신 시도
      return await this.refreshToken();
    } catch (error) {
      console.error('자동 토큰 갱신 오류:', error);
      return null;
    }
  }

  /**
   * 토큰 저장
   */
  private storeTokens(accessToken: string, refreshToken: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_pro_access_token', accessToken);
      localStorage.setItem('auth_pro_refresh_token', refreshToken);
      localStorage.setItem('auth_pro_token_timestamp', Date.now().toString());
    }
  }

  /**
   * 저장된 액세스 토큰 조회
   */
  private getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_pro_access_token');
    }
    return null;
  }

  /**
   * 저장된 리프레시 토큰 조회
   */
  private getStoredRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_pro_refresh_token');
    }
    return null;
  }

  /**
   * 저장된 토큰 삭제
   */
  private clearStoredTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_pro_access_token');
      localStorage.removeItem('auth_pro_refresh_token');
      localStorage.removeItem('auth_pro_token_timestamp');
    }
  }

  /**
   * 토큰 만료 시간 확인
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  /**
   * 인증 상태 확인
   */
  isAuthenticated(): boolean {
    const token = this.getStoredToken();
    if (!token) {
      return false;
    }
    return !this.isTokenExpired(token);
  }

  /**
   * 인증 헤더 반환
   */
  getAuthHeaders(): Record<string, string> {
    const token = this.getStoredToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

// 싱글톤 인스턴스 생성
const authProService = new AuthProService();

export default authProService; 