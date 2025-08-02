/**
 * @file components/ErrorMessage.tsx
 * @description 사용자 친화적 에러 메시지 컴포넌트
 */

import React, { useState } from 'react';
import { ErrorType, UserFriendlyError } from '../types/error.types';

interface ErrorMessageProps {
  error: Error | string;
  type?: ErrorType;
  onRetry?: () => void;
  onClose?: () => void;
  showDetails?: boolean;
  className?: string;
}

/**
 * 사용자 친화적 에러 메시지 컴포넌트
 * - 에러 타입별 적절한 메시지 표시
 * - 재시도 및 닫기 기능 제공
 * - 상세 정보 토글 기능
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  type = ErrorType.UNKNOWN,
  onRetry,
  onClose,
  showDetails = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(showDetails);

  // 에러 메시지 파싱
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'string' ? undefined : error.stack;

  // 에러 타입별 사용자 친화적 메시지 생성
  const getUserFriendlyError = (): UserFriendlyError => {
    switch (type) {
      case ErrorType.NETWORK:
        return {
          title: '네트워크 연결 오류',
          message: '인터넷 연결을 확인하고 다시 시도해 주세요.',
          suggestion: '네트워크 연결 상태를 확인해 주세요.',
          action: onRetry ? {
            label: '다시 시도',
            onClick: onRetry
          } : undefined
        };

      case ErrorType.VALIDATION:
        return {
          title: '입력 데이터 오류',
          message: '입력하신 정보를 확인하고 다시 시도해 주세요.',
          suggestion: '필수 항목이 모두 입력되었는지 확인해 주세요.',
          action: onRetry ? {
            label: '다시 입력',
            onClick: onRetry
          } : undefined
        };

      case ErrorType.AUTHENTICATION:
        return {
          title: '인증 오류',
          message: '로그인이 필요하거나 세션이 만료되었습니다.',
          suggestion: '다시 로그인해 주세요.',
          action: {
            label: '로그인',
            onClick: () => window.location.href = '/auth'
          }
        };

      case ErrorType.AUTHORIZATION:
        return {
          title: '권한 오류',
          message: '이 기능에 접근할 권한이 없습니다.',
          suggestion: '관리자에게 권한을 요청해 주세요.',
          action: {
            label: '이전 페이지로',
            onClick: () => window.history.back()
          }
        };

      case ErrorType.NOT_FOUND:
        return {
          title: '페이지를 찾을 수 없습니다',
          message: '요청하신 페이지가 존재하지 않습니다.',
          suggestion: 'URL을 확인하거나 메인 페이지로 이동해 주세요.',
          action: {
            label: '메인으로',
            onClick: () => window.location.href = '/'
          }
        };

      case ErrorType.SERVER_ERROR:
        return {
          title: '서버 오류',
          message: '서버에서 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
          suggestion: '잠시 후 다시 시도해 주세요.',
          action: onRetry ? {
            label: '다시 시도',
            onClick: onRetry
          } : undefined
        };

      default:
        return {
          title: '오류가 발생했습니다',
          message: '예상치 못한 오류가 발생했습니다.',
          suggestion: '페이지를 새로고침하거나 다시 시도해 주세요.',
          action: onRetry ? {
            label: '다시 시도',
            onClick: onRetry
          } : undefined
        };
    }
  };

  const friendlyError = getUserFriendlyError();

  // 에러 타입별 아이콘
  const getErrorIcon = () => {
    switch (type) {
      case ErrorType.NETWORK:
        return (
          <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case ErrorType.VALIDATION:
        return (
          <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {getErrorIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {friendlyError.title}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{friendlyError.message}</p>
            {friendlyError.suggestion && (
              <p className="mt-1 text-red-600">{friendlyError.suggestion}</p>
            )}
          </div>

          {/* 상세 정보 토글 */}
          {errorStack && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-sm text-red-600 hover:text-red-500 focus:outline-none focus:underline"
              >
                {isExpanded ? '상세 정보 숨기기' : '상세 정보 보기'}
              </button>
              
              {isExpanded && (
                <div className="mt-2 p-3 bg-red-100 border border-red-200 rounded-md">
                  <p className="text-xs text-red-800 font-mono break-all">
                    {errorMessage}
                  </p>
                  {errorStack && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-700 cursor-pointer">
                        스택 트레이스
                      </summary>
                      <pre className="text-xs text-red-700 mt-2 whitespace-pre-wrap">
                        {errorStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 액션 버튼들 */}
          <div className="mt-4 flex space-x-3">
            {friendlyError.action && (
              <button
                type="button"
                onClick={friendlyError.action.onClick}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {friendlyError.action.label}
              </button>
            )}
            
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                닫기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage; 