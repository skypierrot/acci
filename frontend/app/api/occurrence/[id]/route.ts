import { NextRequest, NextResponse } from "next/server";
import { savedReports } from "../route";
import { processVictimsData } from "../../../../services/occurrence/occurrence.service";

/**
 * @file /app/api/occurrence/[id]/route.ts
 * @description
 *  - 특정 사고 발생보고서 조회 API
 *  - GET: ID를 통한 사고 발생보고서 상세 조회
 *  - PUT: 기존 사고 발생보고서 수정
 *  - DELETE: 사고 발생보고서 삭제
 */

// 백엔드 API URL 설정
const getBackendUrl = () => {
  // 서버 사이드에서는 Docker 네트워크 이름(accident-backend)을 사용하고,
  // 클라이언트 사이드에서는 호스트 URL을 사용
  return process.env.BACKEND_API_URL || 'http://accident-backend:3000';
};

// 한국 시간 유틸리티 import
import { getKoreanTime } from '@/utils/koreanTime';

// 발생보고서 상세 조회 API (GET)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`API: Looking up occurrence report with ID: ${id}`);
    console.log(`Available reports in memory: ${Object.keys(savedReports).join(', ')}`);

    // 백엔드 API 호출을 항상 우선적으로 시도
    try {
      const backendUrl = getBackendUrl();
      const apiUrl = `${backendUrl}/api/occurrence/${id}`;
      
      console.log(`Calling backend API: ${apiUrl}`);
      const backendResponse = await fetch(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
        // 캐시 방지를 위해 no-store 추가
        cache: 'no-store',
      });
      
      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log(`Backend returned data for ID ${id}`);
        console.log(`Raw file data:`, {
          scene_photos: data.scene_photos,
          cctv_video: data.cctv_video,
          statement_docs: data.statement_docs,
          etc_documents: data.etc_documents,
        });
        
        // 백엔드에서 가져온 데이터 변환 처리
        const processedData = {
          ...data,
          // 문자열로 저장된 배열 필드를 실제 배열로 변환
          scene_photos: parseJsonArray(data.scene_photos),
          cctv_video: parseJsonArray(data.cctv_video),
          statement_docs: parseJsonArray(data.statement_docs),
          etc_documents: parseJsonArray(data.etc_documents),
        };
        
        console.log(`Processed file data:`, {
          scene_photos: processedData.scene_photos,
          cctv_video: processedData.cctv_video,
          statement_docs: processedData.statement_docs,
          etc_documents: processedData.etc_documents,
        });
        
        // 재해자 정보 처리 - 일관된 방식으로 처리
        const normalizedData = processVictimsData(processedData);
        console.log(`재해자 정보 처리 완료: victim_count=${normalizedData.victim_count}, victims 배열 길이=${normalizedData.victims?.length || 0}`);
        
        // 백엔드에서 가져온 데이터를 인메모리 저장소에 캐싱 (변환된 데이터로)
        savedReports[id] = normalizedData;
        return NextResponse.json(normalizedData);
      } else {
        console.warn(`Backend API returned status ${backendResponse.status} for ID ${id}`);
        // 백엔드 호출 실패 시에만 인메모리 저장소 확인
        if (savedReports[id]) {
          console.log(`Falling back to in-memory storage for ID ${id}`);
          // 인메모리 데이터도 파일 필드 변환 처리
          const memoryData = savedReports[id];
          const processedData = {
            ...memoryData,
            scene_photos: parseJsonArray(memoryData.scene_photos),
            cctv_video: parseJsonArray(memoryData.cctv_video),
            statement_docs: parseJsonArray(memoryData.statement_docs),
            etc_documents: parseJsonArray(memoryData.etc_documents),
          };
          
          // 재해자 정보 일관성 보장
          const normalizedData = processVictimsData(processedData);
          // 정규화된 데이터로 업데이트
          savedReports[id] = normalizedData;
          return NextResponse.json(normalizedData);
        }
      }
    } catch (backendError) {
      console.warn(`Backend API call failed for ID ${id}:`, backendError);
      // 백엔드 호출 실패 시에만 인메모리 저장소 확인
      if (savedReports[id]) {
        console.log(`Falling back to in-memory storage for ID ${id}`);
        // 인메모리 데이터도 파일 필드 변환 처리
        const memoryData = savedReports[id];
        const processedData = {
          ...memoryData,
          scene_photos: parseJsonArray(memoryData.scene_photos),
          cctv_video: parseJsonArray(memoryData.cctv_video),
          statement_docs: parseJsonArray(memoryData.statement_docs),
          etc_documents: parseJsonArray(memoryData.etc_documents),
        };
        
        // 재해자 정보 일관성 보장
        const normalizedData = processVictimsData(processedData);
        // 정규화된 데이터로 업데이트
        savedReports[id] = normalizedData;
        return NextResponse.json(normalizedData);
      }
    }

    // 데이터가 없는 경우 404 반환
    console.log(`No data found for ID ${id} in storage or backend`);
    return NextResponse.json(
      { error: "요청한 발생보고서를 찾을 수 없습니다." },
      { status: 404 }
    );
  } catch (error) {
    console.error("사고 발생보고서 조회 중 오류:", error);
    return NextResponse.json(
      { error: "사고 발생보고서를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// JSON 문자열을 배열로 파싱하는 헬퍼 함수
function parseJsonArray(jsonString: string | null | undefined): any[] {
  if (!jsonString) return [];
  try {
    const parsed = JSON.parse(jsonString);
    
    // 배열인 경우 그대로 반환
    if (Array.isArray(parsed)) {
      return parsed;
    }
    
    // 객체인 경우 키들을 배열로 변환 (파일 ID가 객체 키로 저장된 경우)
    if (typeof parsed === 'object' && parsed !== null) {
      const keys = Object.keys(parsed);
      console.log(`파일 ID 객체를 배열로 변환: ${JSON.stringify(parsed)} -> [${keys.join(', ')}]`);
      return keys;
    }
    
    // 문자열인 경우 단일 요소 배열로 변환
    if (typeof parsed === 'string') {
      return [parsed];
    }
    
    return [];
  } catch (e) {
    console.error('JSON 파싱 오류:', e);
    return [];
  }
}

// 발생보고서 수정 API (PUT)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`API: Updating occurrence report with ID: ${id}`);
    
    // FormData 지원을 위한 처리
    let data;
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // FormData 형식의 요청 처리
      const formData = await req.formData();
      
      // JSON 문자열로 전달된 데이터 추출 및 파싱
      const jsonData = formData.get('data');
      if (typeof jsonData === 'string') {
        try {
          data = JSON.parse(jsonData);
          console.log('FormData에서 JSON 데이터 파싱 성공');
        } catch (e) {
          console.error('FormData JSON 파싱 오류:', e);
          return NextResponse.json(
            { error: "잘못된 데이터 형식입니다." },
            { status: 400 }
          );
        }
      } else {
        console.error('FormData에 data 필드가 없거나 형식이 잘못됨');
        return NextResponse.json(
          { error: "데이터 필드가 누락되었습니다." },
          { status: 400 }
        );
      }
    } else {
      // JSON 형식의 요청 처리
      data = await req.json();
      console.log('JSON 형식 요청 데이터 수신:', JSON.stringify(data, null, 2));
    }

    // 데이터 유효성 검증
    if (!data.company_name || !data.site_name || !data.acci_time || !data.acci_location) {
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 존재하는 보고서인지 확인
    if (!savedReports[id]) {
      console.log(`Report with ID ${id} not found for update`);
      return NextResponse.json(
        { error: "존재하지 않는 사고 발생보고서입니다." },
        { status: 404 }
      );
    }

    // 시간 정보 한국 시간으로 변환
    if (data.acci_time) {
      try {
        const acciDate = new Date(data.acci_time);
        data.acci_time = getKoreanTime().toISOString();
      } catch (e) {
        console.error('사고 발생 시간 변환 오류:', e);
      }
    }

    if (data.first_report_time) {
      try {
        const reportDate = new Date(data.first_report_time);
        data.first_report_time = getKoreanTime().toISOString();
      } catch (e) {
        console.error('최초 보고 시간 변환 오류:', e);
      }
    }

    // 실제 프로젝트에서는 DB 업데이트 로직
    // 현재는 메모리에 저장
    const updatedData = {
      ...data,
      accident_id: id,
      updated_at: getKoreanTime().toISOString()
    };
    
    // 재해자 정보 일관성 보장
    const normalizedData = processVictimsData(updatedData);
    console.log(`PUT: 재해자 정보 처리 완료: victim_count=${normalizedData.victim_count}, victims 배열 길이=${normalizedData.victims?.length || 0}`);
    
    // 정규화된 데이터 저장
    savedReports[id] = normalizedData;
    
    console.log(`Updated report with ID ${id} in in-memory storage`);
    
    // 백엔드 API 호출 시도
    try {
      const backendUrl = getBackendUrl();
      console.log(`Calling backend update API for ID ${id}`);
      const backendResponse = await fetch(`${backendUrl}/api/occurrence/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(normalizedData),
      });
      
      if (!backendResponse.ok) {
        const errorData = await backendResponse.json();
        console.error(`Backend update failed with status ${backendResponse.status}:`, errorData);
        return NextResponse.json(
          { 
            error: errorData.error || "백엔드 API 오류가 발생했습니다.",
            details: errorData
          },
          { status: backendResponse.status }
        );
      }
      
      console.log(`Backend update successful for ID ${id}`);
    } catch (backendError) {
      console.warn(`Backend update API call failed for ID ${id}, in-memory storage only updated:`, backendError);
    }
    
    return NextResponse.json({
      success: true,
      accident_id: id,
      message: "사고 발생보고서가 성공적으로 수정되었습니다."
    });
  } catch (error) {
    console.error("사고 발생보고서 수정 중 오류:", error);
    return NextResponse.json(
      { error: "사고 발생보고서 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 발생보고서 삭제 API (DELETE)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`API: Deleting occurrence report with ID: ${id}`);

    // 존재하는 보고서인지 확인
    if (!savedReports[id]) {
      console.log(`Report with ID ${id} not found for deletion`);
      return NextResponse.json(
        { error: "존재하지 않는 사고 발생보고서입니다." },
        { status: 404 }
      );
    }

    // 인메모리 저장소에서 삭제
    delete savedReports[id];
    console.log(`Deleted report with ID ${id} from in-memory storage`);
    
    // 백엔드 API 호출 시도
    try {
      const backendUrl = getBackendUrl();
      console.log(`Calling backend delete API for ID ${id}`);
      await fetch(`${backendUrl}/api/occurrence/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(`Backend deletion successful for ID ${id}`);
    } catch (backendError) {
      console.warn(`Backend delete API call failed for ID ${id}, in-memory storage only deleted:`, backendError);
    }
    
    return NextResponse.json({
      success: true,
      message: "사고 발생보고서가 성공적으로 삭제되었습니다."
    });
  } catch (error) {
    console.error("사고 발생보고서 삭제 중 오류:", error);
    return NextResponse.json(
      { error: "사고 발생보고서 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 