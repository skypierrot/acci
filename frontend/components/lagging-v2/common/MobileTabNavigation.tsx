import React from 'react';

export type TabType = 'overview' | 'charts';

interface Props {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const MobileTabNavigation: React.FC<Props> = ({ activeTab, onTabChange }) => {
  return (
    <div className="md:hidden mb-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => onTabChange('overview')}
            className={`
              py-2 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            주요 지표
          </button>
          <button
            onClick={() => onTabChange('charts')}
            className={`
              py-2 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'charts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            추이 그래프
          </button>
        </nav>
      </div>
    </div>
  );
};