import React from 'react';
import { FormSectionProps } from '../../types/occurrence.types';
import FileUploader from '../FileUploader';

const AttachmentSection: React.FC<FormSectionProps> = ({
  formData,
  onFileChange,
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
    const attachmentFields = getFieldsInGroup('첨부파일');
    if (attachmentFields.length > 0) {
      const gridCols = attachmentFields[0].group_cols || 2;
      console.log('[AttachmentSection] 처리된 열 수:', gridCols, '(모바일 처리 적용됨)');
      setGridCols(gridCols);
    }
  }, [getFieldsInGroup]);

  const stepIndex = formData.accident_type_level1 === "물적" ? 2 : 3;

  // 첨부파일 그룹의 필드들을 display_order 순으로 가져오기
  const attachmentFields = getFieldsInGroup('첨부파일');
  
  // 필드별 렌더링 함수
  const renderField = (field: any) => {
    const fieldName = field.field_name;
    
    // 필드가 보이지 않으면 렌더링하지 않음
    if (!isFieldVisible(fieldName)) return null;
    
    switch (fieldName) {
      case 'scene_photos':
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "사고 현장 사진")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <FileUploader
              onChange={(fileIds) => onFileChange && onFileChange(fieldName)(fileIds)}
              required={isFieldRequired(fieldName)}
            />
          </div>
        );
        
      case 'cctv_video':
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "CCTV 영상")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <FileUploader
              onChange={(fileIds) => onFileChange && onFileChange(fieldName)(fileIds)}
              required={isFieldRequired(fieldName)}
            />
          </div>
        );
        
      case 'statement_docs':
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "관계자 진술서")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <FileUploader
              onChange={(fileIds) => onFileChange && onFileChange(fieldName)(fileIds)}
              required={isFieldRequired(fieldName)}
            />
          </div>
        );
        
      case 'etc_documents':
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "기타 문서")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <FileUploader
              onChange={(fileIds) => onFileChange && onFileChange(fieldName)(fileIds)}
              required={isFieldRequired(fieldName)}
            />
          </div>
        );
        
      default:
        // 기타 파일 필드들은 기본 FileUploader로 처리
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, fieldName)}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <FileUploader
              onChange={(fileIds) => onFileChange && onFileChange(fieldName)(fileIds)}
              required={isFieldRequired(fieldName)}
            />
          </div>
        );
    }
  };

  return (
    <div className={`bg-gray-50 p-3 md:p-4 rounded-md mb-6 ${isMobile && currentStep !== stepIndex ? 'hidden' : ''}`}>
      <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">첨부 파일</h2>
      
      {/* 동적 필드 렌더링 (display_order 순서대로) */}
      <div className="grid gap-4" style={{display: 'grid', gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`}}>
        {attachmentFields.map(field => renderField(field))}
      </div>
    </div>
  );
};

export default AttachmentSection; 