import { useState, useEffect, useCallback } from 'react';
import { InvestigationReport, PropertyDamageItem } from '../types/investigation.types';

import { validateForm, submitForm, updateForm } from '../utils/formUtils';

interface UseInvestigationDataProps {
  accidentId: string;
  onSave?: (data: InvestigationReport) => void;
  onError?: (error: Error) => void;
}

interface UseInvestigationDataReturn {
  report: InvestigationReport | null;
  loading: boolean;
  error: Error | null;
  updateField: <K extends keyof InvestigationReport>(field: K, value: InvestigationReport[K]) => void;
  updatePropertyDamage: (index: number, item: Partial<PropertyDamageItem>) => void;
  addPropertyDamage: () => void;
  removePropertyDamage: (index: number) => void;
  saveReport: (data: Partial<InvestigationReport>) => Promise<void>;
  saving: boolean;
  saveSuccess: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export const useInvestigationData = ({ accidentId }: UseInvestigationDataProps): UseInvestigationDataReturn => {
  const [report, setReport] = useState<InvestigationReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 폼 필드 업데이트 함수 추가
  const updateField = useCallback(<K extends keyof InvestigationReport>(field: K, value: InvestigationReport[K]) => {
    setReport(prev => prev ? { ...prev, [field]: value } : prev);
  }, []);

  // 조사보고서 조회
  const fetchReport = useCallback(async () => {
    if (!accidentId) return;
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/investigation/${accidentId}`);
      
      if (!response.ok) {
        throw new Error('조사보고서를 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      const reportData = data.data || data;
      
      // injury_location_detail에서 물적피해 데이터 파싱
      let parsedReportData = { ...reportData };
      if (reportData.injury_location_detail) {
        try {
          const parsed = JSON.parse(reportData.injury_location_detail);
          if (parsed.property_damages && Array.isArray(parsed.property_damages)) {
            parsedReportData.property_damages = parsed.property_damages;
            parsedReportData.injury_location_detail = parsed.legacy_detail || '';
          }
        } catch (e) {
          // JSON 파싱 실패 시 기존 문자열 그대로 사용
          console.log('injury_location_detail은 일반 텍스트입니다.');
        }
      }
      
      // 물적피해 데이터가 없으면 빈 배열로 초기화
      if (!parsedReportData.property_damages) {
        parsedReportData.property_damages = [];
      }

      // 조사보고서용 물적피해 데이터가 없으면 빈 배열로 초기화
      if (!parsedReportData.investigation_property_damage) {
        parsedReportData.investigation_property_damage = [];
      } else {
        // 각 항목에 shutdown_start_date, recovery_expected_date가 없으면 빈 문자열로 초기화
        parsedReportData.investigation_property_damage = parsedReportData.investigation_property_damage.map((item: any) => ({
          ...item,
          shutdown_start_date: item.shutdown_start_date || '',
          recovery_expected_date: item.recovery_expected_date || '',
        }));
      }
      
      // cause_analysis 필드 파싱 (백엔드에서 JSON 문자열로 오는 경우)
      if (parsedReportData.cause_analysis && typeof parsedReportData.cause_analysis === 'string') {
        try {
          parsedReportData.cause_analysis = JSON.parse(parsedReportData.cause_analysis);
          console.log('cause_analysis 파싱 성공:', parsedReportData.cause_analysis);
        } catch (e) {
          console.error('cause_analysis 파싱 실패:', e);
          // 파싱 실패 시 기본 구조로 초기화
          parsedReportData.cause_analysis = {
            direct_cause: { unsafe_condition: [], unsafe_act: [] },
            root_cause: { human_factor: [], system_factor: [] }
          };
        }
      }
      
      // prevention_actions 필드 파싱 (백엔드에서 JSON 문자열로 오는 경우)
      if (parsedReportData.prevention_actions && typeof parsedReportData.prevention_actions === 'string') {
        try {
          parsedReportData.prevention_actions = JSON.parse(parsedReportData.prevention_actions);
          console.log('prevention_actions 파싱 성공:', parsedReportData.prevention_actions);
        } catch (e) {
          console.error('prevention_actions 파싱 실패:', e);
          // 파싱 실패 시 기본 구조로 초기화
          parsedReportData.prevention_actions = {
            technical_actions: [],
            educational_actions: [],
            managerial_actions: []
          };
        }
      }
      
      setReport(parsedReportData);
    } catch (err) {
      console.error('조사보고서 조회 오류:', err);
      setError(err instanceof Error ? err : new Error('알 수 없는 오류가 발생했습니다.'));
      
      // 백엔드 문제로 인한 임시 데이터
      const tempData: InvestigationReport = {
        accident_id: accidentId,
        investigation_global_accident_no: 'HHH-A-2024-001',
        investigation_team_lead: '김조사관',
        investigation_team_members: '박조사원, 이조사원',
        investigation_location: '현장 사무실',
        investigation_start_time: '2024-01-16T09:00:00Z',
        investigation_status: '조사 착수',
        
        // 원본 정보
        original_global_accident_no: 'HHH-A-2024-001',
        original_acci_time: '2024-01-15T09:30:00Z',
        original_acci_location: '3층 사무실',
        original_accident_type_level1: '넘어짐',
        original_accident_type_level2: '미끄러짐',
        original_acci_summary: '복도에서 미끄러져 넘어짐',
        original_acci_detail: '복도 청소 후 물기로 인해 미끄러져 넘어짐',
        original_victim_count: 1,
        
        // 조사 정보 (초기값은 원본과 동일)
        investigation_acci_time: '2024-01-15T09:30:00Z',
        investigation_acci_location: '3층 사무실',
        investigation_accident_type_level1: '넘어짐',
        investigation_accident_type_level2: '미끄러짐',
        investigation_acci_summary: '복도에서 미끄러져 넘어짐',
        investigation_acci_detail: '복도 청소 후 물기로 인해 미끄러져 넘어짐',
        investigation_victim_count: 1,
        
        // 피해 정보
        damage_cost: 0,
        property_damages: [],
        
        // 원인 분석
        direct_cause: '바닥 청소 후 물기 제거 미흡',
        root_cause: '청소 후 안전 확인 절차 부재',
        
        // 대책 정보
        corrective_actions: '1. 청소 후 물기 완전 제거 절차 수립\n2. 미끄럼 방지 매트 설치\n3. 안전 표지판 설치',
        action_schedule: '2024년 2월 말까지',
        action_verifier: '안전관리자',
        
        // 조사 결론
        investigation_conclusion: '청소 후 안전 관리 절차 미흡으로 인한 미끄럼 사고로 판단됨',
        investigator_signature: '김조사관',
        report_written_date: '2024-01-20T00:00:00Z'
      };
      setReport(tempData);
    } finally {
      setLoading(false);
    }
  }, [accidentId]);

  // 조사보고서 저장
  // @param editForm - 저장할 보고서 데이터
  // @returns Promise<void> - 저장 결과
  const saveReport = async (editForm: Partial<InvestigationReport>) => {
    if (!editForm.accident_id) {
      throw new Error('사고 ID가 없습니다.');
    }

    // 유효성 검사 수행
    const { isValid, errors } = validateForm(editForm);
    if (!isValid) {
      throw new Error(errors.join(', '));
    }

    try {
      setSaving(true);
      setError(null);
      
      // 백엔드에서 새로운 필드들을 지원하므로 그대로 전송
      let saveData = { ...editForm };
      
      // 물적피해 데이터를 JSON 문자열로 변환하여 injury_location_detail에 임시 저장
      saveData = {
        ...saveData,
        injury_location_detail: saveData.property_damages && saveData.property_damages.length > 0 
          ? JSON.stringify({
              property_damages: saveData.property_damages,
              legacy_detail: saveData.injury_location_detail || ''
            })
          : saveData.injury_location_detail || ''
      };
      
      // property_damages는 API 전송에서 제외 (백엔드에서 아직 지원하지 않음)
      delete saveData.property_damages;
      
      // 조사보고서용 물적피해 데이터는 백엔드에서 별도 테이블로 처리하므로 그대로 전송
      
      // 조사보고서 수정은 PUT 메서드 사용
      const response = await updateForm(saveData, `${API_BASE_URL}/investigation/${editForm.accident_id}`);
      
      // 저장 후 최신 데이터 재조회
      await fetchReport();
      setSaveSuccess(true);
      
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);

    } catch (err) {
      console.error('조사보고서 저장 오류:', err);
      setError(err instanceof Error ? err : new Error('저장 중 오류가 발생했습니다.'));
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // 물적피해 추가 함수 구현
  const addPropertyDamage = useCallback(() => {
    setReport(prev => {
      if (!prev) return prev;
      const newDamage: PropertyDamageItem = {
        id: '',
        damage_target: '',
        estimated_cost: 0,
        damage_content: '',
      };
      return {
        ...prev,
        property_damages: [...(prev.property_damages || []), newDamage]
      };
    });
  }, []);

// 물적피해 업데이트 함수 구현
  const updatePropertyDamage = useCallback((index: number, item: Partial<PropertyDamageItem>) => {
    setReport(prev => {
      if (!prev || !prev.property_damages) return prev;
      const newDamages = [...prev.property_damages];
      if (index >= 0 && index < newDamages.length) {
        newDamages[index] = { ...newDamages[index], ...item };
      }
      return {
        ...prev,
        property_damages: newDamages
      };
    });
  }, []);

// 물적피해 제거 함수 구현
  const removePropertyDamage = useCallback((index: number) => {
    setReport(prev => {
      if (!prev || !prev.property_damages) return prev;
      const newDamages = prev.property_damages.filter((_, i) => i !== index);
      return {
        ...prev,
        property_damages: newDamages
      };
    });
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return {
    report,
    loading,
    error,
    updateField,
    updatePropertyDamage,
    addPropertyDamage,
    removePropertyDamage,
    saveReport,
    saving,
    saveSuccess,
  };
}; 