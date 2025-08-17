import { NextRequest, NextResponse } from 'next/server';

/**
 * @file /app/api/files/[id]/preview/route.ts
 * @description
 *  - 파일 미리보기 API를 백엔드 서버로 프록시
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const backendUrl = 'http://accident-backend:3000';
    
    // 백엔드 서버로 요청 프록시
    const response = await fetch(`${backendUrl}/api/files/${id}/preview`, {
      method: 'GET',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: '파일을 찾을 수 없습니다' },
        { status: response.status }
      );
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
    
  } catch (error) {
    console.error('파일 미리보기 프록시 오류:', error);
    return NextResponse.json(
      { error: '파일 미리보기 실패' },
      { status: 500 }
    );
  }
} 