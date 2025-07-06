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
    <div className="report-header">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="report-title">사고조사보고서</h1>
          <p className="report-subtitle">
            사고번호: {report.investigation_global_accident_no || report.accident_id}
          </p>
          <div className="report-meta">
            <div className="report-meta-item">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span>조사일자: {report.investigation_start_time ? new Date(report.investigation_start_time).toLocaleDateString('ko-KR') : '-'}</span>
            </div>
            <div className="report-meta-item">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <span>조사팀장: {report.investigation_team_lead || '-'}</span>
            </div>
            <div className="report-meta-item">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
              </svg>
              <span>상태: {report.investigation_status || '조사 진행중'}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 no-print">
          <Link 
            href="/investigation" 
            className="btn btn-secondary btn-sm"
          >
            ← 목록으로
          </Link>
          {editMode ? (
            <>
              <button
                onClick={onToggleEditMode}
                className="btn btn-secondary btn-sm"
                disabled={saving}
              >
                취소
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className="btn btn-primary btn-sm"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => window.print()}
                className="btn btn-ghost btn-sm"
              >
                🖨️ 인쇄
              </button>
              <button
                onClick={onToggleEditMode}
                className="btn btn-primary btn-sm"
              >
                ✏️ 편집
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}; 