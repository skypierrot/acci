'use client';

import React, { useState, useEffect } from 'react';

interface DynamicGridProps {
  groupName: string;
  className?: string;
  children: React.ReactNode;
}

const DynamicGrid: React.FC<DynamicGridProps> = ({
  groupName,
  className = '',
  children
}) => {
  const [gridClass, setGridClass] = useState('grid grid-cols-1 md:grid-cols-2 gap-4');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchGridSettings = async () => {
      try {
        console.log(`[DynamicGrid] ${groupName} 그룹 설정 로드 시작`);
        
        const response = await fetch('/api/settings/reports/occurrence');
        if (!response.ok) {
          throw new Error('API 호출 실패');
        }
        
        const result = await response.json();
        const groupField = result.data.find((setting: any) => setting.field_group === groupName);
        
        console.log(`[DynamicGrid] ${groupName} 그룹 필드:`, groupField);
        
        if (groupField) {
          const cols = groupField.group_cols || 2;
          let newGridClass = '';
          
          switch (cols) {
            case 1:
              newGridClass = 'grid grid-cols-1 gap-4';
              break;
            case 2:
              newGridClass = 'grid grid-cols-1 md:grid-cols-2 gap-4';
              break;
            case 3:
              newGridClass = 'grid grid-cols-1 md:grid-cols-3 gap-4';
              break;
            case 4:
              newGridClass = 'grid grid-cols-1 md:grid-cols-4 gap-4';
              break;
            default:
              newGridClass = 'grid grid-cols-1 md:grid-cols-2 gap-4';
          }
          
          console.log(`[DynamicGrid] ${groupName} 최종 클래스: ${newGridClass}`);
          setGridClass(newGridClass);
        }
        
        setIsLoaded(true);
      } catch (error) {
        console.error(`[DynamicGrid] ${groupName} 설정 로드 실패:`, error);
        setIsLoaded(true); // 에러가 발생해도 로딩 완료로 처리
      }
    };

    fetchGridSettings();
  }, [groupName]);

  // 로딩 중에는 기본 클래스 사용
  if (!isLoaded) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`${gridClass} ${className}`}>
      {children}
    </div>
  );
};

export default DynamicGrid; 