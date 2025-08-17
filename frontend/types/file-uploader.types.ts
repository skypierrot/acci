/**
 * @file types/file-uploader.types.ts
 * @description FileUploader 관련 타입 정의
 */

import { Attachment } from './occurrence.types';

// FileUploader Props 타입
export interface FileUploaderProps {
  value?: Attachment[];
  onChange: (attachments: Attachment[]) => void;
  required?: boolean;
  multiple?: boolean;
  maxSize?: number; // MB 단위
  acceptedTypes?: string[];
}

// 파일 검증 결과 타입
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

// 파일 업로드 상태 타입
export interface FileUploadState {
  loading: boolean;
  error: string | null;
  draggedIndex: number | null;
  selectedImageIndex: number | null;
}

// 드래그 앤 드롭 이벤트 타입
export interface DragDropEvent {
  draggedIndex: number | null;
  dropIndex: number;
}

// 파일 미리보기 렌더링 타입
export interface FilePreviewProps {
  attachment: Attachment;
  index: number;
  onRemove: (index: number) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, dropIndex: number) => void;
  onImageClick: (index: number) => void;
  isDragging: boolean;
  draggedIndex: number | null;
} 