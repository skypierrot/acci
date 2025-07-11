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
  victims_json?: string;  // 재해자 정보 JSON 문자열
  created_at: string;
  updated_at: string;
  status: string;  // 사고 상태 (발생, 조사중, 완료)
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
  
  // 조사보고서 존재 여부를 저장할 상태 추가 (행별)
  const [investigationExistsMap, setInvestigationExistsMap] = useState<{ [accidentId: string]: boolean }>({});

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
  
  // 보고서 목록이 바뀔 때마다 각 행별로 조사보고서 존재 여부를 비동기로 확인
  useEffect(() => {
    if (!reports || reports.length === 0) return;
    // 이미 확인된 accident_id는 중복 요청하지 않음
    const uncheckedIds = reports.filter(r => !(r.accident_id in investigationExistsMap)).map(r => r.accident_id);
    if (uncheckedIds.length === 0) return;
    uncheckedIds.forEach(accidentId => {
      fetch(`/api/investigation/${accidentId}/exists`)
        .then(res => res.json())
        .then(data => {
          setInvestigationExistsMap(prev => ({ ...prev, [accidentId]: !!data.exists }));
        })
        .catch(() => {
          setInvestigationExistsMap(prev => ({ ...prev, [accidentId]: false }));
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports]);
  
  // 회사 목록 로드 함수
  const loadCompanies = async () => {
    try {
      const response = await fetch('/api/companies');
      if (response.ok) {
        const data = await response.json();
        const companyNames = data.map((company: any) => company.name);
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
        size: String(pagination.size)
      });
      
      // 필터 적용
      if (filters.company) queryParams.append('company', filters.company);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.from) queryParams.append('from', filters.from);
      if (filters.to) queryParams.append('to', filters.to);
      
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
      
      setReports(data.reports || []);
      
      // 페이징 정보 설정
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        page: data.page || 1,
        pages: data.totalPages || 1
      }));
      
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
  
  // victims_json에서 상해정도 추출 함수
  const getInjuryType = (victimsJson: string | undefined) => {
    if (!victimsJson) return '정보 없음';
    
    try {
      const victims = JSON.parse(victimsJson);
      if (Array.isArray(victims) && victims.length > 0) {
        // 첫 번째 재해자의 상해정도 반환
        const firstVictim = victims[0];
        if (firstVictim && firstVictim.injury_type) {
          return firstVictim.injury_type;
        }
        
        // 여러 재해자가 있는 경우 모든 상해정도 조합
        const injuryTypes = victims
          .map(victim => victim.injury_type)
          .filter(type => type && type.trim() !== '')
          .filter((type, index, self) => self.indexOf(type) === index); // 중복 제거
        
        if (injuryTypes.length > 0) {
          return injuryTypes.length > 1 ? `${injuryTypes[0]} 외 ${injuryTypes.length - 1}건` : injuryTypes[0];
        }
      }
    } catch (e) {
      console.error('victims_json 파싱 오류:', e);
    }
    
    return '정보 없음';
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
    <div className="max-w-7xl mx-auto bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-3 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-bold">사고 이력</h1>
        <Link href="/occurrence/create" className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded text-center font-medium hover:bg-blue-700 transition-colors">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">회사</label>
              <select
                name="company"
                value={filters.company}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
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
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
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
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">종료일</label>
              <input
                type="date"
                name="to"
                value={filters.to}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              />
            </div>
          </div>
          
          <div className="mt-4 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              초기화
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              적용
            </button>
          </div>
        </form>
      </div>
      
      {/* 테이블 */}
      <div className="overflow-x-auto">
        {/* 데스크톱 테이블 뷰 - md 이상에서만 표시 */}
        <div className="hidden md:block">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">{/* 상태 열을 가장 왼쪽에 배치, 모든 셀 가운데 정렬 */}<th className="border p-2 text-center">상태</th><th className="border p-2 text-center">사고코드</th><th className="border p-2 text-center">회사</th><th className="border p-2 text-center">사업장</th><th className="border p-2 text-center">발생일시</th><th className="border p-2 text-center">발생장소</th><th className="border p-2 text-center">재해자수</th><th className="border p-2 text-center">사고유형</th><th className="border p-2 text-center">상해정도</th><th className="border p-2 text-center">보고서확인</th></tr>
            </thead>
            <tbody>
              {reports.length > 0 ? (
                reports.map((report) => (
                  <tr key={report.accident_id} className="hover:bg-gray-50">{/* 모든 셀 가운데 정렬 */}
                    <td className="border p-2 text-center"><span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(report.status)}`}>{report.status}</span></td>
                    <td className="border p-2 text-center">{report.global_accident_no}</td>
                    <td className="border p-2 text-center">{report.company_name}</td>
                    <td className="border p-2 text-center">{report.site_name}</td>
                    <td className="border p-2 text-center">{formatDate(report.acci_time)}</td>
                    <td className="border p-2 text-center">{report.acci_location}</td>
                    <td className="border p-2 text-center">{report.victim_count}</td>
                    <td className="border p-2 text-center">{report.accident_type_level1}</td>
                    <td className="border p-2 text-center">{getInjuryType(report.victims_json)}</td>
                    <td className="border p-2 text-center">{/* 작업(보고서확인) 열: 조사보고서 존재 여부에 따라 버튼 표시 */}
                      {investigationExistsMap[report.accident_id] ? (
                        <div className="flex flex-col gap-1 items-center">
                          {/* 조사보고서가 있으면 두 개의 버튼 */}
                          <button
                            onClick={() => router.push(`/investigation/${report.accident_id}`)}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 w-24 mb-1"
                          >
                            조사보고서
                          </button>
                          <button
                            onClick={() => router.push(`/occurrence/${report.accident_id}`)}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 w-24"
                          >
                            발생보고서
                          </button>
                        </div>
                      ) : (
                        // 조사보고서가 없으면 발생보고서만
                        <button
                          onClick={() => router.push(`/occurrence/${report.accident_id}`)}
                          className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 w-24"
                        >
                          발생보고서
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={10} className="border p-4 text-center">{loading ? "데이터를 불러오는 중입니다..." : "조회된 사고 발생보고서가 없습니다."}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 모바일 카드 뷰 - md 미만에서만 표시 */}
        <div className="md:hidden space-y-4">
          {reports.length > 0 ? (
            reports.map((report) => (
              <div
                key={report.accident_id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                {/* 카드 헤더 - 사고코드와 상태 */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">
                      {report.global_accident_no}
                    </h3>
                    <p className="text-sm text-gray-500">사고코드</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(report.status)}`}>
                    {report.status}
                  </span>
                </div>

                {/* 회사 및 사업장 정보 */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-sm text-gray-500">회사</p>
                    <p className="font-medium text-gray-800">{report.company_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">사업장</p>
                    <p className="font-medium text-gray-800">{report.site_name}</p>
                  </div>
                </div>

                {/* 발생일시 및 장소 */}
                <div className="mb-3">
                  <p className="text-sm text-gray-500">발생일시</p>
                  <p className="font-medium text-gray-800 mb-2">{formatDate(report.acci_time)}</p>
                  <p className="text-sm text-gray-500">발생장소</p>
                  <p className="font-medium text-gray-800">{report.acci_location}</p>
                </div>

                {/* 사고 정보 */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-sm text-gray-500">재해자수</p>
                    <p className="font-medium text-red-600">{report.victim_count}명</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">사고유형</p>
                    <p className="font-medium text-gray-800">{report.accident_type_level1}</p>
                  </div>
                </div>

                {/* 상해정도 정보 */}
                <div className="mb-4">
                  <p className="text-sm text-gray-500">상해정도</p>
                  <p className="font-medium text-gray-800">
                    {getInjuryType(report.victims_json)}
                  </p>
                </div>

                {/* 액션 버튼들 */}
                <div className="pt-3 border-t border-gray-100">
                  <button
                    onClick={() => router.push(`/occurrence/${report.accident_id}`)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors"
                  >
                    상세보기
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500">
                {loading ? "데이터를 불러오는 중입니다..." : "조회된 사고 발생보고서가 없습니다."}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* 페이지네이션 */}
      {pagination.pages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 space-y-3 sm:space-y-0">
          {/* 페이지 정보 */}
          <div className="text-sm text-gray-600">
            전체 {pagination.total}건 중 {((pagination.page - 1) * pagination.size) + 1}-{Math.min(pagination.page * pagination.size, pagination.total)}건 표시
          </div>
          
          {/* 페이지 네비게이션 */}
          <nav className="flex items-center">
            <button
              onClick={() => handlePageChange(1)}
              disabled={pagination.page === 1}
              className={`mx-1 px-2 sm:px-3 py-1 rounded text-sm ${
                pagination.page === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <span className="hidden sm:inline">처음</span>
              <span className="sm:hidden">‹‹</span>
            </button>
            
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={`mx-1 px-2 sm:px-3 py-1 rounded text-sm ${
                pagination.page === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <span className="hidden sm:inline">이전</span>
              <span className="sm:hidden">‹</span>
            </button>
            
            {/* 페이지 번호 - 모바일에서는 현재 페이지만 표시 */}
            <div className="hidden sm:flex">
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
                    className={`mx-1 px-3 py-1 rounded text-sm ${
                      pagination.page === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            {/* 모바일에서는 현재 페이지 정보만 표시 */}
            <div className="sm:hidden mx-2 px-3 py-1 bg-blue-600 text-white rounded text-sm">
              {pagination.page} / {pagination.pages}
            </div>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className={`mx-1 px-2 sm:px-3 py-1 rounded text-sm ${
                pagination.page === pagination.pages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <span className="hidden sm:inline">다음</span>
              <span className="sm:hidden">›</span>
            </button>
            
            <button
              onClick={() => handlePageChange(pagination.pages)}
              disabled={pagination.page === pagination.pages}
              className={`mx-1 px-2 sm:px-3 py-1 rounded text-sm ${
                pagination.page === pagination.pages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <span className="hidden sm:inline">마지막</span>
              <span className="sm:hidden">››</span>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default HistoryClient; 