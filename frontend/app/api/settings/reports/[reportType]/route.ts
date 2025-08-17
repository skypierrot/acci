/**
 * @file app/api/settings/reports/[reportType]/route.ts
 * @description
 *  - 보고서 양식 설정 API 라우트
 *  - 백엔드 API를 프록시하여 프론트엔드에서 CORS 없이 접근 가능하도록 함
 */

import { NextRequest, NextResponse } from "next/server";

// 백엔드 API 기본 URL - 환경 변수에서 가져옴
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

/**
 * GET 요청 처리 - 보고서 양식 설정 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportType: string }> }
) {
  const { reportType } = await params;
  
  if (!reportType || !["occurrence", "investigation"].includes(reportType)) {
    return NextResponse.json(
      { error: "유효하지 않은 보고서 유형입니다." },
      { status: 400 }
    );
  }
  
  try {
    // 쿼리 파라미터 추출
    const searchParams = request.nextUrl.searchParams;
    const visible = searchParams.get("visible");
    
    // 조회 유형에 따른 URL 결정
    let url = `${API_BASE_URL}/settings/reports/${reportType}`;
    
    if (searchParams.has("visible")) {
      url = `${API_BASE_URL}/settings/reports/${reportType}/visible?visible=${visible}`;
    } else if (searchParams.has("required")) {
      url = `${API_BASE_URL}/settings/reports/${reportType}/required`;
    }
    
    console.log(`[API 요청] ${url}`);
    
    // 백엔드 API 호출
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    // 응답 데이터
    const data = await response.json();
    
    // 상태 코드와 함께 응답 반환
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`보고서 양식 설정 조회 오류:`, error);
    return NextResponse.json(
      { error: "보고서 양식 설정을 조회하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * PUT 요청 처리 - 보고서 양식 설정 업데이트
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ reportType: string }> }
) {
  const { reportType } = await params;
  
  if (!reportType || !["occurrence", "investigation"].includes(reportType)) {
    return NextResponse.json(
      { error: "유효하지 않은 보고서 유형입니다." },
      { status: 400 }
    );
  }
  
  try {
    // 요청 본문 추출
    const body = await request.json();
    
    // 백엔드 API 호출
    const response = await fetch(`${API_BASE_URL}/settings/reports/${reportType}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    
    // 응답 데이터
    const data = await response.json();
    
    // 상태 코드와 함께 응답 반환
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`보고서 양식 설정 업데이트 오류:`, error);
    return NextResponse.json(
      { error: "보고서 양식 설정을 업데이트하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * POST 요청 처리 - 보고서 양식 설정 초기화
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportType: string }> }
) {
  const { reportType } = await params;
  
  if (!reportType || !["occurrence", "investigation"].includes(reportType)) {
    return NextResponse.json(
      { error: "유효하지 않은 보고서 유형입니다." },
      { status: 400 }
    );
  }
  
  try {
    // 요청 본문 추출
    const body = await request.json();
    
    // "reset" 액션 확인
    if (body.action === "reset") {
      // 백엔드 API 호출
      const response = await fetch(`${API_BASE_URL}/settings/reports/${reportType}/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      // 응답 데이터
      const data = await response.json();
      
      // 상태 코드와 함께 응답 반환
      return NextResponse.json(data, { status: response.status });
    } else {
      return NextResponse.json(
        { error: "유효하지 않은 액션입니다." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error(`보고서 양식 설정 초기화 오류:`, error);
    return NextResponse.json(
      { error: "보고서 양식 설정을 초기화하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 