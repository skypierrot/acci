import React from 'react';
import Link from 'next/link';
import { InvestigationReport, ActionButtonsProps } from '../../types/investigation.types';

interface InvestigationHeaderProps {
  report: InvestigationReport;
  actionButtons: ActionButtonsProps;
}

export const InvestigationHeader: React.FC<InvestigationHeaderProps> = ({ 
  report, 
  actionButtons: { editMode, saving, onToggleEditMode, onSave }
}) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold">조사보고서 상세</h1>
        <p className="text-gray-600 mt-1">
          사고번호: {report.investigation_global_accident_no || report.accident_id}
        </p>
      </div>
      <div className="flex space-x-2">
        <Link 
          href="/investigation" 
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium transition-colors"
        >
          목록으로 돌아가기
        </Link>
        {editMode ? (
          <>
            <button
              onClick={onToggleEditMode}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
              disabled={saving}
            >
              취소
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </>
        ) : (
          <button
            onClick={onToggleEditMode}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            편집 모드
          </button>
        )}
      </div>
    </div>
  );
}; 