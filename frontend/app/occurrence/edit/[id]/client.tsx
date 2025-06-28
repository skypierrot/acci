"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";
import FileUploader from "../../../../components/FileUploader";
import { OccurrenceReportData, VictimInfo, formatDateForInput, updateOccurrenceReport, getOccurrenceReport, processDateFields } from "../../../../services/occurrence/occurrence.service";
import { getFormSettings, FormFieldSetting } from "../../../../services/report_form.service";

// 발생보고서 상세 데이터 인터페이스
interface OccurrenceReportDetail {
  accident_id: string;
  global_accident_no: string;
  company_name: string;
  company_code: string;
  site_name: string;
  site_code: string;
  acci_time: string;
  acci_location: string;
  is_contractor: boolean;
  contractor_name: string;
  victim_count: number;
  victim_name: string;
  victim_age: number;
  victim_belong: string;
  victim_duty: string;
  accident_type_level1: string;
  accident_type_level2: string;
  injury_type: string;
  ppe_worn: string;
  first_aid: string;
  acci_summary: string;
  acci_detail: string;
  reporter_name: string;
  reporter_position: string;
  reporter_belong: string;
  scene_photos: string[];
  cctv_video: string[];
  statement_docs: string[];
  etc_documents: string[];
  report_channel: string;
  report_channel_no: string;
  first_report_time: string;
  victims?: VictimInfo[];  // 다중 재해자 정보
  victims_json?: string;   // 다중 재해자 정보 JSON 문자열
  created_at?: string;     // 생성 시간
  updated_at?: string;     // 수정 시간
}

// 파일 정보 인터페이스
interface FileInfo {
  id: string;
  name: string;
  type: string;
  url: string;
}

// 코드 포맷 도우미 함수 추가
const formatGlobalAccidentNo = (code: string) => {
  if (!code) return '';
  // 기존 포맷이 회사코드-연도-순번 형식이라고 가정
  return code;
};

const formatSiteAccidentNo = (code: string) => {
  if (!code) return '';
  // 기존 포맷이 회사코드-사업장코드-순번-날짜 형식이라고 가정
  return code;
};

// 한국 시간대 설정 헬퍼 함수
const getKoreanDate = (date = new Date()) => {
  // 한국 시간으로 변환 (UTC+9)
  const koreaTimeOffset = 9 * 60; // 9시간을 분으로 변환
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000); // UTC 시간 (밀리초)
  return new Date(utc + (koreaTimeOffset * 60000)); // 한국 시간
};

// 클라이언트 컴포넌트
const OccurrenceEditClient = ({ id }: { id: string }) => {
  const router = useRouter();
  
  // 상태 관리
  const [report, setReport] = useState<OccurrenceReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // 양식 설정 상태
  const [formSettings, setFormSettings] = useState<FormFieldSetting[]>([]);
  const [formSettingsLoaded, setFormSettingsLoaded] = useState(false);
  const [groupedSettings, setGroupedSettings] = useState<{ [key: string]: FormFieldSetting[] }>({});
  
  // 파일 업로드 상태
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, FileInfo[]>>({
    scene_photos: [],
    cctv_video: [],
    statement_docs: [],
    etc_documents: []
  });
  
  // 재해자 관리 상태
  const [victims, setVictims] = useState<VictimInfo[]>([]);
  const [isMultipleVictims, setIsMultipleVictims] = useState(false);

  // 양식 설정 로드
  useEffect(() => {
    async function fetchFormSettings() {
      try {
        console.log("양식 설정 로드 중...");
        
        // 로컬 스토리지에서 폼 세팅 먼저 확인
        const cachedSettings = localStorage.getItem('occurrence_form_settings');
        if (cachedSettings) {
          try {
            const parsed = JSON.parse(cachedSettings);
            console.log('로컬 스토리지에서 양식 설정 로드됨:', parsed);
            setFormSettings(parsed);
            organizeSettingsByGroup(parsed);
            setFormSettingsLoaded(true);
          } catch (e) {
            console.error('로컬 스토리지 데이터 파싱 오류:', e);
            // 오류 발생 시 API 호출 계속 진행
          }
        }
        
        // API에서 최신 설정 조회
        const settings = await getFormSettings("occurrence");
        console.log(`${settings.length}개의 양식 설정 로드됨:`, settings);
        
        setFormSettings(settings);
        organizeSettingsByGroup(settings);
        
        // 로컬 스토리지에 저장
        localStorage.setItem('occurrence_form_settings', JSON.stringify(settings));
        
        setFormSettingsLoaded(true);
      } catch (err) {
        console.error("양식 설정 로드 오류:", err);
        setFormSettingsLoaded(true); // 오류가 있어도 로드 완료 처리
      }
    }
    
    fetchFormSettings();
  }, []);

  // 설정을 그룹별로 정리하고 정렬하는 함수
  const organizeSettingsByGroup = (settings: FormFieldSetting[]) => {
    // 실제 폼에 존재하지 않는 필드 필터링
    const validSettings = settings.filter(setting => {
      // 폼에 없는 필드는 무시
      const nonExistingFields = ['work_related_type', 'misc_classification', 'victims_json'];
      if (nonExistingFields.includes(setting.field_name)) {
        return false;
      }
      
      // 잘못된 그룹 설정 수정
      if (setting.field_name === 'is_contractor' || setting.field_name === 'contractor_name') {
        setting.field_group = '기본정보'; // 협력업체 정보는 기본정보 그룹으로 이동
      }
      
      if (setting.field_name === 'first_report_time') {
        setting.field_group = '기본정보'; // 최초보고시간은 기본정보 그룹으로 이동
      }
      
      return true;
    });

    const grouped = validSettings.reduce((acc: { [key: string]: FormFieldSetting[] }, setting) => {
      const group = setting.field_group;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(setting);
      return acc;
    }, {});

    // 각 그룹 내에서 display_order로 정렬
    Object.keys(grouped).forEach(group => {
      grouped[group].sort((a, b) => a.display_order - b.display_order);
    });

    setGroupedSettings(grouped);
  };

  // 발생보고서 데이터 로드
  useEffect(() => {
    async function fetchReport() {
      console.log(`Fetching report data for ID: ${id}`);
      
      if (!id) {
        setError("유효하지 않은 ID입니다.");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // 공통 서비스 모듈 사용
        const data = await getOccurrenceReport(id);
        
        if (!data || !data.accident_id) {
          throw new Error("유효하지 않은 데이터 형식입니다.");
        }
        
        // 날짜 필드 사전 처리 (안전한 문자열로 변환)
        const processedData = processDateFields(data);
        
        // 재해자 정보 처리
        if (processedData.victims && Array.isArray(processedData.victims)) {
          console.log(`${processedData.victims.length}명의 재해자 정보 로드됨`);
          setVictims(processedData.victims);
          setIsMultipleVictims(processedData.victims.length > 0);
        } else if (processedData.victims_json) {
          try {
            const parsedVictims = JSON.parse(processedData.victims_json);
            if (Array.isArray(parsedVictims)) {
              console.log(`victims_json에서 ${parsedVictims.length}명의 재해자 정보 파싱됨`);
              processedData.victims = parsedVictims;
              setVictims(parsedVictims);
              setIsMultipleVictims(parsedVictims.length > 0);
            }
          } catch (e) {
            console.error('victims_json 파싱 오류:', e);
          }
        } else {
          // 단일 재해자 정보가 있는 경우 배열로 변환
          if (processedData.victim_name) {
            const singleVictim: VictimInfo = {
              name: processedData.victim_name,
              age: processedData.victim_age,
              belong: processedData.victim_belong,
              duty: processedData.victim_duty,
              injury_type: processedData.injury_type,
              ppe_worn: processedData.ppe_worn,
              first_aid: processedData.first_aid
            };
            
            processedData.victims = [singleVictim];
            setVictims([singleVictim]);
            setIsMultipleVictims(true);
            console.log('단일 재해자 정보를 배열로 변환');
          } else {
            processedData.victims = [];
            setVictims([]);
          }
        }
        
        // 가공된 데이터 설정
        setReport(processedData);
        
        // 파일 정보 로드
        await loadFileInfo(processedData);
      } catch (err: any) {
        console.error("사고 발생보고서 로드 오류:", err);
        setError(err.message || "데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchReport();
  }, [id]);
  
  // 파일 정보 로드 함수
  const loadFileInfo = async (reportData: OccurrenceReportData) => {
    const fileCategories = ['scene_photos', 'cctv_video', 'statement_docs', 'etc_documents'] as const;
    const fileInfoMap: Record<string, FileInfo[]> = {
      scene_photos: [],
      cctv_video: [],
      statement_docs: [],
      etc_documents: []
    };
    
    for (const category of fileCategories) {
      // 파싱된 배열로 확인하여 null, 빈 배열, undefined인 경우 처리
      let fileIds: string[] = [];
      
      // 문자열로 저장된 경우 파싱 시도
      if (typeof reportData[category] === 'string') {
        try {
          const parsed = JSON.parse(reportData[category] as string);
          if (Array.isArray(parsed)) {
            fileIds = parsed;
          }
        } catch (e) {
          console.error(`${category} 파싱 오류:`, e);
          fileIds = [];
        }
      }
      
      // 각 파일 아이디에 대한 정보를 저장할 임시 배열
      const fileInfos: FileInfo[] = [];
      
      // 파일 ID가 있는 경우 각 파일에 대한 정보 조회
      for (const fileId of fileIds) {
        if (!fileId) continue;
        
        try {
          // 파일 정보 조회 API 호출이나 정적 서버의 경우 URL 포맷 작성
          const fileInfo: FileInfo = {
            id: fileId,
            name: `파일 ${fileId}`,
            type: category.includes('photo') ? 'image' : 'file',
            url: `/api/files/${fileId}`
          };
          
          fileInfos.push(fileInfo);
        } catch (e) {
          console.error(`파일 정보 조회 오류 (${fileId}):`, e);
        }
      }
      
      // 정보를 맵에 추가
      fileInfoMap[category] = fileInfos;
    }
    
    // 상태 업데이트
    setUploadedFiles(fileInfoMap);
  };
  
  // 양식 설정에 따라 필드 표시 여부 확인
  const isFieldVisible = (fieldName: string): boolean => {
    console.log(`[isFieldVisible 호출] ${fieldName}, 설정 로드 상태: ${formSettingsLoaded}, 설정 개수: ${formSettings.length}`);
    
    if (!formSettingsLoaded || formSettings.length === 0) {
      console.log(`[필드 표시] ${fieldName}: 설정 로드 안됨, 기본적으로 표시`);
      return true; // 설정이 로드되지 않은 경우 기본적으로 표시
    }
    
    const setting = formSettings.find(s => s.field_name === fieldName);
    const result = setting ? setting.is_visible : true;
    console.log(`[필드 표시] ${fieldName}: ${result} (설정: ${setting ? JSON.stringify(setting) : '없음'})`);
    return result;
  };
  
  // 양식 설정에 따라 필드 필수 여부 확인
  const isFieldRequired = (fieldName: string): boolean => {
    if (!formSettingsLoaded || formSettings.length === 0) {
      console.log(`[필드 필수] ${fieldName}: 설정 로드 안됨, 기본적으로 필수 아님`);
      return false; // 설정이 로드되지 않은 경우 기본적으로 필수 아님
    }
    
    const setting = formSettings.find(s => s.field_name === fieldName);
    const result = setting ? setting.is_required : false;
    console.log(`[필드 필수] ${fieldName}: ${result} (설정: ${setting ? '있음' : '없음'})`);
    return result;
  };
  
  // 양식 설정에서 필드 레이블 가져오기
  const getFieldLabel = (fieldName: string, defaultLabel: string): string => {
    if (!formSettingsLoaded || formSettings.length === 0) {
      return defaultLabel;
    }
    
    const setting = formSettings.find(s => s.field_name === fieldName);
    return setting?.display_name || defaultLabel;
  };

  // 특정 그룹에 속하는 필드 목록 가져오기
  const getFieldsInGroup = (groupName: string): FormFieldSetting[] => {
    if (!formSettingsLoaded || !groupedSettings[groupName]) {
      return [];
    }
    return groupedSettings[groupName];
  };

  // 필드가 특정 그룹에 속하는지 확인
  const isFieldInGroup = (fieldName: string, groupName: string): boolean => {
    if (!formSettingsLoaded || !groupedSettings[groupName]) {
      return false;
    }
    return groupedSettings[groupName].some(field => field.field_name === fieldName);
  };
  
  // 입력 필드 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setReport(prev => {
      if (!prev) return prev;
      
      // 사고유형(인적/복합) 선택 시 재해자 수 기본값 1로
      if (name === 'accident_type_level1' && (value === '인적' || value === '복합')) {
        if (!prev.victim_count || prev.victim_count < 1) {
          return {
            ...prev,
            [name]: value,
            victim_count: 1
          };
        }
      }
      // 날짜 필드 특별 처리
      if (name === 'acci_time' || name === 'first_report_time') {
        try {
          const dateValue = new Date(value);
          if (!isNaN(dateValue.getTime())) {
            return {
              ...prev,
              [name]: dateValue.toISOString()
            };
          }
        } catch (e) {
          console.error(`날짜 변환 오류 (${name}):`, e);
        }
      }
      return {
        ...prev,
        [name]: type === 'number' ? Number(value) : value
      };
    });
  };
  
  // 체크박스 변경 핸들러
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    setReport(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: checked
      };
    });
  };
  
  // 숫자 변경 핸들러
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!report) return;
    
    const { name, value } = e.target;
    
    // 숫자 입력 필드 처리
    try {
      const numValue = value === '' ? 0 : parseInt(value, 10);
      
      if (isNaN(numValue)) {
        return; // 숫자가 아닌 경우 처리 중단
      }
      
      // 재해자 수 변경 시 배열 크기 조정
      if (name === 'victim_count') {
        adjustVictimsArray(numValue);
      }
      
      setReport(prev => {
        if (!prev) return null;
        return {
          ...prev,
          [name]: numValue
        };
      });
    } catch (e) {
      console.error('숫자 변환 오류:', e);
    }
  };
  
  // 재해자 배열 크기 조정 함수
  const adjustVictimsArray = (count: number) => {
    if (count === 0) {
      setVictims([]);
      setIsMultipleVictims(false);
      return;
    }
    
    setIsMultipleVictims(count > 0);
    
    // 현재 재해자 배열 복사
    const currentVictims = [...victims];
    
    // 개수가 증가한 경우 빈 객체 추가
    if (count > currentVictims.length) {
      const newVictims = [...currentVictims];
      
      for (let i = currentVictims.length; i < count; i++) {
        newVictims.push({
          name: '',
          age: 0,
          belong: '',
          duty: '',
          injury_type: '',
          ppe_worn: '',
          first_aid: ''
        });
      }
      
      setVictims(newVictims);
      
      // report 객체에도 victims 배열 업데이트
      setReport(prev => {
        if (!prev) return null;
        return {
          ...prev,
          victims: newVictims
        };
      });
    } 
    // 개수가 감소한 경우 배열 자르기
    else if (count < currentVictims.length) {
      const newVictims = currentVictims.slice(0, count);
      setVictims(newVictims);
      
      // report 객체에도 victims 배열 업데이트
      setReport(prev => {
        if (!prev) return null;
        return {
          ...prev,
          victims: newVictims
        };
      });
    }
  };
  
  // 개별 재해자 정보 변경 핸들러
  const handleVictimChange = (index: number, field: keyof VictimInfo, value: string | number) => {
    const updatedVictims = [...victims];
    
    // 해당 인덱스의 재해자 정보 업데이트
    updatedVictims[index] = {
      ...updatedVictims[index],
      [field]: value
    };
    
    setVictims(updatedVictims);
    
    // report 객체에도 victims 배열 업데이트
    setReport(prev => {
      if (!prev) return null;
      return {
        ...prev,
        victims: updatedVictims
      };
    });
    
    // 첫 번째 재해자 정보가 변경된 경우, 단일 필드도 동기화 (하위 호환성)
    if (index === 0) {
      setReport(prev => {
        if (!prev) return null;
        
        // 필드 타입에 맞게 단일 필드 동기화
        const fieldUpdates: any = {};
        
        if (field === 'name') fieldUpdates.victim_name = value;
        if (field === 'age') fieldUpdates.victim_age = value;
        if (field === 'belong') fieldUpdates.victim_belong = value;
        if (field === 'duty') fieldUpdates.victim_duty = value;
        if (field === 'injury_type') fieldUpdates.injury_type = value;
        if (field === 'ppe_worn') fieldUpdates.ppe_worn = value;
        if (field === 'first_aid') fieldUpdates.first_aid = value;
        
        return {
          ...prev,
          ...fieldUpdates
        };
      });
    }
  };
  
  // 재해자 정보 입력 핸들러 (텍스트)
  const handleVictimTextChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    handleVictimChange(index, name as keyof VictimInfo, value);
  };
  
  // 재해자 정보 입력 핸들러 (숫자)
  const handleVictimNumberChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? 0 : parseInt(value, 10);
    
    if (!isNaN(numValue)) {
      handleVictimChange(index, name as keyof VictimInfo, numValue);
    }
  };
  
  // 파일 변경 핸들러
  const handleFileChange = (fieldName: string) => (fileIds: string[]) => {
    if (!report) return;
    
    setReport(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [fieldName]: fileIds
      };
    });
  };

  // 파일 삭제 핸들러
  const handleFileDelete = async (fileId: string, category: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`파일 삭제 실패: ${response.statusText}`);
      }
      
      // 업로드된 파일 목록에서 제거
      setUploadedFiles(prev => ({
        ...prev,
        [category]: prev[category].filter(file => file.id !== fileId)
      }));
      
      // 보고서 데이터에서 파일 ID 제거
      if (!report) return;
      
      // 기존 파일 ID 배열 가져오기
      let existingIds: string[] = [];
      if (typeof report[category] === 'string') {
        try {
          existingIds = JSON.parse(report[category] as string);
        } catch (e) {
          existingIds = [];
        }
      } else if (Array.isArray(report[category])) {
        existingIds = report[category] as string[];
      }
      
      // 파일 ID 제거
      const updatedIds = existingIds.filter(id => id !== fileId);
      
      // 보고서 데이터 업데이트
      setReport({
        ...report,
        [category]: updatedIds
      });
    } catch (err: any) {
      console.error('파일 삭제 오류:', err);
      alert(`파일 삭제 중 오류가 발생했습니다: ${err.message}`);
    }
  };
  
  // 폼 제출 핸들러
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!report) return;
    
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      
      console.log('수정 전송 전 report 데이터:', JSON.stringify({
        acci_time: report.acci_time,
        first_report_time: report.first_report_time,
        created_at: report.created_at,
        updated_at: report.updated_at
      }, null, 2));
      
      // victims 배열 디버깅
      if (report.victims && Array.isArray(report.victims)) {
        console.log('Victims 배열 정보:', report.victims.length, '명의 재해자');
        report.victims.forEach((victim, index) => {
          console.log(`재해자 ${index + 1}:`, JSON.stringify(victim, null, 2));
        });
        
        // 단일 필드 동기화 (하위 호환성을 위한 처리)
        if (report.victims.length > 0) {
          const firstVictim = report.victims[0];
          report.victim_name = firstVictim.name;
          report.victim_age = firstVictim.age;
          report.victim_belong = firstVictim.belong;
          report.victim_duty = firstVictim.duty;
          report.injury_type = firstVictim.injury_type;
          report.ppe_worn = firstVictim.ppe_worn;
          report.first_aid = firstVictim.first_aid;
          
          console.log('첫 번째 재해자 정보를 단일 필드에 동기화');
        }
        
        // victims_json 필드 생성
        report.victims_json = JSON.stringify(report.victims);
        console.log('victims_json 필드 생성됨');
      } else {
        console.log('Victims 배열이 없거나 배열이 아님:', report.victims);
      }
      
      // 중첩된 객체 필드 확인
      console.log('전체 report 구조 요약:', Object.keys(report));
      
      // 모든 필드 타입 검사
      const fieldTypes: Record<string, string> = {};
      for (const key in report) {
        fieldTypes[key] = typeof report[key];
        
        // 객체인 경우 더 자세히 확인
        if (report[key] && typeof report[key] === 'object') {
          if (Array.isArray(report[key])) {
            fieldTypes[key] = 'array';
          } else if (report[key] instanceof Date) {
            fieldTypes[key] = 'Date';
          } else {
            fieldTypes[key] = 'object';
            // 객체 내부 구조 확인
            console.log(`${key} 객체 내부 구조:`, JSON.stringify(report[key], null, 2));
          }
        }
      }
      console.log('모든 필드 타입:', fieldTypes);
      
      // toISOString 메소드가 있는지 확인
      for (const key in report) {
        if (report[key] && typeof report[key] === 'object' && !Array.isArray(report[key])) {
          console.log(`${key} 객체의 toISOString 존재 여부:`, typeof (report[key] as any).toISOString === 'function');
        }
      }
      
      // 안전하게 복사한 데이터로 서비스 호출
      console.log('직렬화 시작...');
      const jsonString = JSON.stringify(report);
      console.log('직렬화 완료');
      
      const safeCopy = JSON.parse(jsonString);
      console.log('역직렬화 완료, 데이터 크기:', jsonString.length);
      
      // 직렬화/역직렬화 과정에서 데이터 손실 확인
      const reportKeys = Object.keys(report);
      const copyKeys = Object.keys(safeCopy);
      const missingKeys = reportKeys.filter(key => !copyKeys.includes(key));
      
      if (missingKeys.length > 0) {
        console.warn('직렬화 과정에서 누락된 키:', missingKeys);
      }
      
      // 공통 서비스 모듈 사용
      const result = await updateOccurrenceReport(id, safeCopy);
      
      if (!result.success) {
        throw new Error(result.error || "사고 발생보고서 수정 중 오류가 발생했습니다.");
      }
      
      setSuccessMessage('발생보고서가 성공적으로 수정되었습니다.');
      
      // 3초 후 상세 페이지로 이동
      setTimeout(() => {
        router.push(`/occurrence/${id}`);
      }, 3000);
      
    } catch (err: any) {
      console.error('발생보고서 수정 오류:', err);
      setSubmitError(err.message || '발생보고서를 수정하는 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">데이터 로딩 중...</div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p className="font-bold">오류 발생</p>
        <p>{error || "사고 발생보고서를 찾을 수 없습니다."}</p>
        <button 
          onClick={() => router.back()} 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
        >
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">사고 발생보고서 수정</h1>
        
        <div className="space-x-2">
          <Link href="/occurrence/list" className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">
            목록으로
          </Link>
          
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
        </div>
      </div>
      
      {/* 디버그 정보 패널 */}
      <div className="mb-6 bg-gray-100 p-4 rounded-md border border-gray-300">
        <h3 className="text-lg font-semibold mb-2">디버그 정보</h3>
        <p>양식 설정 로드 상태: {formSettingsLoaded ? '완료' : '로딩 중'}</p>
        <p>양식 설정 개수: {formSettings.length}</p>
        <p>첫 번째 필드(accident_id) 표시 여부: {isFieldVisible('accident_id') ? '표시' : '숨김'}</p>
        <p>첫 번째 필드(accident_id) 필수 여부: {isFieldRequired('accident_id') ? '필수' : '선택'}</p>
        <p>첫 번째 필드(accident_id) 레이블: {getFieldLabel('accident_id', '기본 레이블')}</p>
        <div className="mt-2">
          <button 
            onClick={() => console.log('현재 설정:', formSettings)} 
            className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm"
          >
            콘솔에 설정 출력
          </button>
        </div>
      </div>
      
      {successMessage && (
        <div className="p-4 bg-green-100 border border-green-300 rounded-md">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}
      
      {submitError && (
        <div className="p-4 bg-red-100 border border-red-300 rounded-md">
          <p className="text-red-700">{submitError}</p>
        </div>
      )}
      
      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* 기본 정보 */}
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h2 className="text-xl font-semibold mb-4">기본 정보</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* 사고 ID */}
            {isFieldVisible("accident_id") && (
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {getFieldLabel("accident_id", "사고 ID")}
                  {isFieldRequired("accident_id") && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  name="accident_id"
                  value={report.accident_id || ''}
                  onChange={handleInputChange}
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100"
                  required={isFieldRequired("accident_id")}
                />
              </div>
            )}
            
            {/* 전체사고코드 */}
            {isFieldVisible("global_accident_no") && (
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {getFieldLabel("global_accident_no", "전체사고코드")}
                  {isFieldRequired("global_accident_no") && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  name="global_accident_no"
                  value={report.global_accident_no || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required={isFieldRequired("global_accident_no")}
                />
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* 사고 코드 */}
            {isFieldVisible("report_channel_no") && (
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {getFieldLabel("report_channel_no", "사고 코드")}
                  {isFieldRequired("report_channel_no") && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  name="report_channel_no"
                  value={report.report_channel_no || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required={isFieldRequired("report_channel_no")}
                />
              </div>
            )}
            
            {/* 회사명 */}
            {isFieldVisible("company_name") && (
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {getFieldLabel("company_name", "회사명")}
                  {isFieldRequired("company_name") && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={report.company_name || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required={isFieldRequired("company_name")}
                />
              </div>
            )}
            
            {/* 회사 코드 */}
            {isFieldVisible("company_code") && (
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {getFieldLabel("company_code", "회사 코드")}
                  {isFieldRequired("company_code") && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  name="company_code"
                  value={report.company_code || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required={isFieldRequired("company_code")}
                />
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 사업장명 */}
            {isFieldVisible("site_name") && (
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {getFieldLabel("site_name", "사업장명")}
                  {isFieldRequired("site_name") && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  name="site_name"
                  value={report.site_name || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required={isFieldRequired("site_name")}
                />
              </div>
            )}
            
            {/* 사업장 코드 */}
            {isFieldVisible("site_code") && (
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {getFieldLabel("site_code", "사업장 코드")}
                  {isFieldRequired("site_code") && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  name="site_code"
                  value={report.site_code || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required={isFieldRequired("site_code")}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* 사고 정보 */}
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h2 className="text-xl font-semibold mb-4">사고 정보</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* 사고 발생 일시 */}
            {isFieldVisible("acci_time") && (
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {getFieldLabel("acci_time", "사고 발생 일시")}
                  {isFieldRequired("acci_time") && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  name="acci_time"
                  value={report.acci_time || ''}
                  onChange={handleInputChange}
                  placeholder="YYYYMMDD(HHMM) 형식 (예: 20250604 또는 202506041430)"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required={isFieldRequired("acci_time")}
                />
              </div>
            )}
            
            {/* 사고 발생 장소 */}
            {isFieldVisible("acci_location") && (
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {getFieldLabel("acci_location", "사고 발생 장소")}
                  {isFieldRequired("acci_location") && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  name="acci_location"
                  value={report.acci_location || ''}
                  onChange={handleInputChange}
                  placeholder="예: 제어반 앞, 적재장 3번 구역"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required={isFieldRequired("acci_location")}
                />
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* 재해발생 형태 */}
            {isFieldVisible("accident_type_level1") && (
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {getFieldLabel("accident_type_level1", "재해발생 형태")}
                  {isFieldRequired("accident_type_level1") && <span className="text-red-500 ml-1">*</span>}
                </label>
                <select
                  name="accident_type_level1"
                  value={report.accident_type_level1 || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required={isFieldRequired("accident_type_level1")}
                >
                  <option value="">선택하세요</option>
                  <option value="인적">인적 (인명 피해)</option>
                  <option value="물적">물적 (재산 피해)</option>
                  <option value="복합">복합 (인적+물적)</option>
                </select>
              </div>
            )}
            
            {/* 사고 유형 */}
            {isFieldVisible("accident_type_level2") && (
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {getFieldLabel("accident_type_level2", "사고 유형")}
                  {isFieldRequired("accident_type_level2") && <span className="text-red-500 ml-1">*</span>}
                </label>
                <select
                  name="accident_type_level2"
                  value={report.accident_type_level2 || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required={isFieldRequired("accident_type_level2")}
                >
                  <option value="">선택하세요</option>
                  <option value="기계">기계 관련</option>
                  <option value="전기">전기 관련</option>
                  <option value="화학물질">화학물질 관련</option>
                  <option value="추락">추락</option>
                  <option value="낙하">낙하·비래</option>
                  <option value="협착">끼임·협착</option>
                  <option value="충돌">충돌·충격</option>
                  <option value="화재">화재·폭발</option>
                  <option value="기타">기타</option>
                </select>
              </div>
            )}
            
            {/* 재해자 수 */}
            {isFieldVisible("victim_count") && (report.accident_type_level1 === "인적" || report.accident_type_level1 === "복합") && (
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {getFieldLabel("victim_count", "재해자 수")}
                  {isFieldRequired("victim_count") && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="number"
                  name="victim_count"
                  value={report.victim_count || 0}
                  onChange={handleNumberChange}
                  min={0}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required={isFieldRequired("victim_count")}
                />
              </div>
            )}
          </div>
          
          <div className="mb-4">
            {/* 사고 개요 */}
            {isFieldVisible("acci_summary") && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600">
                  {getFieldLabel("acci_summary", "사고 개요 (간략)")}
                  {isFieldRequired("acci_summary") && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  name="acci_summary"
                  value={report.acci_summary || ''}
                  onChange={handleInputChange}
                  placeholder="사고에 대한 간략한 설명 (1-2문장)"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required={isFieldRequired("acci_summary")}
                />
              </div>
            )}
            
            {/* 사고 상세 내용 */}
            {isFieldVisible("acci_detail") && (
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {getFieldLabel("acci_detail", "사고 상세 내용")}
                  {isFieldRequired("acci_detail") && <span className="text-red-500 ml-1">*</span>}
                </label>
                <textarea
                  name="acci_detail"
                  value={report.acci_detail || ''}
                  onChange={handleInputChange}
                  rows={10}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder={`사고 발생 전 작업 내용, 사고 발생 시점 작업자 행동, 사고 원인, 대응 조치 등을 상세히 작성하세요.`}
                  required={isFieldRequired("acci_detail")}
                />
              </div>
            )}

            {/* 업무성 사고 분류 */}
            {isFieldVisible("work_related_type") && (
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {getFieldLabel("work_related_type", "업무성 사고 분류")}
                  {isFieldRequired("work_related_type") && <span className="text-red-500 ml-1">*</span>}
                </label>
                <select
                  name="work_related_type"
                  value={report.work_related_type || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required={isFieldRequired("work_related_type")}
                >
                  <option value="">선택하세요</option>
                  <option value="업무중">업무 중</option>
                  <option value="출퇴근중">출퇴근 중</option>
                  <option value="기타">기타</option>
                </select>
              </div>
            )}
            
            {/* 기타 분류 */}
            {isFieldVisible("misc_classification") && (
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {getFieldLabel("misc_classification", "기타 분류")}
                  {isFieldRequired("misc_classification") && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  name="misc_classification"
                  value={report.misc_classification || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required={isFieldRequired("misc_classification")}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* 재해자 정보 */}
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h2 className="text-xl font-semibold mb-4">재해자 정보</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* 협력업체 여부 */}
            {isFieldVisible("is_contractor") && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_contractor"
                  id="is_contractor"
                  checked={report.is_contractor || false}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="is_contractor" className="ml-2 block text-sm text-gray-900">
                  {getFieldLabel("is_contractor", "협력업체 여부")}
                  {isFieldRequired("is_contractor") && <span className="text-red-500 ml-1">*</span>}
                </label>
              </div>
            )}
          </div>
          
          {/* 협력업체명 (조건부) */}
          {isFieldVisible("contractor_name") && report.is_contractor && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600">
                {getFieldLabel("contractor_name", "협력업체명")}
                {isFieldRequired("contractor_name") && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="text"
                name="contractor_name"
                value={report.contractor_name || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required={isFieldRequired("contractor_name")}
              />
            </div>
          )}
          
          {/* 재해자 정보 섹션 */}
          {isFieldVisible("victims_json") && (
            <>
              <div className="flex justify-between items-center my-4">
                <h3 className="text-lg font-medium">
                  {getFieldLabel("victims_json", "재해자 정보")}
                  {isFieldRequired("victims_json") && <span className="text-red-500 ml-1">*</span>}
                </h3>
                <button
                  type="button"
                  onClick={() => adjustVictimsArray(victims.length + 1)}
                  className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                >
                  재해자 추가
                </button>
              </div>
              
              {victims.length === 0 ? (
                <div className="bg-gray-100 p-4 rounded-md text-center text-gray-500">
                  등록된 재해자 정보가 없습니다. '재해자 추가' 버튼을 클릭하여 추가하세요.
                </div>
              ) : (
                victims.map((victim, index) => (
                  <div key={index} className="mb-6 border border-gray-200 rounded-md p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">재해자 #{index + 1}</h4>
                      {victims.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newVictims = [...victims];
                            newVictims.splice(index, 1);
                            setVictims(newVictims);
                            
                            // 재해자 수 조정
                            const newCount = Math.max(0, (report.victim_count || 0) - 1);
                            setReport({ ...report, victim_count: newCount, victims: newVictims });
                          }}
                          className="text-red-500 text-sm hover:text-red-700"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* 재해자 이름 */}
                      {isFieldVisible("victim_name") && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600">
                            {getFieldLabel("victim_name", "재해자 이름")}
                            {isFieldRequired("victim_name") && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={victim.name || ''}
                            onChange={(e) => handleVictimTextChange(index, e)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            required={isFieldRequired("victim_name")}
                          />
                        </div>
                      )}
                      
                      {/* 재해자 나이 */}
                      {isFieldVisible("victim_age") && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600">
                            {getFieldLabel("victim_age", "재해자 나이")}
                            {isFieldRequired("victim_age") && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <input
                            type="number"
                            name="age"
                            value={victim.age || ''}
                            onChange={(e) => handleVictimNumberChange(index, e)}
                            min={1}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            required={isFieldRequired("victim_age")}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* 재해자 소속 */}
                      {isFieldVisible("victim_belong") && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600">
                            {getFieldLabel("victim_belong", "재해자 소속")}
                            {isFieldRequired("victim_belong") && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <input
                            type="text"
                            name="belong"
                            value={victim.belong || ''}
                            onChange={(e) => handleVictimTextChange(index, e)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            required={isFieldRequired("victim_belong")}
                          />
                        </div>
                      )}
                      
                      {/* 재해자 직무 */}
                      {isFieldVisible("victim_duty") && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600">
                            {getFieldLabel("victim_duty", "재해자 직무")}
                            {isFieldRequired("victim_duty") && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <input
                            type="text"
                            name="duty"
                            value={victim.duty || ''}
                            onChange={(e) => handleVictimTextChange(index, e)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            required={isFieldRequired("victim_duty")}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 부상 유형 */}
                      {isFieldVisible("injury_type") && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600">
                            {getFieldLabel("injury_type", "부상 유형")}
                            {isFieldRequired("injury_type") && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <select
                            name="injury_type"
                            value={victim.injury_type || ''}
                            onChange={(e) => handleVictimTextChange(index, e)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            required={isFieldRequired("injury_type")}
                          >
                            <option value="">선택하세요</option>
                            <option value="경상">경상</option>
                            <option value="중상">중상</option>
                            <option value="사망">사망</option>
                            <option value="기타">기타</option>
                          </select>
                        </div>
                      )}
                      
                      {/* 보호구 착용 여부 */}
                      {isFieldVisible("ppe_worn") && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600">
                            {getFieldLabel("ppe_worn", "보호구 착용 여부")}
                            {isFieldRequired("ppe_worn") && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <select
                            name="ppe_worn"
                            value={victim.ppe_worn || ''}
                            onChange={(e) => handleVictimTextChange(index, e)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            required={isFieldRequired("ppe_worn")}
                          >
                            <option value="">선택하세요</option>
                            <option value="착용">착용</option>
                            <option value="미착용">미착용</option>
                            <option value="일부착용">일부착용</option>
                            <option value="해당없음">해당없음</option>
                          </select>
                        </div>
                      )}
                    </div>
                    
                    {/* 응급조치 내역 */}
                    {isFieldVisible("first_aid") && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-600">
                          {getFieldLabel("first_aid", "응급조치 내역")}
                          {isFieldRequired("first_aid") && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <input
                          type="text"
                          name="first_aid"
                          value={victim.first_aid || ''}
                          onChange={(e) => handleVictimTextChange(index, e)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                          placeholder="예: 현장 응급처치 후 병원 이송"
                          required={isFieldRequired("first_aid")}
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </div>
        
        {/* 첨부 파일 */}
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h2 className="text-xl font-semibold mb-4">첨부 파일</h2>
          
          {/* 사고 현장 사진 */}
          {isFieldVisible("scene_photos") && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {getFieldLabel("scene_photos", "사고 현장 사진")}
                {isFieldRequired("scene_photos") && <span className="text-red-500 ml-1">*</span>}
              </label>
              
              {/* 파일 업로드 컴포넌트 */}
              <FileUploader
                onChange={(fileIds) => handleFileChange('scene_photos')(fileIds)}
                required={isFieldRequired("scene_photos")}
              />
              
              {/* 파일 목록 */}
              {uploadedFiles.scene_photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {uploadedFiles.scene_photos.map((file) => (
                    <div key={file.id} className="border rounded-md p-2">
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-24 object-cover mb-2"
                      />
                      <p className="text-xs truncate">{file.name}</p>
                      <button
                        type="button"
                        onClick={() => handleFileDelete(file.id, 'scene_photos')}
                        className="text-xs text-red-600 hover:underline"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* CCTV 영상 */}
          {isFieldVisible("cctv_video") && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {getFieldLabel("cctv_video", "CCTV 영상")}
                {isFieldRequired("cctv_video") && <span className="text-red-500 ml-1">*</span>}
              </label>
              
              {/* 파일 업로드 컴포넌트 */}
              <FileUploader
                onChange={(fileIds) => handleFileChange('cctv_video')(fileIds)}
                required={isFieldRequired("cctv_video")}
              />
              
              {/* 파일 목록 */}
              {uploadedFiles.cctv_video.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {uploadedFiles.cctv_video.map((file) => (
                    <div key={file.id} className="border rounded-md p-2">
                      <div className="bg-gray-100 w-full h-24 flex items-center justify-center mb-2">
                        <span className="text-2xl">🎬</span>
                      </div>
                      <p className="text-xs truncate">{file.name}</p>
                      <button
                        type="button"
                        onClick={() => handleFileDelete(file.id, 'cctv_video')}
                        className="text-xs text-red-600 hover:underline"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* 관계자 진술서 */}
          {isFieldVisible("statement_docs") && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {getFieldLabel("statement_docs", "관계자 진술서")}
                {isFieldRequired("statement_docs") && <span className="text-red-500 ml-1">*</span>}
              </label>
              
              {/* 파일 업로드 컴포넌트 */}
              <FileUploader
                onChange={(fileIds) => handleFileChange('statement_docs')(fileIds)}
                required={isFieldRequired("statement_docs")}
              />
              
              {/* 파일 목록 */}
              {uploadedFiles.statement_docs.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {uploadedFiles.statement_docs.map((file) => (
                    <div key={file.id} className="border rounded-md p-2">
                      <div className="bg-gray-100 w-full h-24 flex items-center justify-center mb-2">
                        <span className="text-2xl">📄</span>
                      </div>
                      <p className="text-xs truncate">{file.name}</p>
                      <button
                        type="button"
                        onClick={() => handleFileDelete(file.id, 'statement_docs')}
                        className="text-xs text-red-600 hover:underline"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* 기타 문서 */}
          {isFieldVisible("etc_documents") && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {getFieldLabel("etc_documents", "기타 문서")}
                {isFieldRequired("etc_documents") && <span className="text-red-500 ml-1">*</span>}
              </label>
              
              {/* 파일 업로드 컴포넌트 */}
              <FileUploader
                onChange={(fileIds) => handleFileChange('etc_documents')(fileIds)}
                required={isFieldRequired("etc_documents")}
              />
              
              {/* 파일 목록 */}
              {uploadedFiles.etc_documents.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {uploadedFiles.etc_documents.map((file) => (
                    <div key={file.id} className="border rounded-md p-2">
                      <div className="bg-gray-100 w-full h-24 flex items-center justify-center mb-2">
                        <span className="text-2xl">📄</span>
                      </div>
                      <p className="text-xs truncate">{file.name}</p>
                      <button
                        type="button"
                        onClick={() => handleFileDelete(file.id, 'etc_documents')}
                        className="text-xs text-red-600 hover:underline"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* 보고자 정보 */}
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h2 className="text-xl font-semibold mb-4">보고자 정보</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* 보고자 이름 */}
            {isFieldVisible("reporter_name") && (
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {getFieldLabel("reporter_name", "보고자 이름")}
                  {isFieldRequired("reporter_name") && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  name="reporter_name"
                  value={report.reporter_name || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required={isFieldRequired("reporter_name")}
                />
              </div>
            )}
            
            {/* 보고자 직책 */}
            {isFieldVisible("reporter_position") && (
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {getFieldLabel("reporter_position", "보고자 직책")}
                  {isFieldRequired("reporter_position") && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  name="reporter_position"
                  value={report.reporter_position || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required={isFieldRequired("reporter_position")}
                />
              </div>
            )}
            
            {/* 보고자 소속 */}
            {isFieldVisible("reporter_belong") && (
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  {getFieldLabel("reporter_belong", "보고자 소속")}
                  {isFieldRequired("reporter_belong") && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  name="reporter_belong"
                  value={report.reporter_belong || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required={isFieldRequired("reporter_belong")}
                />
              </div>
            )}
          </div>
          
          {/* 보고 경로 */}
          {isFieldVisible("report_channel") && (
            <div>
              <label className="block text-sm font-medium text-gray-600">
                {getFieldLabel("report_channel", "보고 경로")}
                {isFieldRequired("report_channel") && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="text"
                name="report_channel"
                value={report.report_channel || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="예: 현장관리자 → 안전팀 → 경영진"
                required={isFieldRequired("report_channel")}
              />
            </div>
          )}
        </div>
        
        {/* 제출 버튼 */}
        <div className="flex justify-end space-x-4 mt-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2 rounded-md shadow-sm text-sm font-medium text-white 
              ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isSubmitting ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OccurrenceEditClient; 