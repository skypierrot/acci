import React from 'react';
import { VictimSectionProps } from '../../types/investigation.types';

export const VictimSection: React.FC<VictimSectionProps> = ({
  report,
  editForm,
  editMode,
  onVictimChange,
  onAddVictim,
  onRemoveVictim,
  onVictimCountChange,
  onLoadOriginalData,
  onLoadOriginalVictim
}) => {
  return (
    <div className="report-section">
      <div className="report-section-header">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="report-section-title">3. 재해자 정보</h3>
            <p className="report-section-subtitle">조사를 통해 확인된 재해자 상세 정보</p>
          </div>
          <div className="flex gap-2 no-print">
            {editMode && (
              <>
                <button
                  type="button"
                  onClick={() => onLoadOriginalData('victims')}
                  className="btn btn-primary btn-sm"
                >
                  발생보고서 정보 불러오기
                </button>
                <button
                  type="button"
                  onClick={onAddVictim}
                  className="btn btn-primary btn-sm"
                >
                  + 추가
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="report-section-content">
      
      {/* 재해자 수 입력 필드 제거 (요구사항에 따라 삭제) */}
      {/*
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">재해자 수</label>
        {editMode ? (
          <input
            type="number"
            value={editForm.investigation_victim_count || 0}
            onChange={(e) => onVictimCountChange(parseInt(e.target.value) || 0)}
            min="0"
            className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
          />
        ) : (
          <span className="text-gray-900 font-medium">{report.investigation_victim_count || 0}명</span>
        )}
      </div>
      */}

      {/* 재해자 목록 */}
      <div className="space-y-4">
        {editMode ? (
          (editForm.investigation_victims || []).length === 0 ? (
            <div className="bg-gray-50 rounded-md p-4 text-center text-gray-600">
              재해자 정보가 없습니다. 위의 재해자 수를 입력하거나 "재해자 추가" 버튼을 클릭하세요.
            </div>
          ) : (
            (editForm.investigation_victims || []).map((victim, index) => (
              <div key={index} className="bg-slate-50 rounded-lg p-4 border">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-sm font-medium text-gray-800">재해자 #{index + 1}</h4>
                  <div className="flex gap-2">
                    {onLoadOriginalVictim && (
                      <button
                        type="button"
                        onClick={() => onLoadOriginalVictim(index)}
                        className="text-gray-800 hover:text-black text-xs px-2 py-1 border border-gray-300 rounded bg-white hover:bg-gray-100"
                        title="발생보고서 정보 불러오기"
                      >
                        발생보고서 정보 불러오기
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemoveVictim(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      삭제
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">성명</label>
                    <input
                      type="text"
                      value={victim.name}
                      onChange={(e) => onVictimChange(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">나이</label>
                    <input
                      type="number"
                      value={victim.age}
                      onChange={(e) => onVictimChange(index, 'age', parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">소속</label>
                    <input
                      type="text"
                      value={victim.belong}
                      onChange={(e) => onVictimChange(index, 'belong', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">직무</label>
                    <input
                      type="text"
                      value={victim.duty}
                      onChange={(e) => onVictimChange(index, 'duty', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    />
                  </div>
                  
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-700 mb-1">상해유형</label>
                    <select
                      value={victim.injury_type}
                      onChange={(e) => onVictimChange(index, 'injury_type', e.target.value)}
                      className="appearance-none w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    >
                      <option value="">선택</option>
                      <option value="응급처치">응급처치(FAC)</option>
                      <option value="병원치료">병원치료(MTC)</option>
                      <option value="경상">경상(1일 이상 휴업)</option>
                      <option value="중상">중상(3일 이상 휴업)</option>
                      <option value="사망">사망</option>
                      <option value="기타">기타(근골 승인 등)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 12a1 1 0 01-.707-.293l-3-3a1 1 0 111.414-1.414L10 9.586l2.293-2.293a1 1 0 111.414 1.414l-3 3A1 1 0 0110 12z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">보호구 착용</label>
                    <select
                      value={victim.ppe_worn}
                      onChange={(e) => onVictimChange(index, 'ppe_worn', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    >
                      <option value="">선택</option>
                      <option value="착용">착용</option>
                      <option value="미착용">미착용</option>
                      <option value="부분착용">부분착용</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">응급처치</label>
                    <input
                      type="text"
                      value={victim.first_aid}
                      onChange={(e) => onVictimChange(index, 'first_aid', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">업무중단일</label>
                    <input
                      type="date"
                      value={victim.absence_start_date ? new Date(victim.absence_start_date).toISOString().slice(0, 10) : ''}
                      onChange={(e) => onVictimChange(index, 'absence_start_date', e.target.value)}
                      onClick={e => e.currentTarget.showPicker && e.currentTarget.showPicker()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">복귀예정일</label>
                    <input
                      type="date"
                      value={victim.return_expected_date ? new Date(victim.return_expected_date).toISOString().slice(0, 10) : ''}
                      onChange={(e) => onVictimChange(index, 'return_expected_date', e.target.value)}
                      onClick={e => e.currentTarget.showPicker && e.currentTarget.showPicker()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">상해부위</label>
                    <input
                      type="text"
                      value={victim.injury_location || ''}
                      onChange={(e) => onVictimChange(index, 'injury_location', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                      placeholder="상해가 발생한 부위를 입력하세요"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">의사소견</label>
                    <input
                      type="text"
                      value={victim.medical_opinion || ''}
                      onChange={(e) => onVictimChange(index, 'medical_opinion', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                      placeholder="의사의 진단 및 소견을 입력하세요"
                    />
                  </div>
                  
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-700 mb-1">교육 이수여부</label>
                    <select
                      value={victim.training_completed || ''}
                      onChange={(e) => onVictimChange(index, 'training_completed', e.target.value)}
                      className="appearance-none w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    >
                      <option value="">선택</option>
                      <option value="이수">이수</option>
                      <option value="미이수">미이수</option>
                      <option value="일부이수">일부이수</option>
                      <option value="해당없음">해당없음</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 12a1 1 0 01-.707-.293l-3-3a1 1 0 111.414-1.414L10 9.586l2.293-2.293a1 1 0 111.414 1.414l-3 3A1 1 0 0110 12z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">기타</label>
                  <textarea
                    value={victim.etc_notes || ''}
                    onChange={(e) => onVictimChange(index, 'etc_notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    placeholder="기타 특이사항이나 추가 정보를 입력하세요"
                  />
                </div>
              </div>
            ))
          )
        ) : (
          (!report.investigation_victims || report.investigation_victims.length === 0) ? (
            <div className="bg-gray-50 rounded-md p-4 text-center text-gray-600">
              재해자 정보가 없습니다.
            </div>
          ) : (
            report.investigation_victims.map((victim, index) => (
              <div key={index} className="bg-slate-50 rounded-lg p-4 border">
                <h4 className="text-sm font-medium text-gray-800 mb-3">재해자 #{index + 1}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 font-medium">성명:</span>
                    <div className="text-gray-900">{victim.name || '-'}</div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 font-medium">나이:</span>
                    <div className="text-gray-900">{victim.age ? `${victim.age}세` : '-'}</div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 font-medium">소속:</span>
                    <div className="text-gray-900">{victim.belong || '-'}</div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 font-medium">직무:</span>
                    <div className="text-gray-900">{victim.duty || '-'}</div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 font-medium">상해유형:</span>
                    <div className="text-gray-900">{victim.injury_type || '-'}</div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 font-medium">보호구 착용:</span>
                    <div className="text-gray-900">{victim.ppe_worn || '-'}</div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 font-medium">응급처치:</span>
                    <div className="text-gray-900">{victim.first_aid || '-'}</div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 font-medium">업무중단일:</span>
                    <div className="text-gray-900">
                      {victim.absence_start_date ? new Date(victim.absence_start_date).toLocaleDateString('ko-KR') : '-'}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 font-medium">복귀예정일:</span>
                    <div className="text-gray-900">
                      {victim.return_expected_date ? new Date(victim.return_expected_date).toLocaleDateString('ko-KR') : '-'}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 font-medium">상해부위:</span>
                    <div className="text-gray-900">{victim.injury_location || '-'}</div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 font-medium">의사소견:</span>
                    <div className="text-gray-900">{victim.medical_opinion || '-'}</div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 font-medium">교육 이수여부:</span>
                    <div className="text-gray-900">{victim.training_completed || '-'}</div>
                  </div>
                </div>
                
                {victim.etc_notes && (
                  <div className="mt-4">
                    <span className="text-gray-600 font-medium">기타:</span>
                    <div className="text-gray-900 mt-1 p-2 bg-gray-100 rounded-md whitespace-pre-wrap">
                      {victim.etc_notes}
                    </div>
                  </div>
                )}
              </div>
            ))
          )
        )}
      </div>
      </div>
    </div>
  );
}; 