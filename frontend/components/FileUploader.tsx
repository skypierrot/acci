"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";

interface UploadedFile {
  id: string;         // 서버에서 발급한 파일 고유 ID
  name: string;       // 원본 파일명
  previewUrl: string; // 이미지인 경우 미리보기 URL, 아니면 파일 아이콘 URL
  size: number;       // 파일 크기
  category: string;   // 파일 카테고리
}

/**
 * @file components/FileUploader.tsx
 * @description
 *  - 파일(이미지, 문서 등)을 다중으로 업로드할 수 있는 컴포넌트
 *  - Drag & Drop 및 파일 선택 모두 지원
 *  - 업로드한 이미지는 미리보기로, 나머지 파일은 아이콘으로 표시
 *  - 업로드된 파일 ID 목록을 상위 컴포넌트에 전달(onChange)
 *  - 임시 파일 세션 관리 및 보고서 첨부 기능 포함
 */
export default function FileUploader({
  onChange,
  required = false,
  category = "etc_documents",
  sessionId,
  initialFiles = [],
}: {
  onChange: (fileIds: string[]) => void; // 파일 ID 배열을 부모로 전달하는 콜백
  required?: boolean; // 필수 필드 여부
  category?: string; // 파일 카테고리 (scene_photos, cctv_video, statement_docs, etc_documents)
  sessionId?: string; // 임시 파일 세션 ID
  initialFiles?: string[]; // 초기 파일 ID 목록 (수정 모드용)
}) {
  // state: 업로드된 파일 목록
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string>(sessionId || '');
  const [isInitialized, setIsInitialized] = useState(false);

  // onChange 콜백을 ref에 저장하여 의존성 문제 해결
  const onChangeRef = useRef(onChange);
  
  // onChange가 변경될 때마다 ref 업데이트
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // 초기 파일 로드
  useEffect(() => {
    console.log('[FileUploader] 초기 파일 로드 확인:', { 
      initialFiles, 
      hasFiles: initialFiles && initialFiles.length > 0, 
      isInitialized,
      category 
    });
    
    if (initialFiles && initialFiles.length > 0 && !isInitialized) {
      console.log('[FileUploader] 초기 파일 로드 시작:', initialFiles);
      loadInitialFiles(initialFiles);
    } else if (initialFiles.length === 0 && !isInitialized) {
      console.log('[FileUploader] 초기 파일 없음, 초기화 완료');
      setIsInitialized(true);
    }
  }, [initialFiles, isInitialized, category]);

  // 파일 ID 변경 시 부모 컴포넌트에 알림 (초기 로드 시에는 호출하지 않음)
  useEffect(() => {
    if (isInitialized) {
      const fileIds = uploadedFiles.map(f => f.id);
      onChangeRef.current(fileIds);
    }
  }, [uploadedFiles, isInitialized]);

  /**
   * @function loadInitialFiles
   * @description 초기 파일 목록 로드 (수정 모드용)
   */
  const loadInitialFiles = async (fileIds: string[]) => {
    try {
      console.log('[FileUploader] loadInitialFiles 시작:', fileIds);
      setLoading(true);
      const fileInfoPromises = fileIds.map(async (fileId) => {
        try {
          console.log(`[FileUploader] 파일 ${fileId} 정보 요청 중...`);
          const response = await axios.get(`http://192.168.100.200:6001/api/files/${fileId}/info`);
          const fileInfo = response.data;
          console.log(`[FileUploader] 파일 ${fileId} 정보 로드 성공:`, fileInfo);
          return {
            id: fileId,
            name: fileInfo.name,
            previewUrl: fileInfo.previewUrl || '/icons/file.svg',
            size: fileInfo.size,
            category: fileInfo.category || category,
          };
        } catch (error: any) {
          console.error(`[FileUploader] 파일 ${fileId} 정보 로드 실패:`, error);
          console.error(`[FileUploader] 에러 상세:`, {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
          });
          return null;
        }
      });

      const loadedFiles = (await Promise.all(fileInfoPromises)).filter(Boolean) as UploadedFile[];
      console.log('[FileUploader] 최종 로드된 파일들:', loadedFiles);
      setUploadedFiles(loadedFiles);
      setIsInitialized(true); // 초기 로드 완료 후 초기화 플래그 설정
    } catch (error) {
      console.error('[FileUploader] 초기 파일 로드 실패:', error);
      setError('파일 정보를 불러오는 중 오류가 발생했습니다.');
      setIsInitialized(true); // 에러가 발생해도 초기화 완료로 표시
    } finally {
      setLoading(false);
    }
  };

  /**
   * @function onDrop
   * @description
   *  - 사용자가 파일을 드롭하거나 선택했을 때 실행되는 콜백
   *  - 서버에 파일을 업로드하고, 반환된 fileId와 미리보기 URL을 저장
   */
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setLoading(true);
      setError(null);
      const newUploaded: UploadedFile[] = [];

      for (const file of acceptedFiles) {
        try {
          // FormData에 파일을 담아 POST 요청
          const formData = new FormData();
          formData.append("file", file);
          formData.append("category", category);
          if (currentSessionId) {
            formData.append("sessionId", currentSessionId);
          }

          // 파일 업로드 API 호출 - 클라이언트에서는 외부 포트 사용
          const response = await axios.post("http://192.168.100.200:6001/api/files/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          
          const { fileId, originalName, size, sessionId: newSessionId, previewUrl } = response.data;

          // 세션 ID 업데이트
          if (newSessionId && !currentSessionId) {
            setCurrentSessionId(newSessionId);
          }

          newUploaded.push({
            id: fileId,
            name: originalName,
            previewUrl: previewUrl || '/icons/file.svg',
            size: size,
            category: category,
          });
        } catch (error: any) {
          console.error('파일 업로드 실패:', error);
          setError(`파일 "${file.name}" 업로드 실패: ${error.response?.data?.error || error.message}`);
        }
      }

      // state에 합쳐서 저장
      setUploadedFiles(prev => [...prev, ...newUploaded]);
      setLoading(false);
    },
    [category, currentSessionId]
  );

  // react-dropzone 훅 설정: 다중 업로드, onDrop 콜백 연결
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.mpeg', '.quicktime', '.webm'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxSize: 20 * 1024 * 1024, // 20MB
  });

  /**
   * @function removeFile
   * @description
   *  - 업로드된 파일 중 하나를 삭제할 때 사용
   *  - 서버에서도 파일을 삭제하고 state에서 제거
   */
  const removeFile = async (id: string) => {
    try {
      // 서버에서 파일 삭제 - 클라이언트에서는 외부 포트 사용
      await axios.delete(`http://192.168.100.200:6001/api/files/${id}`);
      
      // state에서 제거
      setUploadedFiles(prev => prev.filter(f => f.id !== id));
    } catch (error: any) {
      console.error('파일 삭제 실패:', error);
      setError(`파일 삭제 실패: ${error.response?.data?.error || error.message}`);
    }
  };

  /**
   * @function formatFileSize
   * @description 파일 크기를 읽기 쉬운 형태로 변환
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * @function renderFilePreview
   * @description 파일 타입에 따른 미리보기 렌더링
   */
  const renderFilePreview = (file: UploadedFile) => {
    // 백엔드에서 반환된 previewUrl이 이미지 미리보기인 경우
    if (file.previewUrl && file.previewUrl.includes('/preview')) {
      return (
        <img
          src={file.previewUrl}
          alt={file.name}
          className="w-12 h-12 object-cover rounded"
          onError={(e) => {
            // 이미지 로드 실패 시 파일 타입에 따른 기본 아이콘으로 대체
            const target = e.target as HTMLImageElement;
            const fileExt = file.name.split('.').pop()?.toLowerCase();
            
            if (fileExt && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
              target.src = '/icons/image.svg';
            } else if (fileExt && ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(fileExt)) {
              target.src = '/icons/video.svg';
            } else if (fileExt === 'pdf') {
              target.src = '/icons/pdf.svg';
            } else if (fileExt && ['doc', 'docx'].includes(fileExt)) {
              target.src = '/icons/word.svg';
            } else if (fileExt && ['xls', 'xlsx'].includes(fileExt)) {
              target.src = '/icons/excel.svg';
            } else {
              target.src = '/icons/file.svg';
            }
          }}
        />
      );
    } else {
      // 아이콘 표시 (파일 확장자에 따라 적절한 아이콘 선택)
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      let iconSrc = '/icons/file.svg';
      
      if (fileExt && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
        iconSrc = '/icons/image.svg';
      } else if (fileExt && ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(fileExt)) {
        iconSrc = '/icons/video.svg';
      } else if (fileExt === 'pdf') {
        iconSrc = '/icons/pdf.svg';
      } else if (fileExt && ['doc', 'docx'].includes(fileExt)) {
        iconSrc = '/icons/word.svg';
      } else if (fileExt && ['xls', 'xlsx'].includes(fileExt)) {
        iconSrc = '/icons/excel.svg';
      }
      
      return (
        <img
          src={iconSrc}
          alt="file icon"
          className="w-12 h-12 object-contain"
        />
      );
    }
  };

  return (
    <section className="border-2 border-dashed border-gray-300 p-4 rounded-md">
      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 text-xs mt-1"
          >
            닫기
          </button>
        </div>
      )}

      {/* Drag & Drop 구역 */}
      <div
        {...getRootProps()}
        className={`cursor-pointer p-8 text-center transition-colors ${
          isDragActive 
            ? "bg-blue-50 border-blue-300" 
            : "hover:bg-gray-50"
        } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} required={required && uploadedFiles.length === 0} disabled={loading} />
        
        {loading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-gray-600">파일 업로드 중...</p>
          </div>
        ) : isDragActive ? (
          <div className="flex flex-col items-center">
            <div className="text-4xl mb-2">📁</div>
            <p className="text-blue-600">여기에 파일을 드래그하세요</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="text-4xl mb-2">📎</div>
            <p className="text-gray-600">
              파일을 클릭하거나 드래그하여 업로드
              {required && <span className="text-red-500 ml-1">*</span>}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              최대 20MB, 이미지/동영상/문서 파일 지원
            </p>
          </div>
        )}
      </div>

      {/* 업로드된 파일 목록 */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            업로드된 파일 ({uploadedFiles.length}개)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="relative bg-white border border-gray-200 rounded-lg p-3">
                {/* 파일 미리보기 또는 아이콘 */}
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {renderFilePreview(file)}
                  </div>
                  
                  {/* 파일 정보 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                {/* 삭제 버튼 */}
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors"
                  title="파일 삭제"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
