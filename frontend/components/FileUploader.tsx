"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";

interface UploadedFile {
  id: string;         // 서버에서 발급한 파일 고유 ID
  name: string;       // 원본 파일명
  previewUrl: string; // 이미지인 경우 미리보기 URL, 아니면 파일 아이콘 URL
}

/**
 * @file components/FileUploader.tsx
 * @description
 *  - 파일(이미지, 문서 등)을 다중으로 업로드할 수 있는 컴포넌트
 *  - Drag & Drop 및 파일 선택 모두 지원
 *  - 업로드한 이미지는 미리보기로, 나머지 파일은 아이콘으로 표시
 *  - 업로드된 파일 ID 목록을 상위 컴포넌트에 전달(onChange)
 */
export default function FileUploader({
  onChange,
  required = false,
}: {
  onChange: (fileIds: string[]) => void; // 파일 ID 배열을 부모로 전달하는 콜백
  required?: boolean; // 필수 필드 여부
}) {
  // state: 업로드된 파일 목록
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  /**
   * @function onDrop
   * @description
   *  - 사용자가 파일을 드롭하거나 선택했을 때 실행되는 콜백
   *  - 서버에 파일을 업로드하고, 반환된 fileId와 미리보기 URL을 저장
   */
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newUploaded: UploadedFile[] = [];

      for (const file of acceptedFiles) {
        // FormData에 파일을 담아 POST 요청
        const formData = new FormData();
        formData.append("file", file);

        // 파일 업로드 API 호출
        const response = await axios.post("/api/files/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const { fileId } = response.data;

        // 이미지 파일인지 확인 (미리보기 처리)
        const isImage = file.type.startsWith("image/");
        const previewUrl = isImage
          ? URL.createObjectURL(file) // 브라우저에서 바로 생성한 미리보기 URL
          : "/icons/file.svg";        // 이미지가 아니면 generic 파일 아이콘

        newUploaded.push({ id: fileId, name: file.name, previewUrl });
      }

      // state에 합쳐서 저장하고, 부모 컴포넌트에 fileId 목록 전달
      setUploadedFiles((prev) => {
        const all = [...prev, ...newUploaded];
        onChange(all.map((f) => f.id));
        return all;
      });
    },
    [onChange]
  );

  // react-dropzone 훅 설정: 다중 업로드, onDrop 콜백 연결
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  /**
   * @function removeFile
   * @description
   *  - 업로드된 파일 중 하나를 삭제할 때 사용
   *  - 해당 파일 ID를 state에서 제거한 뒤 부모에게 업데이트된 ID 목록 전달
   */
  const removeFile = (id: string) => {
    setUploadedFiles((prev) => {
      const filtered = prev.filter((f) => f.id !== id);
      onChange(filtered.map((f) => f.id));
      return filtered;
    });
  };

  return (
    <section className="border-2 border-dashed p-4 rounded-md">
      {/* Drag & Drop 구역 */}
      <div
        {...getRootProps()}
        className={`cursor-pointer p-8 text-center ${
          isDragActive ? "bg-blue-50" : ""
        }`}
      >
        <input {...getInputProps()} required={required} />
        {isDragActive ? (
          <p>여기에 파일을 드래그하세요 …</p>
        ) : (
          <p>
            파일을 클릭하거나 드래그하여 업로드
            {required && <span className="text-red-500 ml-1">*</span>}
          </p>
        )}
      </div>

      {/* 업로드된 파일 목록 (썸네일/아이콘 + 파일명) */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {uploadedFiles.map((file) => (
          <div key={file.id} className="relative">
            {/* 이미지 미리보기 또는 아이콘 */}
            <img
              src={file.previewUrl}
              alt={file.name}
              className="w-full h-24 object-cover rounded"
            />
            {/* 삭제 버튼 */}
            <button
              type="button"
              onClick={() => removeFile(file.id)}
              className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
            >
              ×
            </button>
            {/* 파일명 */}
            <p className="text-xs mt-1 truncate">{file.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
