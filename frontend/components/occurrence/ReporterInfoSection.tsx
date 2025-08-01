import React from 'react';
import { FormSectionProps } from '../../types/occurrence.types';

const ReporterInfoSection: React.FC<FormSectionProps> = ({
  formData,
  onChange,
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
    const reporterInfoFields = getFieldsInGroup('보고자정보');
    if (reporterInfoFields.length > 0) {
      const gridCols = reporterInfoFields[0].group_cols || 2;
      console.log('[ReporterInfoSection] 처리된 열 수:', gridCols, '(모바일 처리 적용됨)');
      setGridCols(gridCols);
    }
  }, [getFieldsInGroup]);

  // 스텝 인덱스 계산: 보고자정보 섹션은 사고 유형에 따라 다른 위치
  let stepIndex = 2; // 기본값 (사고 유형이 없거나 기타인 경우)
  if (formData.accident_type_level1 === "인적") {
    stepIndex = 3; // 인적: 기본정보(0) → 사고정보(1) → 재해자정보(2) → 보고자정보(3)
  } else if (formData.accident_type_level1 === "물적") {
    stepIndex = 3; // 물적: 기본정보(0) → 사고정보(1) → 물적피해정보(2) → 보고자정보(3)
  } else if (formData.accident_type_level1 === "복합") {
    stepIndex = 4; // 복합: 기본정보(0) → 사고정보(1) → 재해자정보(2) → 물적피해정보(3) → 보고자정보(4)
  }

  // 보고자정보 그룹의 필드들을 display_order 순으로 가져오기
  const reporterInfoFields = getFieldsInGroup('보고자정보');
  
  // 필드별 렌더링 함수
  const renderField = (field: any) => {
    const fieldName = field.field_name;
    
    // 필드가 보이지 않으면 렌더링하지 않음
    if (!isFieldVisible(fieldName)) return null;
    
    switch (fieldName) {
      case 'first_report_time':
        return (
          <div key={fieldName} className="col-span-full mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "최초 보고 시간")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="datetime-local"
              name={fieldName}
              value={formData.first_report_time || ''}
              onChange={onChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required={isFieldRequired(fieldName)}
            />
            <p className="text-xs text-gray-500 mt-1">
              사고를 처음 보고한 날짜와 시간
            </p>
          </div>
        );
        
      case 'reporter_name':
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "보고자 이름")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              name={fieldName}
              value={formData.reporter_name || ''}
              onChange={onChange}
              required={isFieldRequired(fieldName)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        );
        
      case 'reporter_position':
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "보고자 직책")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              name={fieldName}
              value={formData.reporter_position || ''}
              onChange={onChange}
              required={isFieldRequired(fieldName)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        );
        
      case 'reporter_belong':
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "보고자 소속")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              name={fieldName}
              value={formData.reporter_belong || ''}
              onChange={onChange}
              required={isFieldRequired(fieldName)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        );
        
      case 'report_channel':
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "보고 경로")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              name={fieldName}
              value={formData.report_channel || ''}
              onChange={onChange}
              required={isFieldRequired(fieldName)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="예: 전화, 이메일, 직접 보고"
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
              name={fieldName}
              value={(formData as any)[fieldName] || ''}
              onChange={onChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required={isFieldRequired(fieldName)}
            />
          </div>
        );
    }
  };

  return (
    <div className={`bg-gray-50 p-3 md:p-4 rounded-md mb-6 ${isMobile && currentStep !== stepIndex ? 'hidden' : ''}`}>
      <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">보고자 정보</h2>
      
      {/* 동적 필드 렌더링 (display_order 순서대로) */}
      <div className="grid gap-4" style={{display: 'grid', gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`}}>
        {reporterInfoFields.map(field => renderField(field))}
      </div>
    </div>
  );
};

export default ReporterInfoSection; 