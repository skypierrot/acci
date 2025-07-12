import { useState, useCallback } from 'react';
import { getFormSettings, updateFormSettings, resetFormSettings, addMissingFields, FormFieldSetting } from '../services/report_form.service';

export const useSettings = (reportType: string) => {
  const [settings, setSettings] = useState<FormFieldSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 설정 로드 함수: 캐싱 적용으로 중복 호출 방지
  // @param forceRefresh - 캐시 무시하고 새로 로드 여부
  const loadSettings = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    try {
      const data = await getFormSettings(reportType, forceRefresh);
      setSettings(data);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }, [reportType]);

  // 설정 업데이트 함수: 변경된 설정 저장
  // @param updatedSettings - 업데이트할 설정 배열
  const updateSettings = useCallback(async (updatedSettings: FormFieldSetting[]) => {
    try {
      await updateFormSettings(reportType, updatedSettings);
      await loadSettings(true); // 저장 후 새로 로드
    } catch (err: any) {
      setError(err.message);
    }
  }, [reportType, loadSettings]);

  // 초기화 함수
  const resetSettings = useCallback(async () => {
    try {
      await resetFormSettings(reportType);
      await loadSettings(true);
    } catch (err: any) {
      setError(err.message);
    }
  }, [reportType, loadSettings]);

  // 누락 필드 추가 함수
  const addMissing = useCallback(async () => {
    try {
      await addMissingFields(reportType);
      await loadSettings(true);
    } catch (err: any) {
      setError(err.message);
    }
  }, [reportType, loadSettings]);

  return { settings, loading, error, loadSettings, updateSettings, resetSettings, addMissing };
}; 