import { NextRequest, NextResponse } from "next/server";

/**
 * @file /app/api/files/[id]/route.ts
 * @description
 *  - 파일 다운로드 및 삭제 API를 백엔드 서버로 프록시
 */

// 파일 다운로드 또는 메타데이터 조회 API (GET)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fileId } = await params;
    const { searchParams } = new URL(request.url);
    const backendUrl = 'http://accident-backend:3000';
    
    // 백엔드 서버로 요청 프록시
    const response = await fetch(`${backendUrl}/api/files/${fileId}?${searchParams.toString()}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // JSON 응답인 경우 (메타데이터 요청)
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data);
    }
    
    // 파일 다운로드인 경우
    const buffer = await response.arrayBuffer();
    const contentDisposition = response.headers.get('content-disposition');
    const contentLength = response.headers.get('content-length');
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition || 'attachment',
        'Content-Length': contentLength || buffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error("파일 다운로드 프록시 오류:", error);
    return NextResponse.json(
      { error: "파일 다운로드 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 파일 삭제 API (DELETE)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fileId } = await params;
    const backendUrl = 'http://accident-backend:3000';
    
    // 백엔드 서버로 요청 프록시
    const response = await fetch(`${backendUrl}/api/files/${fileId}`, {
      method: 'DELETE',
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("파일 삭제 프록시 오류:", error);
    return NextResponse.json(
      { error: "파일 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 