'use client';

import React, { useState, useEffect } from 'react';

interface DynamicGridWrapperProps {
  groupName: string;
  getDynamicGridClass: (groupName: string) => string;
  className?: string;
  children: React.ReactNode;
}

const DynamicGridWrapper: React.FC<DynamicGridWrapperProps> = ({
  groupName,
  getDynamicGridClass,
  className = '',
  children
}) => {
  const [isClient, setIsClient] = useState(false);
  const [gridClass, setGridClass] = useState('grid grid-cols-1 md:grid-cols-2 gap-4'); // 기본값

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      // 즉시 실행
      const dynamicClass = getDynamicGridClass(groupName);
      console.log(`[DynamicGridWrapper] 즉시 실행 - 그룹: ${groupName}, 클래스: ${dynamicClass}`);
      setGridClass(dynamicClass);
      
      // 1초 후에 다시 실행 (설정 로드 대기)
      const timer = setTimeout(() => {
        const delayedClass = getDynamicGridClass(groupName);
        console.log(`[DynamicGridWrapper] 1초 후 실행 - 그룹: ${groupName}, 클래스: ${delayedClass}`);
        setGridClass(delayedClass);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isClient, groupName, getDynamicGridClass]);

  // 서버 사이드에서는 기본 클래스 사용
  const finalClass = isClient ? gridClass : 'grid grid-cols-1 md:grid-cols-2 gap-4';

  return (
    <div className={`${finalClass} ${className}`}>
      {children}
    </div>
  );
};

export default DynamicGridWrapper; 