import React from 'react';
import { InvestigationComponentProps } from '../../types/investigation.types';

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
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-lg font-semibold">조사 기본 정보</h2>
        {editMode ? (
          <select
            name="investigation_status"
            value={editForm.investigation_status || ''}
            onChange={onInputChange}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">상태 선택</option>
            <option value="조사 착수">조사 착수</option>
            <option value="조사 진행중">조사 진행중</option>
            <option value="대책 이행중">대책 이행중</option>
            <option value="완료">완료</option>
          </select>
        ) : (
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(report.investigation_status)}`}>
            {report.investigation_status || '미정'}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">조사팀장</label>
          {editMode ? (
            <input
              type="text"
              name="investigation_team_lead"
              value={editForm.investigation_team_lead || ''}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="조사팀장 이름"
            />
          ) : (
            <div className="text-gray-900">{report.investigation_team_lead || '-'}</div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">조사팀원</label>
          {editMode ? (
            <input
              type="text"
              name="investigation_team_members"
              value={editForm.investigation_team_members || ''}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="조사팀원 (쉼표로 구분)"
            />
          ) : (
            <div className="text-gray-900">{report.investigation_team_members || '-'}</div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">조사 장소</label>
          {editMode ? (
            <input
              type="text"
              name="investigation_location"
              value={editForm.investigation_location || ''}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="조사 장소"
            />
          ) : (
            <div className="text-gray-900">{report.investigation_location || '-'}</div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">조사 시작일</label>
          {editMode ? (
            <input
              type="date"
              name="investigation_start_time"
              value={editForm.investigation_start_time ? new Date(editForm.investigation_start_time).toISOString().slice(0, 10) : ''}
              onChange={onDateChange}
              onClick={onDateClick}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">조사 종료일</label>
          {editMode ? (
            <input
              type="date"
              name="investigation_end_time"
              value={editForm.investigation_end_time ? new Date(editForm.investigation_end_time).toISOString().slice(0, 10) : ''}
              onChange={onDateChange}
              onClick={onDateClick}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">보고서 작성일</label>
          {editMode ? (
            <input
              type="date"
              name="report_written_date"
              value={editForm.report_written_date ? new Date(editForm.report_written_date).toISOString().slice(0, 10) : ''}
              onChange={onDateChange}
              onClick={onDateClick}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
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
  );
}; 