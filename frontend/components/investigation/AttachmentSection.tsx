import React, { useState } from 'react';
import { Attachment } from '../../types/occurrence.types';
import { InvestigationReport } from '../../types/investigation.types';
import FileUploader from '../FileUploader';
import ImageModal from '../ImageModal';

interface AttachmentSectionProps {
  report: InvestigationReport;
  editForm: Partial<InvestigationReport>;
  editMode: boolean;
  onAttachmentsChange: (attachments: Attachment[]) => void;
}

/**
 * 사고조사보고서 파일첨부 섹션 컴포넌트
 * - 조사보고서 작성 시 관련 파일들을 첨부할 수 있는 기능 제공
 * - 이미지, 문서, 동영상 등 다양한 파일 형식 지원
 * - 드래그 앤 드롭으로 파일 순서 변경 가능
 * - 읽기 모드에서 미리보기 및 다운로드 기능 제공
 */
const AttachmentSection: React.FC<AttachmentSectionProps> = ({
  report,
  editForm,
  editMode,
  onAttachmentsChange
}) => {
  // 현재 첨부파일 목록 (편집 모드에서는 editForm의 attachments, 그렇지 않으면 report의 attachments)
  const attachments: Attachment[] = editMode 
    ? (editForm.attachments || [])
    : (report.attachments || []);

  // 이미지 모달 상태
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    name: string;
    fileId: string;
  } | null>(null);

  // 파일 추가/삭제 핸들러
  const handleAttachmentsChange = (newAttachments: Attachment[]) => {
    onAttachmentsChange(newAttachments);
  };

  // 파일 다운로드 함수
  const downloadFile = (fileId: string) => {
    window.open(`/api/files/${fileId}`, '_blank');
  };

  // 이미지 클릭 핸들러
  const handleImageClick = (attachment: Attachment) => {
    if (attachment.type?.startsWith('image/')) {
      setSelectedImage({
        url: `/api/files/${attachment.fileId}`,
        name: attachment.name,
        fileId: attachment.fileId || ''
      });
      setImageModalOpen(true);
    }
  };

  // 이미지 모달 닫기
  const closeImageModal = () => {
    setImageModalOpen(false);
    setSelectedImage(null);
  };

  // 파일 타입에 따른 미리보기 렌더링 함수
  const renderFilePreview = (attachment: Attachment) => {
    const isImage = attachment.type?.startsWith('image/');
    const isVideo = attachment.type?.startsWith('video/');
    const isPdf = attachment.type === 'application/pdf';
    const isDocument = attachment.type?.includes('word') || attachment.type?.includes('document');
    
    if (isImage) {
      // 이미지 파일: 실제 미리보기 표시 (클릭 가능)
      return (
        <div 
          className="relative group cursor-pointer"
          onClick={() => handleImageClick(attachment)}
        >
          <img
            src={`/api/files/${attachment.fileId}/preview`}
            alt={attachment.name}
            className="w-full h-24 object-cover mb-2 transition-opacity hover:opacity-80"
            onError={(e) => {
              // 이미지 로드 실패 시 기본 이미지 아이콘으로 대체
              (e.target as HTMLImageElement).src = '/icons/image.svg';
            }}
          />
          {/* 호버 시 확대 아이콘 표시 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 bg-black bg-opacity-40 mb-2 pointer-events-none">
            <svg className="w-8 h-8 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            <span className="text-white text-xs font-medium">클릭하여 확대</span>
          </div>
        </div>
      );
    } else if (isVideo) {
      // 동영상 파일: 동영상 아이콘
      return (
        <div className="bg-slate-100 w-full h-24 flex items-center justify-center mb-2">
          <span className="text-2xl">🎬</span>
        </div>
      );
    } else if (isPdf) {
      // PDF 파일: PDF 아이콘
      return (
        <div className="bg-red-50 w-full h-24 flex items-center justify-center mb-2">
          <span className="text-2xl">📄</span>
        </div>
      );
    } else if (isDocument) {
      // 문서 파일: 문서 아이콘
      return (
        <div className="bg-emerald-50 w-full h-24 flex items-center justify-center mb-2">
          <span className="text-2xl">📝</span>
        </div>
      );
    } else {
      // 기타 파일: 일반 파일 아이콘
      return (
        <div className="bg-neutral-50 w-full h-24 flex items-center justify-center mb-2">
          <span className="text-2xl">📁</span>
        </div>
      );
    }
  };

  return (
    <div className="bg-gray-50 p-3 md:p-4 rounded-md mb-6">
      <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">첨부 파일</h2>
      
      {/* 파일 업로드 안내 */}
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
                <li>업로드된 파일은 조사보고서 저장 시 자동으로 첨부됩니다.</li>
                <li>조사 관련 증거 자료, 현장 사진, 관련 문서 등을 첨부하세요.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* 편집 모드일 때만 파일 업로더 표시 */}
      {editMode ? (
        <FileUploader
          value={attachments}
          onChange={handleAttachmentsChange}
          required={false}
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
      ) : (
        /* 읽기 모드일 때는 파일 목록과 미리보기/다운로드 기능 표시 */
        <div className="space-y-4">
          {attachments.length > 0 ? (
            <>
              <h3 className="text-lg font-medium text-gray-900">첨부된 파일 ({attachments.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {attachments.map((attachment, index) => (
                  <div key={attachment.fileId || index} className="border rounded-md p-2 bg-white">
                    {renderFilePreview(attachment)}
                    <p className="text-xs truncate mt-2">{attachment.name}</p>
                    <div className="flex justify-between items-center mt-2">
                      <button
                        onClick={() => handleImageClick(attachment)}
                        className="text-xs text-slate-600 hover:underline"
                      >
                        미리보기
                      </button>
                      <button
                        onClick={() => downloadFile(attachment.fileId || '')}
                        className="text-xs text-green-600 hover:underline"
                      >
                        다운로드
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2 text-sm">첨부된 파일이 없습니다.</p>
            </div>
          )}
        </div>
      )}

      {/* 이미지 확대 모달 */}
      {selectedImage && (
        <ImageModal
          isOpen={imageModalOpen}
          onClose={closeImageModal}
          imageUrl={selectedImage.url}
          imageName={selectedImage.name}
          fileId={selectedImage.fileId}
        />
      )}
    </div>
  );
};

export default AttachmentSection; 