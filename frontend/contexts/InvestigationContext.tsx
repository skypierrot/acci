import React, { createContext, useContext } from 'react';

// InvestigationDataContext 타입 정의
interface InvestigationDataContextType {
  fetchOccurrences: (year: number) => Promise<void>;
  fetchInvestigations: (page: number, term: string) => Promise<void>;
  fetchCorrectiveStats: (year: number) => Promise<void>;
  refreshDashboard: () => Promise<void>;
}

// Context 생성
export const InvestigationDataContext = createContext<InvestigationDataContextType | null>(null);

// Context 사용을 위한 커스텀 훅
export const useInvestigationDataContext = () => {
  const context = useContext(InvestigationDataContext);
  if (!context) {
    throw new Error('useInvestigationDataContext must be used within an InvestigationDataProvider');
  }
  return context;
}; 