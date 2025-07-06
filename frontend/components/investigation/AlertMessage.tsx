import React from 'react';
import { AlertMessageProps } from '../../types/investigation.types';

export const AlertMessage: React.FC<AlertMessageProps> = ({ type, message }) => {
  const isError = type === 'error';
  
  return (
    <div className={`border px-4 py-3 rounded-md ${
      isError 
        ? 'bg-red-50 border-red-200 text-red-700' 
        : 'bg-green-50 border-green-200 text-green-700'
    }`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className={`h-5 w-5 ${isError ? 'text-red-400' : 'text-green-400'}`} viewBox="0 0 20 20" fill="currentColor">
            {isError ? (
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            ) : (
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            )}
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
}; 