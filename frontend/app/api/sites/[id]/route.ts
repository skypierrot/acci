/**
 * @file app/api/sites/[id]/route.ts
 * @description
 *  - 개별 사업장 정보 관리를 위한 Next.js API 라우트
 *  - 외부 API 서버와의 통신을 중개합니다
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * GET 요청 처리 - 사업장 정보 조회
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Next.js 15에서는 params가 Promise가 될 수 있으므로 확인
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { error: '사업장 ID가 제공되지 않았습니다.' },
        { status: 400 }
      );
    }
    
    // 컨테이너 이름으로 백엔드 서비스 접근
    const apiUrl = 'http://accident-backend:3000';
    
    // 백엔드 API로 요청 전달
    const response = await fetch(`${apiUrl}/api/sites/${id}`);
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        return NextResponse.json(
          { error: errorData.error || '사업장 정보를 불러오는 중 오류가 발생했습니다.' },
          { status: response.status }
        );
      } catch (jsonError) {
        // JSON 파싱 오류가 발생하면 텍스트로 응답 처리
        const errorText = await response.text();
        return NextResponse.json(
          { error: errorText || '사업장 정보를 불러오는 중 오류가 발생했습니다.' },
          { status: response.status }
        );
      }
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('사업장 정보 조회 오류:', error);
    return NextResponse.json(
      { error: '사업장 정보를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PUT 요청 처리 - 사업장 정보 수정
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Next.js 15에서는 params가 Promise가 될 수 있으므로 확인
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { error: '사업장 ID가 제공되지 않았습니다.' },
        { status: 400 }
      );
    }
    
    // 컨테이너 이름으로 백엔드 서비스 접근
    const apiUrl = 'http://accident-backend:3000';
    
    // 요청 본문 파싱
    const body = await req.json();
    
    // 백엔드 API로 요청 전달
    const response = await fetch(`${apiUrl}/api/sites/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        return NextResponse.json(
          { error: errorData.error || '사업장 정보를 수정하는 중 오류가 발생했습니다.' },
          { status: response.status }
        );
      } catch (jsonError) {
        // JSON 파싱 오류가 발생하면 텍스트로 응답 처리
        const errorText = await response.text();
        return NextResponse.json(
          { error: errorText || '사업장 정보를 수정하는 중 오류가 발생했습니다.' },
          { status: response.status }
        );
      }
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('사업장 정보 수정 오류:', error);
    return NextResponse.json(
      { error: '사업장 정보를 수정하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE 요청 처리 - 사업장 삭제
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Next.js 15에서는 params가 Promise가 될 수 있으므로 확인
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { error: '사업장 ID가 제공되지 않았습니다.' },
        { status: 400 }
      );
    }
    
    // 컨테이너 이름으로 백엔드 서비스 접근
    const apiUrl = 'http://accident-backend:3000';
    
    // 백엔드 API로 요청 전달
    const response = await fetch(`${apiUrl}/api/sites/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        return NextResponse.json(
          { error: errorData.error || '사업장을 삭제하는 중 오류가 발생했습니다.' },
          { status: response.status }
        );
      } catch (jsonError) {
        // JSON 파싱 오류가 발생하면 텍스트로 응답 처리
        const errorText = await response.text();
        return NextResponse.json(
          { error: errorText || '사업장을 삭제하는 중 오류가 발생했습니다.' },
          { status: response.status }
        );
      }
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