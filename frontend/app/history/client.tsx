"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// 발생보고서 인터페이스
interface OccurrenceReport {
  accident_id: string;
  global_accident_no: string;
  company_name: string;
  site_name: string;
  acci_time: string;
  acci_location: string;
  accident_type_level1: string;
  accident_type_level2: string;
  victim_count: number;
  victim_name?: string;
  victim_age?: number;
  is_contractor: boolean;
  contractor_name?: string;
  injury_type?: string;
  created_at: string;
  updated_at: string;
}

// 페이징 정보 인터페이스
interface PaginationInfo {
  total: number;
  page: number;
  size: number;
  pages: number;
}

// 필터 상태 인터페이스
interface FilterState {
  company: string;
  status: string;
  from: string;
  to: string;
}

const HistoryClient = () => {
  const router = useRouter();
  const [reports, setReports] = useState<OccurrenceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    size: 10,
    pages: 0
  });
  
  // 필터 상태
  const [filters, setFilters] = useState<FilterState>({
    company: "",
    status: "",
    from: "",
    to: ""
  });
  
  // 회사 목록
  const [companies, setCompanies] = useState<string[]>([]);
  
  // 초기 데이터 로드
  useEffect(() => {
    loadReports();
    // 회사 목록 로드
    loadCompanies();
  }, []);
  
  // 페이징 또는 필터 변경 시 데이터 재로드
  useEffect(() => {
    // 초기 렌더링이 아닌 경우에만 데이터 로드
    if (!loading) {
      loadReports();
    }
  }, [pagination.page, filters]);
  
  // 회사 목록 로드 함수
  const loadCompanies = async () => {
    try {
      const response = await fetch('/api/settings/companies');
      if (response.ok) {
        const data = await response.json();
        const companyNames = data.map((company: any) => company.company_name);
        setCompanies(companyNames);
      }
    } catch (err) {
      console.error('회사 목록 로드 오류:', err);
    }
  };
  
  // 사고 발생보고서 로드 함수
  const loadReports = async () => {
    try {
      setLoading(true);
      
      // 쿼리 파라미터 구성
      const queryParams = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.size)
      });
      
      // 필터 적용
      if (filters.company) queryParams.append('company', filters.company);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.from) queryParams.append('start_date', filters.from);
      if (filters.to) queryParams.append('end_date', filters.to);
      
      // API 호출
      console.log('API 호출:', `/api/occurrence?${queryParams.toString()}`);
      const response = await fetch(`/api/occurrence?${queryParams.toString()}`, {
        cache: 'no-store', // 캐시 방지
        next: { revalidate: 0 } // SSR 캐시 방지
      });
      
      if (!response.ok) {
        throw new Error(`API 오류 (${response.status}): ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API 응답:', data);
      
      // API 응답 구조에 맞게 데이터 추출
      const reportsData = data.reports || data.data || [];
      if (reportsData && Array.isArray(reportsData)) {
        setReports(reportsData);
      } else {
        console.error('API 응답에 reports 배열이 없습니다:', data);
        setReports([]);
      }
      
      // 페이징 정보 설정
      setPagination({
        total: data.total || 0,
        page: data.page || 1,
        size: data.limit || 10,
        pages: data.total_pages || 1
      });
      
    } catch (err: any) {
      console.error('사고 발생보고서 로드 오류:', err);
      setError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
      // 에러 발생 시에도 로딩 상태 해제
      setReports([]);
    } finally {
      setLoading(false);
    }
  };
  
  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
  };
  
  // 필터 변경 핸들러
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  // 필터 적용 핸들러
  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    // 페이지를 1로 리셋하고 필터 적용
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  
  // 필터 초기화 핸들러
  const handleResetFilters = () => {
    setFilters({
      company: "",
      status: "",
      from: "",
      to: ""
    });
    // 페이지를 1로 리셋
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  
  // 날짜 포맷 함수
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch (e) {
      console.error('날짜 포맷 오류:', e);
      return dateStr;
    }
  };
  
  // 상태에 따른 배지 색상
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case '발생':
        return 'bg-red-100 text-red-800';
      case '조사중':
        return 'bg-yellow-100 text-yellow-800';
      case '완료':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (loading && reports.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">데이터 로딩 중...</div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">사고 이력</h1>
        <Link href="/occurrence/create" className="px-4 py-2 bg-blue-600 text-white rounded">
          신규 사고 등록
        </Link>
      </div>
      
      {/* 오류 메시지 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">오류 발생</p>
          <p>{error}</p>
          <button 
            onClick={() => {
              setError(null);
              loadReports();
            }} 
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
          >
            다시 시도
          </button>
        </div>
      )}
      
      {/* 필터 섹션 */}
      <div className="bg-gray-50 p-4 rounded-md mb-6">
        <form onSubmit={handleApplyFilters}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">회사</label>
              <select
                name="company"
                value={filters.company}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                <option value="">전체</option>
                {companies.map((company, index) => (
                  <option key={index} value={company}>{company}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">상태</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                <option value="">전체</option>
                <option value="발생">발생</option>
                <option value="조사중">조사중</option>
                <option value="완료">완료</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">시작일</label>
              <input
                type="date"
                name="from"
                value={filters.from}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">종료일</label>
              <input
                type="date"
                name="to"
                value={filters.to}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md p-2"
              />
            </div>
          </div>
          
          <div className="mt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 border border-gray-300 rounded-md"
            >
              초기화
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              적용
            </button>
          </div>
        </form>
      </div>
      
      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">사고코드</th>
              <th className="border p-2 text-left">회사</th>
              <th className="border p-2 text-left">사업장</th>
              <th className="border p-2 text-left">발생일시</th>
              <th className="border p-2 text-left">발생장소</th>
              <th className="border p-2 text-left">재해자수</th>
              <th className="border p-2 text-left">사고유형</th>
              <th className="border p-2 text-left">상태</th>
              <th className="border p-2 text-center">상세보기</th>
            </tr>
          </thead>
          <tbody>
            {reports.length > 0 ? (
              reports.map((report) => (
                <tr key={report.accident_id} className="hover:bg-gray-50">
                  <td className="border p-2">{report.global_accident_no}</td>
                  <td className="border p-2">{report.company_name}</td>
                  <td className="border p-2">{report.site_name}</td>
                  <td className="border p-2">{formatDate(report.acci_time)}</td>
                  <td className="border p-2">{report.acci_location}</td>
                  <td className="border p-2">{report.victim_count}</td>
                  <td className="border p-2">{report.accident_type_level1}</td>
                  <td className="border p-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass('발생')}`}>
                      발생
                    </span>
                  </td>
                  <td className="border p-2 text-center">
                    <button
                      onClick={() => router.push(`/occurrence/${report.accident_id}`)}
                      className="text-blue-600 hover:underline"
                    >
                      상세보기
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="border p-4 text-center">
                  {loading ? "데이터를 불러오는 중입니다..." : "조회된 사고 발생보고서가 없습니다."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* 페이지네이션 */}
      {pagination.pages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center">
            <button
              onClick={() => handlePageChange(1)}
              disabled={pagination.page === 1}
              className={`mx-1 px-3 py-1 rounded ${
                pagination.page === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              처음
            </button>
            
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={`mx-1 px-3 py-1 rounded ${
                pagination.page === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              이전
            </button>
            
            {/* 페이지 번호 */}
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              // 현재 페이지를 중심으로 표시할 페이지 범위 계산
              let startPage = Math.max(1, pagination.page - 2);
              const endPage = Math.min(pagination.pages, startPage + 4);
              
              // 마지막 페이지가 최대 페이지보다 작을 경우 시작 페이지 조정
              if (endPage - startPage < 4) {
                startPage = Math.max(1, endPage - 4);
              }
              
              const pageNum = startPage + i;
              if (pageNum > pagination.pages) return null;
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`mx-1 px-3 py-1 rounded ${
                    pagination.page === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className={`mx-1 px-3 py-1 rounded ${
                pagination.page === pagination.pages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              다음
            </button>
            
            <button
              onClick={() => handlePageChange(pagination.pages)}
              disabled={pagination.page === pagination.pages}
              className={`mx-1 px-3 py-1 rounded ${
                pagination.page === pagination.pages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              마지막
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default HistoryClient; 