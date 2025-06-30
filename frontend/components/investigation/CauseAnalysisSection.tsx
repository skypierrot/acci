import React from 'react';
import { InvestigationComponentProps } from '../../types/investigation.types';

interface CauseAnalysisSectionProps extends InvestigationComponentProps {
  showCauseOnly?: boolean;
  showActionOnly?: boolean;
  showConclusionOnly?: boolean;
}

export const CauseAnalysisSection: React.FC<CauseAnalysisSectionProps> = ({
  report,
  editForm,
  editMode,
  onInputChange,
  showCauseOnly = false,
  showActionOnly = false,
  showConclusionOnly = false
}) => {
  // 모든 섹션을 보여줄지 결정 (기본값: 모든 섹션 표시)
  const showAll = !showCauseOnly && !showActionOnly && !showConclusionOnly;
  return (
    <div className="space-y-6">
      {/* 원인 분석 */}
      {(showAll || showCauseOnly) && (
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-800 mb-4">원인 분석</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">직접 원인</label>
              {editMode ? (
                <textarea
                  name="direct_cause"
                  value={editForm.direct_cause || ''}
                  onChange={onInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="사고의 직접적인 원인을 입력하세요"
                />
              ) : (
                <p className="text-gray-900 whitespace-pre-wrap">{report.direct_cause || '-'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">근본 원인</label>
              {editMode ? (
                <textarea
                  name="root_cause"
                  value={editForm.root_cause || ''}
                  onChange={onInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="사고의 근본적인 원인을 입력하세요"
                />
              ) : (
                <p className="text-gray-900 whitespace-pre-wrap">{report.root_cause || '-'}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 대책 정보 */}
      {(showAll || showActionOnly) && (
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-800 mb-4">대책 정보</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">개선 대책</label>
              {editMode ? (
                <textarea
                  name="corrective_actions"
                  value={editForm.corrective_actions || ''}
                  onChange={onInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="구체적인 개선 대책을 입력하세요"
                />
              ) : (
                <p className="text-gray-900 whitespace-pre-wrap">{report.corrective_actions || '-'}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">완료 일정</label>
                {editMode ? (
                  <input
                    type="text"
                    name="action_schedule"
                    value={editForm.action_schedule || ''}
                    onChange={onInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="예: 2024년 3월 말까지"
                  />
                ) : (
                  <p className="text-gray-900">{report.action_schedule || '-'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">확인자</label>
                {editMode ? (
                  <input
                    type="text"
                    name="action_verifier"
                    value={editForm.action_verifier || ''}
                    onChange={onInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="확인 담당자 이름"
                  />
                ) : (
                  <p className="text-gray-900">{report.action_verifier || '-'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 조사 결론 */}
      {(showAll || showConclusionOnly) && (
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-800 mb-4">조사 결론</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">조사 결론</label>
              {editMode ? (
                <textarea
                  name="investigation_conclusion"
                  value={editForm.investigation_conclusion || ''}
                  onChange={onInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="조사 결과에 대한 종합적인 결론을 입력하세요"
                />
              ) : (
                <p className="text-gray-900 whitespace-pre-wrap">{report.investigation_conclusion || '-'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">조사 요약</label>
              {editMode ? (
                <textarea
                  name="investigation_summary"
                  value={editForm.investigation_summary || ''}
                  onChange={onInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="조사 내용 요약"
                />
              ) : (
                <p className="text-gray-900 whitespace-pre-wrap">{report.investigation_summary || '-'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">조사관 서명</label>
              {editMode ? (
                <input
                  type="text"
                  name="investigator_signature"
                  value={editForm.investigator_signature || ''}
                  onChange={onInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="조사관 이름"
                />
              ) : (
                <p className="text-gray-900">{report.investigator_signature || '-'}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 