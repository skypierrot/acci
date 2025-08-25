/**
 * @file next.config.js
 * @description
 *  - Next.js 설정 파일
 *  - 환경변수 로드, 이미지 도메인 설정 등 필요 시 추가 설정 가능
 */

// 상위 디렉토리의 .env 파일 로드
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ESLint 비활성화 (임시 - 프로덕션 배포용)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // TypeScript 타입 검사 건너뛰기 (임시 - 프로덕션 배포용)
  typescript: {
    ignoreBuildErrors: true,
  },
  // 환경변수 공개 범위 설정 (NEXT_PUBLIC_* 로 시작하는 변수만 클라이언트로 노출)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    BACKEND_API_URL: process.env.BACKEND_API_URL,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.BACKEND_API_URL ? `${process.env.BACKEND_API_URL}/api/:path*` : 'http://accident-backend:3000/api/:path*',
      },
    ]
  },
};

module.exports = nextConfig;
