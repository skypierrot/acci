"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import ImageModal from "./ImageModal";
import FilePreview from "./FilePreview";
import ErrorMessage from "./ErrorMessage";
import { FileUploaderProps, FileValidationResult } from '../types/file-uploader.types';
import { Attachment } from '../types/occurrence.types';
import { ErrorType } from '../types/error.types';
import { logError } from '../utils/logger';

/**
 * @file components/FileUploader.tsx
 * @description
 *  - 파일(이미지, 문서 등)을 다중으로 업로드할 수 있는 컴포넌트
 *  - Drag & Drop 및 파일 선택 모두 지원
 *  - 업로드한 이미지는 미리보기로, 나머지 파일은 아이콘으로 표시
 *  - 드래그 앤 드롭으로 파일 순서 변경 가능
 *  - 파일 삭제 및 목록 관리 기능 포함
 */

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
  const validateFile = (file: File): FileValidationResult => {
    // 파일 크기 검증
    if (file.size > maxSize * 1024 * 1024) {
      return {
        isValid: false,
        error: `파일 크기는 ${maxSize}MB 이하여야 합니다.`
      };
    }

    // 파일 타입 검증
    const isValidType = acceptedTypes.some(type => {
      if (type.includes('*')) {
        return file.type.startsWith(type.replace('*', ''));
      }
      return file.type === type || file.name.toLowerCase().endsWith(type);
    });

    if (!isValidType) {
      return {
        isValid: false,
        error: '지원하지 않는 파일 형식입니다.'
      };
    }

    return { isValid: true };
  };

  // 파일 업로드 처리
  const handleFilesAdded = async (files: FileList | File[]) => {
    setLoading(true);
    setError(null);
    
    const newAttachments: Attachment[] = [];
    const errors: string[] = [];

    for (const file of Array.from(files)) {
      const validation = validateFile(file);
      if (!validation.isValid) {
        errors.push(`${file.name}: ${validation.error}`);
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

        const result = await response.json();
        
        if (result.success) {
          const newAttachment: Attachment = {
            name: file.name,
            url: result.fileUrl,
            type: file.type,
            size: file.size,
            fileId: result.fileId,
            previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
          };
          
          newAttachments.push(newAttachment);
          console.log('[FileUploader] 파일 업로드 성공:', file.name);
        } else {
          throw new Error(result.message || '파일 업로드 실패');
        }
              } catch (error) {
          logError('파일 업로드 실패', { fileName: file.name, fileSize: file.size }, error as Error);
          errors.push(`${file.name}: 업로드 실패`);
        }
    }

    // 에러가 있으면 표시
    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    // 성공한 파일들 추가
    if (newAttachments.length > 0) {
      const updatedAttachments = [...attachments, ...newAttachments];
      setAttachments(updatedAttachments);
      onChange(updatedAttachments);
    }

    setLoading(false);
  };

  // 파일 삭제
  const handleRemove = (index: number) => {
    const updatedAttachments = attachments.filter((_, i) => i !== index);
    setAttachments(updatedAttachments);
    onChange(updatedAttachments);
  };

  // 드래그 앤 드롭 이벤트 핸들러
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

    const updatedAttachments = [...attachments];
    const [draggedItem] = updatedAttachments.splice(draggedIndex, 1);
    updatedAttachments.splice(dropIndex, 0, draggedItem);
    
    setAttachments(updatedAttachments);
    onChange(updatedAttachments);
    setDraggedIndex(null);
  };

  // 이미지 클릭 핸들러
  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  // 이미지 모달 닫기
  const handleCloseModal = () => {
    setSelectedImageIndex(null);
  };

  // Dropzone 설정
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFilesAdded,
    multiple,
    accept: acceptedTypes.reduce((acc, type) => {
      if (type.includes('*')) {
        const baseType = type.replace('*', '');
        acc[baseType] = [];
      } else {
        acc[type] = [];
      }
      return acc;
    }, {} as Record<string, string[]>)
  });

  return (
    <div className="space-y-4">
      {/* 파일 업로드 영역 */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <div className="text-4xl">📁</div>
          <p className="text-lg font-medium text-gray-700">
            {isDragActive ? '파일을 여기에 놓으세요' : '파일을 드래그하거나 클릭하여 선택하세요'}
          </p>
          <p className="text-sm text-gray-500">
            지원 형식: {acceptedTypes.join(', ')} | 최대 크기: {maxSize}MB
          </p>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <ErrorMessage
          error={error}
          type={ErrorType.VALIDATION}
          onClose={() => setError(null)}
          className="mb-4"
        />
      )}

      {/* 로딩 상태 */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-700 text-sm">파일을 업로드하고 있습니다...</p>
        </div>
      )}

      {/* 파일 목록 */}
      {attachments.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">업로드된 파일 ({attachments.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {attachments.map((attachment, index) => (
              <FilePreview
                key={attachment.fileId || index}
                attachment={attachment}
                index={index}
                onRemove={handleRemove}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onImageClick={handleImageClick}
                isDragging={draggedIndex !== null}
                draggedIndex={draggedIndex}
              />
            ))}
          </div>
        </div>
      )}

      {/* 이미지 모달 */}
      {selectedImageIndex !== null && (
        <ImageModal
          isOpen={true}
          onClose={handleCloseModal}
          imageUrl={attachments[selectedImageIndex]?.previewUrl || attachments[selectedImageIndex]?.url || ''}
          imageName={attachments[selectedImageIndex]?.name || ''}
          fileId={attachments[selectedImageIndex]?.fileId || attachments[selectedImageIndex]?.url || ''}
        />
      )}
    </div>
  );
}
