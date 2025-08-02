/**
 * @file utils/apiErrorHandler.ts
 * @description API 에러 처리 유틸리티
 */

import { ErrorType, ApiErrorResponse } from '../types/error.types';
import { logError } from './logger';

/**
 * HTTP 상태 코드를 ErrorType으로 변환
 */
export function getErrorTypeFromStatus(status: number): ErrorType {
  switch (status) {
    case 400:
      return ErrorType.VALIDATION;
    case 401:
      return ErrorType.AUTHENTICATION;
    case 403:
      return ErrorType.AUTHORIZATION;
    case 404:
      return ErrorType.NOT_FOUND;
    case 500:
    case 502:
    case 503:
    case 504:
      return ErrorType.SERVER_ERROR;
    default:
      return ErrorType.UNKNOWN;
  }
}

/**
 * 네트워크 에러인지 확인
 */
export function isNetworkError(error: any): boolean {
  return (
    error.name === 'TypeError' ||
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('Failed to fetch')
  );
}

/**
 * API 응답에서 에러 정보 추출
 */
export function extractApiError(response: Response, data?: any): {
  type: ErrorType;
  message: string;
  details?: any;
} {
  // 네트워크 에러
  if (!response.ok) {
    const errorType = getErrorTypeFromStatus(response.status);
    
    // API에서 반환한 에러 메시지가 있는 경우
    if (data && typeof data === 'object' && 'error' in data) {
      const apiError = data as ApiErrorResponse;
      return {
        type: errorType,
        message: apiError.error.message || `HTTP ${response.status}: ${response.statusText}`,
        details: apiError.error.details
      };
    }
    
    // 기본 HTTP 에러 메시지
    return {
      type: errorType,
      message: `HTTP ${response.status}: ${response.statusText}`
    };
  }
  
  // 성공 응답이지만 에러 데이터가 포함된 경우
  if (data && typeof data === 'object' && 'success' in data && !data.success) {
    const apiError = data as ApiErrorResponse;
    return {
      type: ErrorType.UNKNOWN,
      message: apiError.error.message || '알 수 없는 오류가 발생했습니다.',
      details: apiError.error.details
    };
  }
  
  return {
    type: ErrorType.UNKNOWN,
    message: '알 수 없는 오류가 발생했습니다.'
  };
}

/**
 * API 호출 에러 처리
 */
export async function handleApiError(
  response: Response,
  data?: any,
  context?: Record<string, any>
): Promise<never> {
  const errorInfo = extractApiError(response, data);
  
  // 에러 로깅
  logError('API 호출 실패', {
    url: response.url,
    status: response.status,
    statusText: response.statusText,
    errorType: errorInfo.type,
    errorMessage: errorInfo.message,
    ...context
  });
  
  // 에러 객체 생성
  const error = new Error(errorInfo.message);
  (error as any).type = errorInfo.type;
  (error as any).status = response.status;
  (error as any).details = errorInfo.details;
  
  throw error;
}

/**
 * 네트워크 에러 처리
 */
export function handleNetworkError(
  error: Error,
  context?: Record<string, any>
): never {
  // 네트워크 에러 로깅
  logError('네트워크 에러', {
    errorName: error.name,
    errorMessage: error.message,
    ...context
  }, error);
  
  // 네트워크 에러 객체 생성
  const networkError = new Error('네트워크 연결에 실패했습니다. 인터넷 연결을 확인해 주세요.');
  (networkError as any).type = ErrorType.NETWORK;
  (networkError as any).originalError = error;
  
  throw networkError;
}

/**
 * 일반적인 에러 처리
 */
export function handleGeneralError(
  error: Error,
  context?: Record<string, any>
): never {
  // 에러 로깅
  logError('일반 에러', {
    errorName: error.name,
    errorMessage: error.message,
    ...context
  }, error);
  
  // 에러 타입 설정
  if (!(error as any).type) {
    (error as any).type = ErrorType.UNKNOWN;
  }
  
  throw error;
}

/**
 * fetch 래퍼 함수 (에러 처리 포함)
 */
export async function fetchWithErrorHandling(
  url: string,
  options: RequestInit = {},
  context?: Record<string, any>
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    // 응답 데이터 파싱 시도
    let data: any;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (parseError) {
        // JSON 파싱 실패는 무시하고 계속 진행
      }
    }
    
    // 에러 응답 처리
    if (!response.ok) {
      await handleApiError(response, data, context);
    }
    
    return response;
  } catch (error) {
    // 네트워크 에러 처리
    if (error instanceof TypeError || isNetworkError(error)) {
      handleNetworkError(error, context);
    }
    
    // 이미 처리된 에러는 그대로 던지기
    if ((error as any).type) {
      throw error;
    }
    
    // 기타 에러 처리
    handleGeneralError(error as Error, context);
  }
}

/**
 * 사용자 친화적 에러 메시지 생성
 */
export function getUserFriendlyMessage(error: Error): string {
  const errorType = (error as any).type || ErrorType.UNKNOWN;
  
  switch (errorType) {
    case ErrorType.NETWORK:
      return '네트워크 연결을 확인하고 다시 시도해 주세요.';
    case ErrorType.VALIDATION:
      return '입력하신 정보를 확인하고 다시 시도해 주세요.';
    case ErrorType.AUTHENTICATION:
      return '로그인이 필요합니다. 다시 로그인해 주세요.';
    case ErrorType.AUTHORIZATION:
      return '이 기능에 접근할 권한이 없습니다.';
    case ErrorType.NOT_FOUND:
      return '요청하신 정보를 찾을 수 없습니다.';
    case ErrorType.SERVER_ERROR:
      return '서버에서 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
    default:
      return '예상치 못한 오류가 발생했습니다. 다시 시도해 주세요.';
  }
} 