'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface InvestigationReport {
  accident_id: string;
  investigation_start_time?: string;
  investigation_end_time?: string;
  investigation_team_lead?: string;
  investigation_status?: string;
  damage_severity?: string;
  death_count?: number;
  injured_count?: number;
  investigation_acci_time?: string;
  investigation_acci_location?: string;
  investigation_global_accident_no?: string;
}

export default function InvestigationListPage() {
  const router = useRouter();
  const [reports, setReports] = useState<InvestigationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 필터 상태
  const [filters, setFilters] = useState({
    investigation_status: '',
    investigation_team_lead: '',
    search: ''
  });

  // 조사보고서 목록 조회
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      if (filters.investigation_status) queryParams.append('investigation_status', filters.investigation_status);
      if (filters.investigation_team_lead) queryParams.append('investigation_team_lead', filters.investigation_team_lead);
      
      console.log('조사보고서 API 호출:', `http://localhost:6001/api/investigation?${queryParams.toString()}`);
      const response = await fetch(`http://localhost:6001/api/investigation?${queryParams.toString()}`, {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`조사보고서 API 오류 (${response.status}): ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('조사보고서 API 응답:', data);
      
      // API 응답 구조에 맞게 데이터 추출
      const reportsData = data.data || data.reports || [];
      if (reportsData && Array.isArray(reportsData)) {
        setReports(reportsData);
        console.log('조사보고서 데이터 로드 완료:', reportsData.length, '건');
      } else {
        console.log('조사보고서가 없습니다. 빈 배열로 설정');
        setReports([]);
      }
      
    } catch (err) {
      console.error('조사보고서 목록 조회 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      
      // 백엔드 문제 시 빈 배열로 설정
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filters.investigation_status, filters.investigation_team_lead]);

  // 상태별 색상 반환
  const getStatusColor = (status?: string) => {
    switch (status) {
      case '조사 착수': return 'bg-blue-100 text-blue-800';
      case '조사 진행중': return 'bg-yellow-100 text-yellow-800';
      case '대책 이행중': return 'bg-purple-100 text-purple-800';
      case '완료': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 피해 정도별 색상 반환
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case '사망': return 'bg-red-100 text-red-800';
      case '중상': return 'bg-orange-100 text-orange-800';
      case '경상': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 조사보고서 상세 페이지로 이동
  const handleViewReport = (accidentId: string) => {
    router.push(`/investigation/${accidentId}`);
  };

  // 검색 실행
  const handleSearch = () => {
    fetchReports();
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">조사보고서 관리</h1>
        <Link href="/investigation/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
          + 새 조사보고서
        </Link>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">조사 상태</label>
            <select
              value={filters.investigation_status}
              onChange={(e) => setFilters(prev => ({ ...prev, investigation_status: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              <option value="조사 착수">조사 착수</option>
              <option value="조사 진행중">조사 진행중</option>
              <option value="대책 이행중">대책 이행중</option>
              <option value="완료">완료</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">조사팀장</label>
            <input
              type="text"
              value={filters.investigation_team_lead}
              onChange={(e) => setFilters(prev => ({ ...prev, investigation_team_lead: e.target.value }))}
              placeholder="조사팀장 이름 입력"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">통합 검색</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="사고번호, 발생장소 등"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <button
              onClick={handleSearch}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              검색
            </button>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
              <p className="text-xs mt-1 text-red-600">백엔드 연결 문제로 임시 데이터를 표시합니다.</p>
            </div>
          </div>
        </div>
      )}

      {/* 조사보고서 목록 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사고번호</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사고발생일시</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">발생장소</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">조사팀장</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">조사기간</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">피해정도</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">인명피해</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">조사상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    조사보고서를 불러오는 중...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    조사보고서가 없습니다.
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.accident_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {report.investigation_global_accident_no || report.accident_id}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {report.investigation_acci_time 
                          ? new Date(report.investigation_acci_time).toLocaleString('ko-KR')
                          : '-'
                        }
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {report.investigation_acci_location || '-'}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {report.investigation_team_lead || '-'}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {report.investigation_start_time && report.investigation_end_time ? (
                          <>
                            {new Date(report.investigation_start_time).toLocaleDateString('ko-KR')}
                            <br />
                            ~ {new Date(report.investigation_end_time).toLocaleDateString('ko-KR')}
                          </>
                        ) : report.investigation_start_time ? (
                          <>
                            {new Date(report.investigation_start_time).toLocaleDateString('ko-KR')}
                            <br />
                            ~ 진행중
                          </>
                        ) : (
                          '-'
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {report.damage_severity && (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(report.damage_severity)}`}>
                          {report.damage_severity}
                        </span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {report.death_count || report.injured_count ? (
                          <>
                            {report.death_count ? `사망 ${report.death_count}명` : ''}
                            {report.death_count && report.injured_count ? ', ' : ''}
                            {report.injured_count ? `부상 ${report.injured_count}명` : ''}
                          </>
                        ) : (
                          '-'
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.investigation_status)}`}>
                        {report.investigation_status || '미정'}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewReport(report.accident_id)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        상세
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 통계 정보 */}
      {!loading && reports.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">
            총 {reports.length}건의 조사보고서가 있습니다.
          </div>
        </div>
      )}
    </div>
  );
} 