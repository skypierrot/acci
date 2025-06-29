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
  const [sessionId, setSessionId] = React.useState<string>('');
  
  React.useEffect(() => {
    // useOccurrenceForm에서 처리된 설정 사용 (모바일 처리 포함)
    const attachmentFields = getFieldsInGroup('첨부파일');
    if (attachmentFields.length > 0) {
      const gridCols = attachmentFields[0].group_cols || 2;
      console.log('[AttachmentSection] 처리된 열 수:', gridCols, '(모바일 처리 적용됨)');
      setGridCols(gridCols);
    }
  }, [getFieldsInGroup]);

  // 세션 ID 생성 및 관리
  React.useEffect(() => {
    if (!sessionId) {
      // 고유한 세션 ID 생성 (timestamp + random)
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
    }
  }, [sessionId]);

  const stepIndex = formData.accident_type_level1 === "물적" ? 2 : 3;

  // 첨부파일 그룹의 필드들을 display_order 순으로 가져오기
  const attachmentFields = getFieldsInGroup('첨부파일');
  
  // 파일 카테고리 매핑
  const getCategoryForField = (fieldName: string): string => {
    switch (fieldName) {
      case 'scene_photos':
        return 'scene_photos';
      case 'cctv_video':
        return 'cctv_video';
      case 'statement_docs':
        return 'statement_docs';
      case 'etc_documents':
      default:
        return 'etc_documents';
    }
  };

  // 초기 파일 ID 목록 가져오기 (수정 모드용)
  const getInitialFiles = (fieldName: string): string[] => {
    const fieldValue = formData[fieldName as keyof typeof formData];
    console.log(`[AttachmentSection] ${fieldName} 필드 값:`, fieldValue, typeof fieldValue);
    
    if (Array.isArray(fieldValue)) {
      // 문자열 배열인지 확인 (파일 ID 배열)
      if (fieldValue.every(item => typeof item === 'string')) {
        console.log(`[AttachmentSection] ${fieldName} 배열 파일 ID:`, fieldValue);
        return fieldValue as string[];
      }
      // VictimInfo 배열인 경우 빈 배열 반환
      console.log(`[AttachmentSection] ${fieldName} VictimInfo 배열로 판단, 빈 배열 반환`);
      return [];
    } else if (typeof fieldValue === 'string' && fieldValue) {
      try {
        // JSON 문자열인 경우 파싱 시도
        let parsed = JSON.parse(fieldValue);
        
        // 중첩된 JSON 문자열인 경우 한 번 더 파싱
        if (typeof parsed === 'string') {
          try {
            parsed = JSON.parse(parsed);
          } catch {
            // 두 번째 파싱 실패 시 원본 사용
          }
        }
        
        // 객체인 경우 값들을 배열로 변환
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          const result = Object.values(parsed).filter(v => typeof v === 'string') as string[];
          console.log(`[AttachmentSection] ${fieldName} 객체에서 값 추출:`, result);
          return result;
        }
        
        const result = Array.isArray(parsed) ? parsed : [];
        console.log(`[AttachmentSection] ${fieldName} JSON 파싱 결과:`, result);
        return result;
      } catch (e) {
        console.log(`[AttachmentSection] ${fieldName} JSON 파싱 실패:`, e);
        // JSON이 아닌 경우 단일 파일 ID로 처리
        console.log(`[AttachmentSection] ${fieldName} 단일 파일 ID:`, [fieldValue]);
        return [fieldValue];
      }
    }
    console.log(`[AttachmentSection] ${fieldName} 빈 배열 반환`);
    return [];
  };
  
  // 필드별 렌더링 함수
  const renderField = (field: any) => {
    const fieldName = field.field_name;
    
    // 필드가 보이지 않으면 렌더링하지 않음
    if (!isFieldVisible(fieldName)) return null;
    
    const category = getCategoryForField(fieldName);
    const initialFiles = getInitialFiles(fieldName);
    
    switch (fieldName) {
      case 'scene_photos':
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getFieldLabel(fieldName, "사고 현장 사진")}
              {isFieldRequired(fieldName) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <FileUploader
              onChange={(fileIds) => onFileChange && onFileChange(fieldName, fileIds)}
              required={isFieldRequired(fieldName)}
              category={category}
              sessionId={sessionId}
              initialFiles={initialFiles}
            />
            <p className="text-xs text-gray-500 mt-1">
              사고 현장의 전체적인 모습과 세부 상황을 보여주는 사진을 업로드하세요.
            </p>
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
              onChange={(fileIds) => onFileChange && onFileChange(fieldName, fileIds)}
              required={isFieldRequired(fieldName)}
              category={category}
              sessionId={sessionId}
              initialFiles={initialFiles}
            />
            <p className="text-xs text-gray-500 mt-1">
              사고 발생 전후의 CCTV 영상 파일을 업로드하세요. (MP4, MOV, AVI 등)
            </p>
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
              onChange={(fileIds) => onFileChange && onFileChange(fieldName, fileIds)}
              required={isFieldRequired(fieldName)}
              category={category}
              sessionId={sessionId}
              initialFiles={initialFiles}
            />
            <p className="text-xs text-gray-500 mt-1">
              목격자, 피해자, 관계자들의 진술서나 인터뷰 내용을 업로드하세요.
            </p>
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
              onChange={(fileIds) => onFileChange && onFileChange(fieldName, fileIds)}
              required={isFieldRequired(fieldName)}
              category={category}
              sessionId={sessionId}
              initialFiles={initialFiles}
            />
            <p className="text-xs text-gray-500 mt-1">
              사고 관련 기타 문서 (보고서, 도면, 매뉴얼 등)를 업로드하세요.
            </p>
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
              onChange={(fileIds) => onFileChange && onFileChange(fieldName, fileIds)}
              required={isFieldRequired(fieldName)}
              category={getCategoryForField(fieldName)}
              sessionId={sessionId}
              initialFiles={getInitialFiles(fieldName)}
            />
          </div>
        );
    }
  };

  return (
    <div className={`bg-gray-50 p-3 md:p-4 rounded-md mb-6 ${isMobile && currentStep !== stepIndex ? 'hidden' : ''}`}>
      <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">첨부 파일</h2>
      
      {/* 파일 업로드 안내 */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">파일 업로드 안내</h3>
            <div className="mt-1 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>최대 20MB까지 업로드 가능합니다.</li>
                <li>이미지, 동영상, PDF, 문서 파일을 지원합니다.</li>
                <li>업로드된 파일은 보고서 저장 시 자동으로 첨부됩니다.</li>
                <li>보고서를 저장하지 않으면 24시간 후 자동 삭제됩니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* 동적 필드 렌더링 (display_order 순서대로) */}
      <div className="grid gap-6" style={{display: 'grid', gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`}}>
        {attachmentFields.map(field => renderField(field))}
      </div>
    </div>
  );
};

export default AttachmentSection; 