"use client";

import React, { useEffect, useState, useRef } from 'react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageName: string;
  fileId: string;
}

/**
 * @component ImageModal
 * @description 이미지를 원본 크기로 확대해서 보여주는 모달 컴포넌트
 * - ESC 키로 닫기
 * - 배경 클릭으로 닫기
 * - 마우스 휠로 확대/축소
 * - 드래그로 이미지 이동
 */
const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  imageName,
  fileId,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);

  // 모달이 열릴 때마다 초기화
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setLoading(true);
      // body 스크롤 방지
      document.body.style.overflow = 'hidden';
    } else {
      // body 스크롤 복원
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // 마우스 휠 이벤트 처리를 위한 ref
  const modalRef = useRef<HTMLDivElement>(null);

  // 마우스 휠로 확대/축소 - useEffect로 직접 이벤트 리스너 등록
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale(prevScale => Math.max(0.1, Math.min(5, prevScale * delta)));
    };

    const modalElement = modalRef.current;
    if (modalElement && isOpen) {
      // passive: false로 설정하여 preventDefault 사용 가능
      modalElement.addEventListener('wheel', handleWheel, { passive: false });
      
      return () => {
        modalElement.removeEventListener('wheel', handleWheel);
      };
    }
  }, [isOpen]);

  // 드래그 시작
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) return; // 배경 클릭은 드래그 시작하지 않음
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  // 드래그 중
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  // 드래그 종료
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 확대/축소 버튼
  const handleZoomIn = () => {
    setScale(prev => Math.min(5, prev * 1.2));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.1, prev / 1.2));
  };

  // 리셋
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // 다운로드
  const handleDownload = async () => {
    try {
      const response = await fetch(`http://192.168.100.200:6001/api/files/${fileId}`);
      if (!response.ok) {
        throw new Error('파일 다운로드 실패');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = imageName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('다운로드 실패:', error);
      alert('파일 다운로드에 실패했습니다.');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* 상단 툴바 */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <div className="flex items-center space-x-2 bg-black bg-opacity-50 rounded-lg px-3 py-2">
          <span className="text-white text-sm font-medium truncate max-w-xs">
            {imageName}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 확대/축소 컨트롤 */}
          <div className="flex items-center space-x-1 bg-black bg-opacity-50 rounded-lg px-2 py-1">
            <button
              onClick={handleZoomOut}
              className="text-white hover:text-gray-300 p-1"
              title="축소"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            
            <span className="text-white text-sm px-2 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <button
              onClick={handleZoomIn}
              className="text-white hover:text-gray-300 p-1"
              title="확대"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            
            <button
              onClick={handleReset}
              className="text-white hover:text-gray-300 p-1 ml-2"
              title="원본 크기"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* 다운로드 버튼 */}
          <button
            onClick={handleDownload}
            className="bg-black bg-opacity-50 rounded-lg p-2 text-white hover:text-gray-300"
            title="다운로드"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>

          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="bg-black bg-opacity-50 rounded-lg p-2 text-white hover:text-gray-300"
            title="닫기 (ESC)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 이미지 컨테이너 */}
      <div 
        ref={modalRef}
        className="relative w-full h-full flex items-center justify-center cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}
        
        <img
          src={imageUrl}
          alt={imageName}
          className="max-w-none select-none"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
          onLoad={() => setLoading(false)}
          onError={() => setLoading(false)}
          draggable={false}
        />
      </div>

      {/* 하단 도움말 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="bg-black bg-opacity-50 rounded-lg px-4 py-2">
          <p className="text-white text-xs text-center">
            마우스 휠: 확대/축소 | 드래그: 이동 | ESC: 닫기
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImageModal; 