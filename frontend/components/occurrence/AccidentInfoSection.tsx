import React from 'react';
import { FormSectionProps } from '../../types/occurrence.types';

interface AccidentInfoSectionProps extends FormSectionProps {
  onAcciTimeChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getDynamicGridClass?: (groupName: string) => string;
}

const AccidentInfoSection: React.FC<AccidentInfoSectionProps> = ({
  formData,
  onChange,
  onAcciTimeChange,
  isFieldVisible,
  isFieldRequired,
  getFieldLabel,
  getFieldsInGroup,
  getDynamicGridClass,
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
        const accidentInfoField = result.data.find((setting: any) => setting.field_group === '사고정보');
        
        if (accidentInfoField) {
          console.log('[AccidentInfoSection] DB에서 가져온 열 수:', accidentInfoField.group_cols);
          setGridCols(accidentInfoField.group_cols || 2);
        }
      } catch (error) {
        console.error('[AccidentInfoSection] 설정 로드 실패:', error);
      }
    };
    
    fetchGridCols();
  }, []);

  // 사고정보 그룹의 필드들을 display_order 순으로 가져오기
  const accidentInfoFields = getFieldsInGroup('사고정보');
  
  // 필드별 렌더링 함수
  const renderField = (field: any) => {
    const fieldName = field.field_name;
    
    // 필드가 보이지 않으면 렌더링하지 않음
    if (!isFieldVisible(fieldName)) return null;
    
    switch (fieldName) {
      case 'acci_time':
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "사고 발생 일시")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              name={fieldName}
              value={formData.acci_time || ''}
              onChange={onChange}
              onBlur={(e) => {
                // 포커스가 벗어날 때만 자동 포맷팅 처리
                let value = e.target.value;
                
                if (/^\d{8}$/.test(value)) {
                  // YYYYMMDD 형식을 YYYY-MM-DD로 변환
                  const year = value.substring(0, 4);
                  const month = value.substring(4, 6);
                  const day = value.substring(6, 8);
                  const formattedValue = `${year}-${month}-${day}`;
                  
                  // 포맷팅된 값으로 onChange 호출
                  const syntheticEvent = {
                    target: {
                      name: fieldName,
                      value: formattedValue
                    }
                  } as React.ChangeEvent<HTMLInputElement>;
                  onChange(syntheticEvent);
                } else if (/^\d{12}$/.test(value)) {
                  // YYYYMMDDHHMM 형식을 YYYY-MM-DDTHH:MM로 변환
                  const year = value.substring(0, 4);
                  const month = value.substring(4, 6);
                  const day = value.substring(6, 8);
                  const hour = value.substring(8, 10);
                  const minute = value.substring(10, 12);
                  const formattedValue = `${year}-${month}-${day}T${hour}:${minute}`;
                  
                  // 포맷팅된 값으로 onChange 호출
                  const syntheticEvent = {
                    target: {
                      name: fieldName,
                      value: formattedValue
                    }
                  } as React.ChangeEvent<HTMLInputElement>;
                  onChange(syntheticEvent);
                } else if (/^\d{10}$/.test(value)) {
                  // YYYYMMDDHH 형식을 YYYY-MM-DDTHH:00로 변환
                  const year = value.substring(0, 4);
                  const month = value.substring(4, 6);
                  const day = value.substring(6, 8);
                  const hour = value.substring(8, 10);
                  const formattedValue = `${year}-${month}-${day}T${hour}:00`;
                  
                  // 포맷팅된 값으로 onChange 호출
                  const syntheticEvent = {
                    target: {
                      name: fieldName,
                      value: formattedValue
                    }
                  } as React.ChangeEvent<HTMLInputElement>;
                  onChange(syntheticEvent);
                }
              }}
              placeholder="YYYY-MM-DD 또는 YYYY-MM-DDTHH:MM 형식 (예: 20250505)"
              required={isFieldRequired(fieldName)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              숫자 입력 후 다른 필드로 이동하면 자동 변환됩니다: 20250505 → 2025-05-05, 202505051430 → 2025-05-05T14:30
            </p>
          </div>
        );
        
      case 'acci_location':
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "사고 발생 위치")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              name={fieldName}
              value={formData.acci_location}
              onChange={onChange}
              required={isFieldRequired(fieldName)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="구체적인 사고 발생 위치"
            />
          </div>
        );
        
      case 'accident_type_level1':
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "재해발생 형태")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              name={fieldName}
              value={formData.accident_type_level1}
              onChange={onChange}
              required={isFieldRequired(fieldName)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">선택하세요</option>
              <option value="인적">인적 (인명 피해)</option>
              <option value="물적">물적 (재산 피해)</option>
              <option value="복합">복합 (인적+물적)</option>
            </select>
          </div>
        );
        
      case 'accident_type_level2':
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "사고 유형")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              name={fieldName}
              value={formData.accident_type_level2}
              onChange={onChange}
              required={isFieldRequired(fieldName)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">선택하세요</option>
              <option value="기계">기계 관련</option>
              <option value="전기">전기 관련</option>
              <option value="화학물질">화학물질 관련</option>
              <option value="추락">추락</option>
              <option value="낙하">낙하·비래</option>
              <option value="협착">끼임·협착</option>
              <option value="충돌">충돌·충격</option>
              <option value="화재">화재·폭발</option>
              <option value="기타">기타</option>
            </select>
          </div>
        );
        
      case 'victim_count':
        // 인적 또는 복합 선택 시에만 표시
        if (!(formData.accident_type_level1 === "인적" || formData.accident_type_level1 === "복합")) {
          return null;
        }
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "재해자 수")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              name={fieldName}
              value={formData.victim_count}
              onChange={onChange}
              min="0"
              max="100"
              required={isFieldRequired(fieldName)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        );
        
      case 'acci_summary':
        return (
          <div key={fieldName} className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "사고 개요")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              name={fieldName}
              value={formData.acci_summary}
              onChange={onChange}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="사고 발생 경위를 간략히 설명해주세요"
              required={isFieldRequired(fieldName)}
            />
          </div>
        );
        
      case 'acci_detail':
        return (
          <div key={fieldName} className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "사고 상세 내용")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="mb-2">
              <p className="text-sm text-gray-600">
                아래 항목을 포함하여 상세하게 작성해주세요:
              </p>
              <ol className="text-sm text-gray-600 list-decimal pl-5 mt-1">
                <li>사고 발생 전 작업 내용</li>
                <li>사고 발생 시점 작업자 행동</li>
                <li>사고가 발생하게 된 동작 및 기계 상태</li>
                <li>현장에서 어떤 일이 일어났는가</li>
                <li>사고 발생 후 초기 조치 및 대응</li>
              </ol>
            </div>
            <textarea
              name={fieldName}
              value={formData.acci_detail}
              onChange={onChange}
              rows={8}
              required={isFieldRequired(fieldName)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder={`1. 사고 발생 전 작업 내용
- 

2. 사고 발생 시점 작업자 행동
- 

3. 사고가 발생하게 된 동작 및 기계 상태
- 

4. 현장에서 어떤 일이 일어났는가
- 

5. 사고 발생 후 초기 조치 및 대응
- `}
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
    <div className={`bg-gray-50 p-3 md:p-4 rounded-md mb-6 ${isMobile && currentStep !== 1 ? 'hidden' : ''}`}>
      <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">사고 정보</h2>
      
      {/* 동적 필드 렌더링 (display_order 순서대로) */}
      <div className="grid gap-4" style={{display: 'grid', gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`}}>
        {accidentInfoFields.map(field => renderField(field))}
      </div>
    </div>
  );
};

export default AccidentInfoSection; 