import { NextRequest, NextResponse } from "next/server";

/**
 * @file /app/api/investigation/[id]/route.ts
 * @description
 *  - 특정 사고 조사보고서 조회 API
 *  - GET: ID를 통한 사고 조사보고서 상세 조회
 *  - PUT: 기존 사고 조사보고서 수정
 *  - DELETE: 사고 조사보고서 삭제
 */

// 백엔드 API URL 설정
const getBackendUrl = () => {
  // 서버 사이드에서는 Docker 네트워크 이름(accident-backend)을 사용하고,
  // 클라이언트 사이드에서는 호스트 URL을 사용
  return process.env.BACKEND_API_URL || 'http://accident-backend:3000';
};

// 조사보고서 조회 API (GET)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`API: Fetching investigation report with ID: ${id}`);

    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/investigation/${id}`, {
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
    console.error("조사보고서 조회 중 오류:", error);
    return NextResponse.json(
      { error: "조사보고서 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 조사보고서 수정 API (PUT)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    console.log(`API: Updating investigation report with ID: ${id}`);

    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/investigation/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("조사보고서 수정 중 오류:", error);
    return NextResponse.json(
      { error: "조사보고서 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 조사보고서 삭제 API (DELETE)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`API: Deleting investigation report with ID: ${id}`);

    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/investigation/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      message: "사고 조사보고서가 성공적으로 삭제되었습니다."
    });
  } catch (error) {
    console.error("사고 조사보고서 삭제 중 오류:", error);
    return NextResponse.json(
      { error: "사고 조사보고서 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 