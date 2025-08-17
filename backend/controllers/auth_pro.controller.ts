/**
 * @file controllers/auth_pro.controller.ts
 * @description 중앙 로그인 시스템(auth_pro)과 연동하는 인증 컨트롤러
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import authProClient from '../services/auth.service';

// 로그인 요청 타입
interface LoginRequest {
  username: string;
  password: string;
}

// MFA 인증 요청 타입
interface MFARequest {
  tempToken: string;
  mfaToken: string;
}

// 토큰 갱신 요청 타입
interface RefreshRequest {
  refreshToken: string;
}

/**
 * 중앙 로그인 시스템을 통한 로그인
 */
export const loginWithAuthPro = async (req: Request, res: Response) => {
  try {
    const { username, password }: LoginRequest = req.body;

    // 입력 검증
    if (!username || !password) {
      return res.status(400).json({
        error: '사용자명과 비밀번호를 입력해주세요.'
      });
    }

    // 중앙 로그인 시스템에 로그인 요청
    const authProResponse = await authProClient.login(username, password);

    // 로컬 JWT 토큰 생성
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET 환경 변수가 설정되지 않았습니다.');
    }

    const localToken = jwt.sign(
      {
        userId: authProResponse.user.id.toString(),
        role: 'user',
        authProUserId: authProResponse.user.id,
      },
      jwtSecret,
      { expiresIn: '1h' }
    );

    // 응답 데이터 구성
    const responseData = {
      access_token: localToken,
      refresh_token: authProResponse.refresh_token,
      user: {
        id: authProResponse.user.id,
        username: authProResponse.user.username,
        email: authProResponse.user.email,
        firstName: authProResponse.user.first_name,
        lastName: authProResponse.user.last_name,
        isVerified: authProResponse.user.is_verified,
        mfaEnabled: authProResponse.user.mfa_enabled,
      },
      message: '로그인이 성공했습니다.'
    };

    res.status(200).json(responseData);
  } catch (error: any) {
    console.error('중앙 로그인 시스템 로그인 오류:', error);
    
    // 중앙 시스템에서 반환된 에러 메시지 처리
    if (error.message.includes('Invalid credentials')) {
      return res.status(401).json({
        error: '사용자명 또는 비밀번호가 올바르지 않습니다.'
      });
    }
    
    if (error.message.includes('Account is disabled')) {
      return res.status(401).json({
        error: '비활성화된 계정입니다.'
      });
    }
    
    if (error.message.includes('Account is locked')) {
      return res.status(401).json({
        error: '잠긴 계정입니다. 잠시 후 다시 시도해주세요.'
      });
    }

    res.status(500).json({
      error: '로그인 처리 중 오류가 발생했습니다.'
    });
  }
};

/**
 * MFA 인증 처리
 */
export const verifyMFA = async (req: Request, res: Response) => {
  try {
    const { tempToken, mfaToken }: MFARequest = req.body;

    // 입력 검증
    if (!tempToken || !mfaToken) {
      return res.status(400).json({
        error: '임시 토큰과 MFA 토큰을 입력해주세요.'
      });
    }

    // 중앙 시스템에서 MFA 인증
    const authProResponse = await authProClient.verifyMFA(tempToken, mfaToken);

    // 로컬 JWT 토큰 생성
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET 환경 변수가 설정되지 않았습니다.');
    }

    const localToken = jwt.sign(
      {
        userId: authProResponse.user.id.toString(),
        role: 'user',
        authProUserId: authProResponse.user.id,
      },
      jwtSecret,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      access_token: localToken,
      refresh_token: authProResponse.refresh_token,
      user: {
        id: authProResponse.user.id,
        username: authProResponse.user.username,
        email: authProResponse.user.email,
        firstName: authProResponse.user.first_name,
        lastName: authProResponse.user.last_name,
        isVerified: authProResponse.user.is_verified,
        mfaEnabled: authProResponse.user.mfa_enabled,
      },
      message: 'MFA 인증이 완료되었습니다.'
    });
  } catch (error: any) {
    console.error('MFA 인증 오류:', error);
    
    if (error.message.includes('MFA verification failed')) {
      return res.status(401).json({
        error: 'MFA 인증에 실패했습니다. 올바른 코드를 입력해주세요.'
      });
    }

    res.status(500).json({
      error: 'MFA 인증 처리 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 토큰 갱신
 */
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken }: RefreshRequest = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: '리프레시 토큰이 필요합니다.'
      });
    }

    // 중앙 시스템에서 토큰 갱신
    const newAccessToken = await authProClient.refreshToken();
    
    if (!newAccessToken) {
      return res.status(401).json({
        error: '토큰 갱신에 실패했습니다. 다시 로그인해주세요.'
      });
    }

    // 새로운 로컬 JWT 토큰 생성
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET 환경 변수가 설정되지 않았습니다.');
    }

    // 토큰에서 사용자 정보 추출
    const decoded = jwt.decode(newAccessToken) as any;
    const localToken = jwt.sign(
      {
        userId: decoded.user_id?.toString() || 'unknown',
        role: 'user',
        authProUserId: decoded.user_id,
      },
      jwtSecret,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      access_token: localToken,
      message: '토큰이 갱신되었습니다.'
    });
  } catch (error: any) {
    console.error('토큰 갱신 오류:', error);
    
    res.status(401).json({
      error: '토큰 갱신에 실패했습니다. 다시 로그인해주세요.'
    });
  }
};

/**
 * 로그아웃
 */
export const logout = async (req: Request, res: Response) => {
  try {
    // 중앙 시스템에서 로그아웃
    await authProClient.logout();

    res.status(200).json({
      message: '로그아웃이 완료되었습니다.'
    });
  } catch (error: any) {
    console.error('로그아웃 오류:', error);
    
    // 로그아웃 실패해도 클라이언트에서는 성공으로 처리
    res.status(200).json({
      message: '로그아웃이 완료되었습니다.'
    });
  }
};

/**
 * 사용자 정보 조회
 */
export const getUserInfo = async (req: Request, res: Response) => {
  try {
    // 중앙 시스템에서 사용자 정보 조회
    const userInfo = await authProClient.getUserInfo();

    res.status(200).json({
      user: {
        id: userInfo.id,
        username: userInfo.username,
        email: userInfo.email,
        firstName: userInfo.first_name,
        lastName: userInfo.last_name,
        isVerified: userInfo.is_verified,
        mfaEnabled: userInfo.mfa_enabled,
      }
    });
  } catch (error: any) {
    console.error('사용자 정보 조회 오류:', error);
    
    if (error.message.includes('인증이 필요합니다')) {
      return res.status(401).json({
        error: '인증이 필요합니다.'
      });
    }

    res.status(500).json({
      error: '사용자 정보 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 토큰 검증
 */
export const verifyToken = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: '인증 토큰이 필요합니다.'
      });
    }

    const token = authHeader.split(' ')[1];

    // 중앙 시스템에서 토큰 검증
    const userInfo = await authProClient.verifyToken(token);

    res.status(200).json({
      valid: true,
      user: {
        id: userInfo.id,
        username: userInfo.username,
        email: userInfo.email,
        firstName: userInfo.first_name,
        lastName: userInfo.last_name,
        isVerified: userInfo.is_verified,
        mfaEnabled: userInfo.mfa_enabled,
      }
    });
  } catch (error: any) {
    console.error('토큰 검증 오류:', error);
    
    res.status(401).json({
      valid: false,
      error: '유효하지 않은 토큰입니다.'
    });
  }
}; 