import { NextRequest, NextResponse } from 'next/server';

/**
 * @file /app/api/files/upload/route.ts
 * @description
 *  - 파일 업로드 API를 백엔드 서버로 프록시
 */

export async function POST(request: NextRequest) {
  try {
    const backendUrl = 'http://accident-backend:3000';
    
    // 백엔드 서버로 요청 프록시
    const response = await fetch(`${backendUrl}/api/files/upload`, {
      method: 'POST',
      body: await request.formData(),
      headers: {
        // Content-Type은 자동으로 설정됨 (multipart/form-data)
      },
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('파일 업로드 프록시 오류:', error);
    return NextResponse.json(
      { error: '파일 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 