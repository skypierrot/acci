/**
 * @file __tests__/utils/test-utils.tsx
 * @description 테스트 유틸리티 함수
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ErrorBoundary } from '../../components/ErrorBoundary';

// 커스텀 렌더러를 위한 AllTheProviders 타입
interface AllTheProvidersProps {
  children: React.ReactNode;
}

// 모든 프로바이더를 포함한 커스텀 렌더러
const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
};

// 커스텀 렌더 함수
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// 재내보내기
export * from '@testing-library/react';
export { customRender as render };

// 테스트 데이터 생성 함수들
export const createMockAccidentReport = (overrides = {}) => ({
  accident_id: 'test-accident-1',
  global_accident_no: 'ACC-2025-001',
  accident_name: '테스트 사고',
  final_accident_name: '테스트 사고 (최종)',
  site_name: '테스트 사업장',
  acci_time: '2025-01-01T10:00:00Z',
  final_acci_time: '2025-01-01T10:00:00Z',
  status: 'completed',
  ...overrides
});

export const createMockInvestigationReport = (overrides = {}) => ({
  accident_id: 'test-accident-1',
  investigation_id: 'inv-001',
  status: 'completed',
  ...overrides
});

export const createMockAttachment = (overrides = {}) => ({
  name: 'test-file.jpg',
  url: 'http://example.com/test-file.jpg',
  type: 'image/jpeg',
  size: 1024,
  fileId: 'file-001',
  previewUrl: 'http://example.com/preview.jpg',
  ...overrides
});

// API 응답 모킹 함수들
export const mockApiResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    headers: new Headers({
      'content-type': 'application/json',
    }),
  });
};

export const mockApiError = (status = 500, message = 'Internal Server Error') => {
  return Promise.resolve({
    ok: false,
    status,
    statusText: message,
    json: () => Promise.resolve({ error: { message } }),
    headers: new Headers({
      'content-type': 'application/json',
    }),
  });
};

// 사용자 이벤트 시뮬레이션 함수들
export const simulateFileUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return mockApiResponse({
    success: true,
    fileId: 'uploaded-file-id',
    fileUrl: 'http://example.com/uploaded-file.jpg',
    previewUrl: 'http://example.com/preview.jpg'
  });
};

export const simulateApiCall = async (endpoint: string, data?: any) => {
  // 실제 API 호출을 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return mockApiResponse({
    success: true,
    data: data || {}
  });
};

// 테스트 환경 설정 함수들
export const setupTestEnvironment = () => {
  // 전역 fetch 모킹
  global.fetch = jest.fn();
  
  // 전역 console 모킹
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
};

export const cleanupTestEnvironment = () => {
  jest.clearAllMocks();
  jest.resetAllMocks();
};

// 테스트 헬퍼 함수들
export const waitForElementToBeRemoved = (element: HTMLElement) => {
  return new Promise<void>((resolve) => {
    const observer = new MutationObserver(() => {
      if (!document.contains(element)) {
        observer.disconnect();
        resolve();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
};

export const createMockFile = (name: string, type: string, size: number): File => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false,
  });
  return file;
}; 