import { NextRequest, NextResponse } from "next/server";

/**
 * @file /app/api/investigation/[id]/exists/route.ts
 * @description
 *  - 특정 사고에 대한 조사보고서 존재 여부 확인 API
 *  - GET: ID를 통한 조사보고서 존재 여부 확인
 */

// 백엔드 API URL 설정
const getBackendUrl = () => {
  // 서버 사이드에서는 Docker 네트워크 이름(accident-backend)을 사용하고,
  // 클라이언트 사이드에서는 호스트 URL을 사용
  return process.env.BACKEND_API_URL || 'http://accident-backend:3000';
};

// 조사보고서 존재 여부 확인 API (GET)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`API: Checking investigation report existence for ID: ${id}`);

    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/investigation/${id}/exists`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("조사보고서 존재 여부 확인 중 오류:", error);
    return NextResponse.json(
      { success: false, exists: false },
      { status: 500 }
    );
  }
} 