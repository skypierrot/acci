"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import ImageModal from "./ImageModal";
import { Attachment } from '../types/occurrence.types';

/**
 * @file components/FileUploader.tsx
 * @description
 *  - 파일(이미지, 문서 등)을 다중으로 업로드할 수 있는 컴포넌트
 *  - Drag & Drop 및 파일 선택 모두 지원
 *  - 업로드한 이미지는 미리보기로, 나머지 파일은 아이콘으로 표시
 *  - 드래그 앤 드롭으로 파일 순서 변경 가능
 *  - 파일 삭제 및 목록 관리 기능 포함
 */

interface FileUploaderProps {
  value?: Attachment[];
  onChange: (attachments: Attachment[]) => void;
  required?: boolean;
  multiple?: boolean;
  maxSize?: number; // MB 단위
  acceptedTypes?: string[];
}

export default function FileUploader({
  value = [],
  onChange,
  required = false,
  multiple = true,
  maxSize = 20,
  acceptedTypes = ['image/*', 'video/*', 'application/pdf', '.doc', '.docx', '.txt']
}: FileUploaderProps) {
  const [attachments, setAttachments] = useState<Attachment[]>(value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // value prop이 바뀌면 state 동기화
  useEffect(() => {
    setAttachments(value || []);
  }, [value]);

  // 파일 타입 검증
  const validateFile = (file: File): string | null => {
    // 파일 크기 검증
    if (file.size > maxSize * 1024 * 1024) {
      return `파일 크기는 ${maxSize}MB 이하여야 합니다.`;
    }

    // 파일 타입 검증
    const isValidType = acceptedTypes.some(type => {
      if (type.includes('*')) {
        return file.type.startsWith(type.replace('*', ''));
      }
      return file.type === type || file.name.toLowerCase().endsWith(type);
    });

    if (!isValidType) {
      return '지원하지 않는 파일 형식입니다.';
    }

    return null;
  };

  // 파일 업로드 처리
  const handleFilesAdded = async (files: FileList | File[]) => {
    setLoading(true);
    setError(null);
    
    const newAttachments: Attachment[] = [];
    const errors: string[] = [];

    for (const file of Array.from(files)) {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
        continue;
      }

      try {
        // 실제 파일 업로드 로직
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', 'occurrence_attachment');
        formData.append('sessionId', Date.now().toString());

        console.log('[FileUploader] 파일 업로드 시작:', file.name);

        const response = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`파일 업로드 실패: ${response.statusText}`);
        }

        const uploadResult = await response.json();
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || '파일 업로드 실패');
        }

        console.log('[FileUploader] 파일 업로드 성공:', uploadResult);

        // 서버에서 받은 파일 정보로 Attachment 객체 생성
        const newAttachment: Attachment = {
          name: file.name,
          url: uploadResult.fileId, // 파일 ID를 URL 필드에 저장 (기존 구조 유지)
          type: file.type,
          size: file.size,
          fileId: uploadResult.fileId, // 실제 파일 ID
          previewUrl: uploadResult.previewUrl // 미리보기 URL
        };

        newAttachments.push(newAttachment);

        console.log('[FileUploader] 생성된 Attachment:', newAttachment);
      } catch (uploadError) {
        console.error('[FileUploader] 파일 업로드 오류:', uploadError);
        errors.push(`${file.name}: ${uploadError instanceof Error ? uploadError.message : '업로드 실패'}`);
      }
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    const updated = [...attachments, ...newAttachments];
    setAttachments(updated);
    onChange(updated);
    setLoading(false);
  };

  // 파일 삭제
  const handleRemove = (index: number) => {
    const updated = attachments.filter((_, i) => i !== index);
    setAttachments(updated);
    onChange(updated);
  };

  // 드래그 앤 드롭 순서 변경
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newAttachments = [...attachments];
    const draggedItem = newAttachments[draggedIndex];
    
    // 드래그된 아이템 제거
    newAttachments.splice(draggedIndex, 1);
    
    // 새 위치에 삽입
    newAttachments.splice(dropIndex, 0, draggedItem);
    
    setAttachments(newAttachments);
    onChange(newAttachments);
    setDraggedIndex(null);
  };

  // 파일 타입별 아이콘 및 미리보기 렌더링
  const renderFilePreview = (attachment: Attachment, index: number) => {
    const isImage = attachment.type.startsWith('image/');
    const isVideo = attachment.type.startsWith('video/');
    const isPdf = attachment.type === 'application/pdf';
    const isDocument = attachment.type.includes('document') || 
                      attachment.type.includes('word') || 
                      attachment.name.toLowerCase().endsWith('.doc') ||
                      attachment.name.toLowerCase().endsWith('.docx');

    if (isImage) {
      return (
        <div 
          className="relative w-full h-24 bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
          onClick={() => setSelectedImageIndex(index)}
        >
          <img 
            src={attachment.previewUrl || attachment.url} 
            alt={attachment.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
            <span className="text-white opacity-0 hover:opacity-100 text-sm">미리보기</span>
          </div>
        </div>
      );
    }

    // 파일 타입별 아이콘
    let icon = '📄';
    let bgColor = 'bg-gray-100';
    
    if (isVideo) {
      icon = '🎬';
      bgColor = 'bg-purple-100';
    } else if (isPdf) {
      icon = '📄';
      bgColor = 'bg-red-100';
    } else if (isDocument) {
      icon = '📝';
      bgColor = 'bg-blue-100';
    }

    return (
      <div className={`w-full h-24 ${bgColor} rounded-lg flex items-center justify-center`}>
        <span className="text-3xl">{icon}</span>
      </div>
    );
  };

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 드롭존 설정
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: handleFilesAdded,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    multiple,
    maxSize: maxSize * 1024 * 1024,
    disabled: loading,
    noClick: false,
    noKeyboard: false
  });

  // 수동으로 파일 선택 창 열기
  const handleClick = () => {
    if (!loading) {
      open();
    }
  };

  return (
    <div className="space-y-4">
      {/* 파일 업로드 영역 */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="text-4xl">📎</div>
          <div className="text-sm text-gray-600">
            {isDragActive ? (
              <p>파일을 여기에 드롭하세요</p>
            ) : (
              <div className="space-y-3">
                <p>파일을 드래그하여 업로드하거나</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  파일 선택
                </button>
                <p className="text-xs text-gray-500">
                  최대 {maxSize}MB, 이미지/동영상/PDF/문서 파일 지원
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600 mt-2">파일 업로드 중...</p>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800 whitespace-pre-line">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 업로드된 파일 목록 */}
      {attachments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              업로드된 파일 ({attachments.length}개)
            </h3>
            <p className="text-xs text-gray-500">드래그하여 순서를 변경할 수 있습니다</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {attachments.map((attachment, index) => (
              <div
                key={`${attachment.url}-${index}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={`bg-white border rounded-lg p-3 hover:shadow-md transition-shadow cursor-move ${
                  draggedIndex === index ? 'opacity-50' : ''
                }`}
              >
                {/* 파일 미리보기 */}
                {renderFilePreview(attachment, index)}
                
                {/* 파일 정보 */}
                <div className="mt-2 space-y-1">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate pr-2">
                      {attachment.name}
                    </p>
                    <button
                      onClick={() => handleRemove(index)}
                      className="flex-shrink-0 text-red-500 hover:text-red-700 transition-colors"
                      title="파일 삭제"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{attachment.type}</span>
                    {attachment.size && <span>{formatFileSize(attachment.size)}</span>}
                  </div>
                  
                  {/* 순서 표시 */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">#{index + 1}</span>
                    <div className="flex items-center text-xs text-gray-400">
                      <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                      드래그하여 이동
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 이미지 모달 */}
      {selectedImageIndex !== null && (
        <ImageModal
          isOpen={true}
          onClose={() => setSelectedImageIndex(null)}
          imageUrl={attachments[selectedImageIndex]?.previewUrl || attachments[selectedImageIndex]?.url || ''}
          imageName={attachments[selectedImageIndex]?.name || ''}
          fileId={attachments[selectedImageIndex]?.fileId || attachments[selectedImageIndex]?.url || ''}
        />
      )}
    </div>
  );
}
