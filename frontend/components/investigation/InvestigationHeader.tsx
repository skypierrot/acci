import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { InvestigationReport, ActionButtonsProps } from '../../types/investigation.types';

interface InvestigationHeaderProps {
  report: InvestigationReport;
  actionButtons: ActionButtonsProps;
}

interface InvestigationDashboardProps {
  years: number[];
  selectedYear: number;
  onYearChange: (year: number) => void;
  total: number;
  waiting: number;
  started: number;
  progressing: number;
  actionInProgress: number;
  completed: number;
}

// 상태별 색상
const statusColors = {
  waiting: 'bg-gray-200 text-gray-700',
  started: 'bg-yellow-100 text-yellow-800',
  progressing: 'bg-blue-100 text-blue-800',
  actionInProgress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
};

const InvestigationDashboard: React.FC<InvestigationDashboardProps> = ({
  years,
  selectedYear,
  onYearChange,
  total,
  waiting,
  started,
  progressing,
  actionInProgress,
  completed,
}) => {
  // 합계 검증
  const sum = waiting + started + progressing + actionInProgress + completed;
  const isValid = sum === total;

  return (
    <div className="w-full bg-white shadow rounded-lg p-4 mb-8 sticky top-0 z-30">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg text-blue-700">사고조사현황</span>
          <select
            className="ml-2 px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-400"
            value={selectedYear}
            onChange={e => onYearChange(Number(e.target.value))}
          >
            {years.map(year => (
              <option key={year} value={year}>{year}년</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-sm">전체</span>
          <span className="text-2xl font-bold text-blue-700">{total}건</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-between md:justify-start mt-2">
        <div className={`px-4 py-2 rounded font-semibold text-sm ${statusColors.waiting}`}>대기 {waiting}건</div>
        <div className={`px-4 py-2 rounded font-semibold text-sm ${statusColors.started}`}>조사 착수 {started}건</div>
        <div className={`px-4 py-2 rounded font-semibold text-sm ${statusColors.progressing}`}>조사 진행 {progressing}건</div>
        <div className={`px-4 py-2 rounded font-semibold text-sm ${statusColors.actionInProgress}`}>대책 이행중 {actionInProgress}건</div>
        <div className={`px-4 py-2 rounded font-semibold text-sm ${statusColors.completed}`}>완료 {completed}건</div>
      </div>
      {!isValid && (
        <div className="mt-2 text-xs text-red-600 font-semibold">⚠️ 합계({sum})가 전체({total})와 일치하지 않습니다. 데이터 확인 필요</div>
      )}
    </div>
  );
};

export default InvestigationDashboard;

export const InvestigationHeader: React.FC<InvestigationHeaderProps> = ({ 
  report, 
  actionButtons: { editMode, saving, onToggleEditMode, onSave }
}) => {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 삭제 모달 열기
  const openDeleteModal = () => {
    setDeleteModalOpen(true);
  };

  // 삭제 모달 닫기
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
  };

  // 조사보고서 삭제 함수
  const deleteReport = async () => {
    try {
      setDeleteLoading(true);
      
      const response = await fetch(`/api/investigation/${report.accident_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`삭제 실패: ${response.statusText}`);
      }
      
      // 삭제 성공 후 목록 페이지로 이동
      router.push('/investigation');
      
    } catch (err: any) {
      console.error('조사보고서 삭제 오류:', err);
      alert(err.message || '삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleteLoading(false);
      closeDeleteModal();
    }
  };

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
              <button
                onClick={openDeleteModal}
                className="btn btn-danger btn-sm"
              >
                🗑️ 삭제
              </button>
            </>
          )}
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">사고 조사보고서 삭제</h3>
            <p className="mb-6">정말로 이 사고 조사보고서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 border border-gray-300 rounded"
                disabled={deleteLoading}
              >
                취소
              </button>
              <button
                onClick={deleteReport}
                className="px-4 py-2 bg-red-600 text-white rounded"
                disabled={deleteLoading}
              >
                {deleteLoading ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 