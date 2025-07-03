import React from 'react';
import { FormSectionProps } from '../../types/occurrence.types';

const PropertyDamageSection: React.FC<FormSectionProps> = ({
  formData,
  onChange,
  onPropertyDamageChange,
  onAddPropertyDamage,
  onRemovePropertyDamage,
  isFieldVisible,
  isFieldRequired,
  getFieldLabel,
  getFieldsInGroup,
  isMobile = false,
  currentStep = 0
}) => {
  // 실제 동적 그리드 열 수 계산
  const [gridCols, setGridCols] = React.useState(2);
  
  React.useEffect(() => {
    // useOccurrenceForm에서 처리된 설정 사용 (모바일 처리 포함)
    const propertyDamageFields = getFieldsInGroup('물적피해정보');
    if (propertyDamageFields.length > 0) {
      const gridCols = propertyDamageFields[0].group_cols || 2;
      console.log('[PropertyDamageSection] 처리된 열 수:', gridCols, '(모바일 처리 적용됨)');
      setGridCols(gridCols);
    }
  }, [getFieldsInGroup]);

  // 물적피해 정보 섹션은 물적 또는 복합 사고일 때만 표시
  if (formData.accident_type_level1 !== "물적" && formData.accident_type_level1 !== "복합") {
    return null;
  }

  // 물적피해정보 그룹의 필드들을 display_order 순으로 가져오기
  const propertyDamageFields = getFieldsInGroup('물적피해정보');
  
  // 물적피해정보 그룹에 보이는 필드가 없으면 렌더링하지 않음
  const visibleFields = propertyDamageFields.filter(field => isFieldVisible(field.field_name));
  if (visibleFields.length === 0) {
    return null;
  }

  // 물적피해 배열이 없으면 빈 배열로 초기화
  const propertyDamages = formData.property_damages || [];

  // 필드별 렌더링 함수
  const renderField = (field: any, damageIndex: number) => {
    const fieldName = field.field_name;
    
    // 필드가 보이지 않으면 렌더링하지 않음
    if (!isFieldVisible(fieldName)) return null;
    
    switch (fieldName) {
      case 'damage_target':
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "피해대상물")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              name={`damage_target_${damageIndex}`}
              value={propertyDamages[damageIndex]?.damage_target || ''}
              onChange={(e) => onPropertyDamageChange && onPropertyDamageChange(damageIndex, 'damage_target', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="예: 생산설비, 건물, 차량 등"
              required={isFieldRequired(fieldName)}
            />
          </div>
        );
        
      case 'estimated_cost':
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "피해금액(예상)")} <span className='text-gray-400'>(단위: 천원)</span>
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              name={`estimated_cost_${damageIndex}`}
              value={propertyDamages[damageIndex]?.estimated_cost || ''}
              onChange={(e) => onPropertyDamageChange && onPropertyDamageChange(damageIndex, 'estimated_cost', parseInt(e.target.value) || 0)}
              min="0"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="천원"
              required={isFieldRequired(fieldName)}
            />
          </div>
        );
        
      case 'damage_content':
        return (
          <div key={fieldName} className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "피해 내용")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              name={`damage_content_${damageIndex}`}
              value={propertyDamages[damageIndex]?.damage_content || ''}
              onChange={(e) => onPropertyDamageChange && onPropertyDamageChange(damageIndex, 'damage_content', e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="구체적인 피해 내용을 입력하세요 (예: 설비 파손 정도, 손상 범위 등)"
              required={isFieldRequired(fieldName)}
            />
          </div>
        );
        
      case 'shutdown_start_date':
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "가동중단일")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="date"
              name={`shutdown_start_date_${damageIndex}`}
              value={propertyDamages[damageIndex]?.shutdown_start_date || ''}
              onChange={(e) => onPropertyDamageChange && onPropertyDamageChange(damageIndex, 'shutdown_start_date', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required={isFieldRequired(fieldName)}
            />
          </div>
        );
        
      case 'recovery_expected_date':
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "예상복구일")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="date"
              name={`recovery_expected_date_${damageIndex}`}
              value={propertyDamages[damageIndex]?.recovery_expected_date || ''}
              onChange={(e) => onPropertyDamageChange && onPropertyDamageChange(damageIndex, 'recovery_expected_date', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required={isFieldRequired(fieldName)}
            />
          </div>
        );
        
      default:
        // 기타 필드들은 기본 input으로 처리
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, fieldName)}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              name={`${fieldName}_${damageIndex}`}
              value={propertyDamages[damageIndex]?.[fieldName] || ''}
              onChange={(e) => onPropertyDamageChange && onPropertyDamageChange(damageIndex, fieldName, e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required={isFieldRequired(fieldName)}
            />
          </div>
        );
    }
  };

  const stepIndex = 3; // 물적피해는 3번째 스텝

  return (
    <div className={`bg-gray-50 p-3 md:p-4 rounded-md mb-6 ${isMobile && currentStep !== stepIndex ? 'hidden' : ''}`}>
      <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">물적피해 정보</h2>
      
      {/* 물적피해 항목이 없을 때 안내 메시지 */}
      {propertyDamages.length === 0 && (
        <div className="bg-gray-50 rounded-md p-4 text-center text-gray-600 mb-4">
          물적피해 항목이 없습니다. 아래 버튼을 클릭하여 추가하세요.
        </div>
      )}
      
      {/* 물적피해 정보를 개수에 맞게 렌더링 */}
      {propertyDamages.map((damage, index) => (
        <div key={index} className="mb-6 p-4 bg-white rounded-md border border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base md:text-lg font-medium">물적피해 {index + 1}</h3>
            {onRemovePropertyDamage && (
              <button
                type="button"
                onClick={() => onRemovePropertyDamage(index)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                삭제
              </button>
            )}
          </div>
          
          {/* 동적 필드 렌더링 (display_order 순서대로) */}
          <div className="grid gap-4" style={{display: 'grid', gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`}}>
            {visibleFields.map(field => renderField(field, index))}
          </div>
        </div>
      ))}
      
      {/* 물적피해 추가 버튼 */}
      {onAddPropertyDamage && (
        <button
          type="button"
          onClick={onAddPropertyDamage}
          className="w-full py-2 px-4 border border-dashed border-gray-300 rounded-md text-gray-600 hover:text-gray-800 hover:border-gray-400"
        >
          + 물적피해 추가
        </button>
      )}
    </div>
  );
};

export default PropertyDamageSection; 