import { NextRequest, NextResponse } from "next/server";

/**
 * @file /app/api/occurrence/route.ts
 * @description
 *  - 사고 발생보고서 목록 조회 및 생성 API
 *  - GET: 사고 발생보고서 목록 조회 (페이징 및 필터링 지원)
 *  - POST: 새로운 사고 발생보고서 생성
 */

// 백엔드 API URL 설정
const getBackendUrl = () => {
  // 서버 사이드에서는 Docker 네트워크 이름(accident-backend)을 사용하고,
  // 클라이언트 사이드에서는 호스트 URL을 사용
  return process.env.BACKEND_API_URL || 'http://accident-backend:3000';
};

// 인메모리 저장소 초기화 (백엔드에서 새로 데이터를 가져오도록)
export const savedReports: Record<string, any> = {};

// 회사별 연간 카운터
export const companyYearlyCounters: Record<string, Record<number, number>> = {};

// 사업장별 연간 카운터
export const siteYearlyCounters: Record<string, Record<number, number>> = {};

// 한국 시간대 설정 헬퍼 함수
export const getKoreanDate = (date = new Date()) => {
  // 한국 시간으로 변환 (UTC+9)
  const koreaTimeOffset = 9 * 60; // 9시간을 분으로 변환
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000); // UTC 시간 (밀리초)
  return new Date(utc + (koreaTimeOffset * 60000)); // 한국 시간
};

// 목록 조회 API (GET)
export async function GET(request: NextRequest) {
  try {
    // 현재 URL에서 쿼리 파라미터 추출
    const url = new URL(request.url);
    
    // 순번 조회 요청인지 확인
    const sequenceType = url.searchParams.get('sequence_type');
    const sequenceCode = url.searchParams.get('sequence_code');
    const sequenceYear = url.searchParams.get('sequence_year');
    
    if (sequenceType && sequenceCode && sequenceYear) {
      console.log(`=== 순번 조회 API 호출 ===`);
      console.log(`Type: ${sequenceType}, Code: ${sequenceCode}, Year: ${sequenceYear}`);
      
      // 순번 조회 로직
      const yearNum = parseInt(sequenceYear, 10);
      let nextSequence = 1;
      
      try {
        // 백엔드에서 실제 데이터 가져오기
        const backendUrl = getBackendUrl();
        const apiUrl = `${backendUrl}/api/occurrence?page=1&size=1000`;
        console.log(`백엔드 데이터 조회: ${apiUrl}`);
        
        const backendResponse = await fetch(apiUrl, {
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });
        
        if (backendResponse.ok) {
          const backendData = await backendResponse.json();
          const reports = backendData.reports || [];
          console.log(`백엔드에서 ${reports.length}개 보고서 조회됨`);
          
          if (sequenceType === 'company') {
            // 회사별 연도별 순번 계산
            const companyReports = reports.filter((r: any) => {
              const reportYear = r.acci_time ? new Date(r.acci_time).getFullYear() : 0;
              return r.company_code === sequenceCode && reportYear === yearNum;
            });
            
            console.log(`회사 ${sequenceCode}, 연도 ${yearNum}에 해당하는 보고서: ${companyReports.length}개`);
            
            const maxSeq = Math.max(0, ...companyReports.map((r: any) => {
              if (!r.global_accident_no) return 0;
              // 형식: "HHH-2025-001"에서 마지막 숫자 부분 추출
              const match = r.global_accident_no.match(/.*-(\d+)$/);
              const seq = match ? parseInt(match[1], 10) : 0;
              console.log(`전체사고코드 ${r.global_accident_no} => 순번 ${seq}`);
              return isNaN(seq) ? 0 : seq;
            }));
            
            nextSequence = maxSeq + 1;
            console.log(`회사 순번 계산: 기존 최대 ${maxSeq}, 다음 순번 ${nextSequence}`);
            
          } else if (sequenceType === 'site') {
            // 사업장별 연도별 순번 계산
            const [companyCode, siteCode] = sequenceCode.split('-');
            
            if (!companyCode || !siteCode) {
              console.error(`잘못된 사업장 코드 형식: ${sequenceCode}`);
              return NextResponse.json(
                { error: "사업장 코드는 '회사코드-사업장코드' 형식이어야 합니다." },
                { status: 400 }
              );
            }
            
            const siteReports = reports.filter((r: any) => {
              const reportYear = r.acci_time ? new Date(r.acci_time).getFullYear() : 0;
              return r.company_code === companyCode && r.site_code === siteCode && reportYear === yearNum;
            });
            
            console.log(`사업장 ${companyCode}-${siteCode}, 연도 ${yearNum}에 해당하는 보고서: ${siteReports.length}개`);
            
            const maxSeq = Math.max(0, ...siteReports.map((r: any) => {
              if (!r.accident_id) return 0;
              // 새 형식: "[회사코드]-[사업장코드]-[년도]-[사업장 순번]"에서 마지막 부분 추출
              const parts = r.accident_id.split('-');
              let seq = 0;
              
              if (parts.length === 4) {
                // 새 형식: 마지막 부분이 순번
                seq = parseInt(parts[3], 10);
              } else if (parts.length >= 3) {
                // 기존 형식: 세 번째 부분이 순번
                seq = parseInt(parts[2], 10);
              }
              
              console.log(`사업장사고코드 ${r.accident_id} => 순번 ${seq}`);
              return isNaN(seq) ? 0 : seq;
            }));
            
            nextSequence = maxSeq + 1;
            console.log(`사업장 순번 계산: 기존 최대 ${maxSeq}, 다음 순번 ${nextSequence}`);
          }
        } else {
          console.error(`백엔드 API 오류: ${backendResponse.status}`);
        }
      } catch (error) {
        console.error(`순번 계산 중 오류: ${error}`);
      }
      
      // 3자리 문자열로 포맷팅
      const formattedSequence = nextSequence.toString().padStart(3, '0');
      console.log(`최종 순번: ${formattedSequence}`);
      
      return NextResponse.json({ nextSequence: formattedSequence });
    }
    
    // 일반 목록 조회
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const companyCode = url.searchParams.get('company') || '';
    const siteCode = url.searchParams.get('site') || '';
    const startDate = url.searchParams.get('start_date') || '';
    const endDate = url.searchParams.get('end_date') || '';
    
    console.log(`API: Fetching occurrence reports`);
    console.log(`Memory storage has ${Object.keys(savedReports).length} reports`);

    // 백엔드 API 호출 시도
    try {
      const backendUrl = getBackendUrl();
      const queryParams = new URLSearchParams();
      
      if (page) queryParams.append('page', page.toString());
      if (limit) queryParams.append('size', limit.toString());
      if (companyCode) queryParams.append('company', companyCode);
      if (siteCode) queryParams.append('site', siteCode);
      if (startDate) queryParams.append('from', startDate);
      if (endDate) queryParams.append('to', endDate);
      
      const apiUrl = `${backendUrl}/api/occurrence?${queryParams.toString()}`;
      console.log(`Calling backend list API: ${apiUrl}`);
      
      const backendResponse = await fetch(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // 캐시 방지
      });
      
      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log(`Backend returned ${data.reports?.length || 0} reports`);
        
        // 백엔드 응답 구조가 프론트엔드와 다를 수 있으므로 변환
        const reports = data.reports || [];
        const processedReports = reports.map((report: any) => {
          // 문자열로 저장된 배열 필드를 실제 배열로 변환
          return {
            ...report,
            scene_photos: parseJsonArray(report.scene_photos),
            cctv_video: parseJsonArray(report.cctv_video),
            statement_docs: parseJsonArray(report.statement_docs),
            etc_documents: parseJsonArray(report.etc_documents),
          };
        });
        
        // 백엔드에서 온 데이터를 인메모리 저장소에 추가/업데이트
        processedReports.forEach((report: any) => {
          if (report.accident_id) {
            savedReports[report.accident_id] = report;
          }
        });
        
        // 백엔드 응답 구조를 프론트엔드 형식으로 변환
        return NextResponse.json({
          reports: processedReports,
          total: data.total || reports.length,
          page: data.page || page,
          limit: limit,
          total_pages: data.totalPages || Math.ceil((data.total || reports.length) / limit)
        });
      } else {
        console.warn(`Backend list API returned status ${backendResponse.status}, falling back to in-memory data`);
      }
    } catch (backendError) {
      console.warn("Backend list API call failed, using in-memory data only:", backendError);
    }

    // 백엔드 API 호출 실패 시 인메모리 데이터 사용
    console.log("Using in-memory data for list response");
    
    // 인메모리 저장소에서 데이터 가져오기
    let reports = Object.values(savedReports);
    
    // 필터링 적용
    if (companyCode) {
      reports = reports.filter(report => report.company_code === companyCode);
    }
    
    if (siteCode) {
      reports = reports.filter(report => report.site_code === siteCode);
    }
    
    if (startDate) {
      const startTimestamp = new Date(startDate).getTime();
      reports = reports.filter(report => {
        const reportTime = new Date(report.acci_time).getTime();
        return reportTime >= startTimestamp;
      });
    }
    
    if (endDate) {
      const endTimestamp = new Date(endDate).getTime();
      reports = reports.filter(report => {
        const reportTime = new Date(report.acci_time).getTime();
        return reportTime <= endTimestamp;
      });
    }
    
    // 최신순 정렬
    reports.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    // 페이지네이션 적용
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedReports = reports.slice(startIndex, endIndex);
    
    // 최종 데이터 반환
    return NextResponse.json({
      reports: paginatedReports,
      total: reports.length,
      page,
      limit,
      total_pages: Math.ceil(reports.length / limit)
    });
  } catch (error) {
    console.error("사고 발생보고서 목록 조회 중 오류:", error);
    return NextResponse.json(
      { error: "사고 발생보고서 목록을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// JSON 문자열을 배열로 파싱하는 헬퍼 함수
function parseJsonArray(jsonString: string | null | undefined): any[] {
  if (!jsonString) return [];
  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('JSON 파싱 오류:', e);
    return [];
  }
}

// 발생보고서 생성 API (POST)
export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const data = await request.json();
    console.log("API: Creating new occurrence report", {
      company: data.company_name,
      site: data.site_name,
      acciTime: data.acci_time ? new Date(data.acci_time).toISOString() : null
    });

    // 필수 필드 검증
    if (!data.company_name || !data.site_name || !data.acci_time || !data.acci_location) {
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 사고 ID 생성 로직
    const date = getKoreanDate(data.acci_time ? new Date(data.acci_time) : undefined);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}${month}${day}`;
    
    // 회사 코드 (유효하지 않으면 기본값 'HHH' 사용)
    const companyCode = data.company_code || 'HHH';
    
    // 사업장 코드 (유효하지 않으면 기본값 'A' 사용)
    const siteCode = data.site_code || 'A';
    
    // 저장소의 모든 키를 로그로 출력
    console.log(`현재 저장된 보고서 키: ${Object.keys(savedReports).join(', ')}`);
    
    // 통계 API를 통해 현재 최대 순번 조회
    console.log(`통계 API 호출: 회사코드=${companyCode}, 사업장코드=${siteCode}, 연도=${year}`);
    
    // 직접 순번 계산 (백업 로직)
    let companyMaxSeq = 0;
    let siteMaxSeq = 0;
    
    try {
      // 통계 API 호출
      const statsUrl = `/api/occurrence/stats?company=${companyCode}&site=${siteCode}&year=${year}`;
      const statsResponse = await fetch(statsUrl);
      
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        companyMaxSeq = stats.companyYearlyCount || 0;
        siteMaxSeq = stats.siteYearlyCount || 0;
        console.log(`통계 API 응답: 회사 최대 순번=${companyMaxSeq}, 사업장 최대 순번=${siteMaxSeq}`);
      } else {
        console.error(`통계 API 오류: ${statsResponse.status}, 직접 계산합니다.`);
      }
    } catch (statsError) {
      console.error(`통계 API 호출 실패: ${statsError}, 직접 계산합니다.`);
    }
    
    // API 호출 실패 시 직접 계산 (백업 로직)
    if (companyMaxSeq === 0) {
      // 1. 전체사고코드 순번 구하기
      const companyReports = Object.values(savedReports).filter(r => {
        const isMatch = r.company_code === companyCode && 
                       new Date(r.acci_time).getFullYear() === year;
        return isMatch;
      });
      
      console.log(`회사코드 ${companyCode}, 연도 ${year}에 해당하는 보고서 수: ${companyReports.length}`);
      
      companyMaxSeq = Math.max(0, ...companyReports.map(r => {
        if (!r.global_accident_no) return 0;
        // 형식: "CO-2025-001"에서 마지막 숫자 부분 추출
        const match = r.global_accident_no.match(/.*-(\d+)$/);
        const seq = match ? parseInt(match[1], 10) : 0;
        console.log(`전체사고코드 순번 추출: ${r.global_accident_no} => ${seq}`);
        return seq;
      }));
    }
    
    // 사업장 순번도 백업 로직으로 계산
    if (siteMaxSeq === 0) {
      // 2. 사업장사고코드 순번 구하기
      const siteReports = Object.values(savedReports).filter(r => {
        const isMatch = r.company_code === companyCode && 
                      r.site_code === siteCode && 
                      new Date(r.acci_time).getFullYear() === year;
        return isMatch;
      });
      
      siteMaxSeq = Math.max(0, ...siteReports.map(r => {
        if (!r.accident_id) return 0;
        // 새 형식: "[회사코드]-[사업장코드]-[년도]-[사업장 순번]"에서 마지막 부분 추출
        // 기존 형식: "CO-ST-001-20250601"에서 세 번째 부분 추출 (호환성)
        const parts = r.accident_id.split('-');
        let seq = 0;
        
        if (parts.length === 4) {
          // 새 형식: 마지막 부분이 순번
          seq = parseInt(parts[3], 10);
        } else if (parts.length >= 3) {
          // 기존 형식: 세 번째 부분이 순번
          seq = parseInt(parts[2], 10);
        }
        
        console.log(`사업장사고코드 순번 추출: ${r.accident_id} => ${seq}`);
        return isNaN(seq) ? 0 : seq;
      }));
    }
    
    // 다음 순번 계산
    const nextCompanySeq = companyMaxSeq + 1;
    const nextSiteSeq = siteMaxSeq + 1;
    
    console.log(`최종 계산된 순번: 회사=${nextCompanySeq}, 사업장=${nextSiteSeq}`);

    // 코드 생성
    const companyCountStr = nextCompanySeq.toString().padStart(3, '0');
    const siteCountStr = nextSiteSeq.toString().padStart(3, '0');
    // 형식: [회사코드]-[사업장코드]-[년도]-[사업장 순번]
    const accidentId = `${companyCode}-${siteCode}-${year}-${siteCountStr}`;
    const globalAccidentNo = `${companyCode}-${year}-${companyCountStr}`;
    const reportChannelNo = accidentId;
    
    console.log(`Generated IDs:`, {
      accidentId,
      globalAccidentNo,
      reportChannelNo,
      companySeq: nextCompanySeq,
      siteSeq: nextSiteSeq
    });

    // 시간 정보 한국 시간으로 변환
    if (data.acci_time) {
      try {
        const acciDate = new Date(data.acci_time);
        data.acci_time = getKoreanDate(acciDate).toISOString();
      } catch (e) {
        console.error('사고 발생 시간 변환 오류:', e);
      }
    }

    if (data.first_report_time) {
      try {
        const reportDate = new Date(data.first_report_time);
        data.first_report_time = getKoreanDate(reportDate).toISOString();
      } catch (e) {
        console.error('최초 보고 시간 변환 오류:', e);
      }
    }

    // 실제 프로젝트에서는 DB 저장 로직
    // 현재는 메모리에 저장
    const newReport = {
      ...data,
      accident_id: accidentId,
      global_accident_no: globalAccidentNo,
      report_channel_no: reportChannelNo,
      created_at: getKoreanDate().toISOString(),
      updated_at: getKoreanDate().toISOString()
    };
    
    // 이 부분이 중요! 인메모리 저장소에 저장
    savedReports[accidentId] = newReport;
    
    console.log(`Stored new report with ID ${accidentId} in in-memory storage`);
    console.log(`Current storage keys: ${Object.keys(savedReports).join(', ')}`);

    // 백엔드 API로 데이터 전송
    const backendUrl = getBackendUrl();
    console.log(`Sending data to backend API: ${backendUrl}/api/occurrence`);
    
    // 백엔드로 전송할 데이터 준비 (파일 정보는 문자열로 변환)
    const backendData = {
      ...newReport,
      scene_photos: Array.isArray(newReport.scene_photos) ? JSON.stringify(newReport.scene_photos) : '[]',
      cctv_video: Array.isArray(newReport.cctv_video) ? JSON.stringify(newReport.cctv_video) : '[]',
      statement_docs: Array.isArray(newReport.statement_docs) ? JSON.stringify(newReport.statement_docs) : '[]',
      etc_documents: Array.isArray(newReport.etc_documents) ? JSON.stringify(newReport.etc_documents) : '[]',
      // victims_json 필드가 존재하면 그대로 전달, 없으면 victims 배열을 JSON 문자열로 변환
      victims_json: newReport.victims_json || (Array.isArray(newReport.victims) ? JSON.stringify(newReport.victims) : '[]')
    };
    
    // 날짜 형식이 올바른지 확인하고 필요시 변환
    if (backendData.first_report_time) {
      try {
        // 날짜 객체가 아닌 경우에만 변환 시도
        if (typeof backendData.first_report_time === 'string') {
          const reportDate = new Date(backendData.first_report_time);
          if (!isNaN(reportDate.getTime())) {
            backendData.first_report_time = reportDate.toISOString();
          }
        } else {
          // 문자열이 아닌 경우 문자열로 변환
          backendData.first_report_time = String(backendData.first_report_time);
        }
      } catch (e) {
        console.error('최종 전송 전 날짜 변환 오류:', e);
        // 오류 발생 시 null로 설정하여 백엔드에서 기본값 사용
        backendData.first_report_time = null;
      }
    }

    // acci_time 필드도 동일하게 처리
    if (backendData.acci_time) {
      try {
        if (typeof backendData.acci_time === 'string') {
          const acciDate = new Date(backendData.acci_time);
          if (!isNaN(acciDate.getTime())) {
            backendData.acci_time = acciDate.toISOString();
          }
        } else {
          backendData.acci_time = String(backendData.acci_time);
        }
      } catch (e) {
        console.error('사고 발생 시간 변환 오류:', e);
        backendData.acci_time = null;
      }
    }
    
    // 디버깅 정보 출력
    console.log('백엔드로 전송할 데이터 (상세):', JSON.stringify(backendData, null, 2));
    
    // 날짜 필드가 문자열인지 확인하는 함수
    const ensureStringDates = (data) => {
      const result = { ...data };
      // 모든 날짜 필드가 문자열인지 확인
      ['first_report_time', 'acci_time', 'created_at', 'updated_at'].forEach(field => {
        if (result[field] && typeof result[field] !== 'string') {
          result[field] = String(result[field]);
        }
      });
      return result;
    };
    
    const processedData = ensureStringDates(backendData);
    
    const backendResponse = await fetch(`${backendUrl}/api/occurrence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(processedData),
    });
    
    if (backendResponse.ok) {
      const responseData = await backendResponse.json();
      console.log(`Backend creation successful, ID: ${responseData.accident_id || 'unknown'}`);
      
      // 백엔드에서 반환한 ID를 사용하여 인메모리 저장소에도 동일한 ID로 저장
      if (responseData.accident_id && responseData.accident_id !== accidentId) {
        console.log(`Updating in-memory storage with backend-generated ID: ${responseData.accident_id}`);
        // 기존 ID로 저장한 데이터 제거
        delete savedReports[accidentId];
        // 백엔드에서 받은 ID로 다시 저장
        savedReports[responseData.accident_id] = {
          ...newReport,
          accident_id: responseData.accident_id
        };
      }
    } else {
      // 백엔드 호출 실패 시 에러 처리
      const errorText = await backendResponse.text();
      console.error(`Backend creation API returned status ${backendResponse.status}: ${errorText}`);
      throw new Error(`백엔드 저장 실패 (${backendResponse.status}): ${errorText}`);
    }
    
    return NextResponse.json({
      success: true,
      accident_id: accidentId,
      message: "사고 발생보고서가 성공적으로 생성되었습니다."
    });
  } catch (error) {
    console.error("사고 발생보고서 생성 중 오류:", error);
    return NextResponse.json(
      { error: "사고 발생보고서 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 