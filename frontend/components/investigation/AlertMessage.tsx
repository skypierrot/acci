import React from 'react';
import { AlertMessageProps } from '../../types/investigation.types';

export const AlertMessage: React.FC<AlertMessageProps> = ({ type, message }) => {
  // type이 'error', 'success', 'warning' 중 어떤 것인지에 따라 스타일을 다르게 적용
  const isError = type === 'error';
  const isSuccess = type === 'success';
  const isWarning = type === 'warning';

  return (
    <div className={`border px-4 py-3 rounded-md ${
      isError
        ? 'bg-red-50 border-red-200 text-red-700'
        : isSuccess
        ? 'bg-green-50 border-green-200 text-green-700'
        : isWarning
        ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
        : 'bg-gray-50 border-gray-200 text-gray-700'
    }`}>
      <div className="flex">
        {/* error, success 타입만 아이콘 표시, warning은 아이콘 없음 */}
        {isError ? (
          // 에러 아이콘
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
        ) : isSuccess ? (
          // 성공 아이콘
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        ) : null}
        <div className={isError || isSuccess ? "ml-3" : undefined}>
          {/* 실제 메시지 출력 */}
          <p className="text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
}; 