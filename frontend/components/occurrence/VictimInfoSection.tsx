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
    const fetchGridCols = async () => {
      try {
        const response = await fetch('/api/settings/reports/occurrence');
        const result = await response.json();
        const victimInfoField = result.data.find((setting: any) => setting.field_group === '재해자정보');
        
        if (victimInfoField) {
          console.log('[VictimInfoSection] DB에서 가져온 열 수:', victimInfoField.group_cols);
          setGridCols(victimInfoField.group_cols || 2);
        }
      } catch (error) {
        console.error('[VictimInfoSection] 설정 로드 실패:', error);
      }
    };
    
    fetchGridCols();
  }, []);

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
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "부상 유형")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              name={`injury_type_${victimIndex}`}
              value={formData.victims[victimIndex]?.injury_type || ''}
              onChange={(e) => onVictimChange && onVictimChange(victimIndex, 'injury_type', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required={isFieldRequired(fieldName)}
            >
              <option value="">선택하세요</option>
              <option value="경상">경상</option>
              <option value="중상">중상</option>
              <option value="사망">사망</option>
              <option value="기타">기타</option>
            </select>
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