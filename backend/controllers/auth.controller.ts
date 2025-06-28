/**
 * @file controllers/auth.controller.ts
 * @description
 *  - 인증 관련 요청을 처리하는 컨트롤러
 *  - 로그인, 현재 사용자 정보 조회, 로그아웃 기능 구현
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// 테스트 목적의 하드코딩된 사용자 정보 (실제로는 DB에서 조회)
const testUsers = [
  {
    id: '1',
    username: 'aadmin',
    password: 'Admin@123',
    role: 'admin',
    name: '관리자'
  },
  {
    id: '2',
    username: 'uuser',
    password: 'User@123',
    role: 'user',
    name: '일반 사용자'
  }
];

export default class AuthController {
  /**
   * @method login
   * @description
   *  - POST /api/auth/login
   *  - 사용자 인증 및 JWT 토큰 발급
   */
  static async login(req: Request, res: Response) {
    const { username, password } = req.body;

    // 입력값 검증
    if (!username || !password) {
      return res.status(400).json({ error: '아이디와 비밀번호를 모두 입력해주세요.' });
    }

    try {
      // 사용자 찾기 (실제로는 DB 조회, 비밀번호 검증 로직 필요)
      const user = testUsers.find(u => u.username === username && u.password === password);

      if (!user) {
        return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
      }

      // JWT 시크릿 키 확인
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET 환경 변수가 설정되지 않았습니다.');
      }

      // JWT 토큰 생성 (페이로드에 userId, role 포함)
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        jwtSecret,
        { expiresIn: '8h' } // 토큰 유효 기간
      );

      // 응답
      return res.status(200).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role
        }
      });
    } catch (error: any) {
      console.error('로그인 에러:', error.message);
      return res.status(500).json({ error: '로그인 중 오류가 발생했습니다.' });
    }
  }

  /**
   * @method me
   * @description
   *  - GET /api/auth/me
   *  - 현재 로그인한 사용자 정보 조회
   *  - authMiddleware로 보호되어 있어 유효한 JWT가 필요
   */
  static async me(req: Request, res: Response) {
    try {
      // 미들웨어에서 추가한 사용자 정보 확인
      if (!req.user) {
        return res.status(401).json({ error: '인증된 사용자 정보가 없습니다.' });
      }

      const { userId } = req.user;

      // 사용자 정보 조회 (실제로는 DB 조회)
      const user = testUsers.find(u => u.id === userId);

      if (!user) {
        return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      }

      // 응답 (비밀번호 제외)
      return res.status(200).json({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      });
    } catch (error: any) {
      console.error('사용자 정보 조회 에러:', error.message);
      return res.status(500).json({ error: '사용자 정보 조회 중 오류가 발생했습니다.' });
    }
  }

  /**
   * @method logout
   * @description
   *  - POST /api/auth/logout
   *  - 로그아웃 처리 (클라이언트 측에서 토큰 삭제가 주요 로직)
   *  - 서버 측에서는 간단히 성공 응답만 반환
   */
  static async logout(req: Request, res: Response) {
    // JWT는 stateless하므로 서버에서 특별히 처리할 내용은 없음
    // 실제 구현 시 토큰 블랙리스트 등의 방식으로 무효화 처리 가능
    return res.status(200).json({ message: '로그아웃 되었습니다.' });
  }
}
