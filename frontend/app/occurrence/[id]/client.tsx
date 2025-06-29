"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";
import ImageModal from "../../../components/ImageModal";

// 발생보고서 상세 데이터 인터페이스
interface OccurrenceReportDetail {
  // 기본 정보
  global_accident_no: string;     // 전체사고코드
  accident_id: string;            // 사고 ID (자동 생성)
  company_name: string;           // 회사명
  company_code: string;           // 회사 코드
  site_name: string;              // 사업장명
  site_code: string;              // 사업장 코드
  acci_time: string;              // 사고 발생 일시
  acci_location: string;          // 사고 발생 위치
  report_channel_no: string;      // 사고 코드
  first_report_time: string;      // 최초 보고 시간
  
  // 사고 분류 정보
  accident_type_level1: string;   // 재해발생 형태 (인적, 물적, 복합)
  accident_type_level2: string;   // 사고 유형 (기계, 전기 등)
  acci_summary: string;           // 사고 개요
  acci_detail: string;            // 사고 상세 내용
  victim_count: number;           // 재해자 수
  
  // 기본 재해자 정보 (단일 정보용, 하위 호환성 유지)
  victim_name: string;            // 재해자 이름
  victim_age: number;             // 재해자 나이
  victim_belong: string;          // 재해자 소속
  victim_duty: string;            // 재해자 직무
  injury_type: string;            // 상해 정도
  ppe_worn: string;               // 보호구 착용 여부
  first_aid: string;              // 응급조치 내역
  
  // 다중 재해자 정보 (배열)
  victims?: VictimInfo[];         // 재해자 정보 배열
  
  // 협력업체 관련
  is_contractor: boolean;         // 협력업체 직원 관련 사고 여부
  contractor_name: string;        // 협력업체명
  
  // 파일 첨부
  scene_photos: string[];         // 사고 현장 사진
  cctv_video: string[];           // CCTV 영상
  statement_docs: string[];       // 관계자 진술서
  etc_documents: string[];        // 기타 문서
  
  // 보고자 정보
  reporter_name: string;          // 보고자 이름
  reporter_position: string;      // 보고자 직책
  reporter_belong: string;        // 보고자 소속
  report_channel: string;         // 보고 경로

  
  // 시스템 필드
  created_at?: string;            // 생성 시간
  updated_at?: string;            // 수정 시간
}

// 재해자 정보 인터페이스
interface VictimInfo {
  victim_id?: number;             // 재해자 ID
  accident_id?: string;           // 사고 ID
  name: string;                   // 이름
  age?: number;                   // 나이
  belong?: string;                // 소속
  duty?: string;                  // 직무
  injury_type?: string;           // 상해 정도
  ppe_worn?: string;              // 보호구 착용 여부
  first_aid?: string;             // 응급조치 내역
  birth_date?: string;            // 생년월일
  created_at?: string;            // 생성 시간
  updated_at?: string;            // 수정 시간
}

// 파일 정보 인터페이스
interface FileInfo {
  id: string;
  name: string;
  type: string;
  url: string;
}

// 코드 포맷 도우미 함수 추가
const formatGlobalAccidentNo = (code: string) => {
  if (!code) return '코드 정보 없음';
  // 형식: [회사코드]-[연도]-[순번3자리]
  return code;
};

const formatSiteAccidentNo = (code: string, fallback?: string) => {
  if (code) return code;
  if (fallback) return fallback;
  return '코드 정보 없음';
};

// 한국 시간대 설정 헬퍼 함수
const getKoreanDate = (date = new Date()) => {
  // 한국 시간으로 변환 (UTC+9)
  const koreaTimeOffset = 9 * 60; // 9시간을 분으로 변환
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000); // UTC 시간 (밀리초)
  return new Date(utc + (koreaTimeOffset * 60000)); // 한국 시간
};

// 클라이언트 컴포넌트
const OccurrenceDetailClient = ({ id }: { id: string }) => {
  const router = useRouter();
  const [report, setReport] = useState<OccurrenceReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 파일 정보 상태
  const [files, setFiles] = useState<Record<string, FileInfo[]>>({
    scene_photos: [],
    cctv_video: [],
    statement_docs: [],
    etc_documents: []
  });

  // 필요한 상태와 함수 추가
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // 이미지 모달 상태
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    name: string;
    fileId: string;
  } | null>(null);

  // 발생보고서 데이터 로드
  useEffect(() => {
    async function fetchReport() {
      console.log(`Fetching report data for ID: ${id}`);
      
      if (!id) {
        setError("유효하지 않은 ID입니다.");
        setLoading(false);
        return;
      }
      
      // 'create' ID인 경우 새 보고서 작성 페이지로 리다이렉트
      if (id === 'create') {
        console.log("Redirecting to new occurrence page");
        router.push('/occurrence');
        return;
      }
      
      try {
        setLoading(true);
        
        // 인메모리 API 직접 호출 시도
        const response = await fetch(`/api/occurrence/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`보고서 ID ${id}를 찾을 수 없습니다.`);
          } else {
            throw new Error(`API 오류 (${response.status}): ${response.statusText}`);
          }
        }
        
        const data = await response.json();
        console.log(`Report data received:`, data);
        
        if (!data || !data.accident_id) {
          throw new Error("유효하지 않은 데이터 형식입니다.");
        }
        
        // 재해자 정보 처리
        if (data.victims) {
          console.log(`재해자 정보 ${data.victims.length}명 확인됨`);
          
          // 재해자 수 업데이트 (victims 배열 길이로 보정)
          if (data.victims.length !== data.victim_count) {
            console.log(`재해자 수 보정: ${data.victim_count} → ${data.victims.length}`);
            data.victim_count = data.victims.length;
          }
        } else if (data.victims_json) {
          // victims_json 문자열이 있는 경우 파싱
          try {
            const parsedVictims = JSON.parse(data.victims_json);
            if (Array.isArray(parsedVictims) && parsedVictims.length > 0) {
              console.log(`victims_json에서 ${parsedVictims.length}명의 재해자 정보 파싱됨`);
              data.victims = parsedVictims;
              
              // 재해자 수 업데이트
              if (parsedVictims.length !== data.victim_count) {
                console.log(`재해자 수 보정: ${data.victim_count} → ${parsedVictims.length}`);
                data.victim_count = parsedVictims.length;
              }
            }
          } catch (e) {
            console.error('victims_json 파싱 오류:', e);
          }
        }
        
        setReport(data);
        
        // 파일 정보 로드
        await loadFileInfo(data);
      } catch (err: any) {
        console.error("사고 발생보고서 로드 오류:", err);
        setError(err.message || "데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchReport();
  }, [id]);
  
  // 파일 정보 로드 함수
  const loadFileInfo = async (reportData: OccurrenceReportDetail) => {
    console.log('Loading file info for report:', reportData.accident_id);
    
    const fileInfoMap: {
      scene_photos: FileInfo[];
      cctv_video: FileInfo[];
      statement_docs: FileInfo[];
      etc_documents: FileInfo[];
    } = {
      scene_photos: [],
      cctv_video: [],
      statement_docs: [],
      etc_documents: [],
    };

    // JSON 문자열을 배열로 파싱하는 헬퍼 함수
    const parseFileIds = (fileData: any): string[] => {
      if (!fileData) return [];
      
      // 이미 배열인 경우
      if (Array.isArray(fileData)) {
        return fileData;
      }
      
      // 문자열인 경우 처리
      if (typeof fileData === 'string') {
        // 빈 문자열이나 빈 배열 문자열인 경우
        if (!fileData || fileData === '[]' || fileData.trim() === '') {
          return [];
        }
        
        try {
          // 먼저 정상적인 JSON 파싱 시도
          const parsed = JSON.parse(fileData);
          
          // 파싱 결과가 배열인 경우
          if (Array.isArray(parsed)) {
            return parsed;
          }
          
          // 파싱 결과가 객체인 경우 키들을 배열로 변환
          if (typeof parsed === 'object' && parsed !== null) {
            const keys = Object.keys(parsed);
            console.log(`파일 ID 객체를 배열로 변환: ${JSON.stringify(parsed)} -> [${keys.join(', ')}]`);
            return keys;
          }
          
          // 파싱 결과가 문자열인 경우 단일 요소 배열로 변환
          if (typeof parsed === 'string') {
            return [parsed];
          }
        } catch (e) {
          // JSON 파싱 실패 시 정규식으로 UUID 패턴 추출 시도
          console.warn('정상 JSON 파싱 실패, 정규식으로 UUID 추출 시도:', fileData);
          
          // UUID 패턴 정규식 (8-4-4-4-12 형태)
          const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
          const matches = fileData.match(uuidPattern);
          
          if (matches && matches.length > 0) {
            console.log(`정규식으로 UUID 추출 성공: [${matches.join(', ')}]`);
            return matches;
          }
          
          // 중괄호 안의 내용 추출 시도 (잘못된 JSON 형태 처리)
          const bracePattern = /\{([^}]+)\}/g;
          const braceMatches = [];
          let match;
          
          while ((match = bracePattern.exec(fileData)) !== null) {
            const content = match[1].trim();
            // 따옴표 제거
            const cleanContent = content.replace(/['"]/g, '');
            if (cleanContent) {
              braceMatches.push(cleanContent);
            }
          }
          
          if (braceMatches.length > 0) {
            console.log(`중괄호 패턴으로 추출 성공: [${braceMatches.join(', ')}]`);
            return braceMatches;
          }
          
          console.error('파일 ID 추출 실패:', e);
        }
      }
      
      return [];
    };

    // 각 카테고리별로 파일 정보 로드
    for (const category of ['scene_photos', 'cctv_video', 'statement_docs', 'etc_documents'] as const) {
      const rawFileData = reportData[category];
      const fileIds = parseFileIds(rawFileData);
      
      console.log(`${category} 파일 처리:`, {
        raw: rawFileData,
        parsed: fileIds,
        count: fileIds.length
      });
      
      // 파일 ID가 없거나 빈 배열인 경우 건너뛰기
      if (fileIds.length === 0) {
        continue;
      }
      
      for (const fileId of fileIds) {
        // 파일 ID가 유효하지 않은 경우 건너뛰기
        if (!fileId || fileId === '' || fileId === '[]') {
          continue;
        }
        
        try {
          // URL에 특수문자가 포함된 경우 인코딩 처리
          const encodedFileId = encodeURIComponent(fileId);
          
          // 실제 API 호출을 통해 파일 정보 가져오기 시도
          try {
            const response = await fetch(`http://192.168.100.200:6001/api/files/${encodedFileId}/info`);
            
            if (response.ok) {
              const fileData = await response.json();
              fileInfoMap[category].push({
                id: fileId,
                name: fileData.name || `파일 ${fileId}`,
                type: fileData.type || (category === 'cctv_video' ? 'video/mp4' : 'image/png'),
                url: `http://192.168.100.200:6001/api/files/${encodedFileId}`
              });
              continue;
            } else {
              // 404는 파일이 없는 정상적인 경우이므로 경고 수준으로 로그
              const errorText = await response.text();
              if (response.status === 404) {
                console.warn(`파일 없음 (${fileId}): ${errorText}`);
              } else {
                console.error(`파일 정보 조회 실패 (${fileId}):`, response.status, errorText);
              }
              // 파일이 없으면 건너뛰기
              continue;
            }
          } catch (error) {
            console.error(`파일 정보 API 호출 실패 (${fileId}):`, error);
            // API 호출 실패 시에도 건너뛰기
            continue;
          }
        } catch (error) {
          console.error(`파일 정보 로드 오류 (${fileId}):`, error);
        }
      }
    }
    
    // 디버그용 로그
    console.log('파일 정보 로드 결과:', {
      scene_photos: fileInfoMap.scene_photos.length,
      cctv_video: fileInfoMap.cctv_video.length,
      statement_docs: fileInfoMap.statement_docs.length,
      etc_documents: fileInfoMap.etc_documents.length
    });
    
    setFiles(fileInfoMap);
  };
  
  // 날짜 포맷 함수
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    
    try {
      // 한국 시간으로 날짜 표시
      const date = new Date(dateStr);
      // 브라우저의 로컬 시간대가 아닌 한국 시간대로 표시
      return date.toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      console.error('날짜 포맷 오류:', e);
      return dateStr;
    }
  };
  
  // 파일 다운로드 함수
  const downloadFile = (fileId: string) => {
    // 클라이언트에서는 외부 포트 사용
    window.open(`http://192.168.100.200:6001/api/files/${fileId}`, '_blank');
  };

  // 이미지 클릭 핸들러
  const handleImageClick = (file: FileInfo) => {
    if (file.type.startsWith('image/')) {
      setSelectedImage({
        url: `http://192.168.100.200:6001/api/files/${file.id}`,
        name: file.name,
        fileId: file.id
      });
      setImageModalOpen(true);
    }
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setSelectedImage(null);
  };

  // 삭제 모달 열기
  const openDeleteModal = () => {
    setDeleteModalOpen(true);
  };

  // 삭제 모달 닫기
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
  };

  // 사고 발생보고서 삭제 함수
  const deleteReport = async () => {
    try {
      setDeleteLoading(true);
      
      const response = await fetch(`/api/occurrence/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`삭제 실패: ${response.statusText}`);
      }
      
      // 삭제 성공 후 목록 페이지로 이동
      router.push('/history');
      
    } catch (err: any) {
      console.error('사고 발생보고서 삭제 오류:', err);
      setError(err.message || '삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleteLoading(false);
      closeDeleteModal();
    }
  };

  // 파일 타입에 따른 미리보기 렌더링 함수
  const renderFilePreview = (file: FileInfo) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isPdf = file.type === 'application/pdf';
    const isDocument = file.type.includes('word') || file.type.includes('document');
    
    if (isImage) {
      // 이미지 파일: 실제 미리보기 표시 (클릭 가능)
      return (
        <div 
          className="relative group cursor-pointer"
          onClick={() => handleImageClick(file)}
        >
          <img
            src={`http://192.168.100.200:6001/api/files/${file.id}/preview`}
            alt={file.name}
            className="w-full h-24 object-cover mb-2 transition-opacity hover:opacity-80"
            onError={(e) => {
              // 이미지 로드 실패 시 기본 이미지 아이콘으로 대체
              (e.target as HTMLImageElement).src = '/icons/image.svg';
            }}
          />
          {/* 호버 시 확대 아이콘 표시 - 클릭 이벤트를 차단하지 않음 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 bg-black bg-opacity-40 mb-2 pointer-events-none">
            <svg className="w-8 h-8 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            <span className="text-white text-xs font-medium">클릭하여 확대</span>
          </div>
        </div>
      );
    } else if (isVideo) {
      // 동영상 파일: 동영상 아이콘
      return (
        <div className="bg-gray-100 w-full h-24 flex items-center justify-center mb-2">
          <span className="text-2xl">🎬</span>
        </div>
      );
    } else if (isPdf) {
      // PDF 파일: PDF 아이콘
      return (
        <div className="bg-red-50 w-full h-24 flex items-center justify-center mb-2">
          <span className="text-2xl">📄</span>
        </div>
      );
    } else if (isDocument) {
      // 문서 파일: 문서 아이콘
      return (
        <div className="bg-blue-50 w-full h-24 flex items-center justify-center mb-2">
          <span className="text-2xl">📝</span>
        </div>
      );
    } else {
      // 기타 파일: 일반 파일 아이콘
      return (
        <div className="bg-gray-50 w-full h-24 flex items-center justify-center mb-2">
          <span className="text-2xl">📁</span>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">데이터 로딩 중...</div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p className="font-bold">오류 발생</p>
        <p>{error || "사고 발생보고서를 찾을 수 없습니다."}</p>
        <button 
          onClick={() => router.back()} 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
        >
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">사고 발생보고서</h1>
        <div className="flex space-x-2">
          <Link
            href={`/investigation/new?id=${report.accident_id}`}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            조사보고서 작성
          </Link>
        </div>
      </div>
      
      {/* 사고 기본 정보 */}
      <div className="bg-gray-50 p-4 rounded-md mb-6">
        <h2 className="text-xl font-semibold mb-4">기본 정보</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-600">전체사고코드</h3>
            <p className="mt-1 text-gray-900 font-medium">{formatGlobalAccidentNo(report.global_accident_no)}</p>
            <p className="text-xs text-gray-500 mt-1">
              형식: [회사코드]-[연도]-[순번3자리]
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600">사업장사고코드</h3>
            <p className="mt-1 text-gray-900 font-medium">{formatSiteAccidentNo(report.report_channel_no, report.accident_id)}</p>
            <p className="text-xs text-gray-500 mt-1">
              형식: [회사코드]-[사업장코드]-[YYYY]-[순번3자리]
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600">최초 보고 시간</h3>
            <p className="mt-1 text-gray-900">{formatDate(report.first_report_time)}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-600">회사명</h3>
            <p className="mt-1 text-gray-900">{report.company_name}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-600">사업장명</h3>
            <p className="mt-1 text-gray-900">{report.site_name}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-600">사고 발생 일시</h3>
            <p className="mt-1 text-gray-900">{formatDate(report.acci_time)}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-600">사고 발생 장소</h3>
            <p className="mt-1 text-gray-900">{report.acci_location}</p>
          </div>
        </div>
        
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-600">협력업체 사고 여부</h3>
          <p className="mt-1 text-gray-900">
            {report.is_contractor ? "예" : "아니오"}
            {report.is_contractor && report.contractor_name && ` (${report.contractor_name})`}
          </p>
        </div>
      </div>
      
      {/* 사고 정보 */}
      <div className="bg-gray-50 p-4 rounded-md mb-6">
        <h2 className="text-xl font-semibold mb-4">사고 정보</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-600">재해발생 형태</h3>
            <p className="mt-1 text-gray-900">{report.accident_type_level1 || "미기재"}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-600">사고 유형</h3>
            <p className="mt-1 text-gray-900">{report.accident_type_level2 || "미기재"}</p>
          </div>
        </div>
        
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-600">사고 개요</h3>
          <p className="mt-1 text-gray-900">{report.acci_summary || "미기재"}</p>
        </div>
        
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-600">사고 상세 내용</h3>
          <div className="whitespace-pre-line mt-2 bg-white p-3 border rounded-md">
            {/* 사고 상세 내용을 항목별로 표시하려고 시도합니다 */}
            {(() => {
              const detailText = report.acci_detail || "상세 내용 없음";
              
              // 1~5 번호가 있는 경우 구조화된 형식으로 인식
              const hasStructuredFormat = 
                /1\..*[\s\S]*2\..*[\s\S]*3\..*[\s\S]*4\..*[\s\S]*5\./i.test(detailText) ||
                detailText.includes("1. 사고 발생 전 작업 내용");
              
              if (hasStructuredFormat) {
                // 각 항목을 찾아서 분리
                const sections = [
                  { title: "사고 발생 전 작업 내용", 
                    content: detailText.match(/1\.\s*.*?발생\s*전\s*작업\s*내용([\s\S]*?)(?=2\.|$)/i)?.[1]?.trim() },
                  { title: "사고 발생 시점 작업자 행동", 
                    content: detailText.match(/2\.\s*.*?발생\s*시점\s*작업자\s*행동([\s\S]*?)(?=3\.|$)/i)?.[1]?.trim() },
                  { title: "사고가 발생하게 된 동작 및 기계 상태", 
                    content: detailText.match(/3\.\s*.*?발생.*?동작.*?기계\s*상태([\s\S]*?)(?=4\.|$)/i)?.[1]?.trim() },
                  { title: "현장에서 어떤 일이 일어났는가", 
                    content: detailText.match(/4\.\s*.*?현장.*?일.*?일어났는가([\s\S]*?)(?=5\.|$)/i)?.[1]?.trim() },
                  { title: "사고 발생 후 초기 조치 및 대응", 
                    content: detailText.match(/5\.\s*.*?발생\s*후\s*초기\s*조치([\s\S]*?)(?=$)/i)?.[1]?.trim() }
                ];
                
                return (
                  <div className="space-y-3 mt-2">
                    {sections.map((section, index) => (
                      <div key={index} className="border-b pb-3 last:border-b-0">
                        <h4 className="font-semibold text-gray-700">{index + 1}. {section.title}</h4>
                        <p className="mt-1 text-gray-800">{section.content || "정보 없음"}</p>
                      </div>
                    ))}
                  </div>
                );
              } else {
                // 구조화되지 않은 형식은 그대로 표시
                return <p>{detailText}</p>;
              }
            })()}
          </div>
        </div>
        
        {report.victim_count > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">재해자 정보 ({report.victim_count}명)</h3>
            
            {/* 다중 재해자 정보 표시 */}
            {report.victims && report.victims.length > 0 ? (
              <div className="space-y-4">
                {report.victims.map((victim, index) => (
                  <div key={index} className="bg-white p-4 rounded-md shadow border">
                    <h4 className="font-medium text-gray-700 border-b pb-2 mb-3">재해자 {index + 1}: {victim.name || "확인되지 않음"}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">나이</p>
                        <p className="font-medium">{victim.age ? `${victim.age}세` : "확인되지 않음"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">소속</p>
                        <p className="font-medium">{victim.belong || "확인되지 않음"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">직무</p>
                        <p className="font-medium">{victim.duty || "확인되지 않음"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">상해 정도</p>
                        <p className="font-medium">{victim.injury_type || "확인되지 않음"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">보호구 착용 여부</p>
                        <p className="font-medium">{victim.ppe_worn || "확인되지 않음"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">응급조치 내역</p>
                        <p className="font-medium">{victim.first_aid || "확인되지 않음"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // 기존 단일 재해자 정보 표시 (하위 호환성 유지)
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-md shadow">
                <div>
                  <h4 className="text-xs font-medium text-gray-500">재해자 수</h4>
                  <p className="text-gray-900">{report.victim_count}명</p>
                </div>
                
                <div>
                  <h4 className="text-xs font-medium text-gray-500">재해자 이름</h4>
                  <p className="text-gray-900">{report.victim_name || "확인되지 않음"}</p>
                </div>
                
                <div>
                  <h4 className="text-xs font-medium text-gray-500">재해자 나이</h4>
                  <p className="text-gray-900">{report.victim_age > 0 ? `${report.victim_age}세` : "확인되지 않음"}</p>
                </div>
                
                <div>
                  <h4 className="text-xs font-medium text-gray-500">재해자 소속</h4>
                  <p className="text-gray-900">{report.victim_belong || "확인되지 않음"}</p>
                </div>
                
                <div>
                  <h4 className="text-xs font-medium text-gray-500">재해자 직무</h4>
                  <p className="text-gray-900">{report.victim_duty || "확인되지 않음"}</p>
                </div>
                
                <div>
                  <h4 className="text-xs font-medium text-gray-500">상해 정도</h4>
                  <p className="text-gray-900">{report.injury_type || "확인되지 않음"}</p>
                </div>
                
                <div>
                  <h4 className="text-xs font-medium text-gray-500">보호구 착용 여부</h4>
                  <p className="text-gray-900">{report.ppe_worn || "확인되지 않음"}</p>
                </div>
                
                <div>
                  <h4 className="text-xs font-medium text-gray-500">응급조치 내역</h4>
                  <p className="text-gray-900">{report.first_aid || "확인되지 않음"}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 첨부 파일 */}
      <div className="bg-gray-50 p-4 rounded-md mb-6">
        <h2 className="text-xl font-semibold mb-4">첨부 파일</h2>
        
        <div className="space-y-6">
          {/* 사고 현장 사진 */}
          <div>
            <h3 className="text-lg font-medium mb-2">사고 현장 사진</h3>
            {files.scene_photos.length === 0 ? (
              <p className="text-gray-500">첨부된 파일이 없습니다.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {files.scene_photos.map((file) => (
                  <div key={file.id} className="border rounded-md p-2 bg-white">
                    {renderFilePreview(file)}
                    <p className="text-xs truncate">{file.name}</p>
                    <button
                      onClick={() => downloadFile(file.id)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      다운로드
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* CCTV 영상 */}
          <div>
            <h3 className="text-lg font-medium mb-2">CCTV 영상</h3>
            {files.cctv_video.length === 0 ? (
              <p className="text-gray-500">첨부된 파일이 없습니다.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {files.cctv_video.map((file) => (
                  <div key={file.id} className="border rounded-md p-2 bg-white">
                    {renderFilePreview(file)}
                    <p className="text-xs truncate">{file.name}</p>
                    <button
                      onClick={() => downloadFile(file.id)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      다운로드
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* 관계자 진술서 */}
          <div>
            <h3 className="text-lg font-medium mb-2">관계자 진술서</h3>
            {files.statement_docs.length === 0 ? (
              <p className="text-gray-500">첨부된 파일이 없습니다.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {files.statement_docs.map((file) => (
                  <div key={file.id} className="border rounded-md p-2 bg-white">
                    {renderFilePreview(file)}
                    <p className="text-xs truncate">{file.name}</p>
                    <button
                      onClick={() => downloadFile(file.id)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      다운로드
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* 기타 문서 */}
          <div>
            <h3 className="text-lg font-medium mb-2">기타 문서</h3>
            {files.etc_documents.length === 0 ? (
              <p className="text-gray-500">첨부된 파일이 없습니다.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {files.etc_documents.map((file) => (
                  <div key={file.id} className="border rounded-md p-2 bg-white">
                    {renderFilePreview(file)}
                    <p className="text-xs truncate">{file.name}</p>
                    <button
                      onClick={() => downloadFile(file.id)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      다운로드
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 보고자 정보 */}
      <div className="bg-gray-50 p-4 rounded-md mb-6">
        <h2 className="text-xl font-semibold mb-4">보고자 정보</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-600">보고자 이름</h3>
            <p className="mt-1 text-gray-900">{report.reporter_name || "미기재"}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-600">보고자 직책</h3>
            <p className="mt-1 text-gray-900">{report.reporter_position || "미기재"}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-600">보고자 소속</h3>
            <p className="mt-1 text-gray-900">{report.reporter_belong || "미기재"}</p>
          </div>
        </div>
        
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-600">보고 경로</h3>
          <p className="mt-1 text-gray-900">{report.report_channel || "미기재"}</p>
        </div>
      </div>
      
      {/* 하단 버튼 */}
      <div className="flex justify-between mt-6">
        <div className="space-x-2">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium"
          >
            목록으로
          </button>
        </div>
        <div className="space-x-2">
          <button
            onClick={openDeleteModal}
            className="px-4 py-2 bg-red-600 text-white rounded-md shadow-sm text-sm font-medium"
          >
            삭제
          </button>
          <button
            onClick={() => router.push(`/occurrence/edit/${id}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium"
          >
            수정
          </button>
        </div>
      </div>
      
      {/* 삭제 확인 모달 */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">사고 발생보고서 삭제</h3>
            <p className="mb-6">정말로 이 사고 발생보고서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 border border-gray-300 rounded"
                disabled={deleteLoading}
              >
                취소
              </button>
              <button
                onClick={deleteReport}
                className="px-4 py-2 bg-red-600 text-white rounded"
                disabled={deleteLoading}
              >
                {deleteLoading ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 확대 모달 */}
      {selectedImage && (
        <ImageModal
          isOpen={imageModalOpen}
          onClose={closeImageModal}
          imageUrl={selectedImage.url}
          imageName={selectedImage.name}
          fileId={selectedImage.fileId}
        />
      )}
    </div>
  );
};

// 발생보고서 상세 컴포넌트 내보내기
export default OccurrenceDetailClient; 