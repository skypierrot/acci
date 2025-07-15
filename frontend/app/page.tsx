"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * @file app/page.tsx
 * @description
 *  - 메인 페이지 (대시보드)
 *  - 사고 통계 및 최근 사고 목록 표시
 */

interface AccidentStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

interface RecentAccident {
  id: string;
  date: string;
  company: string;
  location: string;
  type: string;
  status: string;
}

export default function Dashboard() {
  const router = useRouter();

  // 통계 데이터 상태
  const [stats, setStats] = useState<AccidentStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0
  });

  // 최근 사고 목록 상태
  const [recentAccidents, setRecentAccidents] = useState<RecentAccident[]>([]);
  const [loading, setLoading] = useState(true);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    // 실제 구현에서는 API 호출
    // 지금은 테스트 데이터로 시뮬레이션
    setTimeout(() => {
      // 통계 데이터 설정
      setStats({
        total: 12,
        pending: 3,
        inProgress: 5,
        completed: 4
      });

      // 최근 사고 목록 설정
      setRecentAccidents([
        {
          id: 'AC-20250604-001',
          date: '2025-06-04',
          company: '제1공장',
          location: '조립라인 B',
          type: '기계',
          status: '조사 진행 중'
        },
        {
          id: 'AC-20250601-003',
          date: '2025-06-01',
          company: '제2공장',
          location: '자재 창고',
          type: '화재',
          status: '조사 완료'
        },
        {
          id: 'AC-20250529-002',
          date: '2025-05-29',
          company: '물류센터',
          location: '상차장',
          type: '추락',
          status: '조치 이행 중'
        },
        {
          id: 'AC-20250525-004',
          date: '2025-05-25',
          company: '제1공장',
          location: '출하장',
          type: '충돌',
          status: '조사 완료'
        },
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">데이터 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <div className="flex space-x-4">
          <Link href="/settings" className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-gray-800 font-medium transition-colors">
            시스템 관리
          </Link>
        </div>
      </div>
      
      {/* 통계 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xl font-semibold">전체 사고</div>
          {/* [색상 일관성 작업] 파란색 계열 → slate/emerald/neutral 계열로 교체 */}
          {/* 통계 숫자 색상 변경 */}
          <div className="text-3xl font-bold text-emerald-600 mt-2">{stats.total}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xl font-semibold">미착수</div>
          <div className="text-3xl font-bold text-red-500 mt-2">{stats.pending}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xl font-semibold">진행 중</div>
          <div className="text-3xl font-bold text-yellow-500 mt-2">{stats.inProgress}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xl font-semibold">완료</div>
          <div className="text-3xl font-bold text-green-600 mt-2">{stats.completed}</div>
        </div>
      </div>
      
      {/* 최근 사고 목록 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">최근 사고 발생</h2>
          {/* 링크 색상 변경 */}
          <Link href="/occurrence/list" className="text-emerald-600 hover:underline">
            모두 보기
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-3 text-left">사고 ID</th>
                <th className="py-2 px-3 text-left">발생일</th>
                <th className="py-2 px-3 text-left">사업장</th>
                <th className="py-2 px-3 text-left">발생장소</th>
                <th className="py-2 px-3 text-left">유형</th>
                <th className="py-2 px-3 text-left">상태</th>
                <th className="py-2 px-3 text-left">조회</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentAccidents.map((accident) => (
                <tr key={accident.id} className="hover:bg-gray-50">
                  <td className="py-2 px-3">{accident.id}</td>
                  <td className="py-2 px-3">{accident.date}</td>
                  <td className="py-2 px-3">{accident.company}</td>
                  <td className="py-2 px-3">{accident.location}</td>
                  <td className="py-2 px-3">{accident.type}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      accident.status === '조사 완료' 
                        ? 'bg-green-100 text-green-800'
                        : accident.status === '조사 진행 중'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {accident.status}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    {/* 링크 색상 변경 */}
                    <Link href={`/history/${accident.id}`} className="text-emerald-600 hover:underline">
                      상세
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* 바로가기 버튼 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/occurrence" className="block">
          <div className="bg-primary-700 text-white rounded-lg shadow p-6 hover:bg-primary-800 transition-colors">
            <div className="text-xl font-semibold">사고 발생보고 등록</div>
            <div className="mt-2">새로운 사고 발생을 보고합니다.</div>
          </div>
        </Link>
        
        <Link href="/occurrence/list" className="block">
          <div className="bg-secondary-700 text-white rounded-lg shadow p-6 hover:bg-secondary-800 transition-colors">
            <div className="text-xl font-semibold">사고 발생보고 목록</div>
            <div className="mt-2">등록된 모든 사고 발생보고를 확인합니다.</div>
          </div>
        </Link>
        
        <Link href="/investigation" className="block">
          <div className="bg-primary-600 text-white rounded-lg shadow p-6 hover:bg-primary-700 transition-colors">
            <div className="text-xl font-semibold">사고 조사보고 작성</div>
            <div className="mt-2">등록된 사고에 대한 조사 결과를 작성합니다.</div>
          </div>
        </Link>
      </div>
    </div>
  );
} 