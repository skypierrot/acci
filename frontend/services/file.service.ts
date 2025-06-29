/**
 * @file services/file.service.ts
 * @description
 *  - 파일 업로드, 다운로드, 삭제 등 파일 관리 API 호출을 담당하는 서비스
 *  - 보고서 첨부, 임시 파일 세션 관리 기능 포함
 */

import axios from 'axios';

export interface FileInfo {
  fileId: string;
  name: string;
  size: number;
  type: string;
  category: string;
  status: string;
  reportId?: string;
  reportType?: string;
  createdAt: string;
  previewUrl: string;
}

export interface UploadResponse {
  fileId: string;
  originalName: string;
  mimetype: string;
  size: number;
  category: string;
  sessionId: string;
  previewUrl: string;
}

export interface AttachResponse {
  success: boolean;
  attachedFiles: string[];
  message: string;
}

class FileService {
  private baseURL = '/api/files';

  /**
   * @method upload
   * @description 파일 업로드
   */
  async upload(
    file: File, 
    category: string = 'etc_documents', 
    sessionId?: string
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (sessionId) {
      formData.append('sessionId', sessionId);
    }

    const response = await axios.post(`${this.baseURL}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  }

  /**
   * @method attachToReport
   * @description 업로드된 파일들을 보고서에 첨부
   */
  async attachToReport(
    fileIds: string[],
    reportId: string,
    reportType: 'occurrence' | 'investigation'
  ): Promise<AttachResponse> {
    const response = await axios.post(`${this.baseURL}/attach`, {
      fileIds,
      reportId,
      reportType,
    });

    return response.data;
  }

  /**
   * @method getFileInfo
   * @description 파일 정보 조회
   */
  async getFileInfo(fileId: string): Promise<FileInfo> {
    const response = await axios.get(`${this.baseURL}/${fileId}/info`);
    return response.data;
  }

  /**
   * @method download
   * @description 파일 다운로드 (브라우저에서 다운로드 시작)
   */
  async download(fileId: string): Promise<void> {
    const response = await axios.get(`${this.baseURL}/${fileId}`, {
      responseType: 'blob',
    });

    // 파일 정보 가져오기
    const fileInfo = await this.getFileInfo(fileId);

    // 브라우저에서 다운로드 시작
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileInfo.name);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  /**
   * @method delete
   * @description 파일 삭제
   */
  async delete(fileId: string): Promise<void> {
    await axios.delete(`${this.baseURL}/${fileId}`);
  }

  /**
   * @method cleanupOrphanedFiles
   * @description 고아 파일 정리 (관리자용)
   */
  async cleanupOrphanedFiles(): Promise<{ message: string; deletedCount: number }> {
    const response = await axios.delete(`${this.baseURL}/cleanup`);
    return response.data;
  }

  /**
   * @method getFilesByReport
   * @description 특정 보고서에 첨부된 파일 목록 조회
   */
  async getFilesByReport(reportId: string, reportType: string): Promise<FileInfo[]> {
    const response = await axios.get(`${this.baseURL}/by-report`, {
      params: { reportId, reportType },
    });
    return response.data;
  }

  /**
   * @method generatePreviewUrl
   * @description 파일 미리보기 URL 생성
   */
  generatePreviewUrl(fileId: string): string {
    return `${this.baseURL}/${fileId}/preview`;
  }

  /**
   * @method validateFile
   * @description 업로드 전 파일 유효성 검사
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // 파일 크기 검사 (20MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: '파일 크기가 20MB를 초과합니다.' };
    }

    // 파일 형식 검사
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: '지원하지 않는 파일 형식입니다.' };
    }

    return { valid: true };
  }

  /**
   * @method formatFileSize
   * @description 파일 크기를 읽기 쉬운 형태로 변환
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * @method getFileIcon
   * @description 파일 타입에 따른 아이콘 URL 반환
   */
  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) {
      return '/icons/image.svg';
    } else if (mimeType.startsWith('video/')) {
      return '/icons/video.svg';
    } else if (mimeType === 'application/pdf') {
      return '/icons/pdf.svg';
    } else if (mimeType.includes('word')) {
      return '/icons/word.svg';
    } else if (mimeType.includes('excel') || mimeType.includes('sheet')) {
      return '/icons/excel.svg';
    } else {
      return '/icons/file.svg';
    }
  }
}

// 싱글톤 인스턴스 생성
const fileService = new FileService();
export default fileService; 