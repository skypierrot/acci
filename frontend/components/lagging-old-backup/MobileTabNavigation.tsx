import React from 'react';
import { TabType } from './utils';

interface MobileTabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const MobileTabNavigation: React.FC<MobileTabNavigationProps> = ({ 
  activeTab, 
  onTabChange 
}) => {
  const tabs = [
    { id: 'overview' as TabType, label: '주요지표', icon: '📊' },
    { id: 'charts' as TabType, label: '차트분석', icon: '📈' }
  ];

  return (
    <div className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex flex-col items-center">
              <span className="text-lg mb-1">{tab.icon}</span>
              <span>{tab.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileTabNavigation;