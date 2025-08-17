/**
 * @file middleware/auth.middleware.ts
 * @description
 *  - 중앙 로그인 시스템(auth_pro)과 연동하는 인증 미들웨어
 *  - JWT 토큰을 검증하고 중앙 시스템과 동기화합니다.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import authProClient from '../services/auth.service';

dotenv.config();

// JWT 페이로드 타입 정의
interface JwtPayload {
  userId: string;
  role: string;
  authProUserId?: number; // 중앙 시스템 사용자 ID
}

// Express의 Request 타입을 확장하여 사용자 정보 추가
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        authProUserId?: number;
        username?: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        isVerified?: boolean;
        mfaEnabled?: boolean;
      };
    }
  }
}

// =============================
// [로컬 인증/로그인 미들웨어 주석처리]
// acci_kpi는 auth_pro만 사용하므로, 아래 기존 로컬 인증 미들웨어 코드는 비활성화합니다.
// =============================

/*
// 기존 JWT 인증 미들웨어
// export function authMiddleware(req, res, next) {
//   // ...로컬 JWT 토큰 검증 및 사용자 정보 주입...
// }
*/

// =============================
// [auth_pro 연동 미들웨어만 유지]
// =============================

// ... auth_pro 토큰 검증 미들웨어만 남기세요 ...

/**
 * 중앙 로그인 시스템과 연동하는 인증 미들웨어
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 요청 헤더에서 Authorization 값 추출
    const authHeader = req.headers.authorization;

    // Authorization 헤더가 없거나 Bearer 형식이 아닌 경우
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    }

    // "Bearer " 이후의 JWT 토큰 추출
    const token = authHeader.split(' ')[1];

    // 1단계: 로컬 JWT 토큰 검증
    const localUser = await verifyLocalToken(token);
    if (!localUser) {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }

    // 2단계: 중앙 시스템 토큰 검증 (선택적)
    try {
      const authProUser = await authProClient.verifyToken(token);
      
      // 중앙 시스템 사용자 정보와 로컬 사용자 정보 동기화
      req.user = {
        ...localUser,
        authProUserId: authProUser.id,
        username: authProUser.username,
        email: authProUser.email,
        firstName: authProUser.first_name,
        lastName: authProUser.last_name,
        isVerified: authProUser.is_verified,
        mfaEnabled: authProUser.mfa_enabled,
      };
    } catch (authProError) {
      // 중앙 시스템 검증 실패 시 로컬 토큰만으로 진행
      console.warn('중앙 시스템 토큰 검증 실패, 로컬 토큰으로 진행:', authProError);
      req.user = localUser;
    }

    // 다음 미들웨어 또는 라우트 핸들러로 제어 이동
    next();
  } catch (error) {
    console.error('인증 미들웨어 오류:', error);
    return res.status(401).json({ error: '인증 처리 중 오류가 발생했습니다.' });
  }
};

/**
 * 로컬 JWT 토큰 검증
 */
async function verifyLocalToken(token: string): Promise<JwtPayload | null> {
  try {
    // 환경 변수에서 JWT 시크릿 키 가져오기
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET 환경 변수가 설정되지 않았습니다.');
    }

    // JWT 검증 및 페이로드 디코딩
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    // 토큰 만료 확인
    if (authProClient.isTokenExpired(token)) {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * 중앙 로그인 시스템 전용 인증 미들웨어
 * 로컬 JWT 없이 중앙 시스템 토큰만으로 인증
 */
export const authProMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    }

    const token = authHeader.split(' ')[1];

    // 중앙 시스템 토큰 검증
    const authProUser = await authProClient.verifyToken(token);
    
    req.user = {
      userId: authProUser.id.toString(),
      role: 'user', // 기본 역할
      authProUserId: authProUser.id,
      username: authProUser.username,
      email: authProUser.email,
      firstName: authProUser.first_name,
      lastName: authProUser.last_name,
      isVerified: authProUser.is_verified,
      mfaEnabled: authProUser.mfa_enabled,
    };

    next();
  } catch (error) {
    console.error('중앙 시스템 인증 미들웨어 오류:', error);
    return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
  }
};

/**
 * 선택적 인증 미들웨어 (인증이 있으면 사용자 정보 추가, 없어도 통과)
 */
export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // 인증 토큰이 없어도 통과
      return next();
    }

    const token = authHeader.split(' ')[1];

    // 로컬 토큰 검증 시도
    const localUser = await verifyLocalToken(token);
    if (localUser) {
      req.user = localUser;
      return next();
    }

    // 중앙 시스템 토큰 검증 시도
    try {
      const authProUser = await authProClient.verifyToken(token);
      req.user = {
        userId: authProUser.id.toString(),
        role: 'user',
        authProUserId: authProUser.id,
        username: authProUser.username,
        email: authProUser.email,
        firstName: authProUser.first_name,
        lastName: authProUser.last_name,
        isVerified: authProUser.is_verified,
        mfaEnabled: authProUser.mfa_enabled,
      };
    } catch (authProError) {
      // 중앙 시스템 검증도 실패하면 인증 없이 통과
      console.warn('선택적 인증 실패:', authProError);
    }

    next();
  } catch (error) {
    console.error('선택적 인증 미들웨어 오류:', error);
    // 오류가 발생해도 통과
    next();
  }
};
