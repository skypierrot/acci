import React from 'react';
import { InvestigationComponentProps } from '../../types/investigation.types';
import { getInvestigationSteps } from '../../utils/investigation.utils';

interface InvestigationBasicInfoSectionProps extends InvestigationComponentProps {
  getStatusColor: (status?: string) => string;
}

export const InvestigationBasicInfoSection: React.FC<InvestigationBasicInfoSectionProps> = ({
  report,
  editForm,
  editMode,
  onInputChange,
  onDateChange,
  onDateClick,
  getStatusColor
}) => {
  // 현재 스텝이 0(기본정보)라고 가정, requiredFields 추출
  const requiredFields = getInvestigationSteps()[0].requiredFields;
  const isRequired = (name: string) => requiredFields.includes(name);
  return (
    <div className="report-section">
      <div className="report-section-header">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="report-section-title">1. 조사 기본 정보</h2>
            {editMode ? (
              <select
                name="investigation_status"
                value={editForm.investigation_status || ''}
                onChange={onInputChange}
                className="form-select text-sm w-32"
              >
                <option value="">상태 선택</option>
                <option value="대기">대기</option>
                <option value="조사진행">조사진행</option>
                <option value="조사완료">조사완료</option>
                <option value="대책이행">대책이행</option>
                <option value="조치완료">조치완료</option>
              </select>
            ) : (
              <span className={`status-badge ${getStatusColor(report.investigation_status)}`}>
                {report.investigation_status || '미정'}
              </span>
            )}
          </div>
          <p className="report-section-subtitle">조사팀 구성 및 조사 일정 정보</p>
        </div>
      </div>
      
      <div className="report-section-content">
      
        {/* 사고코드 정보 - 숨김 처리 */}
        {/* 
        <div className="grid-form-2 mb-6">
          <div>
            <label className="form-label">전체사고코드</label>
            {editMode ? (
              <input
                type="text"
                name="investigation_global_accident_no"
                value={editForm.investigation_global_accident_no || ''}
                onChange={onInputChange}
                className="form-input"
                placeholder="전체사고코드"
              />
            ) : (
              <div className="text-gray-900">{report.investigation_global_accident_no || '-'}</div>
            )}
          </div>
          
          <div>
            <label className="form-label">사업장사고코드</label>
            {editMode ? (
              <input
                type="text"
                name="investigation_site_accident_no"
                value={editForm.accident_id || ''}
                onChange={onInputChange}
                className="form-input"
                placeholder="사업장사고코드"
              />
            ) : (
              <div className="text-gray-900">{report.accident_id || '-'}</div>
            )}
          </div>
        </div>
        */}

        {/* 조사팀 정보 */}
        <div className="grid-form-2 mb-6">
          <div>
            <label className="form-label">
              조사팀장
              {isRequired('investigation_team_lead') && <span className="text-red-500 ml-1">*</span>}
            </label>
            {editMode ? (
              <input
                type="text"
                name="investigation_team_lead"
                value={editForm.investigation_team_lead || ''}
                onChange={onInputChange}
                className="form-input"
                placeholder="조사팀장 이름"
              />
            ) : (
              <div className="text-gray-900">{report.investigation_team_lead || '-'}</div>
            )}
          </div>
          
          <div>
            <label className="form-label">조사팀원</label>
            {editMode ? (
              <input
                type="text"
                name="investigation_team_members"
                value={editForm.investigation_team_members || ''}
                onChange={onInputChange}
                className="form-input"
                placeholder="조사팀원 (쉼표로 구분)"
              />
            ) : (
              <div className="text-gray-900">{report.investigation_team_members || '-'}</div>
            )}
          </div>
        </div>

        {/* 조사 일정 정보 */}
        <div className="grid-form-3">
          <div>
            <label className="form-label">
              조사 시작일
              {isRequired('investigation_start_time') && <span className="text-red-500 ml-1">*</span>}
            </label>
            {editMode ? (
              <input
                type="date"
                name="investigation_start_time"
                value={editForm.investigation_start_time ? new Date(editForm.investigation_start_time).toISOString().slice(0, 10) : ''}
                onChange={onDateChange}
                onClick={onDateClick}
                className="form-input cursor-pointer"
              />
            ) : (
              <div className="text-gray-900">
                {report.investigation_start_time 
                  ? new Date(report.investigation_start_time).toLocaleDateString('ko-KR')
                  : '-'
                }
              </div>
            )}
          </div>
          
          <div>
            <label className="form-label">조사 종료일</label>
            {editMode ? (
              <input
                type="date"
                name="investigation_end_time"
                value={editForm.investigation_end_time ? new Date(editForm.investigation_end_time).toISOString().slice(0, 10) : ''}
                onChange={onDateChange}
                onClick={onDateClick}
                className="form-input cursor-pointer"
              />
            ) : (
              <div className="text-gray-900">
                {report.investigation_end_time 
                  ? new Date(report.investigation_end_time).toLocaleDateString('ko-KR')
                  : '진행중'
                }
              </div>
            )}
          </div>
          
          <div>
            <label className="form-label">보고서 작성일</label>
            {editMode ? (
              <input
                type="date"
                name="report_written_date"
                value={editForm.report_written_date ? new Date(editForm.report_written_date).toISOString().slice(0, 10) : ''}
                onChange={onDateChange}
                onClick={onDateClick}
                className="form-input cursor-pointer"
              />
            ) : (
              <div className="text-gray-900">
                {report.report_written_date 
                  ? new Date(report.report_written_date).toLocaleDateString('ko-KR')
                  : '-'
                }
              </div>
            )}
          </div>
        </div>

        {/* 조사 장소 정보 */}
        <div className="grid-form-1 mt-6">
          <div>
            <label className="form-label">조사 장소</label>
            {editMode ? (
              <input
                type="text"
                name="investigation_location"
                value={editForm.investigation_location || ''}
                onChange={onInputChange}
                className="form-input"
                placeholder="조사 장소"
              />
            ) : (
              <div className="text-gray-900">{report.investigation_location || '-'}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 