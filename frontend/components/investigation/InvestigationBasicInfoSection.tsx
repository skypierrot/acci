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
        <div className="flex justify-between items-center">
          <div>
            <h2 className="report-section-title">1. 조사 기본 정보</h2>
            <p className="report-section-subtitle">조사팀 구성 및 조사 일정 정보</p>
          </div>
          {editMode ? (
            <select
              name="investigation_status"
              value={editForm.investigation_status || ''}
              onChange={onInputChange}
              className="form-select text-sm"
            >
              <option value="">상태 선택</option>
              <option value="조사 착수">조사 착수</option>
              <option value="조사 진행중">조사 진행중</option>
              <option value="대책 이행중">대책 이행중</option>
              <option value="완료">완료</option>
            </select>
          ) : (
            <span className={`status-badge ${getStatusColor(report.investigation_status)}`}>
              {report.investigation_status || '미정'}
            </span>
          )}
        </div>
      </div>
      
      <div className="report-section-content">
      
              <div className="grid-form-3">
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
      </div>
    </div>
  );
}; 