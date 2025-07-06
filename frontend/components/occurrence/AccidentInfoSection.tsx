import React from 'react';
import { FormSectionProps } from '../../types/occurrence.types';
import { FormFieldSetting } from '@/services/report_form.service';

interface AccidentInfoSectionProps extends FormSectionProps {
  onAcciTimeChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getDynamicGridClass?: (groupName: string) => string;
  fields: FormFieldSetting[];
  layoutSettings: any;
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
  currentStep = 0,
}) => {
  // 실제 동적 그리드 열 수 계산
  const [gridCols, setGridCols] = React.useState(2);
  
  React.useEffect(() => {
    const accidentInfoFields = getFieldsInGroup('사고정보');
    if (accidentInfoFields.length > 0) {
      const cols = accidentInfoFields[0].group_cols || 2;
      setGridCols(cols);
    }
  }, [getFieldsInGroup]);

  const accidentInfoFields = getFieldsInGroup('사고정보');
  
  const renderField = (field: any) => {
    const fieldName = field.field_name;
    
    if (!isFieldVisible(fieldName)) return null;
    
    switch (fieldName) {
      case 'acci_time':
        const handleDateTimeClick = (e: React.MouseEvent<HTMLInputElement>) => {
          const input = e.target as HTMLInputElement;
          if (input.showPicker) {
            input.showPicker();
          }
        };
        
        const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          onChange(e);
        };

        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "사고 발생 일시")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="datetime-local"
              name={fieldName}
              value={formData.acci_time || ''}
              onChange={handleDateTimeChange}
              onClick={handleDateTimeClick}
              required={isFieldRequired(fieldName)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 cursor-pointer"
            />
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
          <div key={fieldName} className="relative w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "재해발생 형태")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              name={fieldName}
              value={formData.accident_type_level1}
              onChange={onChange}
              required={isFieldRequired(fieldName)}
              className="appearance-none w-full border border-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        );
        
      case 'accident_type_level2':
        return (
          <div key={fieldName} className="relative w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "사고 유형")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              name={fieldName}
              value={formData.accident_type_level2}
              onChange={onChange}
              required={isFieldRequired(fieldName)}
              className="appearance-none w-full border border-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">선택하세요</option>
              <option value="떨어짐">떨어짐</option>
              <option value="넘어짐">넘어짐</option>
              <option value="부딪힘">부딪힘</option>
              <option value="맞음">맞음</option>
              <option value="무너짐">무너짐</option>
              <option value="끼임">끼임</option>
              <option value="감전">감전</option>
              <option value="화재폭발">화재·폭발</option>
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
              placeholder={`1. 사고 발생 전 작업 내용\n- \n\n2. 사고 발생 시점 작업자 행동\n- \n\n3. 사고가 발생하게 된 동작 및 기계 상태\n- \n\n4. 현장에서 어떤 일이 일어났는가\n- \n\n5. 사고 발생 후 초기 조치 및 대응\n- `}
            />
          </div>
        );

      case 'work_permit_required':
        return (
          <div key={fieldName} className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {getFieldLabel(fieldName, "작업허가대상")}
                {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
              </label>
              <select
                name={fieldName}
                value={formData.work_permit_required || ''}
                onChange={onChange}
                required={isFieldRequired(fieldName)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">선택</option>
                <option value="대상">대상</option>
                <option value="비대상">비대상</option>
              </select>
            </div>

            {formData.work_permit_required === '대상' && (
              <>
                <div className="md:col-start-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {getFieldLabel("work_permit_number", "작업허가서 번호")}
                  </label>
                  <input
                    type="text"
                    name="work_permit_number"
                    value={formData.work_permit_number || ''}
                    onChange={onChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="예: PTW-2024-001"
                  />
                </div>
                <div className="md:col-start-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {getFieldLabel("work_permit_status", "작업허가서 상태")}
                  </label>
                  <select
                     name="work_permit_status"
                     value={formData.work_permit_status || ''}
                     onChange={onChange}
                     className="w-full border border-gray-300 rounded-md px-3 py-2"
                   >
                     <option value="">선택</option>
                     <option value="발행">발행</option>
                     <option value="미발행">미발행</option>
                   </select>
                </div>
              </>
            )}
          </div>
        );
        
      default:
        if (['work_permit_number', 'work_permit_status'].includes(fieldName)) return null;

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
      
      <div className="grid gap-4" style={{display: 'grid', gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`}}>
        {accidentInfoFields.map(field => renderField(field))}
      </div>
    </div>
  );
};

export default AccidentInfoSection; 