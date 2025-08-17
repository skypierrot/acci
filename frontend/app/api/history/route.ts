import { NextRequest, NextResponse } from "next/server";

/**
 * @file /app/api/history/route.ts
 * @description
 *  - 사고 이력 목록 조회 API
 *  - GET: 사고 이력 목록 조회 (페이징 및 필터링 지원)
 */

// 백엔드 API URL 설정
const getBackendUrl = () => {
  // 서버 사이드에서는 Docker 네트워크 이름(accident-backend)을 사용하고,
  // 클라이언트 사이드에서는 호스트 URL을 사용
  return process.env.BACKEND_API_URL || 'http://accident-backend:3000';
};

// 히스토리 목록 조회 API (GET)
export async function GET(request: NextRequest) {
  try {
    // 현재 URL에서 쿼리 파라미터 추출
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const size = parseInt(url.searchParams.get('size') || '10'); // 기본 페이지 크기를 10으로 설정
    const company = url.searchParams.get('company') || '';
    const site = url.searchParams.get('site') || '';  // site 파라미터 추가
    const status = url.searchParams.get('status') || '';
    const startDate = url.searchParams.get('startDate') || '';  // startDate 파라미터 추가
    const endDate = url.searchParams.get('endDate') || '';      // endDate 파라미터 추가
    
    console.log(`API: Fetching history reports`);
    console.log(`Parameters: page=${page}, size=${size}, company=${company}, site=${site}, status=${status}, startDate=${startDate}, endDate=${endDate}`);

    // 백엔드 API 호출
    try {
      const backendUrl = getBackendUrl();
      const queryParams = new URLSearchParams();
      
      if (page) queryParams.append('page', page.toString());
      if (size) queryParams.append('size', size.toString());
      if (company) queryParams.append('company', company);
      if (site) queryParams.append('site', site);  // site 파라미터 전달
      if (status) queryParams.append('status', status);
      if (startDate) queryParams.append('startDate', startDate);  // startDate 파라미터 전달
      if (endDate) queryParams.append('endDate', endDate);        // endDate 파라미터 전달
      
      const apiUrl = `${backendUrl}/api/history?${queryParams.toString()}`;
      console.log(`Calling backend history API: ${apiUrl}`);
      
      const backendResponse = await fetch(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // 캐시 방지
      });
      
      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log(`Backend history API returned ${data.reports?.length || 0} reports`);
        
        // 백엔드 응답 구조를 프론트엔드 형식으로 변환
        return NextResponse.json({
          reports: data.reports || [],
          total: data.total || 0,
          page: data.page || page,
          size: size,
          totalPages: data.totalPages || Math.ceil((data.total || 0) / size)
        });
      } else {
        console.error(`Backend history API error: ${backendResponse.status}`);
        const errorData = await backendResponse.json().catch(() => ({}));
        return NextResponse.json(
          { error: errorData.error || '히스토리 데이터를 불러오는 중 오류가 발생했습니다.' },
          { status: backendResponse.status }
        );
      }
    } catch (backendError) {
      console.error("Backend history API call failed:", backendError);
      return NextResponse.json(
        { error: "백엔드 서버와의 연결에 실패했습니다." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("히스토리 목록 조회 중 오류:", error);
    return NextResponse.json(
      { error: "히스토리 목록을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 