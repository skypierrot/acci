import React from 'react';
import { LoadingStage } from './utils';

interface FullPageLoadingOverlayProps {
  stage: LoadingStage;
  isVisible: boolean;
}

const FullPageLoadingOverlay: React.FC<FullPageLoadingOverlayProps> = ({ 
  stage,
  isVisible 
}) => {
  const stageMessages = {
    initial: '페이지를 초기화하는 중...',
    data: '지표 데이터를 불러오는 중...',
    charts: '차트 데이터를 준비하는 중...',
    complete: '완료'
  };

  const stageProgress = {
    initial: 25,
    data: 60,
    charts: 90,
    complete: 100
  };

  const stageIcons = {
    initial: (
      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    data: (
      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    charts: (
      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    complete: null
  };

  if (!isVisible || stage === 'complete') return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        {/* 로딩 아이콘 */}
        <div className="mb-6">
          {stageIcons[stage]}
        </div>
        
        {/* 로딩 스피너 */}
        <div className="mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
        
        {/* 메시지 */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          사고 지표 데이터 로딩 중
        </h2>
        <p className="text-gray-600 mb-6">
          {stageMessages[stage]}
        </p>
        
        {/* 진행률 바 */}
        <div className="w-64 mx-auto">
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${stageProgress[stage]}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500">
            {stageProgress[stage]}% 완료
          </p>
        </div>
        
        {/* 추가 정보 */}
        <div className="mt-8 text-sm text-gray-500">
          <p>잠시만 기다려주세요...</p>
        </div>
      </div>
    </div>
  );
};

export default FullPageLoadingOverlay;