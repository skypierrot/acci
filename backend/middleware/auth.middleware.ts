/**
 * @file middleware/auth.middleware.ts
 * @description
 *  - JWT 토큰을 검증하는 미들웨어
 *  - 인증이 필요한 모든 API 경로에 적용됩니다.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// JWT 페이로드 타입 정의
interface JwtPayload {
  userId: string;
  role: string;
}

// Express의 Request 타입을 확장하여 사용자 정보 추가
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
      };
    }
  }
}

/**
 * JWT 토큰을 검증하고 Request 객체에 사용자 정보를 추가하는 미들웨어
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // 요청 헤더에서 Authorization 값 추출
  const authHeader = req.headers.authorization;

  // Authorization 헤더가 없거나 Bearer 형식이 아닌 경우
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
  }

  // "Bearer " 이후의 JWT 토큰 추출
  const token = authHeader.split(' ')[1];

  try {
    // 환경 변수에서 JWT 시크릿 키 가져오기
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET 환경 변수가 설정되지 않았습니다.');
    }

    // JWT 검증 및 페이로드 디코딩
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    // Request 객체에 사용자 정보 추가
    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };

    // 다음 미들웨어 또는 라우트 핸들러로 제어 이동
    next();
  } catch (error) {
    // JWT 검증 실패 시 401 Unauthorized 응답
    return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
  }
};
