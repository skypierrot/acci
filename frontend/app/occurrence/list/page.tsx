"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * @file app/occurrence/list/page.tsx
 * @description
 *  - 사고 발생보고서 목록 페이지
 *  - 페이징 및 필터링 기능 제공
 */

// 발생보고서 데이터 인터페이스
interface OccurrenceReport {
  accident_id: string;
  global_accident_no: string;
  acci_time: string;
  company_name: string;
  company_code: string;
  site_name: string;
  site_code: string;
  acci_location: string;
  accident_type_level1: string;
  accident_type_level2: string;
  acci_summary: string;
  victim_count: number;
  victim_name: string;
  is_contractor: boolean;
  reporter_name: string;
  report_channel_no?: string; // 사업장 사고 코드 추가
}

// 페이지네이션 인터페이스
interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

// 한국 시간대 설정 헬퍼 함수
const getKoreanDate = (date = new Date()) => {
  // 한국 시간으로 변환 (UTC+9)
  const koreaTimeOffset = 9 * 60; // 9시간을 분으로 변환
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000); // UTC 시간 (밀리초)
  return new Date(utc + (koreaTimeOffset * 60000)); // 한국 시간
};

export default function OccurrenceListPage() {
  const router = useRouter();
  
  // 상태 관리
  const [reports, setReports] = useState<OccurrenceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  
  // 필터 상태
  const [filters, setFilters] = useState({
    company: "",
    fromDate: "",
    toDate: "",
    accidentType: ""
  });
  
  // 디버깅 정보 상태
  const [debugInfo, setDebugInfo] = useState<any>({});
  
  // 데이터 로드 함수
  const loadData = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      // API 요청을 위한 쿼리 파라미터 구성
      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: "10",
        ...(filters.company && { company: filters.company }),
        ...(filters.fromDate && { from: filters.fromDate }),
        ...(filters.toDate && { to: filters.toDate }),
        ...(filters.accidentType && { type: filters.accidentType })
      });
      
      // API 호출
      console.log("Fetching occurrence reports list...");
      const response = await fetch(`/api/occurrence?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error("사고 보고서 목록을 불러오는 중 오류가 발생했습니다.");
      }
      
      const data = await response.json();
      console.log("Reports data received:", data);
      
      // 디버깅 정보 업데이트
      setDebugInfo({
        apiResponse: {
          total: data.total,
          page: data.page,
          limit: data.limit,
          totalPages: data.total_pages,
          reportsCount: data.reports?.length || 0
        },
        timestamp: new Date().toISOString()
      });
      
      // 가져온 데이터 설정
      setReports(data.items || []);
      setPagination({
        currentPage: data.page || 1,
        totalPages: data.totalPages || 1,
        totalItems: data.totalItems || 0
      });
    } catch (err: any) {
      console.error("사고 발생보고서 목록 로드 오류:", err);
      setError(err.message || "데이터를 불러오는 중 오류가 발생했습니다.");
      
      // 임시 테스트 데이터 (실제 API가 없을 때 사용)
      setReports([
        {
          accident_id: "AC-20250604-001",
          global_accident_no: "20250604-001",
          acci_time: "2025-06-04T14:30:00",
          company_name: "제1공장",
          company_code: "C001",
          site_name: "조립라인",
          site_code: "S001",
          acci_location: "조립라인 B",
          accident_type_level1: "인적",
          accident_type_level2: "기계",
          acci_summary: "설비 점검 중 손가락 협착",
          victim_count: 1,
          victim_name: "김손가락",
          is_contractor: false,
          reporter_name: "김기장"
        },
        {
          accident_id: "AC-20250601-003",
          global_accident_no: "20250601-003",
          acci_time: "2025-06-01T09:15:00",
          company_name: "제2공장",
          company_code: "C002",
          site_name: "자재창고",
          site_code: "S002",
          acci_location: "자재 창고",
          accident_type_level1: "물적",
          accident_type_level2: "화재",
          acci_summary: "전기합선으로 인한 화재 발생",
          victim_count: 0,
          victim_name: "",
          is_contractor: false,
          reporter_name: "이기장"
        },
        {
          accident_id: "AC-20250529-002",
          global_accident_no: "20250529-002",
          acci_time: "2025-05-29T16:45:00",
          company_name: "물류센터",
          company_code: "C003",
          site_name: "상차장",
          site_code: "S003",
          acci_location: "상차장",
          accident_type_level1: "인적",
          accident_type_level2: "추락",
          acci_summary: "상차 작업 중 추락",
          victim_count: 1,
          victim_name: "박추락",
          is_contractor: true,
          reporter_name: "박센터"
        },
        {
          accident_id: "AC-20250525-004",
          global_accident_no: "20250525-004",
          acci_time: "2025-05-25T11:30:00",
          company_name: "제1공장",
          company_code: "C001",
          site_name: "출하장",
          site_code: "S004",
          acci_location: "출하장",
          accident_type_level1: "복합",
          accident_type_level2: "충돌",
          acci_summary: "지게차와 작업자 충돌",
          victim_count: 1,
          victim_name: "최충돌",
          is_contractor: false,
          reporter_name: "최공장"
        }
      ]);
      
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: 4
      });
    } finally {
      setLoading(false);
    }
  };
  
  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadData();
  }, []);
  
  // 필터 변경 핸들러
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 필터 적용 핸들러
  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(1); // 필터 적용 시 첫 페이지로 이동
  };
  
  // 페이지 변경 핸들러
  const changePage = (page: number) => {
    loadData(page);
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

  // 코드 포맷 함수 추가
  const formatGlobalAccidentNo = (code: string) => {
    if (!code) return '-';
    // 형식: [회사코드]-[YYYY]-[순번3자리]
    return code;
  };

  const formatSiteAccidentNo = (code: string) => {
    if (!code) return '-';
    // 형식: [회사식별코드]-[사업장코드]-[순번3자리]-[YYYYMMDD]
    return code;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">사고 발생보고 목록</h1>
        <Link 
          href="/occurrence" 
          className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700"
        >
          새 발생보고 작성
        </Link>
      </div>
      
      {/* 필터 섹션 */}
      <div className="bg-white rounded-lg shadow p-4">
        <form onSubmit={applyFilters} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">회사/사업장</label>
            <input
              type="text"
              name="company"
              value={filters.company}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="회사명 또는 사업장"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
            <input
              type="date"
              name="fromDate"
              value={filters.fromDate}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
            <input
              type="date"
              name="toDate"
              value={filters.toDate}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사고 유형</label>
            <select
              name="accidentType"
              value={filters.accidentType}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">전체</option>
              <option value="떨어짐">떨어짐(높이가 있는 곳에서 사람이 떨어짐)</option>
              <option value="넘어짐">넘어짐(사람이 미끄러지거나 넘어짐)</option>
              <option value="깔림">깔림(물체의 쓰러짐이나 뒤집힘)</option>
              <option value="부딪힘">부딪힘(물체에 부딪힘)</option>
              <option value="맞음">맞음(날아오거나 떨어진 물체에 맞음)</option>
              <option value="무너짐">무너짐(건축물이나 쌓인 물체가 무너짐)</option>
              <option value="끼임">끼임(기계설비에 끼이거나 감김)</option>
              <option value="절단베임찔림">절단·베임·찔림</option>
              <option value="감전">감전</option>
              <option value="폭발파열">폭발·파열</option>
              <option value="화재">화재</option>
              <option value="무리한동작">불균형 및 무리한 동작</option>
              <option value="이상온도접촉">이상온도·물체접촉</option>
              <option value="화학물질누출접촉">화학물질 누출·접촉</option>
              <option value="산소결핍">산소결핍</option>
              <option value="빠짐익사">빠짐·익사</option>
              <option value="기타">기타</option>
            </select>
          </div>
          
          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700"
            >
              필터 적용
            </button>
          </div>
        </form>
      </div>
      
      {/* 디버깅 정보 표시 */}
      <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded">
        <h3 className="text-sm font-semibold mb-2">디버깅 정보</h3>
        <pre className="text-xs overflow-auto max-h-32">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
        
        <h3 className="text-sm font-semibold mt-2 mb-2">저장된 보고서 ID</h3>
        <div className="text-xs">
          {reports.length > 0 ? (
            <ul>
              {reports.map(report => (
                <li key={report.accident_id}>
                  ID: {report.accident_id} | 
                  이름: {report.victim_name} | 
                  회사: {report.company_name} | 
                  사업장: {report.site_name}
                </li>
              ))}
            </ul>
          ) : (
            <p>저장된 보고서가 없습니다.</p>
          )}
        </div>
      </div>
      
      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {/* 로딩 표시 */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="text-lg">데이터 로딩 중...</div>
        </div>
      ) : (
        <>
          {/* 보고서 목록 테이블 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      전체사고코드
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사업장사고코드
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      발생일시
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      회사/사업장
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사고유형
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사고개요
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      재해자
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      보고자
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        조회된 사고 발생보고가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr 
                        key={report.accident_id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/occurrence/${report.accident_id}`)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatGlobalAccidentNo(report.global_accident_no)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatSiteAccidentNo(report.accident_id)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(report.acci_time)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{report.company_name}</div>
                          <div className="text-xs text-gray-500">{report.site_name}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{report.accident_type_level1}</div>
                          <div className="text-xs text-gray-500">{report.accident_type_level2}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 truncate max-w-xs">{report.acci_summary}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{report.victim_name || '-'}</div>
                          {report.victim_count > 1 && (
                            <div className="text-xs text-gray-500">외 {report.victim_count - 1}명</div>
                          )}
                          {report.is_contractor && (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              협력사
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {report.reporter_name}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* 페이지네이션 */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-700">
              총 <span className="font-medium">{pagination.totalItems}</span> 건의 보고서
            </div>
            <div className="flex space-x-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => changePage(page)}
                  className={`px-3 py-1 rounded-md ${
                    page === pagination.currentPage
                      ? "bg-slate-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 