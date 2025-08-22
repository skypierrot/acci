import React from 'react';

// AccidentCountCard Props Interface
interface AccidentCountCardProps {
  count: number;
  employeeAccidentCount: number;
  contractorAccidentCount: number;
  siteAccidentCounts: Record<string, number>;
  loading: boolean;
}

// PropertyDamageCard Props Interface
interface PropertyDamageCardProps {
  directDamageAmount: number;
  indirectDamageAmount: number;
  loading: boolean;
}

// VictimCountCard Props Interface
interface VictimCountCardProps {
  count: number;
  employeeCount: number;
  contractorCount: number;
  injuryTypeCounts: Record<string, number>;
  loading: boolean;
}

// LTIRCard Props Interface
interface LTIRCardProps {
  ltir: number;
  employeeLtir: number;
  contractorLtir: number;
  ltirBase: number;
  setLtirBase: (v: number) => void;
  loading: boolean;
}

// TRIRCard Props Interface
interface TRIRCardProps {
  trir: number;
  employeeTrir: number;
  contractorTrir: number;
  trirBase: number;
  setTrirBase: (v: number) => void;
  loading: boolean;
}

// SeverityRateCard Props Interface
interface SeverityRateCardProps {
  severityRate: number;
  employeeSeverityRate: number;
  contractorSeverityRate: number;
  totalLossDays: number;
  loading: boolean;
}

// 사고 건수 지표 카드 컴포넌트
export const AccidentCountCard: React.FC<AccidentCountCardProps> = ({ 
  count,
  employeeAccidentCount,
  contractorAccidentCount,
  siteAccidentCounts,
  loading 
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
export const PropertyDamageCard: React.FC<PropertyDamageCardProps> = ({
  directDamageAmount,
  indirectDamageAmount,
  loading
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
export const VictimCountCard: React.FC<VictimCountCardProps> = ({
  count,
  employeeCount,
  contractorCount,
  injuryTypeCounts,
  loading
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
export const LTIRCard: React.FC<LTIRCardProps> = ({
  ltir,
  employeeLtir,
  contractorLtir,
  ltirBase,
  setLtirBase,
  loading
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
export const TRIRCard: React.FC<TRIRCardProps> = ({
  trir,
  employeeTrir,
  contractorTrir,
  trirBase,
  setTrirBase,
  loading
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

// 강도율 카드 컴포넌트
export const SeverityRateCard: React.FC<SeverityRateCardProps> = ({
  severityRate,
  employeeSeverityRate,
  contractorSeverityRate,
  totalLossDays,
  loading
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">강도율</p>
          {loading ? (
            <div className="mt-2 h-8 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">{severityRate.toFixed(2)}</p>
                <p className="text-sm text-gray-600">(총 근로손실일 {totalLossDays}일)</p>
              </div>
            </div>
          )}
        </div>
        <div className="p-3 bg-green-100 rounded-full">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>
      
      {/* 임직원/협력업체 강도율 */}
      {!loading && (
        <div className="mt-3">
          <div className="flex gap-8">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">임직원 강도율</p>
              <span className="text-lg font-semibold text-gray-900">{employeeSeverityRate.toFixed(2)}</span>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">협력업체 강도율</p>
              <span className="text-lg font-semibold text-gray-900">{contractorSeverityRate.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};