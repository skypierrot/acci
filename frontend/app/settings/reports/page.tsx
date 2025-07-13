"use client";

import React, { useState, useEffect } from "react";
import { 
  getFormSettings, 
  updateFormSettings, 
  resetFormSettings,
  saveCurrentSettingsAsDefault,
  resetToDefaultSettings,
  addMissingFields,
  FormFieldSetting,
  getSequence,
  updateSequence
} from "@/services/report_form.service";
import GridLayoutEditor from "@/components/GridLayoutEditor";

/**
 * @file app/settings/reports/page.tsx
 * @description
 *  - 보고서 양식 설정 관리 페이지
 *  - 발생보고서와 조사보고서 양식의 표시 여부, 필수 항목, 순서, 그리드 레이아웃 등을 관리
 */

export default function ReportFormSettingsPage() {
  // 상태 관리
  const [formFields, setFormFields] = useState<FormFieldSetting[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentReportType, setCurrentReportType] = useState<string>("occurrence");
  const [activeTab, setActiveTab] = useState<string>("occurrence");
  const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "success" | "error" | "unsaved">("idle");
  const [resettingStatus, setResettingStatus] = useState<"idle" | "resetting" | "success" | "error">("idle");
  const [groupedFields, setGroupedFields] = useState<{ [key: string]: FormFieldSetting[] }>({});
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [gridCols, setGridCols] = useState<number>(12);
  const [gridRowHeight, setGridRowHeight] = useState<number>(50);
  const [gridDimensions, setGridDimensions] = useState<{ width: number; height: number }>({ width: 12, height: 20 });
  // 시퀀스 관리 상태
  const [seqType, setSeqType] = useState<'global' | 'site'>('site');
  const [seqCompany, setSeqCompany] = useState('');
  const [seqSite, setSeqSite] = useState('');
  const [seqYear, setSeqYear] = useState(new Date().getFullYear());
  const [currentSeq, setCurrentSeq] = useState<number | null>(null);
  const [newSeq, setNewSeq] = useState<number | null>(null);
  const [seqError, setSeqError] = useState<string | null>(null);
  const [seqSuccess, setSeqSuccess] = useState<string | null>(null);
  const [seqLoading, setSeqLoading] = useState(false);

  // 보고서 양식 설정 조회
  useEffect(() => {
    fetchFormSettings(currentReportType);
  }, [currentReportType]);

  // 필드 그룹별로 정렬
  useEffect(() => {
    if (formFields.length > 0) {
      console.log('🔄 [필드 정렬] 원본 필드들:', formFields.map(f => ({ 
        name: f.field_name, 
        group: f.field_group, 
        order: f.display_order 
      })));
      
      // 필요한 필드만 필터링 (그룹 조정 로직 제거)
      const validFields = formFields.filter(field => {
        // 폼에 없는 필드는 무시
        const nonExistingFields = ['work_related_type', 'misc_classification', 'victims_json'];
        return !nonExistingFields.includes(field.field_name);
      });
      
      const grouped = validFields.reduce((acc: { [key: string]: FormFieldSetting[] }, field) => {
        const group = field.field_group || "기타";
        if (!acc[group]) {
          acc[group] = [];
        }
        acc[group].push(field);
        return acc;
      }, {});

      // 각 그룹 내에서 display_order로 정렬
      Object.keys(grouped).forEach(group => {
        grouped[group].sort((a, b) => a.display_order - b.display_order);
        console.log(`📋 [${group}] 정렬된 필드들:`, grouped[group].map(f => ({ 
          name: f.field_name, 
          order: f.display_order 
        })));
      });

      setGroupedFields(grouped);
    }
  }, [formFields]);

  // 보고서 양식 설정 조회 함수
  const fetchFormSettings = async (reportType: string, forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const settings = await getFormSettings(reportType, forceRefresh);
      
      // 필요한 필드만 필터링
      const filteredSettings = settings.filter(field => {
        // 폼에 없는 필드는 무시
        const nonExistingFields = ['work_related_type', 'misc_classification', 'victims_json'];
        return !nonExistingFields.includes(field.field_name);
      });
      
      setFormFields(filteredSettings);
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "보고서 양식 설정을 조회하는 중 오류가 발생했습니다.");
      setLoading(false);
      console.error(`${reportType} 보고서 양식 설정 조회 오류:`, err);
    }
  };

  // 보고서 유형 변경 핸들러
  const handleReportTypeChange = (reportType: string) => {
    setCurrentReportType(reportType);
    setActiveTab(reportType);
  };

  // 필드 표시 여부 변경 핸들러
  const handleVisibilityChange = (fieldId: string, isVisible: boolean) => {
    console.log('🔄 [설정 변경] 표시 여부 변경:', { fieldId, isVisible });
    
    setFormFields(prev => {
      const updated = prev.map(field => {
        if (field.id === fieldId) {
          const updatedField = { ...field, is_visible: isVisible };
          console.log('✅ [필드 업데이트]', { 
            fieldName: field.field_name, 
            before: field.is_visible, 
            after: isVisible 
          });
          return updatedField;
        }
        return field;
      });
      
      console.log('📊 [전체 필드 상태]', updated.map(f => ({ 
        name: f.field_name, 
        visible: f.is_visible 
      })));
      
      return updated;
    });
    
    setSavingStatus("unsaved");
  };

  // 필드 필수 여부 변경 핸들러
  const handleRequiredChange = (fieldId: string, isRequired: boolean) => {
    console.log('🔄 [설정 변경] 필수 여부 변경:', { fieldId, isRequired });
    
    setFormFields(prev => {
      const updated = prev.map(field => {
        if (field.id === fieldId) {
          const updatedField = { ...field, is_required: isRequired };
          console.log('✅ [필수 여부 업데이트]', { 
            fieldName: field.field_name, 
            before: field.is_required, 
            after: isRequired 
          });
          return updatedField;
        }
        return field;
      });
      
      return updated;
    });
    
    setSavingStatus("unsaved");
  };

  // 필드 순서 변경 핸들러
  const handleOrderChange = (fieldId: string, direction: "up" | "down") => {
    console.log('🔄 [순서 변경] 시작:', { fieldId, direction });
    
    const updatedFields = [...formFields];
    const fieldIndex = updatedFields.findIndex(field => field.id === fieldId);
    
    if (fieldIndex === -1) {
      console.log('❌ [순서 변경] 필드를 찾을 수 없음:', fieldId);
      return;
    }
    
    const field = updatedFields[fieldIndex];
    const fieldGroup = field.field_group;
    
    console.log('📍 [순서 변경] 대상 필드:', { 
      name: field.field_name, 
      group: fieldGroup, 
      currentOrder: field.display_order 
    });
    
    // 특정 그룹에 속한 보이는 필드만 필터링
    const visibleFieldsInSameGroup = updatedFields.filter(
      f => f.field_group === fieldGroup && f.is_visible
    );
    
    // 현재 필드의 그룹 내 인덱스 찾기
    const fieldGroupIndex = visibleFieldsInSameGroup.findIndex(f => f.id === fieldId);
    
    if (direction === "up" && fieldGroupIndex > 0) {
      // 위로 이동
      const targetField = visibleFieldsInSameGroup[fieldGroupIndex - 1];
      const tempOrder = field.display_order;
      
      // 순서 변경
      updatedFields[fieldIndex].display_order = targetField.display_order;
      updatedFields[updatedFields.findIndex(f => f.id === targetField.id)].display_order = tempOrder;
    } else if (direction === "down" && fieldGroupIndex < visibleFieldsInSameGroup.length - 1) {
      // 아래로 이동
      const targetField = visibleFieldsInSameGroup[fieldGroupIndex + 1];
      const tempOrder = field.display_order;
      
      // 순서 변경
      updatedFields[fieldIndex].display_order = targetField.display_order;
      updatedFields[updatedFields.findIndex(f => f.id === targetField.id)].display_order = tempOrder;
    }
    
    // 그룹별로 필드를 재정렬하여 순서 값을 연속적으로 만듦
    const groupedForReorder: Record<string, FormFieldSetting[]> = {};
    
    // 각 그룹별로 필드 분류
    updatedFields.forEach(field => {
      const group = field.field_group || '기타';
      if (!groupedForReorder[group]) {
        groupedForReorder[group] = [];
      }
      groupedForReorder[group].push(field);
    });
    
    // 각 그룹 내에서 현재 display_order 기준으로 정렬 후 연속된 값으로 재할당
    const finalFields: FormFieldSetting[] = [];
    
    // 그룹 순서 정의
    const groupOrder = ['기본정보', '사고정보', '재해자정보', '첨부파일', '보고자정보', '기타'];
    
    // 각 그룹의 시작 순서값 계산
    let lastOrder = 0;
    
    // 그룹 순서대로 처리
    groupOrder.forEach(group => {
      if (!groupedForReorder[group]) return; // 해당 그룹이 없으면 건너뛰기
      
      const groupFields = groupedForReorder[group].sort((a, b) => a.display_order - b.display_order);
      
      // 그룹 내 시작 순서는 이전 그룹의 마지막 순서 + 1
      const startOrder = lastOrder + 1;
      
      // 연속된 순서값 할당
      groupFields.forEach((field, i) => {
        field.display_order = startOrder + i;
        finalFields.push(field);
      });
      
      // 이 그룹의 마지막 순서값 저장
      lastOrder = startOrder + groupFields.length - 1;
    });
    
    // 최종 정렬된 필드로 상태 업데이트
    setFormFields(finalFields);
    
    // 저장 안내 표시
    setSavingStatus("unsaved");
  };

  // 그리드 레이아웃 변경 핸들러
  const handleGridLayoutChange = (updatedFields: FormFieldSetting[]) => {
    console.log('🔄 [그리드 레이아웃] 변경된 필드들:', updatedFields);
    setFormFields(updatedFields);
    setSavingStatus("unsaved");
  };

  // 그리드 열 수 변경 핸들러
  const handleGridColsChange = (value: number) => {
    setGridCols(value);
    setGridDimensions(prev => ({ ...prev, width: value }));
  };

  // 그리드 행 높이 변경 핸들러
  const handleGridRowHeightChange = (value: number) => {
    setGridRowHeight(value);
  };

  // 필드별 설명 가져오기
  const getFieldDescription = (fieldName: string): string => {
    const descriptions: { [key: string]: string } = {
      'global_accident_no': '회사 전체 사고 관리용 코드 (예: HHH-2025-001)',
      'accident_id': '사업장별 사고 식별 코드 (예: HHH-A-001-20250525)',
      'report_channel_no': '시스템 내부 보고 경로 번호 (일반적으로 숨김 처리)',
      'company_name': '사고가 발생한 회사명',
      'company_code': '회사 식별 코드 (시스템 내부용)',
      'site_name': '사고가 발생한 사업장명',
      'site_code': '사업장 식별 코드 (시스템 내부용)',
      'acci_time': '사고가 발생한 날짜와 시간',
      'accident_name': '사고의 간단한 제목 (예: 제조라인 A 추락사고)',
      'acci_location': '사고가 발생한 구체적인 위치',
      'accident_type_level1': '사고 분류 (인적/물적/복합)',
      'accident_type_level2': '세부 사고 유형 (기계/전기/추락 등)',
      'victim_count': '사고로 피해를 받은 인원 수',
      'victim_name': '재해자의 이름',
      'victim_age': '재해자의 나이',
      'victim_belong': '재해자의 소속 부서',
      'victim_duty': '재해자의 직무/업무',
      'injury_type': '상해 정도',
      'ppe_worn': '개인보호구 착용 여부',
      'first_aid': '현장에서 실시한 응급조치 내용',
      'damage_target': '피해를 받은 대상물 (예: 생산설비, 건물, 차량 등)',
      'estimated_cost': '예상되는 피해금액 (천원 단위)',
      'damage_content': '구체적인 피해 내용 및 범위',
      'acci_summary': '사고의 간단한 개요',
      'acci_detail': '사고의 상세한 경위와 내용',
      'scene_photos': '사고 현장 사진 파일',
      'cctv_video': 'CCTV 영상 파일',
      'statement_docs': '관계자 진술서 파일',
      'etc_documents': '기타 관련 문서 파일',
      'reporter_name': '사고를 보고한 사람의 이름',
      'reporter_position': '보고자의 직책',
      'reporter_belong': '보고자의 소속 부서',
      'report_channel': '사고 보고 경로 (전화/시스템 등)',
      'is_contractor': '협력업체 직원 여부',
      'contractor_name': '협력업체명',
      'first_report_time': '사고가 최초 보고된 시간'
    };
    
    return descriptions[fieldName] || '';
  };

  // 양식 설정 저장 핸들러
  const handleSaveSettings = async () => {
    try {
      console.log('💾 [저장 시작] 보고서 타입:', currentReportType);
      console.log('💾 [저장 시작] 필드 수:', formFields.length);
      
      setSavingStatus("saving");
      setError(null);
      
      // 수정된 필드 설정 적용
      const updatedFields = formFields.map(field => {
        // 그룹 설정 조정
        if (field.field_name === 'is_contractor' || field.field_name === 'contractor_name') {
          return { ...field, field_group: '기본정보' }; // 협력업체 정보는 기본정보 그룹으로 이동
        }
        
        if (field.field_name === 'first_report_time') {
          return { ...field, field_group: '기본정보' }; // 최초보고시간은 기본정보 그룹으로 이동
        }
        
        // group_cols 정보가 있으면 그대로 유지 (GridLayoutEditor에서 설정됨)
        
        return field;
      });
      
      console.log('💾 [API 호출] updateFormSettings 호출 전');
      console.log('💾 [저장할 필드들]:', updatedFields.map(f => ({ 
        id: f.id, 
        field_name: f.field_name, 
        group_cols: f.group_cols,
        field_group: f.field_group 
      })));
      await updateFormSettings(currentReportType, updatedFields);
      console.log('💾 [API 호출] updateFormSettings 호출 완료');
      
      // 프론트엔드 캐시 완전 초기화 (모든 관련 캐시 삭제)
      localStorage.removeItem(`${currentReportType}_form_settings`);
      localStorage.removeItem('occurrence_form_settings');
      localStorage.removeItem('investigation_form_settings');
      
      // 설정 다시 로드하여 최신 상태 반영 (강제 새로고침)
      await fetchFormSettings(currentReportType, true);
      
      setSavingStatus("success");
      setTimeout(() => setSavingStatus("idle"), 3000);
    } catch (err: any) {
      setError(err.message || "보고서 양식 설정을 저장하는 중 오류가 발생했습니다.");
      setSavingStatus("error");
      console.error(`${currentReportType} 보고서 양식 설정 저장 오류:`, err);
    }
  };

  // 현재 설정을 기본설정으로 저장 핸들러
  const handleSaveAsDefault = async () => {
    if (!confirm("현재 설정을 기본설정으로 저장하시겠습니까? 이 설정이 새로운 기본값이 됩니다.")) {
      return;
    }
    
    try {
      setSavingStatus("saving");
      setError(null);
      
      const result = await saveCurrentSettingsAsDefault(currentReportType);
      
      setSavingStatus("success");
      setTimeout(() => setSavingStatus("idle"), 3000);
      
      // 수정: savedCount를 result.data.savedCount로 안전하게 접근
      const savedCount = result?.data?.savedCount ?? 0;
      alert(`현재 설정이 기본설정으로 저장되었습니다. (${savedCount}개 필드)`);
    } catch (err: any) {
      setError(err.message || "기본설정 저장 중 오류가 발생했습니다.");
      setSavingStatus("error");
      console.error(`${currentReportType} 기본설정 저장 오류:`, err);
    }
  };

  // 기본설정으로 초기화 핸들러
  const handleResetToDefault = async () => {
    if (!confirm("기본설정으로 초기화하시겠습니까? 모든 변경사항이 기본설정으로 되돌아갑니다.")) {
      return;
    }
    
    try {
      setResettingStatus("resetting");
      setError(null);
      
      // 현재 재해자 수 필드 설정 저장
      const currentVictimCountSetting = formFields.find(field => field.field_name === 'victim_count');
      
      const resetSettings = await resetToDefaultSettings(currentReportType);
      
      // 백엔드에서 데이터가 없으면 오류 표시 후 함수 종료
      if (!resetSettings || !Array.isArray(resetSettings)) {
        throw new Error("초기화된 설정 데이터를 받지 못했습니다");
      }
      
      // 필요한 필드만 필터링하고 그룹 설정 조정
      const filteredSettings = resetSettings
        .filter(field => {
          // 폼에 없는 필드는 무시
          const nonExistingFields = ['work_related_type', 'misc_classification', 'victims_json'];
          return !nonExistingFields.includes(field.field_name);
        })
        .map(field => {
          // 그룹 설정 조정
          if (field.field_name === 'is_contractor' || field.field_name === 'contractor_name') {
            return { ...field, field_group: '기본정보' }; // 협력업체 정보는 기본정보 그룹으로 이동
          }
          
          if (field.field_name === 'first_report_time') {
            return { ...field, field_group: '기본정보' }; // 최초보고시간은 기본정보 그룹으로 이동
          }
          
          // 재해자 수 필드 설정 유지
          if (field.field_name === 'victim_count' && currentVictimCountSetting) {
            return { ...field, ...currentVictimCountSetting };
          }
          
          return field;
        });
      
      setFormFields(filteredSettings);
      
      // 프론트엔드 캐시 완전 초기화 (모든 관련 캐시 삭제)
      localStorage.removeItem(`${currentReportType}_form_settings`);
      localStorage.removeItem('occurrence_form_settings');
      localStorage.removeItem('investigation_form_settings');
      
      setResettingStatus("success");
      setTimeout(() => setResettingStatus("idle"), 3000);
    } catch (err: any) {
      setError(err.message || "기본설정 초기화 중 오류가 발생했습니다.");
      setResettingStatus("error");
      console.error(`${currentReportType} 기본설정 초기화 오류:`, err);
    }
  };

  // 기존 초기화 핸들러 (코드 기본값으로 초기화)
  const handleResetSettings = async () => {
    if (!confirm("정말 양식 설정을 초기화하시겠습니까? 모든 변경사항이 기본값으로 되돌아갑니다.")) {
      return;
    }
    
    try {
      setResettingStatus("resetting");
      setError(null);
      
      // 현재 재해자 수 필드 설정 저장
      const currentVictimCountSetting = formFields.find(field => field.field_name === 'victim_count');
      
      const resetSettings = await resetFormSettings(currentReportType);
      
      // 백엔드에서 데이터가 없으면 오류 표시 후 함수 종료
      if (!resetSettings || !Array.isArray(resetSettings)) {
        throw new Error("초기화된 설정 데이터를 받지 못했습니다");
      }
      
      // 필요한 필드만 필터링하고 그룹 설정 조정
      const filteredSettings = resetSettings
        .filter(field => {
          // 폼에 없는 필드는 무시
          const nonExistingFields = ['work_related_type', 'misc_classification', 'victims_json'];
          return !nonExistingFields.includes(field.field_name);
        })
        .map(field => {
          // 그룹 설정 조정
          if (field.field_name === 'is_contractor' || field.field_name === 'contractor_name') {
            return { ...field, field_group: '기본정보' }; // 협력업체 정보는 기본정보 그룹으로 이동
          }
          
          if (field.field_name === 'first_report_time') {
            return { ...field, field_group: '기본정보' }; // 최초보고시간은 기본정보 그룹으로 이동
          }
          
          // 재해자 수 필드 설정 유지
          if (field.field_name === 'victim_count' && currentVictimCountSetting) {
            return { ...field, ...currentVictimCountSetting };
          }
          
          return field;
        });
      
      setFormFields(filteredSettings);
      
      // 프론트엔드 캐시 완전 초기화 (모든 관련 캐시 삭제)
      localStorage.removeItem(`${currentReportType}_form_settings`);
      localStorage.removeItem('occurrence_form_settings');
      localStorage.removeItem('investigation_form_settings');
      
      setResettingStatus("success");
      setTimeout(() => setResettingStatus("idle"), 3000);
    } catch (err: any) {
      setError(err.message || "보고서 양식 설정을 초기화하는 중 오류가 발생했습니다.");
      setResettingStatus("error");
      console.error(`${currentReportType} 보고서 양식 설정 초기화 오류:`, err);
    }
  };

  // 시퀀스 값 조회
  const fetchSequence = async () => {
    setSeqError(null);
    setSeqSuccess(null);
    setSeqLoading(true);
    try {
      const res = await getSequence(seqCompany, seqSite, seqYear, seqType);
      setCurrentSeq(res.current_seq);
      setNewSeq(res.current_seq);
    } catch (e: any) {
      setSeqError(e.message || '시퀀스 값을 불러오지 못했습니다.');
      setCurrentSeq(null);
    }
    setSeqLoading(false);
  };

  // 시퀀스 값 수정
  const handleUpdateSeq = async () => {
    setSeqError(null);
    setSeqSuccess(null);
    setSeqLoading(true);
    try {
      await updateSequence(seqCompany, seqSite, seqYear, newSeq, seqType);
      setSeqSuccess('시퀀스 값이 성공적으로 변경되었습니다.');
      setCurrentSeq(newSeq);
    } catch (e: any) {
      setSeqError(e.response?.data?.error || e.message || '시퀀스 값 변경 실패');
    }
    setSeqLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-md shadow">
      <h1 className="text-2xl font-bold mb-6">보고서 양식 설정</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* 시퀀스 관리 UI */}
      <div className="mb-8 p-4 border rounded bg-gray-50">
        <h2 className="font-bold mb-2">시퀀스 관리</h2>
        <div className="flex flex-wrap gap-2 items-center mb-2">
          <select className="border px-2 py-1 rounded" value={seqType} onChange={e => setSeqType(e.target.value as 'global' | 'site')}>
            <option value="site">사업장사고코드</option>
            <option value="global">전체사고코드</option>
          </select>
          <input className="border px-2 py-1 rounded" placeholder="회사코드" value={seqCompany} onChange={e => setSeqCompany(e.target.value)} style={{width:100}} />
          {seqType === 'site' && (
            <input className="border px-2 py-1 rounded" placeholder="사업장코드" value={seqSite} onChange={e => setSeqSite(e.target.value)} style={{width:100}} />
          )}
          <input className="border px-2 py-1 rounded" type="number" min={2000} max={2100} value={seqYear} onChange={e => setSeqYear(Number(e.target.value))} style={{width:90}} />
          <button className="px-3 py-1 bg-blue-500 text-white rounded" onClick={fetchSequence} disabled={seqLoading || !seqCompany || (seqType === 'site' && !seqSite)}>조회</button>
        </div>
        {currentSeq !== null && (
          <div className="flex items-center gap-2 mb-2">
            <span>현재 시퀀스: <b>{String(currentSeq).padStart(3, '0')}</b></span>
            <input className="border px-2 py-1 rounded w-20" type="number" min={1} max={999} value={newSeq ?? ''} onChange={e => setNewSeq(Number(e.target.value))} />
            <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={handleUpdateSeq} disabled={seqLoading || newSeq === null || newSeq === currentSeq}>적용</button>
          </div>
        )}
        <div className="text-xs text-gray-500 mb-1">※ 시퀀스 값은 1~999 사이, 현재 존재하는 accident_id/global_accident_no의 최대값 이상만 허용, 중복 불가</div>
        {seqError && <div className="text-red-500 text-sm">{seqError}</div>}
        {seqSuccess && <div className="text-green-600 text-sm">{seqSuccess}</div>}
      </div>
      
      {/* 보고서 유형 탭 */}
      <div className="mb-6 border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
          <li className="mr-2">
            <button
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === "occurrence"
                  ? "text-blue-600 border-b-2 border-blue-600 active"
                  : "text-gray-500 border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300"
              }`}
              onClick={() => handleReportTypeChange("occurrence")}
            >
              발생보고서
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === "investigation"
                  ? "text-blue-600 border-b-2 border-blue-600 active"
                  : "text-gray-500 border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300"
              }`}
              onClick={() => handleReportTypeChange("investigation")}
              disabled={true} // 조사보고서는 아직 구현 안함
            >
              조사보고서 (준비중)
            </button>
          </li>
        </ul>
      </div>
      
      {/* 양식 설정 정보 */}
      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          {currentReportType === "occurrence" ? "발생보고서" : "조사보고서"} 양식의 항목 표시 여부, 필수 항목 지정, 순서 등을 설정할 수 있습니다.
          변경 사항은 저장 후 새로 작성되는 보고서부터 적용됩니다.
        </p>
        
        {currentReportType === "occurrence" && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">📋 주요 필드 구조 안내</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>전체사고코드:</strong> 회사 전체 사고 관리용 (예: HHH-2025-001)</p>
              <p><strong>사업장사고코드:</strong> 사업장별 사고 식별용 - 실제 사용자가 보는 메인 코드 (예: HHH-A-001-20250525)</p>
              <p><strong>보고 경로 번호:</strong> 시스템 내부용으로 일반적으로 숨김 처리됨</p>
            </div>
          </div>
        )}
        
        <div className="flex gap-2 mb-6">
          <button
            className={`px-4 py-2 text-white rounded ${savingStatus === "saving" ? "bg-yellow-500 hover:bg-yellow-600" : "bg-blue-500 hover:bg-blue-600"}`}
            onClick={handleSaveSettings}
            disabled={savingStatus === "saving"}
          >
            {savingStatus === "saving" ? "저장 중..." : "변경사항 저장"}
          </button>
          <button
            className={`px-4 py-2 text-white rounded ${savingStatus === "saving" ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-600 hover:bg-green-700"}`}
            onClick={handleSaveAsDefault}
            disabled={savingStatus === "saving"}
          >
            {savingStatus === "saving" ? "저장 중..." : "현재설정을 기본설정으로 저장"}
          </button>
          <button
            className={`px-4 py-2 text-white rounded ${resettingStatus === "resetting" ? "bg-yellow-500 hover:bg-yellow-600" : "bg-gray-500 hover:bg-gray-600"}`}
            onClick={handleResetToDefault}
            disabled={resettingStatus === "resetting"}
          >
            {resettingStatus === "resetting" ? "초기화 중..." : "기본값으로 초기화"}
          </button>
        </div>

        {/* 뷰 모드 선택 */}
        <div className="mb-4 border-b border-gray-200">
          <ul className="flex flex-wrap -mb-px text-sm font-medium">
            <li className="mr-2">
              <button
                className={`inline-block p-2 rounded-t-lg ${
                  viewMode === "list"
                    ? "text-blue-600 border-b-2 border-blue-600 active"
                    : "text-gray-500 border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300"
                }`}
                onClick={() => setViewMode("list")}
              >
                목록 뷰
              </button>
            </li>
            <li className="mr-2">
              <button
                className={`inline-block p-2 rounded-t-lg ${
                  viewMode === "grid"
                    ? "text-blue-600 border-b-2 border-blue-600 active"
                    : "text-gray-500 border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300"
                }`}
                onClick={() => setViewMode("grid")}
              >
                그리드 레이아웃
              </button>
            </li>
          </ul>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : viewMode === "list" ? (
        /* 필드 그룹별 항목 설정 목록 */
        <div className="space-y-8">
          {Object.entries(groupedFields).map(([group, fields]) => (
            <div key={group} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{group}</h2>
                <div className="text-sm text-gray-500">
                  표시: {fields.filter(f => f.is_visible).length} / {fields.length} |
                  필수: {fields.filter(f => f.is_required).length}개
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        필드명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        표시 여부
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        필수 여부
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        표시 순서
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fields.map((field) => (
                      <tr key={`${field.id}-${field.is_visible}-${field.is_required}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {field.display_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {field.field_name}
                          </div>
                          {getFieldDescription(field.field_name) && (
                            <div className="text-xs text-blue-600 mt-1">
                              {getFieldDescription(field.field_name)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                                field.is_visible ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
                              }`}
                              checked={field.is_visible}
                              onChange={(e) => handleVisibilityChange(field.id!, e.target.checked)}
                            />
                            <span className={`ml-2 text-sm ${
                              field.is_visible ? 'text-green-600 font-medium' : 'text-gray-500'
                            }`}>
                              {field.is_visible ? "✓ 표시" : "✗ 숨김"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                                field.is_required ? 'bg-red-600 border-red-600' : 'bg-white border-gray-300'
                              } ${!field.is_visible ? 'opacity-50 cursor-not-allowed' : ''}`}
                              checked={field.is_required}
                              onChange={(e) => handleRequiredChange(field.id!, e.target.checked)}
                              disabled={!field.is_visible} // 숨김 필드는 필수 설정 불가
                            />
                            <span className={`ml-2 text-sm ${
                              !field.is_visible ? 'text-gray-400' : 
                              field.is_required ? 'text-red-600 font-medium' : 'text-gray-600'
                            }`}>
                              {field.is_required ? "★ 필수" : "○ 선택"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <button
                              className="p-1 bg-gray-100 hover:bg-gray-200 rounded"
                              onClick={() => handleOrderChange(field.id!, "up")}
                              disabled={!field.is_visible} // 숨김 필드는 순서 변경 불가
                            >
                              <span className="sr-only">위로</span>
                              ↑
                            </button>
                            <button
                              className="p-1 bg-gray-100 hover:bg-gray-200 rounded"
                              onClick={() => handleOrderChange(field.id!, "down")}
                              disabled={!field.is_visible} // 숨김 필드는 순서 변경 불가
                            >
                              <span className="sr-only">아래로</span>
                              ↓
                            </button>
                            <span className="ml-2">{field.display_order}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 그리드 레이아웃 에디터 */
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">그리드 레이아웃 설정</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  그리드 가로 칸 수
                </label>
                <div className="flex items-center">
                  <input
                    type="range"
                    min="3"
                    max="24"
                    value={gridCols}
                    onChange={(e) => handleGridColsChange(parseInt(e.target.value))}
                    className="mr-2 w-full"
                  />
                  <span className="text-sm text-gray-500 w-10 text-right">{gridCols}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  행 높이 (픽셀)
                </label>
                <div className="flex items-center">
                  <input
                    type="range"
                    min="30"
                    max="100"
                    step="5"
                    value={gridRowHeight}
                    onChange={(e) => handleGridRowHeightChange(parseInt(e.target.value))}
                    className="mr-2 w-full"
                  />
                  <span className="text-sm text-gray-500 w-10 text-right">{gridRowHeight}</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mt-4">
                  * 항목을 드래그하여 위치를 변경하고, 모서리를 드래그하여 크기를 조절할 수 있습니다.
                </p>
              </div>
            </div>
            
            <GridLayoutEditor 
              fields={formFields}
              onLayoutChange={handleGridLayoutChange}
              cols={gridCols}
              rowHeight={gridRowHeight}
              gridDimensions={gridDimensions}
              reportType={currentReportType}
            />
          </div>
        </div>
      )}
    </div>
  );
} 