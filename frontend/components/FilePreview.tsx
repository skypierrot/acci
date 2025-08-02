/**
 * @file components/FilePreview.tsx
 * @description 파일 미리보기 컴포넌트
 */

import React from 'react';
import { FilePreviewProps } from '../types/file-uploader.types';

/**
 * 파일 미리보기 컴포넌트
 * - 이미지, 문서 등 다양한 파일 타입의 미리보기 제공
 * - 드래그 앤 드롭으로 순서 변경 지원
 * - 파일 삭제 기능 포함
 */
const FilePreview: React.FC<FilePreviewProps> = React.memo(({
  attachment,
  index,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onImageClick,
  isDragging,
  draggedIndex
}) => {
  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 파일 타입에 따른 아이콘 결정
  const getFileIcon = (type: string): string => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('doc')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📈';
    return '📎';
  };

  // 이미지 파일인지 확인
  const isImage = attachment.type.startsWith('image/');

  return (
    <div
      className={`relative group border-2 border-dashed border-gray-300 rounded-lg p-3 bg-white hover:border-blue-400 transition-all duration-200 ${
        isDragging && draggedIndex === index ? 'border-blue-500 bg-blue-50' : ''
      }`}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
    >
      {/* 삭제 버튼 */}
      <button
        onClick={() => onRemove(index)}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors z-10"
        title="파일 삭제"
      >
        ×
      </button>

      {/* 파일 미리보기 */}
      <div className="flex flex-col items-center space-y-2">
        {isImage ? (
          // 이미지 미리보기
          <div className="relative w-full h-32 overflow-hidden rounded">
            <img
              src={attachment.previewUrl || attachment.url}
              alt={attachment.name}
              className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onImageClick(index)}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
              <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                클릭하여 확대
              </span>
            </div>
          </div>
        ) : (
          // 문서 아이콘
          <div className="w-16 h-16 flex items-center justify-center text-3xl bg-gray-100 rounded-lg">
            {getFileIcon(attachment.type)}
          </div>
        )}

        {/* 파일 정보 */}
        <div className="text-center w-full">
          <p className="text-sm font-medium text-gray-900 truncate" title={attachment.name}>
            {attachment.name}
          </p>
          {attachment.size && (
            <p className="text-xs text-gray-500">
              {formatFileSize(attachment.size)}
            </p>
          )}
          <p className="text-xs text-gray-400">
            {attachment.type}
          </p>
        </div>

        {/* 드래그 안내 */}
        <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
          순서 변경을 위해 드래그하세요
        </div>
      </div>
    </div>
  );
});

FilePreview.displayName = 'FilePreview';

export default FilePreview; 