import { useState, useEffect, useCallback } from 'react';
import { InvestigationReport, PropertyDamageItem } from '../types/investigation.types';
import { convertCauseAnalysisToLegacy, convertPreventionActionsToLegacy } from '../utils/investigation.utils';

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

  // 조사보고서 조회
  const fetchReport = useCallback(async () => {
    if (!accidentId) return;
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/investigation/${accidentId}`);
      
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
  const saveReport = async (editForm: Partial<InvestigationReport>) => {
    if (!editForm.accident_id) {
      throw new Error('사고 ID가 없습니다.');
    }

    try {
      setSaving(true);
      setError(null);
      
      // 새로운 원인 분석 데이터를 기존 형태로 변환 (백엔드 호환성)
      let convertedData = { ...editForm };
      if (editForm.cause_analysis) {
        const { directCause, rootCause } = convertCauseAnalysisToLegacy(editForm.cause_analysis);
        convertedData.direct_cause = directCause;
        convertedData.root_cause = rootCause;
        // 새로운 형태는 백엔드에서 아직 지원하지 않으므로 제거
        delete convertedData.cause_analysis;
      }
      
      // 새로운 대책 데이터를 기존 형태로 변환 (백엔드 호환성)
      if (editForm.prevention_actions) {
        const { correctiveActions, actionSchedule, actionVerifier } = convertPreventionActionsToLegacy(editForm.prevention_actions);
        convertedData.corrective_actions = correctiveActions;
        convertedData.action_schedule = actionSchedule;
        convertedData.action_verifier = actionVerifier;
        // 새로운 형태는 백엔드에서 아직 지원하지 않으므로 제거
        delete convertedData.prevention_actions;
      }
      
      // 물적피해 데이터를 JSON 문자열로 변환하여 injury_location_detail에 임시 저장
      const saveData = {
        ...convertedData,
        // 물적피해 데이터가 있으면 JSON으로 변환하여 저장
        injury_location_detail: convertedData.property_damages && convertedData.property_damages.length > 0 
          ? JSON.stringify({
              property_damages: convertedData.property_damages,
              legacy_detail: convertedData.injury_location_detail || ''
            })
          : convertedData.injury_location_detail || ''
      };
      
      // property_damages는 API 전송에서 제외 (백엔드에서 아직 지원하지 않음)
      delete saveData.property_damages;
      
      const response = await fetch(`${API_BASE_URL}/api/investigation/${editForm.accident_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '조사보고서 저장에 실패했습니다.');
      }

      const data = await response.json();
      setReport(data.data || editForm as InvestigationReport);
      setSaveSuccess(true);
      
      // 성공 메시지 3초 후 자동 숨김
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