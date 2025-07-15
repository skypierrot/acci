import React from 'react';
import { InvestigationComponentProps, CauseAnalysis, PreventionActions, ActionItem } from '../../types/investigation.types';

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
  onDateChange,
  onDateClick,
  showCauseOnly = false,
  showActionOnly = false,
  showConclusionOnly = false
}) => {
  // 모든 섹션을 보여줄지 결정 (기본값: 모든 섹션 표시)
  const showAll = !showCauseOnly && !showActionOnly && !showConclusionOnly;

  // 현재 원인 분석 데이터 가져오기 (새로운 구조 우선, 없으면 기존 구조 사용)
  const getCurrentCauseAnalysis = (): CauseAnalysis => {
    const current = editMode ? editForm : report;
    
    // current가 없거나 cause_analysis가 있으면 그대로 반환
    if (current?.cause_analysis) {
      // cause_analysis가 있지만 구조가 불완전할 수 있으므로 안전하게 처리
      const causeAnalysis = current.cause_analysis;
      return {
        direct_cause: {
          unsafe_condition: causeAnalysis.direct_cause?.unsafe_condition || [],
          unsafe_act: causeAnalysis.direct_cause?.unsafe_act || []
        },
        root_cause: {
          human_factor: causeAnalysis.root_cause?.human_factor || [],
          system_factor: causeAnalysis.root_cause?.system_factor || []
        }
      };
    }
    
    // 안전한 기본값 반환
    return {
      direct_cause: {
        unsafe_condition: current?.direct_cause ? [current.direct_cause] : [],
        unsafe_act: []
      },
      root_cause: {
        human_factor: current?.root_cause ? [current.root_cause] : [],
        system_factor: []
      }
    };
  };

  const causeAnalysis = getCurrentCauseAnalysis();

  // 현재 재발방지대책 데이터 가져오기
  const getCurrentPreventionActions = (): PreventionActions => {
    const current = editMode ? editForm : report;
    
    // current가 없거나 prevention_actions가 있으면 그대로 반환
    if (current?.prevention_actions) {
      // prevention_actions가 있지만 구조가 불완전할 수 있으므로 안전하게 처리
      const preventionActions = current.prevention_actions;
      return {
        technical_actions: preventionActions.technical_actions || [],
        educational_actions: preventionActions.educational_actions || [],
        managerial_actions: preventionActions.managerial_actions || []
      };
    }
    
    // 안전한 기본값 반환
    return {
      technical_actions: [],
      educational_actions: [],
      managerial_actions: current?.corrective_actions ? [{
        id: `legacy_${Date.now()}`,
        title: '', // 필수 필드 추가
        action_type: 'managerial',
        improvement_plan: current.corrective_actions,
        progress_status: 'pending',
        scheduled_date: current.action_schedule || '',
        responsible_person: current.action_verifier || '',
        completion_date: undefined
      }] : []
    };
  };

  const preventionActions = getCurrentPreventionActions();

  // 원인 분석 항목 추가/제거/수정 함수들
  const addCauseItem = (category: 'direct_cause' | 'root_cause', subcategory: string) => {
    const newCauseAnalysis = { ...causeAnalysis };
    if (category === 'direct_cause') {
      if (subcategory === 'unsafe_condition') {
        newCauseAnalysis.direct_cause.unsafe_condition.push('');
      } else if (subcategory === 'unsafe_act') {
        newCauseAnalysis.direct_cause.unsafe_act.push('');
      }
    } else if (category === 'root_cause') {
      if (subcategory === 'human_factor') {
        newCauseAnalysis.root_cause.human_factor.push('');
      } else if (subcategory === 'system_factor') {
        newCauseAnalysis.root_cause.system_factor.push('');
      }
    }
    
    // 폼 업데이트
    const event = {
      target: {
        name: 'cause_analysis',
        value: newCauseAnalysis
      }
    } as any;
    onInputChange(event);
  };

  const removeCauseItem = (category: 'direct_cause' | 'root_cause', subcategory: string, index: number) => {
    const newCauseAnalysis = { ...causeAnalysis };
    if (category === 'direct_cause') {
      if (subcategory === 'unsafe_condition') {
        newCauseAnalysis.direct_cause.unsafe_condition.splice(index, 1);
      } else if (subcategory === 'unsafe_act') {
        newCauseAnalysis.direct_cause.unsafe_act.splice(index, 1);
      }
    } else if (category === 'root_cause') {
      if (subcategory === 'human_factor') {
        newCauseAnalysis.root_cause.human_factor.splice(index, 1);
      } else if (subcategory === 'system_factor') {
        newCauseAnalysis.root_cause.system_factor.splice(index, 1);
      }
    }
    
    // 폼 업데이트
    const event = {
      target: {
        name: 'cause_analysis',
        value: newCauseAnalysis
      }
    } as any;
    onInputChange(event);
  };

  const updateCauseItem = (category: 'direct_cause' | 'root_cause', subcategory: string, index: number, value: string) => {
    const newCauseAnalysis = { ...causeAnalysis };
    if (category === 'direct_cause') {
      if (subcategory === 'unsafe_condition') {
        newCauseAnalysis.direct_cause.unsafe_condition[index] = value;
      } else if (subcategory === 'unsafe_act') {
        newCauseAnalysis.direct_cause.unsafe_act[index] = value;
      }
    } else if (category === 'root_cause') {
      if (subcategory === 'human_factor') {
        newCauseAnalysis.root_cause.human_factor[index] = value;
      } else if (subcategory === 'system_factor') {
        newCauseAnalysis.root_cause.system_factor[index] = value;
      }
    }
    
    // 폼 업데이트
    const event = {
      target: {
        name: 'cause_analysis',
        value: newCauseAnalysis
      }
    } as any;
    onInputChange(event);
  };

  // 대책 항목 추가/제거/수정 함수들
  const addActionItem = (actionType: 'technical_actions' | 'educational_actions' | 'managerial_actions') => {
    const newActionItem: ActionItem = {
      id: `action_${Date.now()}`,
      title: '', // 필수 필드 추가
      action_type: actionType.replace('_actions', '') as 'technical' | 'educational' | 'managerial',
      improvement_plan: '',
      progress_status: 'pending',
      scheduled_date: '',
      responsible_person: '',
      completion_date: undefined
    };
    
    const newPreventionActions = { ...preventionActions };
    newPreventionActions[actionType].push(newActionItem);
    
    const event = {
      target: {
        name: 'prevention_actions',
        value: newPreventionActions
      }
    } as any;
    onInputChange(event);
  };

  const removeActionItem = (actionType: 'technical_actions' | 'educational_actions' | 'managerial_actions', id: string) => {
    const newPreventionActions = { ...preventionActions };
    newPreventionActions[actionType] = newPreventionActions[actionType].filter(item => item.id !== id);
    
    const event = {
      target: {
        name: 'prevention_actions',
        value: newPreventionActions
      }
    } as any;
    onInputChange(event);
  };

  const updateActionItem = (actionType: 'technical_actions' | 'educational_actions' | 'managerial_actions', id: string, field: keyof ActionItem, value: string) => {
    const newPreventionActions = { ...preventionActions };
    const itemIndex = newPreventionActions[actionType].findIndex(item => item.id === id);
    
    if (itemIndex !== -1) {
      newPreventionActions[actionType][itemIndex] = {
        ...newPreventionActions[actionType][itemIndex],
        [field]: value
      };
      
      // 완료 상태가 아닌 경우 완료일 초기화
      if (field === 'progress_status' && value !== 'completed') {
        newPreventionActions[actionType][itemIndex].completion_date = undefined;
      }
    }
    
    const event = {
      target: {
        name: 'prevention_actions',
        value: newPreventionActions
      }
    } as any;
    onInputChange(event);
  };

  // 대책 항목 렌더링 함수
  const renderActionItems = (items: ActionItem[], actionType: 'technical_actions' | 'educational_actions' | 'managerial_actions', title: string, description: string) => {
    const cardClass = actionType === 'technical_actions' ? 'action-card-technical' : 
                     actionType === 'educational_actions' ? 'action-card-educational' : 
                     'action-card-managerial';
    
    return (
      <div className={`action-card ${cardClass} max-w-full overflow-x-auto`}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h5 className="text-sm font-semibold text-gray-800">{title}</h5>
            <p className="text-xs text-gray-600 mt-1">{description}</p>
          </div>
          {editMode && (
            <button
              type="button"
              onClick={() => addActionItem(actionType)}
              className="btn btn-primary btn-sm"
            >
              + 추가
            </button>
          )}
        </div>
      
      {items.length === 0 && !editMode && (
        <p className="text-gray-500 text-sm italic">등록된 대책이 없습니다.</p>
      )}
      
      {items.map((item) => (
        <div key={item.id} className="mb-4 last:mb-0 bg-white rounded border p-4">
          {editMode ? (
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-3">
                  {/* 개선계획 명 입력란 추가 - 시니어 개발자용 상세 주석 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">개선계획 명 <span className="text-red-500">*</span></label>
                    {/* 개선계획 명(title) 입력값을 상태에 반영 */}
                    <input
                      type="text"
                      value={item.title || ''}
                      onChange={(e) => updateActionItem(actionType, item.id, 'title', e.target.value)}
                      className="w-full max-w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="개선계획의 제목(명칭)을 입력하세요"
                      required
                    />
                  </div>
                  {/* 기존 개선 계획(상세내용) 입력란 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">개선 계획</label>
                    <textarea
                      value={item.improvement_plan}
                      onChange={(e) => updateActionItem(actionType, item.id, 'improvement_plan', e.target.value)}
                      className="w-full max-w-full resize-y overflow-x-auto px-2 py-1 border border-gray-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="구체적인 개선 계획을 입력하세요"
                      rows={2}
                      wrap="hard"
                      style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap', overflowX: 'auto' }}
                    />
                  </div>
                  
                  {/* 전개여부, 완료 예정일, 담당자 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">전개여부</label>
                      <select
                        value={item.progress_status}
                        onChange={(e) => updateActionItem(actionType, item.id, 'progress_status', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="pending">대기</option>
                        <option value="in_progress">진행</option>
                        <option value="completed">완료</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">완료 예정일</label>
                      <input
                        type="date"
                        name={`scheduled_date_${item.id}`}
                        value={item.scheduled_date ? new Date(item.scheduled_date).toISOString().slice(0, 10) : ''}
                        onChange={(e) => {
                          updateActionItem(actionType, item.id, 'scheduled_date', e.target.value);
                          onDateChange && onDateChange(e);
                        }}
                        onClick={onDateClick}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">담당자</label>
                      <input
                        type="text"
                        value={item.responsible_person}
                        onChange={(e) => updateActionItem(actionType, item.id, 'responsible_person', e.target.value)}
                        className="w-full max-w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="담당자 이름"
                        style={{ wordBreak: 'break-all', overflowX: 'auto' }}
                      />
                    </div>
                  </div>
                  
                  {/* 완료일 (완료 상태일 때만 표시) */}
                  {item.progress_status === 'completed' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        완료일 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name={`completion_date_${item.id}`}
                        value={item.completion_date ? new Date(item.completion_date).toISOString().slice(0, 10) : ''}
                        onChange={(e) => {
                          updateActionItem(actionType, item.id, 'completion_date', e.target.value);
                          onDateChange && onDateChange(e);
                        }}
                        onClick={onDateClick}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                        required
                      />
                    </div>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => removeActionItem(actionType, item.id)}
                  className="btn btn-danger btn-sm ml-3"
                >
                  삭제
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm text-gray-900">
                <strong>개선 계획:</strong> {item.improvement_plan || '-'}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs text-gray-600">
                <div>
                  <strong>전개여부:</strong> 
                  <span className={`ml-1 px-2 py-1 rounded text-xs ${
                    item.progress_status === 'completed' ? 'bg-green-100 text-green-800' :
                    item.progress_status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {item.progress_status === 'completed' ? '완료' :
                     item.progress_status === 'in_progress' ? '진행' : '대기'}
                  </span>
                </div>
                <div><strong>완료 예정일:</strong> {item.scheduled_date ? new Date(item.scheduled_date).toLocaleDateString('ko-KR') : '-'}</div>
                <div><strong>담당자:</strong> {item.responsible_person || '-'}</div>
                {item.completion_date && (
                  <div><strong>완료일:</strong> {new Date(item.completion_date).toLocaleDateString('ko-KR')}</div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
      
      {editMode && items.length === 0 && (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm mb-2">등록된 대책이 없습니다.</p>
          <button
            type="button"
            onClick={() => addActionItem(actionType)}
            className="btn btn-primary btn-sm"
          >
            첫 번째 대책 추가
          </button>
        </div>
      )}
    </div>
    );
  };

  // 원인 분석 항목 렌더링 함수
  const renderCauseItems = (items: string[], category: 'direct_cause' | 'root_cause', subcategory: string, title: string, placeholder: string) => {
    const cardClass = category === 'direct_cause' ? 'cause-card-direct' : 'cause-card-root';
    
    return (
      <div className={`cause-card ${cardClass} max-w-full overflow-x-auto`}>
        <div className="flex justify-between items-center mb-3">
          <h5 className="text-sm font-semibold text-gray-800">{title}</h5>
          {editMode && (
            <button
              type="button"
              onClick={() => addCauseItem(category, subcategory)}
              className="btn btn-primary btn-sm"
            >
              + 추가
            </button>
          )}
        </div>
      
      {items.length === 0 && !editMode && (
        <p className="text-gray-500 text-sm italic">등록된 항목이 없습니다.</p>
      )}
      
      {items.map((item, index) => (
        <div key={index} className="mb-2 last:mb-0">
          {editMode ? (
            <div className="flex gap-2">
              <textarea
                value={item}
                onChange={(e) => updateCauseItem(category, subcategory, index, e.target.value)}
                className="w-full max-w-full resize-y px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                placeholder={placeholder}
                rows={2}
                wrap="hard"
                style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap', overflowX: 'auto' }}
              />
              <button
                type="button"
                onClick={() => removeCauseItem(category, subcategory, index)}
                className="btn btn-danger btn-sm self-start"
              >
                삭제
              </button>
            </div>
          ) : (
            <div className="bg-white rounded border p-3 text-sm">
              <p className="text-gray-900">{item || '-'}</p>
            </div>
          )}
        </div>
      ))}
      
      {editMode && items.length === 0 && (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm mb-2">등록된 항목이 없습니다.</p>
          <button
            type="button"
            onClick={() => addCauseItem(category, subcategory)}
            className="btn btn-primary btn-sm"
          >
            첫 번째 항목 추가
          </button>
        </div>
      )}
    </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 원인 분석 */}
      {(showAll || showCauseOnly) && (
        <div className="report-section">
          <div className="report-section-header">
            <h3 className="report-section-title">4. 원인 분석</h3>
            <p className="report-section-subtitle">사고의 직접원인과 근본원인 분석</p>
          </div>
          <div className="report-section-content">
          
          {/* 직접원인 */}
          <div className="mb-8">
            <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
              <span className="border-l-4 border-rose-300 text-rose-600 font-semibold bg-white px-2 py-1 rounded-sm text-sm mr-2">직접원인</span>
              사고의 직접적인 원인
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderCauseItems(
                causeAnalysis.direct_cause.unsafe_condition,
                'direct_cause',
                'unsafe_condition',
                '불안전한 상태',
                '불안전한 상태를 구체적으로 기술하세요 (예: 바닥 젖음, 안전장치 미작동, 조명 불량 등)'
              )}
              
              {renderCauseItems(
                causeAnalysis.direct_cause.unsafe_act,
                'direct_cause',
                'unsafe_act',
                '불안전한 행동',
                '불안전한 행동을 구체적으로 기술하세요 (예: 안전수칙 미준수, 보호구 미착용, 무리한 작업 등)'
              )}
            </div>
          </div>
          
          {/* 근본원인 */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
              <span className="border-l-4 border-amber-300 text-amber-600 font-semibold bg-white px-2 py-1 rounded-sm text-sm mr-2">근본원인</span>
              사고의 근본적인 원인
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderCauseItems(
                causeAnalysis.root_cause.human_factor,
                'root_cause',
                'human_factor',
                '인적요인',
                '인적요인을 구체적으로 기술하세요 (예: 교육 부족, 경험 부족, 안전의식 결여 등)'
              )}
              
              {renderCauseItems(
                causeAnalysis.root_cause.system_factor,
                'root_cause',
                'system_factor',
                '업무/시스템적 요인',
                '업무/시스템적 요인을 구체적으로 기술하세요 (예: 안전관리체계 미흡, 작업절차 부재, 점검체계 부족 등)'
              )}
            </div>
          </div>
        </div>
        </div>
      )}

      {/* 재발방지대책 및 개선사항 */}
      {(showAll || showActionOnly) && (
        <div className="report-section">
          <div className="report-section-header">
            <h3 className="report-section-title">5. 재발방지대책 및 개선사항</h3>
            <p className="report-section-subtitle">체계적인 대책 수립 및 관리</p>
          </div>
          <div className="report-section-content">
          
          <div className="space-y-6">
            {/* 기술적 대책 */}
            <div className="bg-white border-l-4 border-sky-300 rounded p-4 mb-4">
              <h4 className="text-sky-600 font-semibold mb-2">기술적 대책</h4>
              {renderActionItems(
                preventionActions.technical_actions,
                'technical_actions',
                '기술적 대책',
                '설비 개선, 시설 보완, 안전장치 설치 등'
              )}
            </div>
            
            {/* 교육적 대책 */}
            <div className="bg-white border-l-4 border-emerald-300 rounded p-4 mb-4">
              <h4 className="text-emerald-600 font-semibold mb-2">교육적 대책</h4>
              {renderActionItems(
                preventionActions.educational_actions,
                'educational_actions',
                '교육적 대책',
                '안전교육, 훈련, 역량 강화 등'
              )}
            </div>
            
            {/* 관리적 대책 */}
            <div className="bg-white border-l-4 border-slate-300 rounded p-4 mb-4">
              <h4 className="text-slate-600 font-semibold mb-2">관리적 대책</h4>
              {renderActionItems(
                preventionActions.managerial_actions,
                'managerial_actions',
                '관리적 대책',
                '절차 개선, 관리체계 보완, 점검 강화 등'
              )}
            </div>
          </div>
        </div>
        </div>
      )}

      {/* 조사 결론 */}
      {(showAll || showConclusionOnly) && (
        <div className="report-section">
          <div className="report-section-header">
            <h3 className="report-section-title">6. 조사 결론</h3>
            <p className="report-section-subtitle">조사 결과 종합 및 결론</p>
          </div>
          <div className="report-section-content">
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">조사 결론</label>
              {editMode ? (
                <textarea
                  name="investigation_conclusion"
                  value={editForm.investigation_conclusion || ''}
                  onChange={onInputChange}
                  rows={4}
                  className="w-full max-w-full break-all break-words resize-y overflow-x-auto px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="조사 결과에 대한 종합적인 결론을 입력하세요"
                  wrap="hard"
                  style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap', overflowX: 'auto' }}
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
                  className="w-full max-w-full break-all break-words resize-y overflow-x-auto px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="조사 내용 요약"
                  wrap="hard"
                  style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap', overflowX: 'auto' }}
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
                  className="w-full max-w-full break-all break-words overflow-x-auto px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="조사관 이름"
                  style={{ wordBreak: 'break-all', overflowX: 'auto' }}
                />
              ) : (
                <p className="text-gray-900">{report.investigator_signature || '-'}</p>
              )}
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}; 