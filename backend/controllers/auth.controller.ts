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

// =============================
// [로컬 인증/로그인 관련 코드 주석처리]
// acci_kpi는 auth_pro만 사용하므로, 아래 기존 로컬 인증 코드는 비활성화합니다.
// =============================

/*
// 기존 JWT 로그인 API
// export async function login(req, res) {
//   // ...로컬 DB에서 사용자 인증 및 토큰 발급...
// }

// export async function logout(req, res) {
//   // ...로컬 로그아웃 처리...
// }

// export async function me(req, res) {
//   // ...로컬 사용자 정보 반환...
// }
*/

// =============================
// [auth_pro 연동 코드만 유지]
// =============================

// ... auth_pro 연동 관련 코드만 남기세요 ...
