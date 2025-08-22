/**
 * @file app/api/settings/annual-working-hours/one/route.ts
 * @description
 *  - 연간 근로시간 단일 조회를 위한 Next.js API 라우트
 *  - 외부 API 서버와의 통신을 중개합니다
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * GET 요청 처리 - 연간 근로시간 단일 조회
 */
export async function GET(req: NextRequest) {
  try {
    // 컨테이너 이름으로 백엔드 서비스 접근
    const apiUrl = 'http://accident-backend:3000';
    
    // URL 쿼리 파라미터 전달
    const searchParams = req.nextUrl.searchParams;
    const queryString = searchParams.toString();
    
    // 백엔드 API로 요청 전달
    const response = await fetch(`${apiUrl}/api/settings/annual-working-hours/one?${queryString}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || '연간 근로시간 정보를 불러오는 중 오류가 발생했습니다.' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('연간 근로시간 단일 조회 오류:', error);
    return NextResponse.json(
      { error: '연간 근로시간을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}