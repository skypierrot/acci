import React from 'react';
import { FormSectionProps } from '../../types/occurrence.types';

const VictimInfoSection: React.FC<FormSectionProps> = ({
  formData,
  onChange,
  onVictimChange,
  onAddVictim,
  onRemoveVictim,
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
    const victimInfoFields = getFieldsInGroup('재해자정보');
    if (victimInfoFields.length > 0) {
      const gridCols = victimInfoFields[0].group_cols || 2;
      console.log('[VictimInfoSection] 처리된 열 수:', gridCols, '(모바일 처리 적용됨)');
      setGridCols(gridCols);
    }
  }, [getFieldsInGroup]);

  // 재해자 정보 섹션은 인적 또는 복합 사고이고 재해자 수가 0보다 클 때만 표시
  if (formData.accident_type_level1 !== "인적" && formData.accident_type_level1 !== "복합") {
    return null;
  }

  if (formData.victim_count <= 0) {
    return null;
  }

  // 재해자정보 그룹의 필드들을 display_order 순으로 가져오기
  const victimInfoFields = getFieldsInGroup('재해자정보');
  
  // 필드별 렌더링 함수
  const renderField = (field: any, victimIndex: number) => {
    const fieldName = field.field_name;
    
    // 필드가 보이지 않으면 렌더링하지 않음
    if (!isFieldVisible(fieldName)) return null;
    
    switch (fieldName) {
      case 'victim_name':
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "재해자 이름")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              name={`victim_name_${victimIndex}`}
              value={formData.victims[victimIndex]?.name || ''}
              onChange={(e) => onVictimChange && onVictimChange(victimIndex, 'name', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required={isFieldRequired(fieldName)}
            />
          </div>
        );
        
      case 'victim_age':
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "재해자 나이")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              name={`victim_age_${victimIndex}`}
              value={formData.victims[victimIndex]?.age || ''}
              onChange={(e) => onVictimChange && onVictimChange(victimIndex, 'age', parseInt(e.target.value) || 0)}
              min="0"
              max="120"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required={isFieldRequired(fieldName)}
            />
          </div>
        );
        
      case 'victim_belong':
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "재해자 소속")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              name={`victim_belong_${victimIndex}`}
              value={formData.victims[victimIndex]?.belong || ''}
              onChange={(e) => onVictimChange && onVictimChange(victimIndex, 'belong', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required={isFieldRequired(fieldName)}
            />
          </div>
        );
        
      case 'victim_duty':
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "재해자 직무")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              name={`victim_duty_${victimIndex}`}
              value={formData.victims[victimIndex]?.duty || ''}
              onChange={(e) => onVictimChange && onVictimChange(victimIndex, 'duty', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required={isFieldRequired(fieldName)}
            />
          </div>
        );
        
      case 'injury_type':
        return (
          <div key={fieldName} className="relative w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              상해 정도(예상)
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              name={`injury_type_${victimIndex}`}
              value={formData.victims[victimIndex]?.injury_type || ''}
              onChange={(e) => onVictimChange && onVictimChange(victimIndex, 'injury_type', e.target.value)}
              className="appearance-none w-full border border-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={isFieldRequired(fieldName)}
            >
              <option value="">선택하세요</option>
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
        );
        
      case 'ppe_worn':
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "보호구 착용 여부")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              name={`ppe_worn_${victimIndex}`}
              value={formData.victims[victimIndex]?.ppe_worn || ''}
              onChange={(e) => onVictimChange && onVictimChange(victimIndex, 'ppe_worn', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="예: 헬멧, 안전화 착용"
              required={isFieldRequired(fieldName)}
            />
          </div>
        );
        
      case 'first_aid':
        return (
          <div key={fieldName} className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "응급조치 내역")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              name={`first_aid_${victimIndex}`}
              value={formData.victims[victimIndex]?.first_aid || ''}
              onChange={(e) => onVictimChange && onVictimChange(victimIndex, 'first_aid', e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="응급처치 내용, 병원 이송 여부 등"
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
              name={`${fieldName}_${victimIndex}`}
              value={(formData.victims[victimIndex] as any)?.[fieldName.replace('victim_', '')] || ''}
              onChange={(e) => onVictimChange && onVictimChange(victimIndex, fieldName.replace('victim_', ''), e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required={isFieldRequired(fieldName)}
            />
          </div>
        );
    }
  };

  return (
    <div className={`bg-gray-50 p-3 md:p-4 rounded-md mb-6 ${isMobile && currentStep !== 2 ? 'hidden' : ''}`}>
      <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">재해자 정보</h2>
      
      {/* 재해자 정보를 재해자 수에 맞게 렌더링 */}
      {formData.victims.map((victim, index) => (
        <div key={index} className="mb-6 p-4 bg-white rounded-md border border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base md:text-lg font-medium">재해자 {index + 1}</h3>
            {index > 0 && onRemoveVictim && (
              <button
                type="button"
                onClick={() => onRemoveVictim(index)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                삭제
              </button>
            )}
          </div>
          
          {/* 동적 필드 렌더링 (display_order 순서대로) */}
          <div className="grid gap-4" style={{display: 'grid', gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`}}>
            {victimInfoFields.map(field => renderField(field, index))}
          </div>
        </div>
      ))}
      
      {/* 재해자 추가 버튼 */}
      {onAddVictim && formData.victims.length < formData.victim_count && (
        <button
          type="button"
          onClick={onAddVictim}
          className="w-full py-2 px-4 border border-dashed border-gray-300 rounded-md text-gray-600 hover:text-gray-800 hover:border-gray-400"
        >
          + 재해자 추가
        </button>
      )}
    </div>
  );
};

export default VictimInfoSection; 