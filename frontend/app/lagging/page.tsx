// /lagging 사고지표 페이지
'use client';

import React, { useState, useEffect } from 'react';

// 연도 선택 드롭다운 컴포넌트
const YearSelector = ({ 
  selectedYear, 
  onYearChange, 
  yearOptions 
}: { 
  selectedYear: number; 
  onYearChange: (year: number) => void; 
  yearOptions: number[]; 
}) => {
  return (
    <div className="mb-6">
      <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 mb-2">
        조회 연도
      </label>
      <select
        id="year-select"
        value={selectedYear}
        onChange={(e) => onYearChange(Number(e.target.value))}
        className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
        {yearOptions.map((year) => (
          <option key={year} value={year}>
            {year}년
          </option>
        ))}
      </select>
    </div>
  );
};

// 사고 건수 지표 카드 컴포넌트
const AccidentCountCard = ({ 
  count,
  employeeAccidentCount,
  contractorAccidentCount,
  siteAccidentCounts,
  loading 
}: { 
  count: number;
  employeeAccidentCount: number;
  contractorAccidentCount: number;
  siteAccidentCounts: Record<string, number>;
  loading: boolean; 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">전체 사고 건수</p>
          {loading ? (
            <div className="mt-2 h-8 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">{count.toLocaleString()}</p>
                {(employeeAccidentCount > 0 || contractorAccidentCount > 0) && (
                  <p className="text-sm text-gray-600">
                    (임직원 {employeeAccidentCount}, 협력업체 {contractorAccidentCount})
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="p-3 bg-blue-100 rounded-full">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
      </div>
      
      {/* 사업장별 사고 건수 목록 */}
      {!loading && Object.keys(siteAccidentCounts).length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-500 mb-1">사업장별 사고 건수</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(siteAccidentCounts)
              .sort(([,a], [,b]) => b - a) // 사고 건수 내림차순 정렬
              .map(([siteName, count]) => (
                <div key={siteName} className="flex items-center px-2 py-0.5 bg-gray-50 rounded text-xs">
                  <span className="text-gray-700">{siteName}</span>
                  <span className="font-medium text-gray-900 ml-1">{count}건</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 물적피해금액 카드 컴포넌트
const PropertyDamageCard = ({
  directDamageAmount,
  indirectDamageAmount,
  loading
}: {
  directDamageAmount: number;
  indirectDamageAmount: number;
  loading: boolean;
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">물적피해금액</p>
          {loading ? (
            <div className="mt-2 h-8 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">{directDamageAmount.toLocaleString()}</p>
                <p className="text-sm text-gray-600">천원</p>
              </div>
            </div>
          )}
        </div>
        <div className="p-3 bg-orange-100 rounded-full">
          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
      </div>
      
      {/* 간접피해금액 */}
      {!loading && indirectDamageAmount > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-500 mb-1">간접피해금액 (직접피해금액×4)</p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold text-gray-900">{indirectDamageAmount.toLocaleString()}</span>
            <span className="text-sm text-gray-600">천원</span>
          </div>
        </div>
      )}
    </div>
  );
};

// 재해자 수 및 상해정도별 카운트 카드 컴포넌트
const VictimCountCard = ({
  count,
  employeeCount,
  contractorCount,
  injuryTypeCounts,
  loading
}: {
  count: number;
  employeeCount: number;
  contractorCount: number;
  injuryTypeCounts: Record<string, number>;
  loading: boolean;
}) => {
  // 상해정도별 색상 매핑 (괄호 제거된 이름)
  const colorMap: Record<string, string> = {
    '응급처치': 'bg-green-100 text-green-700',
    '병원치료': 'bg-blue-100 text-blue-700',
    '경상': 'bg-yellow-100 text-yellow-700',
    '중상': 'bg-orange-100 text-orange-700',
    '사망': 'bg-red-100 text-red-700',
    '기타': 'bg-gray-100 text-gray-700',
  };
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-rose-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">재해자 수</p>
          {loading ? (
            <div className="mt-2 h-8 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">{count.toLocaleString()}</p>
                {(employeeCount > 0 || contractorCount > 0) && (
                  <p className="text-sm text-gray-600">
                    (임직원 {employeeCount}, 협력업체 {contractorCount})
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="p-3 bg-rose-100 rounded-full">
          <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4V7a4 4 0 00-8 0v3m12 4a4 4 0 01-8 0m8 0a4 4 0 01-8 0" />
          </svg>
        </div>
      </div>
      {/* 상해정도별 카운트 (심각도 순서로 정렬) */}
      <div className="mt-3">
        <p className="text-xs font-medium text-gray-500 mb-1">상해정도</p>
        <div className="flex flex-wrap gap-2">
          {(() => {
            // 상해정도 표시 순서 정의 (심각도 순)
            const displayOrder = ['사망', '중상', '경상', '병원치료', '응급처치', '기타'];
            
            // 정의된 순서대로 정렬하여 표시
            return displayOrder
              .filter(type => injuryTypeCounts[type] && injuryTypeCounts[type] > 0)
              .map(type => (
                <span
                  key={type}
                  className={`px-2 py-1 rounded text-xs font-semibold ${colorMap[type] || 'bg-gray-100 text-gray-700'}`}
                >
                  {type}: {injuryTypeCounts[type]}
                </span>
              ));
          })()}
        </div>
      </div>
    </div>
  );
};

// LTIR 카드 컴포넌트
const LTIRCard = ({
  ltir,
  employeeLtir,
  contractorLtir,
  ltirBase,
  setLtirBase,
  loading
}: {
  ltir: number;
  employeeLtir: number;
  contractorLtir: number;
  ltirBase: number;
  setLtirBase: (v: number) => void;
  loading: boolean;
}) => {
  const handleCardClick = () => {
    if (!loading) {
      setLtirBase(ltirBase === 200000 ? 1000000 : 200000);
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500 ${!loading ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">LTIR</p>
          {loading ? (
            <div className="mt-2 h-8 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">{ltir.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>
        <div className="p-3 bg-indigo-100 rounded-full">
          <div className="w-6 h-6 flex items-center justify-center">
            <span className="text-indigo-600 text-xs font-bold text-center">
              {ltirBase === 200000 ? '20만시' : '100만시'}
            </span>
          </div>
        </div>
      </div>
      
      {/* 임직원/협력업체 LTIR */}
      {!loading && (
        <div className="mt-3">
          <div className="flex gap-8">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">임직원 LTIR</p>
              <span className="text-lg font-semibold text-gray-900">{employeeLtir.toFixed(2)}</span>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">협력업체 LTIR</p>
              <span className="text-lg font-semibold text-gray-900">{contractorLtir.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// TRIR 카드 컴포넌트 (LTIR과 동일하지만 기준이상 사고 건수에 경상, 병원치료 포함)
const TRIRCard = ({
  trir,
  employeeTrir,
  contractorTrir,
  trirBase,
  setTrirBase,
  loading
}: {
  trir: number;
  employeeTrir: number;
  contractorTrir: number;
  trirBase: number;
  setTrirBase: (v: number) => void;
  loading: boolean;
}) => {
  const handleCardClick = () => {
    if (!loading) {
      setTrirBase(trirBase === 200000 ? 1000000 : 200000);
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500 ${!loading ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">TRIR</p>
          {loading ? (
            <div className="mt-2 h-8 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">{trir.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>
        <div className="p-3 bg-purple-100 rounded-full">
          <div className="w-6 h-6 flex items-center justify-center">
            <span className="text-purple-600 text-xs font-bold text-center">
              {trirBase === 200000 ? '20만시' : '100만시'}
            </span>
          </div>
        </div>
      </div>
      
      {/* 임직원/협력업체 TRIR */}
      {!loading && (
        <div className="mt-3">
          <div className="flex gap-8">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">임직원 TRIR</p>
              <span className="text-lg font-semibold text-gray-900">{employeeTrir.toFixed(2)}</span>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">협력업체 TRIR</p>
              <span className="text-lg font-semibold text-gray-900">{contractorTrir.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function LaggingPage() {
  // 상태 관리
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [yearOptions, setYearOptions] = useState<number[]>([]);
  const [accidentCount, setAccidentCount] = useState<number>(0);
  const [employeeAccidentCount, setEmployeeAccidentCount] = useState<number>(0);
  const [contractorAccidentCount, setContractorAccidentCount] = useState<number>(0);
  const [siteAccidentCounts, setSiteAccidentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 사업장 정보를 가져오는 함수
  const fetchSiteInfo = async () => {
    try {
      const response = await fetch('/api/companies');
      if (!response.ok) throw new Error('사업장 정보 조회 실패');
      const companies = await response.json();
      
      // 사업장 코드와 이름을 매핑하는 객체 생성
      const siteCodeToName: Record<string, string> = {};
      companies.forEach((company: any) => {
        if (company.sites && Array.isArray(company.sites)) {
          company.sites.forEach((site: any) => {
            siteCodeToName[site.code] = site.name;
          });
        }
      });
      
      return siteCodeToName;
    } catch (error) {
      console.error('사업장 정보 조회 오류:', error);
      // 기본 매핑 반환
      return {
        'A': '가상사업장',
        'B': '나상사업장',
        'C': '다상사업장',
        'D': '라상사업장',
        'E': '마상사업장'
      };
    }
  };
  const [victimCount, setVictimCount] = useState<number>(0);
  const [employeeCount, setEmployeeCount] = useState<number>(0);
  const [contractorCount, setContractorCount] = useState<number>(0);
  const [injuryTypeCounts, setInjuryTypeCounts] = useState<Record<string, number>>({});
  const [victimLoading, setVictimLoading] = useState<boolean>(true);
  const [directDamageAmount, setDirectDamageAmount] = useState<number>(0);
  const [indirectDamageAmount, setIndirectDamageAmount] = useState<number>(0);
  const [propertyDamageLoading, setPropertyDamageLoading] = useState<boolean>(true);
  const [ltirBase, setLtirBase] = useState<number>(200000);
  const [ltir, setLtir] = useState<number>(0);
  const [employeeLtir, setEmployeeLtir] = useState<number>(0);
  const [contractorLtir, setContractorLtir] = useState<number>(0);
  const [ltirLoading, setLtirLoading] = useState<boolean>(true);
  
  // TRIR 관련 상태 (LTIR과 동일한 기준 사용)
  const [trir, setTrir] = useState<number>(0);
  const [employeeTrir, setEmployeeTrir] = useState<number>(0);
  const [contractorTrir, setContractorTrir] = useState<number>(0);
  const [trirLoading, setTrirLoading] = useState<boolean>(true);

  // 연간 근로시간 정보를 가져오는 함수
  const fetchAnnualWorkingHours = async (year: number) => {
    try {
      // 첫 번째 회사 ID를 사용 (실제로는 선택된 회사나 기본 회사 사용)
      const response = await fetch('/api/companies');
      if (!response.ok) throw new Error('회사 정보 조회 실패');
      const companies = await response.json();
      
      if (companies.length === 0) {
        console.log('[LTIR] 회사 정보가 없습니다.');
        return { total: 0, employee: 0, contractor: 0 };
      }

      const companyId = companies[0].id;
      const hoursResponse = await fetch(`/api/settings/annual-working-hours?company_id=${companyId}&year=${year}`);
      if (!hoursResponse.ok) throw new Error('연간 근로시간 조회 실패');
      const hoursData = await hoursResponse.json();

      // 전사-종합 데이터 찾기 (site_id가 null인 경우)
      const totalData = hoursData.find((item: any) => !item.site_id);
      if (!totalData) {
        console.log('[LTIR] 전사-종합 근로시간 데이터가 없습니다.');
        return { total: 0, employee: 0, contractor: 0 };
      }

      console.log('[LTIR] 연간 근로시간 데이터:', totalData);
      
      return {
        total: totalData.total_hours || 0,
        employee: totalData.employee_hours || 0,
        contractor: (totalData.partner_on_hours || 0) + (totalData.partner_off_hours || 0)
      };
    } catch (error) {
      console.error('[LTIR] 연간 근로시간 조회 오류:', error);
      return { total: 0, employee: 0, contractor: 0 };
    }
  };

  // 사고발생보고서에서 연도 추출 함수 (글로벌 사고 코드 기준)
  const extractYearsFromReports = (reports: any[]) => {
    const years = new Set<number>();
    
    reports.forEach(report => {
      if (report.global_accident_no) {
        const parts = report.global_accident_no.split('-');
        if (parts.length >= 2) {
          const year = parseInt(parts[1], 10);
          if (!isNaN(year)) {
            years.add(year);
          }
        }
      }
    });
    
    // 년도를 내림차순으로 정렬 (최신 년도부터)
    return Array.from(years).sort((a, b) => b - a);
  };

  // 기준이상 인적사고 건수 계산 함수
  const calculateLTIRAccidentCounts = async (year: number) => {
    try {
      const response = await fetch(`/api/occurrence/all?year=${year}`);
      if (!response.ok) throw new Error('사고 목록 조회 실패');
      const data = await response.json();
      const reports = data.reports || [];

      // 인적 또는 복합 사고만 필터링
      const humanAccidents = reports.filter((r: any) =>
        r.accident_type_level1 === '인적' || r.accident_type_level1 === '복합'
      );

      console.log(`[LTIR] 전체 사고: ${reports.length}건, 인적/복합 사고: ${humanAccidents.length}건`);

      let totalSevereAccidents = 0;
      let employeeSevereAccidents = 0;
      let contractorSevereAccidents = 0;

      for (const report of humanAccidents) {
        let hasSevereInjury = false;
        
        // 재해자 정보 확인 (조사보고서 우선, 없으면 발생보고서)
        let victims: any[] = [];
        
        // 조사보고서 확인
        try {
          const invResponse = await fetch(`/api/investigation/${report.accident_id}/exists`);
          if (invResponse.ok) {
            const existsData = await invResponse.json();
            if (existsData.exists) {
              const invDataResponse = await fetch(`/api/investigation/${report.accident_id}`);
              if (invDataResponse.ok) {
                const invData = await invDataResponse.json();
                const investigationData = invData.data || invData;
                victims = investigationData.investigation_victims || investigationData.victims || [];
              }
            }
          }
        } catch (e) {
          console.log(`[LTIR] 조사보고서 확인 실패: ${report.accident_id}`);
        }

        // 조사보고서에 재해자 정보가 없으면 발생보고서에서 확인
        if (victims.length === 0) {
          if (report.victims && Array.isArray(report.victims)) {
            victims = report.victims;
          } else if (report.victims_json) {
            try {
              const arr = JSON.parse(report.victims_json);
              if (Array.isArray(arr)) victims = arr;
            } catch (e) {}
          }
        }

        // 중상, 사망, 기타 상해정도가 있는지 확인
        victims.forEach((victim: any) => {
          let injuryType = victim.injury_type || '';
          injuryType = injuryType.replace(/\([^)]*\)/g, '').trim();
          if (['중상', '사망', '기타'].includes(injuryType)) {
            hasSevereInjury = true;
          }
        });

        if (hasSevereInjury) {
          totalSevereAccidents++;
          if (report.is_contractor) {
            contractorSevereAccidents++;
          } else {
            employeeSevereAccidents++;
          }
        }
      }

      console.log(`[LTIR] 기준이상 사고 건수 - 전체: ${totalSevereAccidents}, 임직원: ${employeeSevereAccidents}, 협력업체: ${contractorSevereAccidents}`);
      
      return {
        total: totalSevereAccidents,
        employee: employeeSevereAccidents,
        contractor: contractorSevereAccidents
      };
    } catch (error) {
      console.error('[LTIR] 기준이상 사고 건수 계산 오류:', error);
      return { total: 0, employee: 0, contractor: 0 };
    }
  };

  // TRIR용 기준이상 사고 건수 계산 (중상, 사망, 기타, 경상, 병원치료)
  const calculateTRIRAccidentCounts = async (year: number) => {
    try {
      const response = await fetch(`/api/occurrence/all?year=${year}`);
      if (!response.ok) throw new Error('사고 목록 조회 실패');
      const data = await response.json();
      const reports = data.reports || [];

      // 인적 또는 복합 사고만 필터링
      const humanAccidents = reports.filter((r: any) =>
        r.accident_type_level1 === '인적' || r.accident_type_level1 === '복합'
      );

      console.log(`[TRIR] 전체 사고: ${reports.length}건, 인적/복합 사고: ${humanAccidents.length}건`);

      let totalSevereAccidents = 0;
      let employeeSevereAccidents = 0;
      let contractorSevereAccidents = 0;

      for (const report of humanAccidents) {
        let hasSevereInjury = false;
        
        // 재해자 정보 확인 (조사보고서 우선, 없으면 발생보고서)
        let victims: any[] = [];
        
        // 조사보고서 확인
        try {
          const invResponse = await fetch(`/api/investigation/${report.accident_id}/exists`);
          if (invResponse.ok) {
            const existsData = await invResponse.json();
            if (existsData.exists) {
              const invDataResponse = await fetch(`/api/investigation/${report.accident_id}`);
              if (invDataResponse.ok) {
                const invData = await invDataResponse.json();
                const investigationData = invData.data || invData;
                victims = investigationData.investigation_victims || investigationData.victims || [];
              }
            }
          }
        } catch (e) {
          console.log(`[TRIR] 조사보고서 확인 실패: ${report.accident_id}`);
        }

        // 조사보고서에 재해자 정보가 없으면 발생보고서에서 확인
        if (victims.length === 0) {
          if (report.victims && Array.isArray(report.victims)) {
            victims = report.victims;
          } else if (report.victims_json) {
            try {
              const arr = JSON.parse(report.victims_json);
              if (Array.isArray(arr)) victims = arr;
            } catch (e) {}
          }
        }

        // 중상, 사망, 기타, 경상, 병원치료 상해정도가 있는지 확인
        victims.forEach((victim: any) => {
          let injuryType = victim.injury_type || '';
          injuryType = injuryType.replace(/\([^)]*\)/g, '').trim();
          if (['중상', '사망', '기타', '경상', '병원치료'].includes(injuryType)) {
            hasSevereInjury = true;
          }
        });

        if (hasSevereInjury) {
          totalSevereAccidents++;
          if (report.is_contractor) {
            contractorSevereAccidents++;
          } else {
            employeeSevereAccidents++;
          }
        }
      }

      console.log(`[TRIR] 기준이상 사고 건수 - 전체: ${totalSevereAccidents}, 임직원: ${employeeSevereAccidents}, 협력업체: ${contractorSevereAccidents}`);
      
      return {
        total: totalSevereAccidents,
        employee: employeeSevereAccidents,
        contractor: contractorSevereAccidents
      };
    } catch (error) {
      console.error('[TRIR] 기준이상 사고 건수 계산 오류:', error);
      return { total: 0, employee: 0, contractor: 0 };
    }
  };

  // 연도별 사고 건수 조회 함수
  const fetchAccidentCountByYear = async (year: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // 백엔드 API 호출
      const response = await fetch(`/api/occurrence/all?year=${year}`);
      
      if (!response.ok) {
        throw new Error(`API 오류 (${response.status}): ${response.statusText}`);
      }
      
      const data = await response.json();
      const reports = data.reports || [];
      
      // 임직원과 협력업체 사고 건수 구분
      const employeeAccidents = reports.filter((r: any) => !r.is_contractor);
      const contractorAccidents = reports.filter((r: any) => r.is_contractor);
      
      // 사업장 정보 가져오기
      const siteCodeToName = await fetchSiteInfo();
      
      // 사업장별 사고 건수 집계
      const siteCounts: Record<string, number> = {};
      reports.forEach((report: any) => {
        // 사업장명 추출 (사업장사고코드에서 추출)
        let siteName = '기타';
        if (report.accident_id) {
          const parts = report.accident_id.split('-');
          if (parts.length >= 3) {
            // 사업장사고코드: [회사코드]-[사업장코드]-[연도]-[순번]
            const siteCode = parts[1];
            // 실제 사업장명으로 매핑
            siteName = siteCodeToName[siteCode] || `${siteCode}공장`;
          }
        }
        siteCounts[siteName] = (siteCounts[siteName] || 0) + 1;
      });
      
      setAccidentCount(reports.length);
      setEmployeeAccidentCount(employeeAccidents.length);
      setContractorAccidentCount(contractorAccidents.length);
      setSiteAccidentCounts(siteCounts);
    } catch (err: any) {
      console.error('연도별 사고 건수 조회 중 오류:', err);
      setError(err.message || '사고 건수를 불러오는 중 오류가 발생했습니다.');
      setAccidentCount(0);
      setEmployeeAccidentCount(0);
      setContractorAccidentCount(0);
      setSiteAccidentCounts({});
    } finally {
      setLoading(false);
    }
  };

  // 연도 옵션 로드 (최초 1회)
  useEffect(() => {
    const loadYearOptions = async () => {
      try {
        // 전체 사고발생보고서를 가져와서 연도 추출
        const response = await fetch('/api/occurrence?page=1&limit=10000');
        
        if (!response.ok) {
          throw new Error(`API 오류 (${response.status}): ${response.statusText}`);
        }
        
        const data = await response.json();
        const reports = data.reports || [];
        
        const years = extractYearsFromReports(reports);
        setYearOptions(years);
        
        // 기본 선택 연도를 가장 최신 연도로 설정
        if (years.length > 0) {
          setSelectedYear(years[0]);
        }
      } catch (err: any) {
        console.error('연도 옵션 로드 중 오류:', err);
        setError(err.message || '연도 목록을 불러오는 중 오류가 발생했습니다.');
      }
    };
    
    loadYearOptions();
  }, []);

  // 연도별 재해자 수 및 상해정도별 카운트 집계 함수
  const fetchVictimStatsByYear = async (year: number) => {
    setVictimLoading(true);
    setVictimCount(0);
    setInjuryTypeCounts({});
    try {
      // 1. 연도별 사고 목록 조회
      const response = await fetch(`/api/occurrence/all?year=${year}`);
      if (!response.ok) throw new Error('사고 목록 조회 실패');
      const data = await response.json();
      const reports = data.reports || [];

      // 2. 인적/복합 사고만 필터링
      const filtered = reports.filter((r: any) =>
        r.accident_type_level1 === '인적' || r.accident_type_level1 === '복합'
      );
      
      console.log(`[재해자 통계] 전체 사고: ${reports.length}건, 인적/복합 사고: ${filtered.length}건`);

      // 3. 각 사고별로 조사보고서 존재여부 확인 및 재해자 정보 집계
      let totalVictims = 0;
      let totalEmployees = 0;
      let totalContractors = 0;
      const injuryTypeMap: Record<string, number> = {};

      // 병렬 fetch를 위해 Promise.all 사용
      await Promise.all(filtered.map(async (report: any) => {
        // 조사보고서 존재여부 확인
        let hasInvestigation = false;
        try {
          const res = await fetch(`/api/investigation/${report.accident_id}/exists`);
          if (res.ok) {
            const existsData = await res.json();
            hasInvestigation = existsData.exists;
          }
        } catch (e) {
          // ignore
        }

        let victims: any[] = [];
        // 조사보고서가 있으면 조사보고서에서 재해자 정보 조회
        if (hasInvestigation) {
          try {
            const res = await fetch(`/api/investigation/${report.accident_id}`);
            if (res.ok) {
              const invData = await res.json();
              // 조사보고서 API는 { success: true, data: {...} } 구조로 반환
              const investigationData = invData.data || invData;
              // investigation_victims 또는 victims 필드 사용
              victims = investigationData.investigation_victims || investigationData.victims || [];
              console.log(`[재해자 통계] 조사보고서 ${report.accident_id}에서 재해자 정보:`, victims);
            }
          } catch (e) {
            console.error(`[재해자 통계] 조사보고서 ${report.accident_id} 조회 오류:`, e);
          }
        } else {
          // 없으면 발생보고서의 재해자 정보 사용 (백엔드에서 이미 포함되어 반환됨)
          if (report.victims && Array.isArray(report.victims)) {
            victims = report.victims;
          } else if (report.victims_json) {
            try {
              const arr = JSON.parse(report.victims_json);
              if (Array.isArray(arr)) victims = arr;
            } catch (e) {}
          }
        }
        // 재해자 수 합산 및 임직원/협력업체 구분
        totalVictims += victims.length;
        
        // 협력업체 여부에 따라 구분
        if (report.is_contractor) {
          totalContractors += victims.length;
        } else {
          totalEmployees += victims.length;
        }
        
        // 상해정도별 카운트 집계 (괄호 제거)
        victims.forEach((v) => {
          let type = v.injury_type || '정보없음';
          // 괄호와 그 안의 내용 제거 (예: "경상(1일 이상 휴업)" → "경상")
          type = type.replace(/\([^)]*\)/g, '').trim();
          injuryTypeMap[type] = (injuryTypeMap[type] || 0) + 1;
        });
        
        console.log(`[재해자 통계] 사고 ${report.accident_id}: 재해자 ${victims.length}명, 조사보고서: ${hasInvestigation ? '있음' : '없음'}`);
      }));
      console.log(`[재해자 통계] 최종 결과: 총 재해자 ${totalVictims}명 (임직원 ${totalEmployees}명, 협력업체 ${totalContractors}명), 상해정도별:`, injuryTypeMap);
      setVictimCount(totalVictims);
      setEmployeeCount(totalEmployees);
      setContractorCount(totalContractors);
      setInjuryTypeCounts(injuryTypeMap);
    } catch (err) {
      setVictimCount(0);
      setEmployeeCount(0);
      setContractorCount(0);
      setInjuryTypeCounts({});
    } finally {
      setVictimLoading(false);
    }
  };

  // LTIR 계산 함수
  const calculateLTIR = async (year: number) => {
    setLtirLoading(true);
    setLtir(0);
    setEmployeeLtir(0);
    setContractorLtir(0);
    
    try {
      // 연간 근로시간과 기준이상 사고 건수를 병렬로 가져오기
      const [workingHours, accidentCounts] = await Promise.all([
        fetchAnnualWorkingHours(year),
        calculateLTIRAccidentCounts(year)
      ]);

      console.log('[LTIR] 근로시간:', workingHours);
      console.log('[LTIR] 사고 건수:', accidentCounts);

      // LTIR 계산
      const calculateSingleLTIR = (accidentCount: number, workingHours: number) => {
        if (workingHours === 0) return 0;
        return (accidentCount / workingHours) * ltirBase;
      };

      const totalLtir = calculateSingleLTIR(accidentCounts.total, workingHours.total);
      const employeeLtirValue = calculateSingleLTIR(accidentCounts.employee, workingHours.employee);
      const contractorLtirValue = calculateSingleLTIR(accidentCounts.contractor, workingHours.contractor);

      console.log(`[LTIR] 계산 결과 - 전체: ${totalLtir.toFixed(2)}, 임직원: ${employeeLtirValue.toFixed(2)}, 협력업체: ${contractorLtirValue.toFixed(2)}`);

      setLtir(totalLtir);
      setEmployeeLtir(employeeLtirValue);
      setContractorLtir(contractorLtirValue);
    } catch (error) {
      console.error('[LTIR] 계산 오류:', error);
      setLtir(0);
      setEmployeeLtir(0);
      setContractorLtir(0);
    } finally {
      setLtirLoading(false);
    }
  };

  // TRIR 계산 함수 (LTIR과 동일하지만 기준이상 사고 건수에 경상, 병원치료 포함)
  const calculateTRIR = async (year: number) => {
    setTrirLoading(true);
    setTrir(0);
    setEmployeeTrir(0);
    setContractorTrir(0);
    
    try {
      // 연간 근로시간과 기준이상 사고 건수를 병렬로 가져오기
      const [workingHours, accidentCounts] = await Promise.all([
        fetchAnnualWorkingHours(year),
        calculateTRIRAccidentCounts(year)
      ]);

      console.log('[TRIR] 근로시간:', workingHours);
      console.log('[TRIR] 사고 건수:', accidentCounts);

      const calculateSingleTRIR = (accidentCount: number, workingHours: number) => {
        if (workingHours === 0) return 0;
        return (accidentCount / workingHours) * ltirBase;
      };

      const totalTrir = calculateSingleTRIR(accidentCounts.total, workingHours.total);
      const employeeTrirValue = calculateSingleTRIR(accidentCounts.employee, workingHours.employee);
      const contractorTrirValue = calculateSingleTRIR(accidentCounts.contractor, workingHours.contractor);

      console.log(`[TRIR] 계산 결과 - 전체: ${totalTrir.toFixed(2)}, 임직원: ${employeeTrirValue.toFixed(2)}, 협력업체: ${contractorTrirValue.toFixed(2)}, 기준: ${ltirBase}`);

      setTrir(totalTrir);
      setEmployeeTrir(employeeTrirValue);
      setContractorTrir(contractorTrirValue);
    } catch (error) {
      console.error('[TRIR] 계산 오류:', error);
      setTrir(0);
      setEmployeeTrir(0);
      setContractorTrir(0);
    } finally {
      setTrirLoading(false);
    }
  };

  // 물적피해금액 조회 함수
  const fetchPropertyDamageByYear = async (year: number) => {
    setPropertyDamageLoading(true);
    setDirectDamageAmount(0);
    setIndirectDamageAmount(0);
    try {
      const response = await fetch(`/api/occurrence/all?year=${year}`);
      if (!response.ok) throw new Error('사고 목록 조회 실패');
      const data = await response.json();
      const reports = data.reports || [];

      // 물적 또는 복합 사고만 필터링
      const propertyAccidents = reports.filter((r: any) =>
        r.accident_type_level1 === '물적' || r.accident_type_level1 === '복합'
      );
      
      console.log(`[물적피해] 전체 사고: ${reports.length}건, 물적/복합 사고: ${propertyAccidents.length}건`);

      // 사고피해금액 합산 (property_damage 테이블의 estimated_cost 사용)
      let totalDamageAmount = 0;
      for (const report of propertyAccidents) {
        console.log(`[물적피해] 사고 ${report.accident_id}: property_damages =`, report.property_damages);
        if (report.property_damages && Array.isArray(report.property_damages)) {
          report.property_damages.forEach((damage: any) => {
            console.log(`[물적피해] 피해 정보:`, damage);
            if (damage.estimated_cost && !isNaN(damage.estimated_cost)) {
              totalDamageAmount += Number(damage.estimated_cost);
              console.log(`[물적피해] 피해금액 추가: ${damage.estimated_cost}천원`);
            }
          });
        }
      }

      // 간접피해금액 계산 (직접피해금액 × 4)
      const indirectAmount = totalDamageAmount * 4;

      console.log(`[물적피해] 직접피해금액: ${totalDamageAmount}천원, 간접피해금액: ${indirectAmount}천원`);
      
      setDirectDamageAmount(totalDamageAmount);
      setIndirectDamageAmount(indirectAmount);
    } catch (err) {
      console.error('물적피해금액 조회 중 오류:', err);
      setDirectDamageAmount(0);
      setIndirectDamageAmount(0);
    } finally {
      setPropertyDamageLoading(false);
    }
  };

  // 선택된 연도 변경 시 사고 건수 조회
  useEffect(() => {
    if (selectedYear) {
      fetchAccidentCountByYear(selectedYear);
    }
  }, [selectedYear]);

  // 선택된 연도 변경 시 재해자 통계도 조회
  useEffect(() => {
    if (selectedYear) {
      fetchVictimStatsByYear(selectedYear);
    }
  }, [selectedYear]);

  // 선택된 연도 변경 시 물적피해금액도 조회
  useEffect(() => {
    if (selectedYear) {
      fetchPropertyDamageByYear(selectedYear);
    }
  }, [selectedYear]);

  // 선택된 연도 변경 시 LTIR 계산
  useEffect(() => {
    if (selectedYear) {
      calculateLTIR(selectedYear);
    }
  }, [selectedYear, ltirBase]);

  // 선택된 연도 변경 시 TRIR 계산
  useEffect(() => {
    if (selectedYear) {
      calculateTRIR(selectedYear);
    }
  }, [selectedYear, ltirBase]);

  // 연도 변경 핸들러
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  return (
    <div className="max-w-7xl mx-auto bg-white rounded-lg shadow p-8 mt-8">
      <h1 className="text-2xl font-bold mb-6">사고지표 (Lagging Indicator)</h1>
      <p className="text-gray-700 mb-6">
        사고지표(Lagging Indicator)는 과거에 발생한 사고, 재해, 손실 등의 결과를 측정하는 지표입니다.<br />
        본 페이지에서는 최근 사고 건수, 유형별 통계, 발생 추이 등 다양한 사고지표를 시각화합니다.
      </p>

      {/* 연도 선택 드롭다운 */}
      <YearSelector 
        selectedYear={selectedYear}
        onYearChange={handleYearChange}
        yearOptions={yearOptions}
      />

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* 지표 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* 사고 건수 지표 카드 */}
        <AccidentCountCard 
          count={accidentCount}
          employeeAccidentCount={employeeAccidentCount}
          contractorAccidentCount={contractorAccidentCount}
          siteAccidentCounts={siteAccidentCounts}
          loading={loading} 
        />
        {/* 재해자 수 및 상해정도별 카운트 카드 */}
        <VictimCountCard
          count={victimCount}
          employeeCount={employeeCount}
          contractorCount={contractorCount}
          injuryTypeCounts={injuryTypeCounts}
          loading={victimLoading}
        />
        {/* 물적피해금액 카드 */}
        <PropertyDamageCard
          directDamageAmount={directDamageAmount}
          indirectDamageAmount={indirectDamageAmount}
          loading={propertyDamageLoading}
        />
        {/* LTIR 카드 */}
        <LTIRCard
          ltir={ltir}
          employeeLtir={employeeLtir}
          contractorLtir={contractorLtir}
          ltirBase={ltirBase}
          setLtirBase={setLtirBase}
          loading={ltirLoading}
        />
        {/* TRIR 카드 */}
        <TRIRCard
          trir={trir}
          employeeTrir={employeeTrir}
          contractorTrir={contractorTrir}
          trirBase={ltirBase}
          setTrirBase={setLtirBase}
          loading={trirLoading}
        />
        {/* 향후 추가될 지표들을 위한 플레이스홀더 */}
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6 flex items-center justify-center">
          <p className="text-gray-500 text-sm">추가 지표 예정</p>
        </div>
      </div>

      {/* 개발 중 안내 */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-blue-700 text-sm">
          💡 <strong>개발 진행 상황:</strong> 현재 사고 건수, 재해자 수/상해정도별 지표가 구현되었습니다. 
          향후 7-8개의 추가 지표가 순차적으로 개발될 예정입니다.
        </p>
      </div>
    </div>
  );
} 