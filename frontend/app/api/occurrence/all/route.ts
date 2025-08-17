import { NextRequest, NextResponse } from "next/server";

/**
 * @file /app/api/occurrence/all/route.ts
 * @description
 *  - 백엔드의 연도별 사고 조회 API를 프론트엔드에서 호출할 수 있도록 프록시 역할
 *  - GET: 연도별 전체 발생보고서 목록 조회
 */

// 백엔드 API URL 설정
const getBackendUrl = () => {
  // 서버 사이드에서는 Docker 네트워크 이름(accident-backend)을 사용하고,
  // 클라이언트 사이드에서는 호스트 URL을 사용
  return process.env.BACKEND_API_URL || 'http://accident-backend:3000';
};

// 연도별 전체 발생보고서 목록 조회 API (GET)
export async function GET(request: NextRequest) {
  try {
    // URL에서 쿼리 파라미터 추출
    const url = new URL(request.url);
    const year = url.searchParams.get('year');
    
    if (!year) {
      return NextResponse.json(
        { error: "year 쿼리 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    console.log(`API: 연도별 사고 조회 - ${year}년`);

    // 백엔드 API 호출
    const backendUrl = getBackendUrl();
    const apiUrl = `${backendUrl}/api/occurrence/all?year=${year}`;
    
    console.log(`백엔드 API 호출: ${apiUrl}`);
    
    const backendResponse = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      // 캐시 방지를 위해 no-store 추가
      cache: 'no-store',
    });

    if (!backendResponse.ok) {
      console.error(`백엔드 API 오류: ${backendResponse.status}`);
      return NextResponse.json(
        { error: `백엔드 API 오류 (${backendResponse.status})` },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    console.log(`백엔드 API 응답: ${data.reports?.length || 0}건의 사고 데이터`);

    return NextResponse.json(data);
  } catch (error) {
    console.error("연도별 사고 조회 중 오류:", error);
    return NextResponse.json(
      { error: "연도별 사고 데이터를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 