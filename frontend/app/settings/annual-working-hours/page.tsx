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
// - 1980~2040 범위 내에서 사용자가 원하는 연도 구간만 조회/관리
// - 연도 구간 설정에 따라 드롭다운에 표시할 연도 제한, 선택한 연도의 데이터만 테이블에 표시
const AnnualWorkingHoursPage = () => {
  // 회사/사업장 목록 상태
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 연도 선택 상태 (기본값: 올해)
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);

  // 회사 선택 상태 (기본값: 첫 번째 회사)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // 연간 근로시간 데이터 상태 (company_id+site_id+year별로 매핑)
  const [workingHoursMap, setWorkingHoursMap] = useState<Record<string, AnnualWorkingHours>>({});
  const [hoursLoading, setHoursLoading] = useState(false);
  const [hoursError, setHoursError] = useState<string | null>(null);

  // 입력값 상태 (company_id+site_id로 구분)
  const [inputValues, setInputValues] = useState<Record<string, { employee: number | undefined; partnerOn: number | undefined; partnerOff: number | undefined }>>({});

  // 저장 중 상태 (company_id+site_id로 구분)
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  // 전체 저장 중 상태
  const [bulkSaving, setBulkSaving] = useState(false);

  // 마감 상태 (연도+회사 단위, true: 마감)
  const [closedMap, setClosedMap] = useState<Record<string, boolean>>({});
  const [closing, setClosing] = useState(false);

  // 연도 구간 상태 (기본값: 2010~2025, 범위 1980~2040) - 조회 가능한 연도 범위 설정
  const MIN_YEAR = 1980; // 최소 연도 (1980년)
  const MAX_YEAR = 2040; // 최대 연도 (2040년)
  const [rangeStart, setRangeStart] = useState<number>(2010); // 구간 시작 연도
  const [rangeEnd, setRangeEnd] = useState<number>(2025); // 구간 끝 연도
  const [tempRangeStart, setTempRangeStart] = useState<number>(2010); // 임시 시작 연도
  const [tempRangeEnd, setTempRangeEnd] = useState<number>(2025); // 임시 끝 연도
  const [tempRangeStartStr, setTempRangeStartStr] = useState<string>('2010'); // 임시 시작 연도 문자열
  const [tempRangeEndStr, setTempRangeEndStr] = useState<string>('2025'); // 임시 끝 연도 문자열

  // 회사/사업장 목록 불러오기
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCompanies();
        setCompanies(data);
        // 회사 목록을 불러온 후, 기본 선택값을 첫 번째 회사로 설정
        if (data.length > 0 && !selectedCompanyId) {
          setSelectedCompanyId(data[0].id!);
        }
      } catch (err: any) {
        setError(err.message || '회사/사업장 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 연간 근로시간 데이터 불러오기 (연도/회사별)
  useEffect(() => {
    if (!selectedCompanyId) return;
    const fetchWorkingHours = async () => {
      setHoursLoading(true);
      setHoursError(null);
      try {
        // 선택된 회사의 근로시간 데이터만 조회
        const list = await getAnnualWorkingHoursList(selectedCompanyId, year);
        // 매핑: key = company_id|site_id|year
        const map: Record<string, AnnualWorkingHours> = {};
        const closed: Record<string, boolean> = {};
        list.forEach(item => {
          const key = `${item.company_id}|${item.site_id || ''}|${item.year}`;
          map[key] = item;
          if (!item.site_id) {
            closed[`${item.company_id}|${item.year}`] = !!item.is_closed;
          }
        });
        // 회사 단위 데이터가 없는 경우 마감 상태를 false로 설정
        closed[`${selectedCompanyId}|${year}`] = closed[`${selectedCompanyId}|${year}`] || false;
        setWorkingHoursMap(map);
        setClosedMap(closed);
        // 입력값 상태도 동기화
        const inputMap: Record<string, { employee: number | undefined; partnerOn: number | undefined; partnerOff: number | undefined }> = {};
        list.forEach(item => {
          const key = `${item.company_id}|${item.site_id || ''}`;
          inputMap[key] = {
            employee: item.employee_hours === 0 ? undefined : item.employee_hours,
            partnerOn: item.partner_on_hours === 0 ? undefined : item.partner_on_hours,
            partnerOff: item.partner_off_hours === 0 ? undefined : item.partner_off_hours,
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
  }, [selectedCompanyId, year]);

  // 연도 선택 핸들러
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setYear(Number(e.target.value));
  };

  // 회사 선택 핸들러
  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCompanyId(e.target.value);
  };

  // 입력값 변경 핸들러
  const handleInputChange = (key: string, field: 'employee' | 'partnerOn' | 'partnerOff', value: string) => {
    // 빈 문자열이나 NaN인 경우 undefined로 처리
    const numValue = value === '' ? undefined : Number(value);
    if (numValue !== undefined && isNaN(numValue)) return; // NaN인 경우 무시
    
    setInputValues(prev => ({
      ...prev,
      [key]: {
        ...prev[key] || { employee: undefined, partnerOn: undefined, partnerOff: undefined },
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

  // 마감 버튼 클릭 핸들러
  const handleClose = async (company_id: string) => {
    if (!confirm('정말로 마감하시겠습니까? 마감 후에는 수정이 불가능합니다.')) return;
    setClosing(true);
    try {
      await closeAnnualWorkingHours(company_id, null, year);
      setClosedMap(prev => ({ ...prev, [`${company_id}|${year}`]: true }));
      alert('마감되었습니다.');
    } catch (err: any) {
      alert('마감 실패: ' + (err.message || '알 수 없는 오류'));
    } finally {
      setClosing(false);
    }
  };

  // 마감 취소 버튼 클릭 핸들러
  const handleOpen = async (company_id: string) => {
    if (!confirm('마감을 취소하시겠습니까?')) return;
    setClosing(true);
    try {
      await openAnnualWorkingHours(company_id, null, year);
      setClosedMap(prev => ({ ...prev, [`${company_id}|${year}`]: false }));
      alert('마감이 취소되었습니다.');
    } catch (err: any) {
      alert('마감 취소 실패: ' + (err.message || '알 수 없는 오류'));
    } finally {
      setClosing(false);
    }
  };

  // 연도 구간 설정 변경 핸들러 (조회 가능한 연도 범위 설정)
  const handleRangeChange = () => {
    // 연도 구간이 변경되면 현재 선택된 연도가 새로운 구간에 포함되는지 확인
    if (year < rangeStart || year > rangeEnd) {
      // 현재 선택된 연도가 새로운 구간에 포함되지 않으면 구간의 첫 번째 연도로 설정
      setYear(rangeStart);
    }
  };

  // 연도 구간 조회 버튼 클릭 핸들러
  const handleApplyRange = () => {
    // 유효성 검사
    if (tempRangeStart < MIN_YEAR || tempRangeStart > MAX_YEAR) {
      alert(`시작 연도는 ${MIN_YEAR}년에서 ${MAX_YEAR}년 사이여야 합니다.`);
      return;
    }
    if (tempRangeEnd < MIN_YEAR || tempRangeEnd > MAX_YEAR) {
      alert(`끝 연도는 ${MIN_YEAR}년에서 ${MAX_YEAR}년 사이여야 합니다.`);
      return;
    }
    if (tempRangeStart > tempRangeEnd) {
      alert('시작 연도는 끝 연도보다 작아야 합니다.');
      return;
    }

    // 구간 설정 적용
    setRangeStart(tempRangeStart);
    setRangeEnd(tempRangeEnd);
    handleRangeChange();
    
    // 문자열 상태도 동기화
    setTempRangeStartStr(tempRangeStart.toString());
    setTempRangeEndStr(tempRangeEnd.toString());
    
    // 성공 메시지
    alert(`연도 구간이 ${tempRangeStart}년 ~ ${tempRangeEnd}년으로 설정되었습니다.`);
  };

  // 연도 구간 내의 연도 목록 생성 (드롭다운에 표시할 연도들)
  const yearOptions = [];
  for (let y = rangeEnd; y >= rangeStart; y--) {
    yearOptions.push(y);
  }

  // 선택된 회사 정보
  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  return (
    <div className="p-6">
      {/* 상단: 연도/회사/구간 선택 */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* 연도 선택 드롭다운 - 설정된 구간 내의 연도만 표시 */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">연도:</label>
          <select className="border rounded px-3 py-2 bg-white" value={year} onChange={handleYearChange}>
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
        </div>
        
        {/* 회사 선택 드롭다운 */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">회사:</label>
          <select className="border rounded px-3 py-2 bg-white" value={selectedCompanyId || ''} onChange={handleCompanyChange}>
            {companies.map(company => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>
        </div>
        
        {/* 연도 구간 설정 UI - 조회 가능한 연도 범위 설정 */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">조회 연도 구간:</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              className="border rounded px-2 py-2 w-20 text-center bg-white"
              value={tempRangeStartStr}
              min={MIN_YEAR}
              max={MAX_YEAR}
              onChange={e => {
                const inputValue = e.target.value;
                setTempRangeStartStr(inputValue);
                
                // 빈 문자열이면 기본값으로 설정
                if (inputValue === '') {
                  setTempRangeStart(MIN_YEAR);
                  return;
                }
                
                // 숫자 변환 및 범위 체크
                const numValue = Number(inputValue);
                if (!isNaN(numValue) && numValue >= MIN_YEAR && numValue <= MAX_YEAR) {
                  setTempRangeStart(numValue);
                }
              }}
              placeholder="시작년도"
            />
            <span className="text-gray-500">~</span>
            <input
              type="number"
              className="border rounded px-2 py-2 w-20 text-center bg-white"
              value={tempRangeEndStr}
              min={MIN_YEAR}
              max={MAX_YEAR}
              onChange={e => {
                const inputValue = e.target.value;
                setTempRangeEndStr(inputValue);
                
                // 빈 문자열이면 기본값으로 설정
                if (inputValue === '') {
                  setTempRangeEnd(MAX_YEAR);
                  return;
                }
                
                // 숫자 변환 및 범위 체크
                const numValue = Number(inputValue);
                if (!isNaN(numValue) && numValue >= MIN_YEAR && numValue <= MAX_YEAR) {
                  setTempRangeEnd(numValue);
                }
              }}
              placeholder="끝년도"
            />
            <button
              className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 ml-2"
              onClick={handleApplyRange}
            >
              조회
            </button>
          </div>
          <span className="text-xs text-gray-500 ml-2">
            (범위: {MIN_YEAR}~{MAX_YEAR}년)
          </span>
        </div>
      </div>
      {/* 근로시간 입력 그리드 테이블 - 선택된 연도만 표시 */}
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
          {/* 선택된 연도만 표시 */}
          {selectedCompany && (
            <React.Fragment key={year}>
              {/* 연도별 회사명 행 + 마감상태 */}
                <tr className="bg-blue-50">
                <td className="font-bold text-left" colSpan={5}>{selectedCompany.name} <span className="text-xs text-gray-400">(코드: {selectedCompany.code})</span> <span className="ml-2 text-xs text-blue-500">{year}년</span></td>
                  <td colSpan={2} className="text-right pr-2">
                  {closedMap[`${selectedCompany.id}|${year}`] ? (
                    <span className="text-red-500 font-bold mr-2">🔒 [마감됨]</span>
                    ) : (
                    <span className="text-green-600 font-bold mr-2">📝 [입력가능]</span>
                    )}
                    <button
                    className={`px-2 py-1 rounded text-white ${closedMap[`${selectedCompany.id}|${year}`] ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'} mr-1`}
                    onClick={() => closedMap[`${selectedCompany.id}|${year}`] ? handleOpen(selectedCompany.id!) : handleClose(selectedCompany.id!)}
                      disabled={closing}
                    >
                    {closedMap[`${selectedCompany.id}|${year}`] ? '🔓 마감취소' : '🔒 마감'}
                    </button>
                  </td>
                </tr>
              {/* 연도별 전사 입력 행 */}
              <tr>
                <td className="pl-6">전사</td>
                <td>
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-24"
                    value={inputValues[`${selectedCompany.id}|`] === undefined || inputValues[`${selectedCompany.id}|`]?.employee === undefined ? '' : inputValues[`${selectedCompany.id}|`]?.employee}
                    onChange={e => handleInputChange(`${selectedCompany.id}|`, 'employee', e.target.value)}
                    min={0}
                    max={99999999}
                    step={1}
                    disabled={closedMap[`${selectedCompany.id}|${year}`]}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-24"
                    value={inputValues[`${selectedCompany.id}|`] === undefined || inputValues[`${selectedCompany.id}|`]?.partnerOn === undefined ? '' : inputValues[`${selectedCompany.id}|`]?.partnerOn}
                    onChange={e => handleInputChange(`${selectedCompany.id}|`, 'partnerOn', e.target.value)}
                    min={0}
                    max={99999999}
                    step={1}
                    disabled={closedMap[`${selectedCompany.id}|${year}`]}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-24"
                    value={inputValues[`${selectedCompany.id}|`] === undefined || inputValues[`${selectedCompany.id}|`]?.partnerOff === undefined ? '' : inputValues[`${selectedCompany.id}|`]?.partnerOff}
                    onChange={e => handleInputChange(`${selectedCompany.id}|`, 'partnerOff', e.target.value)}
                    min={0}
                    max={99999999}
                    step={1}
                    disabled={closedMap[`${selectedCompany.id}|${year}`]}
                  />
                </td>
                <td className="font-bold">{(() => {
                  const input = inputValues[`${selectedCompany.id}|`] || { employee: undefined, partnerOn: undefined, partnerOff: undefined };
                  return (input.employee || 0) + (input.partnerOn || 0) + (input.partnerOff || 0);
                })()}</td>
                <td>
                  <button
                    className={`bg-blue-500 text-white px-3 py-1 rounded ${closedMap[`${selectedCompany.id}|${year}`] ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => handleSave(selectedCompany.id!, '', `${selectedCompany.id}|`)}
                    disabled={closedMap[`${selectedCompany.id}|${year}`]}
                  >
                    저장
                  </button>
                </td>
                <td></td>
                  </tr>
              {/* 연도별 사업장 입력 행 */}
              {selectedCompany.sites && selectedCompany.sites.map(site => (
                    <tr key={site.id}>
                      <td className="pl-6">{site.name}</td>
                      <td>
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-24"
                      value={inputValues[`${selectedCompany.id}|${site.id}`] === undefined || inputValues[`${selectedCompany.id}|${site.id}`]?.employee === undefined ? '' : inputValues[`${selectedCompany.id}|${site.id}`]?.employee}
                      onChange={e => handleInputChange(`${selectedCompany.id}|${site.id}`, 'employee', e.target.value)}
                          min={0}
                      max={99999999}
                      step={1}
                      disabled={closedMap[`${selectedCompany.id}|${year}`]}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-24"
                      value={inputValues[`${selectedCompany.id}|${site.id}`] === undefined || inputValues[`${selectedCompany.id}|${site.id}`]?.partnerOn === undefined ? '' : inputValues[`${selectedCompany.id}|${site.id}`]?.partnerOn}
                      onChange={e => handleInputChange(`${selectedCompany.id}|${site.id}`, 'partnerOn', e.target.value)}
                          min={0}
                      max={99999999}
                      step={1}
                      disabled={closedMap[`${selectedCompany.id}|${year}`]}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-24"
                      value={inputValues[`${selectedCompany.id}|${site.id}`] === undefined || inputValues[`${selectedCompany.id}|${site.id}`]?.partnerOff === undefined ? '' : inputValues[`${selectedCompany.id}|${site.id}`]?.partnerOff}
                      onChange={e => handleInputChange(`${selectedCompany.id}|${site.id}`, 'partnerOff', e.target.value)}
                          min={0}
                      max={99999999}
                      step={1}
                      disabled={closedMap[`${selectedCompany.id}|${year}`]}
                        />
                      </td>
                  <td className="font-bold">{(() => {
                    const input = inputValues[`${selectedCompany.id}|${site.id}`] || { employee: undefined, partnerOn: undefined, partnerOff: undefined };
                    return (input.employee || 0) + (input.partnerOn || 0) + (input.partnerOff || 0);
                  })()}</td>
                      <td>
                        <button
                      className={`bg-blue-500 text-white px-3 py-1 rounded ${closedMap[`${selectedCompany.id}|${year}`] ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => handleSave(selectedCompany.id!, site.id, `${selectedCompany.id}|${site.id}`)}
                      disabled={closedMap[`${selectedCompany.id}|${year}`]}
                    >
                      저장
                        </button>
                      </td>
                      <td></td>
                    </tr>
              ))}
              </React.Fragment>
          )}
        </tbody>
      </table>
      {/* 전체 저장 버튼 */}
      <div className="mt-6 text-right">
        <button
          className={`bg-blue-600 text-white px-6 py-2 rounded ${bulkSaving || (selectedCompany && closedMap[`${selectedCompany.id}|${year}`]) ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleBulkSave}
          disabled={bulkSaving || (selectedCompany && closedMap[`${selectedCompany.id}|${year}`])}
        >
          {bulkSaving ? '전체 저장중...' : '전체 저장'}
        </button>
      </div>
      {/* 컴포넌트 상단에 스타일 추가 (스핀 버튼 제거) */}
      <style jsx global>{`
        /* Chrome, Safari, Edge, Opera */
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        /* Firefox */
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
};

export default AnnualWorkingHoursPage; 