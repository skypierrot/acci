"use client";

/**
 * @file components/ErrorBoundary.tsx
 * @description React Error Boundary 컴포넌트
 */

import React, { Component, ErrorInfo } from 'react';
import { ErrorBoundaryProps, ErrorBoundaryState } from '../types/error.types';
import { logError } from '../utils/logger';

/**
 * React Error Boundary 컴포넌트
 * - 컴포넌트 트리에서 발생하는 JavaScript 에러를 캐치
 * - 에러 로깅 및 사용자 친화적 에러 화면 표시
 * - 에러 복구 기능 제공
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 에러 로깅
    logError('Error Boundary caught an error', {
      componentStack: errorInfo.componentStack,
      errorName: error.name,
      errorMessage: error.message
    }, error);

    // 상태 업데이트
    this.setState({
      error,
      errorInfo
    });

    // 사용자 정의 에러 핸들러 호출
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      // 사용자 정의 fallback 컴포넌트가 있으면 사용
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent 
            error={this.state.error!} 
            resetError={this.resetError} 
          />
        );
      }

      // 기본 에러 화면
      return <DefaultErrorFallback error={this.state.error!} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

/**
 * 기본 에러 fallback 컴포넌트
 */
interface DefaultErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({ error, resetError }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* 에러 아이콘 */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          {/* 에러 제목 */}
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            예상치 못한 오류가 발생했습니다
          </h2>

          {/* 에러 메시지 */}
          <p className="mt-2 text-sm text-gray-600">
            죄송합니다. 문제가 발생했습니다. 다시 시도해 주세요.
          </p>

          {/* 개발 모드에서만 상세 에러 정보 표시 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-sm font-medium text-red-800 mb-2">에러 상세 정보:</h3>
              <p className="text-xs text-red-700 font-mono break-all">
                {error.message}
              </p>
              {error.stack && (
                <details className="mt-2">
                  <summary className="text-xs text-red-700 cursor-pointer">
                    스택 트레이스 보기
                  </summary>
                  <pre className="text-xs text-red-700 mt-2 whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>

        {/* 액션 버튼들 */}
        <div className="flex flex-col space-y-3">
          <button
            onClick={resetError}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            다시 시도
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            페이지 새로고침
          </button>

          <button
            onClick={() => window.history.back()}
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            이전 페이지로 돌아가기
          </button>
        </div>

        {/* 도움말 */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            문제가 지속되면 관리자에게 문의해 주세요.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary; 