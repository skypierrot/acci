import React from 'react';
import { FormSectionProps, Attachment } from '../../types/occurrence.types';
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
  // 첨부파일 리스트 state (상위 폼에서 관리하는 경우 formData.attachments 사용)
  const attachments: Attachment[] = formData.attachments || [];

  // 파일 추가/삭제 핸들러
  const handleAttachmentsChange = (newAttachments: Attachment[]) => {
    // 상위 폼에 변경사항 전달 (attachments만 전달)
    if (onFileChange) {
      onFileChange(newAttachments);
    }
  };

  // 스텝 인덱스 계산: 첨부파일 섹션은 항상 마지막 스텝
  let stepIndex = 3; // 기본값
  if (formData.accident_type_level1 === "인적") {
    stepIndex = 4; // 인적: 기본정보(0) → 사고정보(1) → 재해자정보(2) → 보고자정보(3) → 첨부파일(4)
  } else if (formData.accident_type_level1 === "물적") {
    stepIndex = 4; // 물적: 기본정보(0) → 사고정보(1) → 물적피해정보(2) → 보고자정보(3) → 첨부파일(4)
  } else if (formData.accident_type_level1 === "복합") {
    stepIndex = 5; // 복합: 기본정보(0) → 사고정보(1) → 재해자정보(2) → 물적피해정보(3) → 보고자정보(4) → 첨부파일(5)
  }

  return (
    <div className={`bg-gray-50 p-3 md:p-4 rounded-md mb-6 ${isMobile && currentStep !== stepIndex ? 'hidden' : ''}`}>
      <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">첨부 파일</h2>
      
      {/* 파일 업로드 안내 */}
      {/* [색상 일관성 작업] 파란색 계열 → slate/emerald/neutral 계열로 교체 */}
      {/* 파일 업로드 안내 영역 배경색 변경 */}
      <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-md">
        <div className="flex items-start">
          <svg className="h-5 w-5 text-slate-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-slate-800">파일 업로드 안내</h3>
            <div className="mt-1 text-sm text-slate-700">
              <ul className="list-disc list-inside space-y-1">
                <li>최대 20MB까지 업로드 가능합니다.</li>
                <li>이미지, 동영상, PDF, 문서 파일을 지원합니다.</li>
                <li>드래그하여 파일 순서를 변경할 수 있습니다.</li>
                <li>이미지 파일은 클릭하여 미리보기할 수 있습니다.</li>
                <li>업로드된 파일은 보고서 저장 시 자동으로 첨부됩니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* 개선된 FileUploader 컴포넌트 사용 */}
      <FileUploader
        value={attachments}
        onChange={handleAttachmentsChange}
        required={isFieldRequired('attachments')}
        multiple={true}
        maxSize={20}
        acceptedTypes={[
          'image/*',
          'video/*', 
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain'
        ]}
      />
    </div>
  );
};

export default AttachmentSection; 