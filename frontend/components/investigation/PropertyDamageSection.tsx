import React from 'react';
import { PropertyDamageSectionProps } from '../../types/investigation.types';

export const PropertyDamageSection: React.FC<PropertyDamageSectionProps & { onLoadOriginalData?: (field: 'property_damage') => void }> = ({
  report,
  editForm,
  editMode,
  onAddPropertyDamage,
  onRemovePropertyDamage,
  onPropertyDamageChange,
  onLoadOriginalData,
  onLoadOriginalPropertyDamageItem
}) => {
  // 현재 사고유형 확인
  const currentType = editMode 
    ? editForm.investigation_accident_type_level1 
    : report.investigation_accident_type_level1;
  
  // 물적 또는 복합 사고가 아니면 렌더링하지 않음
  if (currentType !== "물적" && currentType !== "복합") {
    return null;
  }

  return (
    <div className="report-section">
      <div className="report-section-header">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="report-section-title">물적피해 정보</h3>
            <p className="report-section-subtitle">조사를 통해 확인된 재산 피해 상세 정보</p>
          </div>
          <div className="flex gap-2 no-print">
            {editMode && (
              <>
                {onLoadOriginalData && (
                  <button
                    type="button"
                    onClick={() => onLoadOriginalData('property_damage')}
                    className="btn btn-primary btn-sm"
                  >
                    발생보고서 정보 불러오기
                  </button>
                )}
                <button
                  type="button"
                  onClick={onAddPropertyDamage}
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
      {/* editMode일 때는 editForm.investigation_property_damage를 사용하여 렌더링 */}
      {editMode ? (
        <div className="space-y-4">
          {(editForm.investigation_property_damage || []).length === 0 ? (
            <div className="bg-gray-50 rounded-md p-4 text-center text-gray-600">
              물적피해 항목이 없습니다. 위의 "피해항목 추가" 버튼을 클릭하여 추가하세요.
            </div>
          ) : (
            (editForm.investigation_property_damage || []).map((damage, index) => (
              <div key={damage.id || (damage as any).damage_id || index} className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-sm font-medium text-gray-800">피해항목 #{index + 1}</h4>
                  <div className="flex gap-2">
                    {onLoadOriginalPropertyDamageItem && (
                      <button
                        type="button"
                        onClick={() => onLoadOriginalPropertyDamageItem(index)}
                        className="text-gray-800 hover:text-black text-xs px-2 py-1 border border-gray-300 rounded bg-white hover:bg-gray-100"
                        title="발생보고서 정보 불러오기"
                      >
                        발생보고서 정보 불러오기
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemovePropertyDamage(damage.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      삭제
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">피해대상물</label>
                    <input
                      type="text"
                      value={damage.damage_target}
                      onChange={(e) => onPropertyDamageChange(damage.id, 'damage_target', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="예: 생산설비, 건물, 차량 등"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">피해금액(예상) <span className='text-gray-400'>(단위: 천원)</span></label>
                    <input
                      type="number"
                      value={damage.estimated_cost}
                      onChange={(e) => onPropertyDamageChange(damage.id, 'estimated_cost', e.target.value)}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="천원"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">피해 내용</label>
                    <textarea
                      value={damage.damage_content}
                      onChange={(e) => onPropertyDamageChange(damage.id, 'damage_content', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="구체적인 피해 내용을 입력하세요 (예: 설비 파손 정도, 손상 범위 등)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">가동중단일</label>
                    <input
                      type="date"
                      value={damage.shutdown_start_date ? new Date(damage.shutdown_start_date).toISOString().slice(0, 10) : ''}
                      onChange={(e) => onPropertyDamageChange(damage.id, 'shutdown_start_date', e.target.value)}
                      onClick={e => e.currentTarget.showPicker && e.currentTarget.showPicker()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">예상복구일</label>
                    <input
                      type="date"
                      value={damage.recovery_expected_date ? new Date(damage.recovery_expected_date).toISOString().slice(0, 10) : ''}
                      onChange={(e) => onPropertyDamageChange(damage.id, 'recovery_expected_date', e.target.value)}
                      onClick={e => e.currentTarget.showPicker && e.currentTarget.showPicker()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {(!report.investigation_property_damage || report.investigation_property_damage.length === 0) ? (
            <div className="bg-gray-50 rounded-md p-4 text-center text-gray-600">
              물적피해 정보가 없습니다.
            </div>
          ) : (
            report.investigation_property_damage.map((damage, index) => (
              <div key={damage.id || index} className="bg-blue-50 rounded-lg p-4 border">
                <h4 className="text-sm font-medium text-gray-800 mb-3">피해항목 #{index + 1}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 font-medium">피해대상물:</span>
                    <div className="text-gray-900">{damage.damage_target || '-'}</div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 font-medium">피해금액(예상):</span>
                    <div className="text-gray-900">
                      {damage.estimated_cost ? `${damage.estimated_cost.toLocaleString()}천원` : '-'}
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <span className="text-gray-600 font-medium">피해 내용:</span>
                    <div className="text-gray-900 whitespace-pre-wrap mt-1">{damage.damage_content || '-'}</div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 font-medium">가동중단일:</span>
                    <div className="text-gray-900">
                      {damage.shutdown_start_date ? new Date(damage.shutdown_start_date).toLocaleDateString('ko-KR') : '-'}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 font-medium">예상복구일:</span>
                    <div className="text-gray-900">
                      {damage.recovery_expected_date ? new Date(damage.recovery_expected_date).toLocaleDateString('ko-KR') : '-'}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {/* 총 피해금액 요약 */}
          {report.investigation_property_damage && report.investigation_property_damage.length > 0 && (
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">총 예상 피해금액:</span>
                <span className="text-lg font-bold text-red-600">
                  {report.investigation_property_damage
                    .reduce((total, damage) => total + (damage.estimated_cost || 0), 0)
                    .toLocaleString()}천원
                </span>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}; 