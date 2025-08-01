import React from 'react';
import { InvestigationComponentProps, OriginalDataField } from '../../types/investigation.types';

interface AccidentContentSectionProps extends InvestigationComponentProps {
  onLoadOriginalData: (field: OriginalDataField) => void;
}

export const AccidentContentSection: React.FC<AccidentContentSectionProps> = ({
  report,
  editForm,
  editMode,
  onInputChange,
  onDateChange,
  onDateClick,
  onLoadOriginalData
}) => {
  return (
    <div className="report-section">
      <div className="report-section-header">
        <h3 className="report-section-title">2. 사고 내용</h3>
        <p className="report-section-subtitle">조사를 통해 확인된 사고 발생 정보</p>
      </div>
      <div className="report-section-content">
      
      <div className="space-y-6">
        {/* 사고명과 사고발생 일시를 같은 행에 배치 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 사고명 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">사고명</label>
              {editMode && (
                <button
                  type="button"
                  onClick={() => onLoadOriginalData('accident_name')}
                  className="btn btn-ghost btn-sm"
                >
                  발생보고서 정보 불러오기
                </button>
              )}
            </div>
            {editMode ? (
              <input
                type="text"
                name="investigation_accident_name"
                value={editForm.investigation_accident_name || ''}
                onChange={onInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="조사를 통해 수정된 사고명을 입력하세요"
              />
            ) : (
              <div className="bg-slate-50 rounded-md p-3 text-sm text-gray-900">
                {report.investigation_accident_name || report.original_accident_name || '-'}
              </div>
            )}
          </div>

          {/* 사고 발생 일시 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">사고 발생 일시</label>
              {editMode && (
                <button
                  type="button"
                  onClick={() => onLoadOriginalData('time')}
                  className="btn btn-ghost btn-sm"
                >
                  발생보고서 정보 불러오기
                </button>
              )}
            </div>
            {editMode ? (
              <input
                type="datetime-local"
                name="investigation_acci_time"
                value={editForm.investigation_acci_time ? new Date(editForm.investigation_acci_time).toISOString().slice(0, 16) : ''}
                onChange={onDateChange}
                onClick={onDateClick}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              />
            ) : (
              <div className="bg-slate-50 rounded-md p-3 text-sm text-gray-900">
                {report.investigation_acci_time 
                  ? new Date(report.investigation_acci_time).toLocaleString('ko-KR')
                  : '-'
                }
              </div>
            )}
          </div>
        </div>

        {/* 기상 정보 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-800">기상 정보</h4>
            {/* '원본 불러오기' 버튼 제거됨 */}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 날씨 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">날씨</label>
              {editMode ? (
                <div className="relative w-full">
                <select
                  name="investigation_weather"
                  value={editForm.investigation_weather || ''}
                  onChange={onInputChange}
                    className="appearance-none w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">선택하세요</option>
                  <option value="맑음">맑음</option>
                  <option value="흐림">흐림</option>
                  <option value="비">비</option>
                  <option value="눈">눈</option>
                  <option value="안개">안개</option>
                </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 12a1 1 0 01-.707-.293l-3-3a1 1 0 111.414-1.414L10 9.586l2.293-2.293a1 1 0 111.414 1.414l-3 3A1 1 0 0110 12z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="text-gray-900">{report.investigation_weather || '-'}</div>
              )}
            </div>
            
            {/* 온도 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">온도 (°C)</label>
              {editMode ? (
                <input
                  type="number"
                  name="investigation_temperature"
                  value={editForm.investigation_temperature || ''}
                  onChange={onInputChange}
                  step="0.1"
                  min="-50"
                  max="60"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="온도 입력"
                />
              ) : (
                <div className="text-gray-900">
                  {report.investigation_temperature !== undefined && report.investigation_temperature !== null
                    ? `${report.investigation_temperature}°C`
                    : '-'
                  }
                </div>
              )}
            </div>
            
            {/* 습도 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">습도 (%)</label>
              {editMode ? (
                <input
                  type="number"
                  name="investigation_humidity"
                  value={editForm.investigation_humidity || ''}
                  onChange={onInputChange}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="습도 입력"
                />
              ) : (
                <div className="text-gray-900">
                  {report.investigation_humidity !== undefined && report.investigation_humidity !== null
                    ? `${report.investigation_humidity}%`
                    : '-'
                  }
                </div>
              )}
            </div>
            
            {/* 바람 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">바람 (m/s)</label>
              {editMode ? (
                <input
                  type="number"
                  name="investigation_wind_speed"
                  value={editForm.investigation_wind_speed || ''}
                  onChange={onInputChange}
                  step="0.1"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="풍속 입력"
                />
              ) : (
                <div className="text-gray-900">
                  {report.investigation_wind_speed !== undefined && report.investigation_wind_speed !== null
                    ? `${report.investigation_wind_speed}m/s`
                    : '-'
                  }
                </div>
              )}
            </div>
            
            {/* 기타 (기상특보) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">기타 (기상특보)</label>
              {editMode ? (
                <input
                  type="text"
                  name="investigation_weather_special"
                  value={editForm.investigation_weather_special || ''}
                  onChange={onInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="태풍, 폭염, 한파, 대설 등 특보 사항"
                />
              ) : (
                <div className="text-gray-900">{report.investigation_weather_special || '-'}</div>
              )}
            </div>
          </div>
        </div>

        {/* 사고 발생 위치, 재해발생 형태, 사고 유형을 같은 행에 배치 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 사고 발생 위치 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">사고 발생 위치</label>
              {editMode && (
                <button
                  type="button"
                  onClick={() => onLoadOriginalData('location')}
                  className="btn btn-ghost btn-sm"
                >
                  발생보고서 정보 불러오기
                </button>
              )}
            </div>
            {editMode ? (
              <input
                type="text"
                name="investigation_acci_location"
                value={editForm.investigation_acci_location || ''}
                onChange={onInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="조사를 통해 수정된 사고 발생 위치를 입력하세요"
              />
            ) : (
              <div className="bg-slate-50 rounded-md p-3 text-sm text-gray-900">
                {report.investigation_acci_location || '-'}
              </div>
            )}
          </div>

          {/* 재해발생 형태 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">재해발생 형태</label>
              {editMode && (
                <button
                  type="button"
                  onClick={() => onLoadOriginalData('type1')}
                  className="btn btn-ghost btn-sm"
                >
                  발생보고서 정보 불러오기
                </button>
              )}
            </div>
            {editMode ? (
              <div className="relative w-full">
              <select
                name="investigation_accident_type_level1"
                value={editForm.investigation_accident_type_level1 || ''}
                onChange={onInputChange}
                  className="appearance-none w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">선택하세요</option>
                <option value="인적">인적 (인명 피해)</option>
                <option value="물적">물적 (재산 피해)</option>
                <option value="복합">복합 (인적+물적)</option>
              </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 12a1 1 0 01-.707-.293l-3-3a1 1 0 111.414-1.414L10 9.586l2.293-2.293a1 1 0 111.414 1.414l-3 3A1 1 0 0110 12z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-md p-3 text-sm text-gray-900">
                {report.investigation_accident_type_level1 || '-'}
              </div>
            )}
          </div>

          {/* 사고 유형 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">사고 유형</label>
              {editMode && (
                <button
                  type="button"
                  onClick={() => onLoadOriginalData('type2')}
                  className="btn btn-ghost btn-sm"
                >
                  발생보고서 정보 불러오기
                </button>
              )}
            </div>
            {editMode ? (
              <div className="relative w-full">
              <select
                name="investigation_accident_type_level2"
                value={editForm.investigation_accident_type_level2 || ''}
                onChange={onInputChange}
                  className="appearance-none w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">선택하세요</option>
                <option value="떨어짐">떨어짐</option>
                <option value="넘어짐">넘어짐</option>
                <option value="부딪힘">부딪힘</option>
                <option value="맞음">맞음</option>
                <option value="무너짐">무너짐</option>
                <option value="끼임">끼임</option>
                <option value="감전">감전</option>
                <option value="터짐">터짐</option>
                <option value="깨짐·부서짐">깨짐·부서짐</option>
                <option value="타거나데임">타거나 데임</option>
                <option value="무리한동작">무리한 동작</option>
                <option value="이상온도물체접촉">이상온도 물체와의 접촉</option>
                <option value="화학물질누출접촉">화학물질 누출·접촉</option>
                <option value="산소결핍">산소결핍</option>
                <option value="빠짐익사">빠짐·익사</option>
                <option value="사업장내교통사고">사업장 내 교통사고</option>
                <option value="동물상해">동물상해</option>
                <option value="기타">기타</option>
              </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 12a1 1 0 01-.707-.293l-3-3a1 1 0 111.414-1.414L10 9.586l2.293-2.293a1 1 0 111.414 1.414l-3 3A1 1 0 0110 12z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-md p-3 text-sm text-gray-900">
                {report.investigation_accident_type_level2 || '-'}
              </div>
            )}
          </div>
        </div>
        
        {/* 사고 개요 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">사고 개요</label>
            {editMode && (
              <button
                type="button"
                onClick={() => onLoadOriginalData('summary')}
                className="btn btn-ghost btn-sm"
              >
                발생보고서 정보 불러오기
              </button>
            )}
          </div>
          {editMode ? (
            <textarea
              name="investigation_acci_summary"
              value={editForm.investigation_acci_summary || ''}
              onChange={onInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="조사를 통해 수정된 사고 개요를 입력하세요"
            />
          ) : (
            <div className="bg-slate-50 rounded-md p-3 text-sm text-gray-900">
              {report.investigation_acci_summary || '-'}
            </div>
          )}
        </div>
        
        {/* 사고 상세 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">사고 상세</label>
            {editMode && (
              <button
                type="button"
                onClick={() => onLoadOriginalData('detail')}
                className="btn btn-ghost btn-sm"
              >
                발생보고서 정보 불러오기
              </button>
            )}
          </div>
          {editMode ? (
            <textarea
              name="investigation_acci_detail"
              value={editForm.investigation_acci_detail || ''}
              onChange={onInputChange}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="조사를 통해 수정된 사고 상세 내용을 입력하세요"
            />
          ) : (
            <div className="bg-slate-50 rounded-md p-3 text-sm text-gray-900 whitespace-pre-wrap">
              {report.investigation_acci_detail || '-'}
            </div>
          )}
        </div>

        {/* 작업허가대상/번호/상태 - 사고 상세 바로 아래 */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">작업허가대상</label>
          {editMode ? (
            <select
              name="work_permit_required"
              value={editForm.work_permit_required || ''}
              onChange={onInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">선택</option>
              <option value="대상">대상</option>
              <option value="비대상">비대상</option>
            </select>
          ) : (
            <div className="text-gray-900">{report.work_permit_required || '-'}</div>
          )}
        </div>
        {/* 대상일 때만 번호/상태 노출 */}
        {(editMode ? editForm.work_permit_required === '대상' : report.work_permit_required === '대상') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">작업허가번호</label>
              {editMode ? (
                <input
                  type="text"
                  name="work_permit_number"
                  value={editForm.work_permit_number || ''}
                  onChange={onInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="작업허가번호를 입력하세요"
                />
              ) : (
                <div className="text-gray-900">{report.work_permit_number || '-'}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">작업허가 발행상태</label>
              {editMode ? (
                <select
                  name="work_permit_status"
                  value={editForm.work_permit_status || ''}
                  onChange={onInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">선택</option>
                  <option value="미발행">미발행</option>
                  <option value="발행(미승인)">발행(미승인)</option>
                  <option value="승인">승인</option>
                </select>
              ) : (
                <div className="text-gray-900">{report.work_permit_status || '-'}</div>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}; 