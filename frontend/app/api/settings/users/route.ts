/**
 * @file app/api/settings/users/route.ts
 * @description
 *  - 사용자 관리를 위한 Next.js API 라우트
 *  - 외부 API 서버와의 통신을 중개합니다
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * GET 요청 처리 - 사용자 목록 조회
 */
export async function GET(req: NextRequest) {
  try {
    // 컨테이너 이름으로 백엔드 서비스 접근
    const apiUrl = 'http://accident-backend:3000';
    
    // 백엔드 API로 요청 전달
    const response = await fetch(`${apiUrl}/api/settings/users`);
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || '사용자 목록을 불러오는 중 오류가 발생했습니다.' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '사용자 목록을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST 요청 처리 - 사용자 생성
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // 컨테이너 이름으로 백엔드 서비스 접근
    const apiUrl = 'http://accident-backend:3000';
    
    // 백엔드 API로 요청 전달
    const response = await fetch(`${apiUrl}/api/settings/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || '사용자 생성 중 오류가 발생했습니다.' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('사용자 생성 오류:', error);
    return NextResponse.json(
      { error: '사용자를 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 