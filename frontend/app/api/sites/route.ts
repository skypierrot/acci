/**
 * @file app/api/sites/route.ts
 * @description
 *  - 사업장 정보 관리를 위한 Next.js API 라우트
 *  - 외부 API 서버와의 통신을 중개합니다
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * GET 요청 처리 - 사업장 목록 조회
 */
export async function GET(req: NextRequest) {
  try {
    // 컨테이너 이름으로 백엔드 서비스 접근
    const apiUrl = 'http://accident-backend:3000';
    
    // 백엔드 API로 요청 전달
    const response = await fetch(`${apiUrl}/api/sites`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || '사업장 목록을 조회하는 중 오류가 발생했습니다.' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('사업장 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '사업장 목록을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST 요청 처리 - 사업장 정보 저장
 */
export async function POST(req: NextRequest) {
  try {
    // 컨테이너 이름으로 백엔드 서비스 접근
    const apiUrl = 'http://accident-backend:3000';
    
    // 요청 본문 파싱
    const body = await req.json();
    
    // 백엔드 API로 요청 전달
    const response = await fetch(`${apiUrl}/api/sites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || '사업장 정보를 저장하는 중 오류가 발생했습니다.' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('사업장 정보 저장 오류:', error);
    return NextResponse.json(
      { error: '사업장 정보를 저장하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE 요청 처리 - 사업장 삭제
 */
export async function DELETE(req: NextRequest) {
  try {
    // 컨테이너 이름으로 백엔드 서비스 접근
    const apiUrl = 'http://accident-backend:3000';
    
    // URL 파라미터에서 사업장 ID 추출
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get('id');
    
    if (!siteId) {
      return NextResponse.json(
        { error: '사업장 ID가 제공되지 않았습니다.' },
        { status: 400 }
      );
    }
    
    // 백엔드 API로 요청 전달
    const response = await fetch(`${apiUrl}/api/sites/${siteId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || '사업장을 삭제하는 중 오류가 발생했습니다.' },
        { status: response.status }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('사업장 삭제 오류:', error);
    return NextResponse.json(
      { error: '사업장을 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 