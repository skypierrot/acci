'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { InvestigationReport } from '../../types/investigation.types';

// API 베이스 URL 환경변수 또는 기본값
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

// 날짜 포맷팅 유틸리티 함수
const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toISOString().split('T')[0];
  } catch (e) {
    return 'Invalid Date';
  }
};

async function getInvestigationList(page: number, searchTerm: string = ''): Promise<{ investigations: InvestigationReport[], totalPages: number, currentPage: number }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/investigation?page=${page}&limit=10&searchTerm=${encodeURIComponent(searchTerm)}`);
    if (!response.ok) {
      // 500 에러의 경우, 응답 본문을 포함하여 에러 메시지 생성
      const errorBody = await response.text();
      console.error('Server error response:', errorBody);
      throw new Error(`조사보고서 목록을 불러오는 데 실패했습니다: ${response.statusText}`);
    }
    const data = await response.json();
    return {
      investigations: data.reports || [],
      totalPages: data.totalPages || 1,
      currentPage: data.currentPage || 1,
    };
  } catch (error) {
    console.error(error);
    return { investigations: [], totalPages: 1, currentPage: 1 };
  }
}

export default function InvestigationListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [investigations, setInvestigations] = useState<InvestigationReport[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1', 10);
    const term = searchParams.get('searchTerm') || '';
    
    setLoading(true);
    setError(null);
    
    getInvestigationList(page, term)
      .then(data => {
        setInvestigations(data.investigations);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push(`/investigation?page=1&searchTerm=${encodeURIComponent(searchTerm)}`);
  };
  
  const handlePageChange = (newPage: number) => {
    router.push(`/investigation?page=${newPage}&searchTerm=${encodeURIComponent(searchTerm)}`);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-xl">로딩 중...</div>
    </div>
  );
  
  if (error) return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-xl text-red-500">에러: {error}</div>
    </div>
  );

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">조사보고서 목록</h1>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="보고서 검색..."
          className="p-2 border rounded w-full"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          검색
        </button>
      </form>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                관리번호
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                사고명
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                조사 시작일
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                상태
              </th>
            </tr>
          </thead>
          <tbody>
            {investigations.map((report) => (
              <tr key={report.accident_id} className="hover:bg-gray-50">
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <Link href={`/investigation/${report.accident_id}`} className="text-blue-600 hover:underline">
                    {report.investigation_global_accident_no || report.accident_id}
                  </Link>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  {report.investigation_acci_summary}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  {formatDate(report.investigation_start_time)}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <span className={`px-2 py-1 font-semibold leading-tight text-green-700 bg-green-100 rounded-full`}>
                    {report.investigation_status || '작성중'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-center items-center mt-6">
        <button 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-4 py-2 mx-1 bg-gray-200 rounded disabled:opacity-50"
        >
          이전
        </button>
        <span className="px-4 py-2">
          {currentPage} / {totalPages}
        </span>
        <button 
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-4 py-2 mx-1 bg-gray-200 rounded disabled:opacity-50"
        >
          다음
        </button>
      </div>
    </div>
  );
} 