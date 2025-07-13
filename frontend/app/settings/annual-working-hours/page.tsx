"use client";

import React, { useEffect, useState } from 'react';
import { getCompanies, Company, Site } from '@/services/company.service';
import {
  getAnnualWorkingHoursList,
  saveAnnualWorkingHours,
  closeAnnualWorkingHours,
  openAnnualWorkingHours,
  AnnualWorkingHours
} from '@/services/annual_working_hours.service';

// 연간 근로시간 관리 페이지
// - 연도 선택, 회사/사업장별 근로시간 입력 그리드, 저장/마감 기능 포함
const AnnualWorkingHoursPage = () => {
  // 회사/사업장 목록 상태
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 연도 선택 상태 (기본값: 올해)
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);

  // 연간 근로시간 데이터 상태 (company_id+site_id+year별로 매핑)
  const [workingHoursMap, setWorkingHoursMap] = useState<Record<string, AnnualWorkingHours>>({});
  const [hoursLoading, setHoursLoading] = useState(false);
  const [hoursError, setHoursError] = useState<string | null>(null);

  // 입력값 상태 (company_id+site_id로 구분)
  const [inputValues, setInputValues] = useState<Record<string, { employee: number; partnerOn: number; partnerOff: number }>>({});

  // 저장 중 상태 (company_id+site_id로 구분)
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  // 전체 저장 중 상태
  const [bulkSaving, setBulkSaving] = useState(false);

  // 마감 상태 (연도+회사 단위, true: 마감)
  const [closedMap, setClosedMap] = useState<Record<string, boolean>>({});
  const [closing, setClosing] = useState(false);

  // 회사/사업장 목록 불러오기
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCompanies();
        setCompanies(data);
      } catch (err: any) {
        setError(err.message || '회사/사업장 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  // 연간 근로시간 데이터 불러오기 (연도/회사별)
  useEffect(() => {
    if (companies.length === 0) return;
    const fetchWorkingHours = async () => {
      setHoursLoading(true);
      setHoursError(null);
      try {
        // 모든 회사의 근로시간 데이터 한 번에 조회
        let all: AnnualWorkingHours[] = [];
        for (const company of companies) {
          const list = await getAnnualWorkingHoursList(company.id!, year);
          all = all.concat(list);
        }
        // 매핑: key = company_id|site_id|year
        const map: Record<string, AnnualWorkingHours> = {};
        const closed: Record<string, boolean> = {};
        all.forEach(item => {
          const key = `${item.company_id}|${item.site_id || ''}|${item.year}`;
          map[key] = item;
          // 마감 상태는 회사 단위로만 관리 (site_id가 없는 데이터가 있으면 마감)
          if (!item.site_id) {
            closed[`${item.company_id}|${item.year}`] = !!item.is_closed;
          }
        });
        
        // 회사 단위 데이터가 없는 경우 마감 상태를 false로 설정
        companies.forEach(company => {
          const companyKey = `${company.id}|`;
          if (!(companyKey in closed)) {
            closed[companyKey] = false;
          }
        });
        setWorkingHoursMap(map);
        setClosedMap(closed);
        // 입력값 상태도 동기화
        const inputMap: Record<string, { employee: number; partnerOn: number; partnerOff: number }> = {};
        all.forEach(item => {
          const key = `${item.company_id}|${item.site_id || ''}`;
          inputMap[key] = {
            employee: item.employee_hours,
            partnerOn: item.partner_on_hours,
            partnerOff: item.partner_off_hours,
          };
        });
        setInputValues(inputMap);
      } catch (err: any) {
        setHoursError(err.message || '근로시간 데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setHoursLoading(false);
      }
    };
    fetchWorkingHours();
  }, [companies, year]);

  // 연도 선택 핸들러
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setYear(Number(e.target.value));
  };

  // 입력값 변경 핸들러
  const handleInputChange = (key: string, field: 'employee' | 'partnerOn' | 'partnerOff', value: string) => {
    // 빈 문자열이나 NaN인 경우 0으로 처리
    const numValue = value === '' ? 0 : Number(value);
    if (isNaN(numValue)) return; // NaN인 경우 무시
    
    setInputValues(prev => ({
      ...prev,
      [key]: {
        ...prev[key] || { employee: 0, partnerOn: 0, partnerOff: 0 },
        [field]: numValue,
      },
    }));
  };

  // 행별 저장 버튼 클릭 핸들러
  const handleSave = async (company_id: string, site_id: string, key: string) => {
    setSaving(prev => ({ ...prev, [key]: true }));
    try {
      const input = inputValues[key];
      if (!input) throw new Error('입력값이 없습니다.');
      // 유효성 검사 (음수 방지)
      if ((input.employee || 0) < 0 || (input.partnerOn || 0) < 0 || (input.partnerOff || 0) < 0) {
        alert('근로시간은 0 이상이어야 합니다.');
        return;
      }
      // site_id가 빈 문자열이면 null로 변환 (회사 단위 저장)
      const realSiteId = site_id === '' ? null : site_id;
      await saveAnnualWorkingHours({
        company_id,
        site_id: realSiteId,
        year,
        employee_hours: input.employee || 0,
        partner_on_hours: input.partnerOn || 0,
        partner_off_hours: input.partnerOff || 0,
        is_closed: false, // 저장 시 마감 아님
      });
      alert('저장되었습니다.');
      // 저장 후 데이터 재조회(동기화)
      const list = await getAnnualWorkingHoursList(company_id, year);
      const wh = list.find(item => (realSiteId ? item.site_id === realSiteId : !item.site_id));
      if (wh) {
        setWorkingHoursMap(prev => ({ ...prev, [`${company_id}|${realSiteId || ''}|${year}`]: wh }));
      }
    } catch (err: any) {
      alert('저장 실패: ' + (err.message || '알 수 없는 오류'));
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  // 전체 저장 버튼 클릭 핸들러
  const handleBulkSave = async () => {
    setBulkSaving(true);
    let successCount = 0;
    let failCount = 0;
    try {
      // 모든 회사 반복
      for (const company of companies) {
        // 1) 회사(본사/통합) 입력값 저장
        const companyKey = `${company.id}|`;
        const input = inputValues[companyKey];
        if (input) {
          if ((input.employee || 0) < 0 || (input.partnerOn || 0) < 0 || (input.partnerOff || 0) < 0) {
            failCount++;
          } else {
            try {
              await saveAnnualWorkingHours({
                company_id: company.id!,
                site_id: null,
                year,
                employee_hours: input.employee || 0,
                partner_on_hours: input.partnerOn || 0,
                partner_off_hours: input.partnerOff || 0,
                is_closed: false,
              });
              successCount++;
            } catch {
              failCount++;
            }
          }
        }
        // 2) 사업장별 입력값 저장
        if (company.sites) {
          for (const site of company.sites) {
            const key = `${company.id}|${site.id}`;
            const input = inputValues[key];
            if (!input) continue;
            if ((input.employee || 0) < 0 || (input.partnerOn || 0) < 0 || (input.partnerOff || 0) < 0) {
              failCount++;
              continue;
            }
            try {
              await saveAnnualWorkingHours({
                company_id: company.id!,
                site_id: site.id,
                year,
                employee_hours: input.employee || 0,
                partner_on_hours: input.partnerOn || 0,
                partner_off_hours: input.partnerOff || 0,
                is_closed: false,
              });
              successCount++;
            } catch {
              failCount++;
            }
          }
        }
      }
      alert(`전체 저장 완료\n성공: ${successCount}건, 실패: ${failCount}건`);
      // 저장 후 전체 데이터 재조회
      const whMap: Record<string, AnnualWorkingHours> = {};
      for (const company of companies) {
        const list = await getAnnualWorkingHoursList(company.id!, year);
        list.forEach(item => {
          const key = `${item.company_id}|${item.site_id || ''}|${item.year}`;
          whMap[key] = item;
        });
      }
      setWorkingHoursMap(whMap);
    } catch (err: any) {
      alert('전체 저장 실패: ' + (err.message || '알 수 없는 오류'));
    } finally {
      setBulkSaving(false);
    }
  };

  // 마감 버튼 클릭 핸들러 (회사별)
  const handleClose = async (company_id: string) => {
    setClosing(true);
    try {
      await closeAnnualWorkingHours(company_id, null, year);
      alert('마감 처리되었습니다.');
      // 마감 후 데이터 재조회
      const list = await getAnnualWorkingHoursList(company_id, year);
      const companyData = list.find(item => !item.site_id);
      const isClosed = companyData ? !!companyData.is_closed : true; // 마감 처리했으므로 true
      setClosedMap(prev => ({ ...prev, [`${company_id}|${year}`]: isClosed }));
    } catch (err: any) {
      alert('마감 실패: ' + (err.message || '알 수 없는 오류'));
    } finally {
      setClosing(false);
    }
  };

  // 마감취소 버튼 클릭 핸들러 (회사별)
  const handleOpen = async (company_id: string) => {
    setClosing(true);
    try {
      await openAnnualWorkingHours(company_id, null, year);
      alert('마감이 취소되었습니다.');
      // 마감취소 후 데이터 재조회
      const list = await getAnnualWorkingHoursList(company_id, year);
      const companyData = list.find(item => !item.site_id);
      const isClosed = companyData ? !!companyData.is_closed : false; // 마감취소 처리했으므로 false
      setClosedMap(prev => ({ ...prev, [`${company_id}|${year}`]: isClosed }));
    } catch (err: any) {
      alert('마감취소 실패: ' + (err.message || '알 수 없는 오류'));
    } finally {
      setClosing(false);
    }
  };

  // 연도 옵션 생성 (최근 5년)
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="p-6">
      {/* 상단: 연도 선택 */}
      <div className="flex items-center gap-4 mb-6">
        {/* 연도 선택 드롭다운 */}
        <select className="border rounded px-2 py-1" value={year} onChange={handleYearChange}>
          {yearOptions.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* 근로시간 입력 그리드 테이블 */}
      <table className="w-full border text-center">
        <thead>
          <tr className="bg-gray-100">
            <th>회사/사업장명</th>
            <th>임직원</th>
            <th>협력업체(상주)</th>
            <th>협력업체(비상주)</th>
            <th>종합</th>
            <th>저장</th>
            <th>마감</th>
          </tr>
        </thead>
        <tbody>
          {/* 로딩/에러 처리 */}
          {(loading || hoursLoading) && (
            <tr><td colSpan={7}>로딩 중...</td></tr>
          )}
          {(error || hoursError) && (
            <tr><td colSpan={7} className="text-red-500">{error || hoursError}</td></tr>
          )}
          {/* 회사별로 렌더링 */}
          {companies.map(company => {
            const isClosed = closedMap[`${company.id}|${year}`];
            // 회사(본사/통합) 입력값 및 저장 상태
            const companyKey = `${company.id}|`;
            const whKey = `${company.id}||${year}`;
            const wh = workingHoursMap[whKey];
            const input = inputValues[companyKey] || { employee: 0, partnerOn: 0, partnerOff: 0 };
            const total = (input.employee || 0) + (input.partnerOn || 0) + (input.partnerOff || 0);
            return (
              <React.Fragment key={company.id}>
                {/* 회사명 행 + 마감상태 */}
                <tr className="bg-blue-50">
                  <td className="font-bold text-left" colSpan={5}>{company.name} <span className="text-xs text-gray-400">(코드: {company.code})</span></td>
                  <td colSpan={2} className="text-right pr-2">
                    {isClosed ? (
                      <span className="text-red-500 font-bold mr-2">🔒 [마감됨]</span>
                    ) : (
                      <span className="text-green-600 font-bold mr-2">📝 [입력가능]</span>
                    )}
                    <button
                      className={`px-2 py-1 rounded text-white ${isClosed ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'} mr-1`}
                      onClick={() => isClosed ? handleOpen(company.id!) : handleClose(company.id!)}
                      disabled={closing}
                    >
                      {isClosed ? '🔓 마감취소' : '🔒 마감'}
                    </button>
                  </td>
                </tr>
                {/* 전사(회사 전체) 입력 행 */}
                <tr>
                  <td className="pl-6">전사</td>
                  <td>
                    <input
                      type="number"
                      className="border rounded px-2 py-1 w-24"
                      value={input.employee || 0}
                      onChange={e => handleInputChange(companyKey, 'employee', e.target.value)}
                      min={0}
                      disabled={isClosed}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="border rounded px-2 py-1 w-24"
                      value={input.partnerOn || 0}
                      onChange={e => handleInputChange(companyKey, 'partnerOn', e.target.value)}
                      min={0}
                      disabled={isClosed}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="border rounded px-2 py-1 w-24"
                      value={input.partnerOff || 0}
                      onChange={e => handleInputChange(companyKey, 'partnerOff', e.target.value)}
                      min={0}
                      disabled={isClosed}
                    />
                  </td>
                  <td className="font-bold">{total || 0}</td>
                  <td>
                    <button
                      className={`bg-blue-500 text-white px-3 py-1 rounded ${saving[companyKey] || isClosed ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => handleSave(company.id!, '', companyKey)}
                      disabled={saving[companyKey] || isClosed}
                    >
                      {saving[companyKey] ? '저장중...' : '저장'}
                    </button>
                  </td>
                  <td></td>
                </tr>
                {/* 사업장별 행 */}
                {company.sites && company.sites.map(site => {
                  const key = `${company.id}|${site.id}`;
                  const whKey = `${company.id}|${site.id}|${year}`;
                  const wh = workingHoursMap[whKey];
                  const input = inputValues[key] || { employee: 0, partnerOn: 0, partnerOff: 0 };
                  const total = (input.employee || 0) + (input.partnerOn || 0) + (input.partnerOff || 0);
                  return (
                    <tr key={site.id}>
                      <td className="pl-6">{site.name}</td>
                      <td>
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-24"
                          value={input.employee || 0}
                          onChange={e => handleInputChange(key, 'employee', e.target.value)}
                          min={0}
                          disabled={isClosed}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-24"
                          value={input.partnerOn || 0}
                          onChange={e => handleInputChange(key, 'partnerOn', e.target.value)}
                          min={0}
                          disabled={isClosed}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-24"
                          value={input.partnerOff || 0}
                          onChange={e => handleInputChange(key, 'partnerOff', e.target.value)}
                          min={0}
                          disabled={isClosed}
                        />
                      </td>
                      <td className="font-bold">{total || 0}</td>
                      <td>
                        <button
                          className={`bg-blue-500 text-white px-3 py-1 rounded ${saving[key] || isClosed ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => handleSave(company.id!, site.id, key)}
                          disabled={saving[key] || isClosed}
                        >
                          {saving[key] ? '저장중...' : '저장'}
                        </button>
                      </td>
                      <td></td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {/* 전체 저장 버튼 */}
      <div className="mt-6 text-right">
        <button
          className={`bg-blue-600 text-white px-6 py-2 rounded ${bulkSaving || Object.values(closedMap).some(v => v) ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleBulkSave}
          disabled={bulkSaving || Object.values(closedMap).some(v => v)}
        >
          {bulkSaving ? '전체 저장중...' : '전체 저장'}
        </button>
      </div>
    </div>
  );
};

export default AnnualWorkingHoursPage; 