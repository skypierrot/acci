import { NextRequest, NextResponse } from "next/server";
import { savedReports } from "../route";
import { getKoreanDate } from "../route";

/**
 * @file /app/api/occurrence/stats/route.ts
 * @description
 *  - 발생보고서 통계 API
 *  - 특정 회사/사업장의 코드 자동 생성을 위한 통계 정보 제공
 */

// 통계 조회 API (GET)
export async function GET(request: NextRequest) {
  try {
    // 현재 URL에서 쿼리 파라미터 추출
    const url = new URL(request.url);
    const companyCode = url.searchParams.get('company') || '';
    const siteCode = url.searchParams.get('site') || '';
    const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());

    console.log(`API: 발생보고서 통계 조회`, {
      companyCode,
      siteCode,
      year,
      totalReports: Object.keys(savedReports).length
    });

    // 필터링 조건 설정
    if (!companyCode) {
      return NextResponse.json(
        { error: "회사 코드가 필요합니다." },
        { status: 400 }
      );
    }

    // 기준 연도로 데이터 필터링
    const yearStart = new Date(year, 0, 1); // 해당 연도 1월 1일
    const yearEnd = new Date(year, 11, 31, 23, 59, 59); // 해당 연도 12월 31일

    // 1. 전체사고코드 순번 구하기 (특정 회사 기준)
    const companyReports = Object.values(savedReports).filter(r => {
      // 저장된 날짜 문자열을 Date 객체로 변환
      const reportDate = r.acci_time ? new Date(r.acci_time) : null;
      
      // 필터링 조건: 회사 코드가 일치하고, 사고 발생 일시가 해당 연도 내에 있는 경우
      const matchesCompany = r.company_code === companyCode;
      const matchesYear = reportDate && reportDate >= yearStart && reportDate <= yearEnd;
      
      return matchesCompany && matchesYear;
    });

    console.log(`회사코드 ${companyCode}, 연도 ${year}에 해당하는 보고서 수: ${companyReports.length}`);
    
    // 전체사고코드 최대 순번 추출
    const maxCompanySeq = Math.max(0, ...companyReports.map(r => {
      if (!r.global_accident_no) return 0;
      // 형식: "HHH-2025-001"에서 마지막 숫자 부분 추출
      const match = r.global_accident_no.match(/.*-(\d+)$/);
      const seq = match ? parseInt(match[1], 10) : 0;
      console.log(`전체사고코드 순번 추출: ${r.global_accident_no} => ${seq}`);
      return seq;
    }));
    
    // 2. 사업장사고코드 순번 구하기 (특정 회사 & 사업장 기준)
    let maxSiteSeq = 0;
    
    if (siteCode) {
      const siteReports = companyReports.filter(r => r.site_code === siteCode);
      
      console.log(`회사코드 ${companyCode}, 사업장코드 ${siteCode}, 연도 ${year}에 해당하는 보고서 수: ${siteReports.length}`);
      
      // 사업장사고코드 최대 순번 추출
      maxSiteSeq = Math.max(0, ...siteReports.map(r => {
        if (!r.accident_id) return 0;
        // 형식: "HHH-A-001-20250601"에서 세 번째 부분(순번) 추출
        const parts = r.accident_id.split('-');
        if (parts.length < 3) return 0;
        const seq = parseInt(parts[2], 10);
        console.log(`사업장사고코드 순번 추출: ${r.accident_id} => 분할 결과: [${parts.join(', ')}] => ${seq}`);
        return isNaN(seq) ? 0 : seq;
      }));
    }

    // 결과 반환
    return NextResponse.json({
      companyYearlyCount: maxCompanySeq,  // 회사 연도별 최대 순번
      siteYearlyCount: maxSiteSeq,        // 사업장 연도별 최대 순번
      totalCompanyReports: companyReports.length,  // 회사 전체 보고서 수
      year                // 조회 연도
    });
  } catch (error) {
    console.error("발생보고서 통계 조회 중 오류:", error);
    return NextResponse.json(
      { error: "발생보고서 통계를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 