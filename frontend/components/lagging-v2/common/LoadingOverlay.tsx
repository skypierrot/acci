import React from 'react';

interface Props {
  isVisible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<Props> = ({ isVisible, message = '데이터를 불러오는 중...' }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
          <p className="text-gray-700 text-center">{message}</p>
        </div>
      </div>
    </div>
  );
};