"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import FileUploader from "../../components/FileUploader";
import { getCompanies } from "../../services/company.service";
import { Company, Site } from "../../services/company.service";
import { getFormSettings, FormFieldSetting } from "../../services/report_form.service";

/**
 * @file app/occurrence/page.tsx
 * @description
 *  - 사고 발생보고서 작성 페이지
 *  - 사고 관련 정보 입력 및 관련 파일 업로드 기능 제공
 */

// 발생보고서 데이터 인터페이스
interface OccurrenceFormData {
  // 기본 정보
  global_accident_no: string;     // 전체사고코드
  accident_id: string;            // 사고 ID (자동 생성)
  company_name: string;           // 회사명
  company_code: string;           // 회사 코드
  site_name: string;              // 사업장명
  site_code: string;              // 사업장 코드
  acci_time: string;              // 사고 발생 일시 (표시용)
  _raw_acci_time?: string;        // 사고 발생 일시 원본 (내부 처리용)
  acci_location: string;          // 사고 발생 위치
  report_channel_no: string;      // 사고 코드
  
  // 사고 분류 정보
  accident_type_level1: string;   // 재해발생 형태 (인적, 물적, 복합)
  accident_type_level2: string;   // 사고 유형 (기계, 전기 등)
  acci_summary: string;           // 사고 개요
  acci_detail: string;            // 사고 상세 내용
  victim_count: number;           // 재해자 수
  
  // 기본 재해자 정보 (하위 호환성 유지)
  victim_name: string;            // 재해자 이름
  victim_age: number;             // 재해자 나이
  victim_belong: string;          // 재해자 소속
  victim_duty: string;            // 재해자 직무
  injury_type: string;            // 부상 유형
  ppe_worn: string;               // 보호구 착용 여부
  first_aid: string;              // 응급조치 내역
  
  // 확장된 재해자 정보 (1:N 관계)
  victims: VictimInfo[];          // 재해자 정보 배열
  
  // 협력업체 관련
  is_contractor: boolean;         // 협력업체 직원 관련 사고 여부
  contractor_name: string;        // 협력업체명
  
  // 파일 첨부
  scene_photos: string[];         // 사고 현장 사진
  cctv_video: string[];           // CCTV 영상
  statement_docs: string[];       // 관계자 진술서
  etc_documents: string[];        // 기타 문서
  
  // 보고자 정보
  reporter_name: string;          // 보고자 이름
  reporter_position: string;      // 보고자 직책
  reporter_belong: string;        // 보고자 소속
  report_channel: string;         // 보고 경로
  first_report_time: string;      // 최초 보고 시간
  _raw_first_report_time: string; // 최초 보고 시간 원본 (내부 처리용)
}

// 재해자 정보 인터페이스
interface VictimInfo {
  name: string;                   // 재해자 이름
  age: number;                    // 재해자 나이
  belong: string;                 // 재해자 소속
  duty: string;                   // 재해자 직무
  injury_type: string;            // 부상 유형
  ppe_worn: string;               // 보호구 착용 여부
  first_aid: string;              // 응급조치 내역
}

// 날짜 시간 변환 함수
const formatDateForInput = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    // 문자열을 Date 객체로 변환
    const date = new Date(dateString);
    
    // 유효한 날짜인지 확인
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // YYYY-MM-DDTHH:MM 형식으로 변환 (datetime-local 입력에 필요한 형식)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (e) {
    console.error('날짜 변환 오류:', e);
    return '';
  }
};

export default function OccurrenceReportPage() {
  const router = useRouter();

  // 폼 데이터 상태 관리
  const [formData, setFormData] = useState<OccurrenceFormData>({
    global_accident_no: "",
    accident_id: "",
    company_name: "",
    company_code: "",
    site_name: "",
    site_code: "",
    acci_time: "",
    acci_location: "",
    report_channel_no: "",
    accident_type_level1: "",
    accident_type_level2: "",
    acci_summary: "",
    acci_detail: "",
    victim_count: 0,
    victim_name: "",
    victim_age: 0,
    victim_belong: "",
    victim_duty: "",
    injury_type: "",
    ppe_worn: "",
    first_aid: "",
    victims: [],
    is_contractor: false,
    contractor_name: "",
    scene_photos: [],
    cctv_video: [],
    statement_docs: [],
    etc_documents: [],
    reporter_name: "",
    reporter_position: "",
    reporter_belong: "",
    report_channel: "",
    first_report_time: new Date().toISOString().slice(0, 16), // 현재 시간을 기본값으로
    _raw_first_report_time: new Date().toISOString().slice(0, 16) // 원본 값도 저장
  });

  // 로딩 및 에러 상태 관리
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 회사 및 사업장 상태 추가
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [siteSearchTerm, setSiteSearchTerm] = useState('');
  const [showSiteDropdown, setShowSiteDropdown] = useState(false);

  // 사고 코드 관련 상태 추가
  const [accidentStats, setAccidentStats] = useState({
    companyAccidentCount: 0,   // 회사 전체 사고 건수
    siteAccidentCount: 0,       // 사업장 사고 건수
    companyYearlyCount: 0,      // 회사 연도별 사고 건수
    siteYearlyCount: 0          // 사업장 연도별 사고 건수
  });

  // 디버깅 정보 상태
  const [debugInfo, setDebugInfo] = useState<any>({});

  // 양식 설정 관련 상태
  const [formSettings, setFormSettings] = useState<FormFieldSetting[]>([]);
  const [formSettingsLoaded, setFormSettingsLoaded] = useState(false);
  const [groupedSettings, setGroupedSettings] = useState<{ [key: string]: FormFieldSetting[] }>({});

  // 모바일 스텝 관련 상태 추가
  const [currentStep, setCurrentStep] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // 스텝 정의 (동적으로 변경됨)
  const getSteps = () => {
    const baseSteps = [
      { id: 'basic', title: '기본정보', group: '기본정보' },
      { id: 'accident', title: '사고정보', group: '사고정보' },
      { id: 'victim', title: '재해자정보', group: '재해자정보' },
      { id: 'attachment', title: '첨부파일', group: '첨부파일' },
      { id: 'reporter', title: '보고자정보', group: '보고자정보' }
    ];
    
    // 물적 사고인 경우 재해자 정보 단계 제외
    if (formData.accident_type_level1 === "물적") {
      return baseSteps.filter(step => step.id !== 'victim');
    }
    
    return baseSteps;
  };
  
  const steps = getSteps();

  // 화면 크기 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // 양식 설정에 따라 필드 표시 여부 확인
  const isFieldVisible = (fieldName: string): boolean => {
    if (!formSettingsLoaded || formSettings.length === 0) {
      return true; // 설정이 로드되지 않은 경우 기본적으로 표시
    }
    
    const setting = formSettings.find(s => s.field_name === fieldName);
    return setting ? setting.is_visible : true;
  };
  
  // 양식 설정에 따라 필드 필수 여부 확인
  const isFieldRequired = (fieldName: string): boolean => {
    if (!formSettingsLoaded || formSettings.length === 0) {
      return false; // 설정이 로드되지 않은 경우 기본적으로 필수 아님
    }
    
    const setting = formSettings.find(s => s.field_name === fieldName);
    return setting ? setting.is_required : false;
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

  // 회사 및 사업장 데이터 로드
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const companiesData = await getCompanies();
        setCompanies(companiesData);
      } catch (error) {
        console.error('회사 목록 로드 오류:', error);
        setError('회사 및 사업장 정보를 불러오는 중 오류가 발생했습니다.');
      }
    };
    
    loadCompanies();
  }, []);

  // 사고 코드 생성 및 상태 업데이트를 위한 통합 useEffect
  useEffect(() => {
    const generateAndSetCodes = async () => {
      if (!selectedCompany) {
        setFormData(prev => ({ ...prev, global_accident_no: '', report_channel_no: '' }));
        return;
      }

      // 1. 사고 일시에서 연도 정보 추출
      let yearForQuery = new Date().getFullYear();
      let dateForCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      
      if (formData._raw_acci_time && formData._raw_acci_time.length >= 8) {
        const inputDate = new Date(formData.acci_time);
        if (!isNaN(inputDate.getTime())) {
          yearForQuery = inputDate.getFullYear();
          const month = String(inputDate.getMonth() + 1).padStart(2, "0");
          const day = String(inputDate.getDate()).padStart(2, "0");
          dateForCode = `${yearForQuery}${month}${day}`;
        } else {
          // 원시 데이터에서 파싱 시도
          const inputYear = formData._raw_acci_time.substring(0, 4);
          const inputMonth = formData._raw_acci_time.substring(4, 6);
          const inputDay = formData._raw_acci_time.substring(6, 8);
          yearForQuery = parseInt(inputYear);
          dateForCode = `${inputYear}${inputMonth}${inputDay}`;
        }
      }

      // 2. 통계 API를 호출하여 최신 순번 정보 가져오기
      let companyYearlyCount = 0;
      let siteYearlyCount = 0;
      
      try {
        console.log("통계 API 호출 중...");
        let apiUrl = `/api/occurrence/stats?company=${selectedCompany.code}&year=${yearForQuery}`;
        if (formData.site_code) {
          apiUrl += `&site=${formData.site_code}`;
        }
        
        console.log(`API 호출: ${apiUrl}`);
        const response = await fetch(apiUrl);
        
        if (response.ok) {
          const stats = await response.json();
          companyYearlyCount = stats.companyYearlyCount || 0;
          siteYearlyCount = stats.siteYearlyCount || 0;
          console.log("통계 데이터 수신:", stats);
          
          // 디버깅 정보 업데이트
          setDebugInfo({
            ...debugInfo,
            stats: {
              companyYearlyCount,
              siteYearlyCount,
              totalCompanyReports: stats.totalCompanyReports,
              year: stats.year
            }
          });
        } else {
          console.error("통계 API 오류:", await response.text());
        }
      } catch (e) {
        console.error("통계 API 호출 중 오류:", e);
      }

      // 3. 순번으로 코드 생성
      const nextCompanySeq = companyYearlyCount + 1;
      const companySerialNumber = nextCompanySeq;
      const globalAccidentNo = `${selectedCompany.code}-${yearForQuery}-${companySerialNumber.toString().padStart(3, '0')}`;
      
      let reportChannelNo = '';
      if (formData.site_code) {
        const nextSiteSeq = siteYearlyCount + 1;
        const siteSerialNumber = nextSiteSeq;
        reportChannelNo = `${selectedCompany.code}-${formData.site_code}-${siteSerialNumber.toString().padStart(3, '0')}-${dateForCode}`;
      }
      
      console.log("생성된 코드:", { globalAccidentNo, reportChannelNo });
      
      // 4. 폼 데이터 업데이트
      setFormData(prev => ({
        ...prev,
        global_accident_no: globalAccidentNo,
        report_channel_no: reportChannelNo,
        accident_id: reportChannelNo  // 사고 ID와 사고 코드는 동일하게 처리
      }));
      
      // 5. 통계 상태 업데이트
      setAccidentStats({
        companyAccidentCount: 0,  // 이 값은 사용하지 않음
        siteAccidentCount: 0,     // 이 값은 사용하지 않음
        companyYearlyCount: companyYearlyCount,
        siteYearlyCount: siteYearlyCount
      });
    };

    generateAndSetCodes();
  }, [selectedCompany, formData.site_code, formData._raw_acci_time, formData.acci_time]);

  // 회사 선택 핸들러
  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    setFormData(prev => ({
      ...prev,
      company_name: company.name,
      company_code: company.code,
      site_name: '', // 회사가 변경되면 사업장 초기화
      site_code: ''
    }));
    setCompanySearchTerm(company.name);
    setShowCompanyDropdown(false);
    setSiteSearchTerm('');
    
    // 회사 선택 시 회사 코드 자동 생성
    setTimeout(() => {
      // 회사 코드만 생성
      // (generateAccidentCodes 함수는 useEffect에서 호출됨)
    }, 100);
  };

  // 사업장 선택 핸들러
  const handleSiteSelect = (site: Site) => {
    setFormData(prev => ({
      ...prev,
      site_name: site.name,
      site_code: site.code
    }));
    setSiteSearchTerm(site.name);
    setShowSiteDropdown(false);
    
    // 사업장 변경 시에도 사고 코드 자동 생성되도록 처리
    setTimeout(() => {
      // 사고 코드 자동 생성
    }, 100);
  };

  // 사고 발생 일시 변경 핸들러
  const handleAcciTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/\D/g, '');
    if (numericValue.length <= 12) {
      const rawValue = numericValue;
      let displayValue = e.target.value;
      
      if (rawValue.length >= 8) {
        const year = rawValue.substring(0, 4);
        const month = rawValue.substring(4, 6);
        const day = rawValue.substring(6, 8);
        const hour = rawValue.length >= 10 ? rawValue.substring(8, 10) : '00';
        const minute = rawValue.length >= 12 ? rawValue.substring(10, 12) : '00';
        displayValue = `${year}-${month}-${day} ${hour}:${minute}`;
      }

      setFormData(prev => ({
        ...prev,
        acci_time: displayValue,
        _raw_acci_time: rawValue
      }));
    }
  };

  // 필터링된 회사 목록
  const filteredCompanies = companySearchTerm
    ? companies.filter(company =>
        company.name.toLowerCase().includes(companySearchTerm.toLowerCase()))
    : companies;

  // 필터링된 사업장 목록
  const filteredSites = siteSearchTerm && selectedCompany
    ? selectedCompany.sites.filter(site =>
        site.name.toLowerCase().includes(siteSearchTerm.toLowerCase()))
    : selectedCompany?.sites || [];

  // 회사명 검색 입력 처리
  const handleCompanySearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCompanySearchTerm(value);
    setShowCompanyDropdown(true);
    
    if (!value) {
      setSelectedCompany(null);
      setFormData(prev => ({
        ...prev,
        company_name: '',
        company_code: '',
        site_name: '',
        site_code: ''
      }));
    }
  };

  // 사업장명 검색 입력 처리
  const handleSiteSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSiteSearchTerm(value);
    setShowSiteDropdown(true);
    
    if (!value) {
      setFormData(prev => ({
        ...prev,
        site_name: '',
        site_code: ''
      }));
    }
  };

  // 외부 클릭 감지를 위한 ref
  const companyDropdownRef = useRef<HTMLDivElement>(null);
  const siteDropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setShowCompanyDropdown(false);
      }
      if (siteDropdownRef.current && !siteDropdownRef.current.contains(event.target as Node)) {
        setShowSiteDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 입력 필드 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // 재해발생 형태 변경 시 처리
    if (name === 'accident_type_level1') {
      // 모바일에서만 스텝 조정
      if (isMobile) {
        adjustStepForAccidentType(value);
      }
      
      // 사고유형(인적/복합) 선택 시 재해자 수 기본값 1로
      if (value === '인적' || value === '복합') {
        setFormData(prev => {
          if (!prev.victim_count || prev.victim_count < 1) {
            return {
              ...prev,
              [name]: value,
              victim_count: 1
            };
          }
          return {
            ...prev,
            [name]: value
          };
        });
        return;
      }
      
      // 물적 사고로 변경된 경우 재해자 관련 데이터 초기화
      if (value === '물적') {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          victim_count: 0,
          victims: [],
          victim_name: '',
          victim_age: 0,
          victim_belong: '',
          victim_duty: '',
          injury_type: '',
          ppe_worn: '',
          first_aid: ''
        }));
        return;
      }
      
      // 기타 경우 (빈 값 등)
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      return;
    }
    
    // 체크박스 처리
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
      return;
    }
    
    // 숫자 타입 처리
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : Number(value)
      }));
      return;
    }
    
    // datetime-local 타입의 first_report_time 처리 - 한국 시간대 적용
    if (name === 'first_report_time' && value) {
      try {
        // 입력된 날짜를 한국 시간대로 변환
        const inputDate = new Date(value);
        // 사용자 입력 시간은 이미 local time이므로 바로 저장
        // 브라우저는 datetime-local 입력을 사용자의 현지 시간대로 처리함
        setFormData(prev => ({
          ...prev,
          [name]: value,
          _raw_first_report_time: value // 원본 값도 저장
        }));
      } catch (e) {
        console.error('최초 보고 시간 변환 오류:', e);
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
      return;
    }
    
    // 기타 입력 필드 처리
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 재해자 정보 업데이트 함수
  const handleVictimChange = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      victims: prev.victims.map((victim, i) => 
        i === index ? { ...victim, [field]: value } : victim
      )
    }));
  };
  
  // victim_count가 변경될 때 victims 배열 길이 조정
  useEffect(() => {
    if (formData.victim_count > 0) {
      setFormData(prev => {
        // 기존 victims 배열 유지하면서 새 길이로 조정
        const updatedVictims = [...prev.victims];
        
        // victim_count보다 배열이 짧으면 빈 객체로 채움
        while (updatedVictims.length < formData.victim_count) {
          updatedVictims.push({
            name: '',
            age: 0,
            belong: '',
            duty: '',
            injury_type: '',
            ppe_worn: '',
            first_aid: ''
          });
        }
        
        // victim_count보다 배열이 길면 자름
        if (updatedVictims.length > formData.victim_count) {
          updatedVictims.length = formData.victim_count;
        }
        
        return {
          ...prev,
          victims: updatedVictims
        };
      });
    }
  }, [formData.victim_count]);

  // 파일 업로드 핸들러
  const handleFileChange = (fieldName: string) => (fileIds: string[]) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: fileIds
    }));
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 폼 데이터 검증
      if (!formData.company_name || !formData.site_name || !formData.acci_time || !formData.acci_location) {
        alert("필수 항목을 모두 입력해주세요.");
        return;
      }
      
      // 폼 데이터 준비 (깊은 복사)
      const submissionData = JSON.parse(JSON.stringify(formData));
      
      // 최초 보고 시간을 한국 시간으로 확실하게 변환
      if (submissionData.first_report_time) {
        try {
          // 사용자가 입력한 datetime-local 값은 로컬 시간대 기준이므로
          // 이를 명시적으로 한국 시간대로 변환해야 함
          let reportDate;
          if (submissionData._raw_first_report_time) {
            // _raw_first_report_time이 있으면 이 값 사용
            reportDate = new Date(submissionData._raw_first_report_time);
          } else {
            // 없으면 first_report_time 사용
            reportDate = new Date(submissionData.first_report_time);
          }
          
          // 유효한 날짜인지 확인
          if (!isNaN(reportDate.getTime())) {
            // ISO 문자열로 변환하여 저장 (getKoreanDate 함수 제거)
            submissionData.first_report_time = reportDate.toISOString();
          } else {
            // 유효하지 않은 날짜면 현재 시간 사용
            submissionData.first_report_time = new Date().toISOString();
          }
          
          // 디버깅용 로그
          console.log('원본 시간:', reportDate);
          console.log('한국 변환 시간:', reportDate);
          console.log('최종 제출 시간:', submissionData.first_report_time);
        } catch (e) {
          console.error('최초 보고 시간 변환 오류:', e);
          // 오류 발생 시 현재 시간 사용
          submissionData.first_report_time = new Date().toISOString();
        }
      } else {
        // 최초 보고 시간이 없으면 현재 시간 사용
        submissionData.first_report_time = new Date().toISOString();
      }
      
      // 내부 처리용 필드 제거
      delete submissionData._raw_first_report_time;
      delete submissionData._raw_acci_time;
      
      // API 호출
      const response = await fetch("/api/occurrence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...submissionData,
          // 재해자 정보를 직렬화하여 JSON 문자열로 변환
          victims_json: JSON.stringify(submissionData.victims)
        }),
      });
      
      if (!response.ok) {
        throw new Error("사고 발생보고서 저장 중 오류가 발생했습니다.");
      }
      
      // 결과 데이터
      const result = await response.json();
      
      // 성공 메시지
      alert("사고 발생보고서가 성공적으로 저장되었습니다.");
      
      // 저장된 보고서 상세 페이지로 이동
      router.push(`/occurrence/${result.accident_id}`);
    } catch (error) {
      console.error("폼 제출 오류:", error);
      alert("사고 발생보고서 저장 중 오류가 발생했습니다.");
    }
  };

  // 발생보고서 목록 로드
  const [reports, setReports] = useState<any[]>([]);
  const [totalReports, setTotalReports] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  // 발생보고서 목록 로드
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        
        // 목록 API 호출
        console.log("Fetching occurrence reports list...");
        const response = await fetch(`/api/occurrence?page=${page}&limit=10`);
        
        if (!response.ok) {
          throw new Error("사고 발생보고서 목록을 불러오는 중 오류가 발생했습니다.");
        }
        
        const data = await response.json();
        console.log("Reports data received:", data);
        
        // 디버깅 정보 업데이트
        setDebugInfo({
          apiResponse: {
            total: data.total,
            page: data.page,
            limit: data.limit,
            totalPages: data.total_pages,
            reportsCount: data.reports?.length || 0
          },
          timestamp: new Date().toISOString()
        });
        
        if (data && Array.isArray(data.reports)) {
          setReports(data.reports);
          setTotalReports(data.total || 0);
          setTotalPages(data.total_pages || 1);
        } else {
          setReports([]);
          setTotalReports(0);
          setTotalPages(1);
        }
      } catch (err: any) {
        console.error("사고 발생보고서 목록 로드 오류:", err);
        setError(err.message || "데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchReports();
  }, [page]);

  // 재해자 추가 함수
  const addVictim = () => {
    setFormData(prev => ({
      ...prev,
      victims: [
        ...prev.victims,
        {
          name: '',
          age: 0,
          belong: '',
          duty: '',
          injury_type: '',
          ppe_worn: '',
          first_aid: ''
        }
      ]
    }));
  };

  // 재해자 삭제 함수
  const removeVictim = (index: number) => {
    setFormData(prev => ({
      ...prev,
      victims: prev.victims.filter((_, i) => i !== index)
    }));
  };

  // 스텝 이동 함수
  const goToNextStep = () => {
    const currentSteps = getSteps();
    if (currentStep < currentSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    const currentSteps = getSteps();
    if (stepIndex >= 0 && stepIndex < currentSteps.length) {
      setCurrentStep(stepIndex);
    }
  };

  // 재해발생 형태 변경 시 스텝 조정
  const adjustStepForAccidentType = (newAccidentType: string) => {
    const currentSteps = getSteps();
    const newSteps = newAccidentType === "물적" 
      ? [
          { id: 'basic', title: '기본정보', group: '기본정보' },
          { id: 'accident', title: '사고정보', group: '사고정보' },
          { id: 'attachment', title: '첨부파일', group: '첨부파일' },
          { id: 'reporter', title: '보고자정보', group: '보고자정보' }
        ]
      : [
          { id: 'basic', title: '기본정보', group: '기본정보' },
          { id: 'accident', title: '사고정보', group: '사고정보' },
          { id: 'victim', title: '재해자정보', group: '재해자정보' },
          { id: 'attachment', title: '첨부파일', group: '첨부파일' },
          { id: 'reporter', title: '보고자정보', group: '보고자정보' }
        ];

    // 현재 재해자 정보 단계(2번)에 있고 물적으로 변경된 경우, 첨부파일 단계로 이동
    if (currentStep === 2 && newAccidentType === "물적") {
      setCurrentStep(2); // 물적에서는 2번이 첨부파일 단계
    }
    // 현재 첨부파일/보고자 단계에 있고 인적/복합으로 변경된 경우, 단계 번호 조정
    else if (currentStep >= 2 && newAccidentType !== "물적" && currentSteps.length === 4) {
      // 물적에서 인적/복합으로 변경된 경우, 재해자 정보 단계가 추가되므로 +1
      setCurrentStep(currentStep + 1);
    }
  };

  // 현재 스텝 유효성 검사
  const validateCurrentStep = (): boolean => {
    const currentStepConfig = steps[currentStep];
    const fieldsInGroup = getFieldsInGroup(currentStepConfig.group);
    
    for (const field of fieldsInGroup) {
      if (isFieldRequired(field.field_name) && isFieldVisible(field.field_name)) {
        const value = formData[field.field_name as keyof OccurrenceFormData];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return false;
        }
      }
    }
    return true;
  };

  // 스텝별 완료 상태 확인
  const isStepCompleted = (stepIndex: number): boolean => {
    const stepConfig = steps[stepIndex];
    const fieldsInGroup = getFieldsInGroup(stepConfig.group);
    
    for (const field of fieldsInGroup) {
      if (isFieldRequired(field.field_name) && isFieldVisible(field.field_name)) {
        const value = formData[field.field_name as keyof OccurrenceFormData];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return false;
        }
      }
    }
    return true;
  };

  // 모바일 스텝 네비게이션 컴포넌트
  const MobileStepNavigation = () => (
    <div className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="px-4 py-3">
        {/* 진행 바 */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">
            {currentStep + 1} / {steps.length}
          </span>
          <span className="text-sm text-gray-500">
            {steps[currentStep].title}
          </span>
        </div>
        
        {/* 진행률 바 */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        
        {/* 스텝 인디케이터 */}
        <div className="flex justify-between mt-3">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => goToStep(index)}
              className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                index <= currentStep
                  ? 'bg-blue-600 text-white'
                  : isStepCompleted(index)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {index < currentStep && isStepCompleted(index) ? '✓' : index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // 모바일 스텝 버튼 컴포넌트
  const MobileStepButtons = () => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
      <div className="flex justify-between space-x-3">
        <button
          type="button"
          onClick={goToPrevStep}
          disabled={currentStep === 0}
          className={`flex-1 px-4 py-3 rounded-md text-base font-medium ${
            currentStep === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          이전
        </button>
        
        {currentStep === steps.length - 1 ? (
          <button
            type="submit"
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-base font-medium"
          >
            저장
          </button>
        ) : (
          <button
            type="button"
            onClick={goToNextStep}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-base font-medium"
          >
            다음
          </button>
        )}
      </div>
    </div>
  );

  // 스텝별 컨텐츠 렌더링 함수
  const renderStepContent = (stepIndex: number) => {
    const step = steps[stepIndex];
    
    switch (step.id) {
      case 'basic':
        return (
          <div className="space-y-4">
            <h2 className="text-lg md:text-xl font-semibold mb-4">기본 정보</h2>
            {getFieldsInGroup('기본정보').map((fieldSetting) => (
              <React.Fragment key={fieldSetting.id}>
                {/* 회사명 필드 */}
                {fieldSetting.field_name === 'company_name' && isFieldVisible('company_name') && (
                  <div className="mb-4">
                    <div ref={companyDropdownRef} className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {getFieldLabel("company_name", "회사명")}
                        {isFieldRequired("company_name") && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <input
                        type="text"
                        value={companySearchTerm}
                        onChange={handleCompanySearchChange}
                        onFocus={() => setShowCompanyDropdown(true)}
                        required={isFieldRequired("company_name")}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                        placeholder="회사명 검색"
                      />
                      {showCompanyDropdown && filteredCompanies.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                          {filteredCompanies.map((company) => (
                            <div
                              key={company.id}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => handleCompanySelect(company)}
                            >
                              {company.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* 회사 코드 필드 */}
                {fieldSetting.field_name === 'company_code' && isFieldVisible('company_code') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getFieldLabel("company_code", "회사 코드")}
                      {isFieldRequired("company_code") && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type="text"
                      name="company_code"
                      value={formData.company_code}
                      readOnly
                      disabled
                      className="w-full border border-gray-300 bg-gray-100 rounded-md px-3 py-2"
                      required={isFieldRequired("company_code")}
                    />
                  </div>
                )}
                
                {/* 사업장명 필드 */}
                {fieldSetting.field_name === 'site_name' && isFieldVisible('site_name') && (
                  <div className="mb-4">
                    <div ref={siteDropdownRef} className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {getFieldLabel("site_name", "사업장명")}
                        {isFieldRequired("site_name") && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <input
                        type="text"
                        value={siteSearchTerm}
                        onChange={handleSiteSearchChange}
                        onFocus={() => setShowSiteDropdown(true)}
                        disabled={!selectedCompany}
                        required={isFieldRequired("site_name")}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                        placeholder={selectedCompany ? "사업장명 검색" : "먼저 회사를 선택하세요"}
                      />
                      {showSiteDropdown && filteredSites.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                          {filteredSites.map((site) => (
                            <div
                              key={site.id}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => handleSiteSelect(site)}
                            >
                              {site.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* 사업장 코드 필드 */}
                {fieldSetting.field_name === 'site_code' && isFieldVisible('site_code') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getFieldLabel("site_code", "사업장 코드")}
                      {isFieldRequired("site_code") && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type="text"
                      name="site_code"
                      value={formData.site_code}
                      readOnly
                      disabled
                      className="w-full border border-gray-300 bg-gray-100 rounded-md px-3 py-2"
                      required={isFieldRequired("site_code")}
                    />
                  </div>
                )}
                
                {/* 전체사고코드 필드 */}
                {fieldSetting.field_name === 'global_accident_no' && isFieldVisible('global_accident_no') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getFieldLabel("global_accident_no", "전체사고코드 (자동생성)")}
                      {isFieldRequired("global_accident_no") && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type="text"
                      name="global_accident_no"
                      value={formData.global_accident_no}
                      readOnly
                      disabled
                      className="w-full border border-gray-300 bg-gray-100 rounded-md px-3 py-2"
                      placeholder={selectedCompany ? "회사 선택 시 자동 생성됩니다" : "회사를 먼저 선택해주세요"}
                      required={isFieldRequired("global_accident_no")}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      형식: [회사코드]-[연도]-[순번3자리]
                    </p>
                  </div>
                )}
                
                {/* 사고 코드 필드 */}
                {fieldSetting.field_name === 'report_channel_no' && isFieldVisible('report_channel_no') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getFieldLabel("report_channel_no", "사업장 사고 코드 (자동생성)")}
                      {isFieldRequired("report_channel_no") && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type="text"
                      name="report_channel_no"
                      value={formData.report_channel_no}
                      readOnly
                      disabled
                      className="w-full border border-gray-300 bg-gray-100 rounded-md px-3 py-2"
                      placeholder={selectedCompany && formData.site_code ? "사업장 선택 시 자동 생성됩니다" : "회사와 사업장을 먼저 선택해주세요"}
                      required={isFieldRequired("report_channel_no")}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      형식: [회사코드]-[사업장코드]-[순번3자리]-[YYYYMMDD]
                    </p>
                  </div>
                )}
                
                {/* 협력업체 여부 필드 */}
                {fieldSetting.field_name === 'is_contractor' && isFieldVisible('is_contractor') && (
                  <div className="mb-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_contractor"
                        checked={formData.is_contractor}
                        onChange={handleChange}
                        id="is_contractor"
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <label htmlFor="is_contractor" className="ml-2 text-sm font-medium text-gray-700">
                        {getFieldLabel("is_contractor", "협력업체 사고")}
                      </label>
                    </div>
                  </div>
                )}
                
                {/* 협력업체명 필드 */}
                {fieldSetting.field_name === 'contractor_name' && isFieldVisible('contractor_name') && formData.is_contractor && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getFieldLabel("contractor_name", "협력업체명")}
                      {isFieldRequired("contractor_name") && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type="text"
                      name="contractor_name"
                      value={formData.contractor_name}
                      onChange={handleChange}
                      required={isFieldRequired("contractor_name")}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                )}
                
                {/* 최초 보고 시간 필드 */}
                {fieldSetting.field_name === 'first_report_time' && isFieldVisible('first_report_time') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getFieldLabel("first_report_time", "최초 보고 시간")}
                      {isFieldRequired("first_report_time") && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type="datetime-local"
                      name="first_report_time"
                      value={formData.first_report_time}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required={isFieldRequired("first_report_time")}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        );
        
      case 'accident':
        return (
          <div className="space-y-4">
            <h2 className="text-lg md:text-xl font-semibold mb-4">사고 정보</h2>
            {getFieldsInGroup('사고정보').map((fieldSetting) => (
              <React.Fragment key={fieldSetting.id}>
                {/* 사고 발생 일시 */}
                {fieldSetting.field_name === 'acci_time' && isFieldVisible('acci_time') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getFieldLabel("acci_time", "사고 발생 일시")}
                      {isFieldRequired("acci_time") && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type="datetime-local"
                      name="acci_time"
                      value={formData.acci_time}
                      onChange={handleChange}
                      required={isFieldRequired("acci_time")}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                    />
                  </div>
                )}
                
                {/* 사고 발생 장소 */}
                {fieldSetting.field_name === 'acci_location' && isFieldVisible('acci_location') && (
                  <div className="mb-3 md:mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getFieldLabel("acci_location", "사고 발생 장소")}
                      {isFieldRequired("acci_location") && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type="text"
                      name="acci_location"
                      value={formData.acci_location}
                      onChange={handleChange}
                      required={isFieldRequired("acci_location")}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                    />
                  </div>
                )}
                
                {/* 재해발생 형태 */}
                {fieldSetting.field_name === 'accident_type_level1' && isFieldVisible('accident_type_level1') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getFieldLabel("accident_type_level1", "재해발생 형태")}
                      {isFieldRequired("accident_type_level1") && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <select
                      name="accident_type_level1"
                      value={formData.accident_type_level1}
                      onChange={handleChange}
                      required={isFieldRequired("accident_type_level1")}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">선택하세요</option>
                      <option value="인적">인적 (인명 피해)</option>
                      <option value="물적">물적 (재산 피해)</option>
                      <option value="복합">복합 (인적+물적)</option>
                    </select>
                  </div>
                )}
                
                {/* 사고 유형 */}
                {fieldSetting.field_name === 'accident_type_level2' && isFieldVisible('accident_type_level2') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getFieldLabel("accident_type_level2", "사고 유형")}
                      {isFieldRequired("accident_type_level2") && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <select
                      name="accident_type_level2"
                      value={formData.accident_type_level2}
                      onChange={handleChange}
                      required={isFieldRequired("accident_type_level2")}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
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
                
                {/* 재해자 수 (인적 또는 복합 선택 시에만 표시) */}
                {fieldSetting.field_name === 'victim_count' && isFieldVisible('victim_count') && (formData.accident_type_level1 === "인적" || formData.accident_type_level1 === "복합") && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getFieldLabel("victim_count", "재해자 수")}
                      {isFieldRequired("victim_count") && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type="number"
                      name="victim_count"
                      value={formData.victim_count}
                      onChange={handleChange}
                      min="0"
                      required={isFieldRequired("victim_count")}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                )}
                
                {/* 사고 개요 */}
                {fieldSetting.field_name === 'acci_summary' && isFieldVisible('acci_summary') && (
                  <div className="mb-3 md:mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getFieldLabel("acci_summary", "사고 개요")}
                      {isFieldRequired("acci_summary") && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <textarea
                      name="acci_summary"
                      value={formData.acci_summary}
                      onChange={handleChange}
                      required={isFieldRequired("acci_summary")}
                      rows={4}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                    />
                  </div>
                )}
                
                {/* 사고 상세 내용 */}
                {fieldSetting.field_name === 'acci_detail' && isFieldVisible('acci_detail') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getFieldLabel("acci_detail", "사고 상세 내용")}
                      {isFieldRequired("acci_detail") && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <div className="mb-2">
                      <p className="text-sm text-gray-600">
                        아래 항목을 포함하여 상세하게 작성해주세요:
                      </p>
                      <ol className="text-sm text-gray-600 list-decimal pl-5 mt-1">
                        <li>사고 발생 전 작업 내용</li>
                        <li>사고 발생 시점 작업자 행동</li>
                        <li>사고가 발생하게 된 동작 및 기계 상태</li>
                        <li>현장에서 어떤 일이 일어났는가</li>
                        <li>사고 발생 후 초기 조치 및 대응</li>
                      </ol>
                    </div>
                    <textarea
                      name="acci_detail"
                      value={formData.acci_detail}
                      onChange={handleChange}
                      rows={10}
                      required={isFieldRequired("acci_detail")}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder={`1. 사고 발생 전 작업 내용
- 

2. 사고 발생 시점 작업자 행동
 - 

3. 사고가 발생하게 된 동작 및 기계 상태
- 

4. 현장에서 어떤 일이 일어났는가
- 

5. 사고 발생 후 초기 조치 및 대응
- 
`}
                    ></textarea>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        );
        
      case 'victim':
        return (
          <div className="space-y-4">
            <h2 className="text-lg md:text-xl font-semibold mb-4">재해자 정보</h2>
            {(formData.accident_type_level1 === "인적" || formData.accident_type_level1 === "복합") && formData.victim_count > 0 && (
              <div>
                {formData.victims.map((victim, index) => (
                  <div key={index} className="mb-6 p-4 bg-white rounded-md border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-base md:text-lg font-medium">재해자 {index + 1}</h3>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeVictim(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {/* 재해자 이름 */}
                      {isFieldVisible("victim_name") && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {getFieldLabel("victim_name", "재해자 이름")}
                            {isFieldRequired("victim_name") && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <input
                            type="text"
                            name={`victim_name_${index}`}
                            value={formData.victims[index]?.name || ''}
                            onChange={(e) => handleVictimChange(index, 'name', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                            required={isFieldRequired("victim_name")}
                          />
                        </div>
                      )}
                      
                      {/* 재해자 나이 */}
                      {isFieldVisible("victim_age") && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {getFieldLabel("victim_age", "재해자 나이")}
                            {isFieldRequired("victim_age") && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <input
                            type="number"
                            name={`victim_age_${index}`}
                            value={formData.victims[index]?.age || 0}
                            onChange={(e) => handleVictimChange(index, 'age', parseInt(e.target.value) || 0)}
                            min="0"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                            required={isFieldRequired("victim_age")}
                          />
                        </div>
                      )}

                      {/* 재해자 소속 */}
                      {isFieldVisible("victim_belong") && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {getFieldLabel("victim_belong", "재해자 소속")}
                            {isFieldRequired("victim_belong") && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <input
                            type="text"
                            name={`victim_belong_${index}`}
                            value={formData.victims[index]?.belong || ''}
                            onChange={(e) => handleVictimChange(index, 'belong', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                            required={isFieldRequired("victim_belong")}
                          />
                        </div>
                      )}

                      {/* 재해자 직무 */}
                      {isFieldVisible("victim_duty") && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {getFieldLabel("victim_duty", "재해자 직무")}
                            {isFieldRequired("victim_duty") && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <input
                            type="text"
                            name={`victim_duty_${index}`}
                            value={formData.victims[index]?.duty || ''}
                            onChange={(e) => handleVictimChange(index, 'duty', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                            required={isFieldRequired("victim_duty")}
                          />
                        </div>
                      )}

                      {/* 부상 유형 */}
                      {isFieldVisible("injury_type") && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {getFieldLabel("injury_type", "부상 유형")}
                            {isFieldRequired("injury_type") && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <select
                            name={`injury_type_${index}`}
                            value={formData.victims[index]?.injury_type || ''}
                            onChange={(e) => handleVictimChange(index, 'injury_type', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                            required={isFieldRequired("injury_type")}
                          >
                            <option value="">선택하세요</option>
                            <option value="경상">경상 (치료 2주 미만)</option>
                            <option value="중경상">중경상 (치료 2주~5주)</option>
                            <option value="중상">중상 (치료 5주 이상)</option>
                            <option value="사망">사망</option>
                            <option value="기타">기타</option>
                          </select>
                        </div>
                      )}

                      {/* 보호구 착용 여부 */}
                      {isFieldVisible("ppe_worn") && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {getFieldLabel("ppe_worn", "보호구 착용 여부")}
                            {isFieldRequired("ppe_worn") && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <select
                            name={`ppe_worn_${index}`}
                            value={formData.victims[index]?.ppe_worn || ''}
                            onChange={(e) => handleVictimChange(index, 'ppe_worn', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                            required={isFieldRequired("ppe_worn")}
                          >
                            <option value="">선택하세요</option>
                            <option value="착용">착용</option>
                            <option value="미착용">미착용</option>
                            <option value="부분착용">부분 착용</option>
                            <option value="해당없음">해당 없음</option>
                          </select>
                        </div>
                      )}

                      {/* 응급조치 내역 */}
                      {isFieldVisible("first_aid") && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {getFieldLabel("first_aid", "응급조치 내역")}
                            {isFieldRequired("first_aid") && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <textarea
                            name={`first_aid_${index}`}
                            value={formData.victims[index]?.first_aid || ''}
                            onChange={(e) => handleVictimChange(index, 'first_aid', e.target.value)}
                            rows={3}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                            placeholder="응급처치 내용, 병원 이송 여부 등"
                            required={isFieldRequired("first_aid")}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* 재해자 추가 버튼 */}
                <button
                  type="button"
                  onClick={addVictim}
                  className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-base"
                >
                  재해자 추가
                </button>
              </div>
            )}
          </div>
        );
        
      case 'attachment':
        return (
          <div className="space-y-4">
            <h2 className="text-lg md:text-xl font-semibold mb-4">첨부 파일</h2>
            {getFieldsInGroup('첨부파일').map((fieldSetting) => (
              <React.Fragment key={fieldSetting.id}>
                {/* 사고 현장 사진 */}
                {fieldSetting.field_name === 'scene_photos' && isFieldVisible('scene_photos') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getFieldLabel("scene_photos", "사고 현장 사진")}
                      {isFieldRequired("scene_photos") && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <FileUploader
                      onFilesSelected={(files) => handleFileChange('scene_photos')(files.map(f => f.id))}
                      accept="image/*"
                      multiple
                      className="w-full"
                    />
                  </div>
                )}
                
                {/* CCTV 영상 */}
                {fieldSetting.field_name === 'cctv_video' && isFieldVisible('cctv_video') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getFieldLabel("cctv_video", "CCTV 영상")}
                      {isFieldRequired("cctv_video") && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <FileUploader
                      onFilesSelected={(files) => handleFileChange('cctv_video')(files.map(f => f.id))}
                      accept="video/*"
                      multiple
                      className="w-full"
                    />
                  </div>
                )}
                
                {/* 관계자 진술서 */}
                {fieldSetting.field_name === 'statement_docs' && isFieldVisible('statement_docs') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getFieldLabel("statement_docs", "관계자 진술서")}
                      {isFieldRequired("statement_docs") && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <FileUploader
                      onFilesSelected={(files) => handleFileChange('statement_docs')(files.map(f => f.id))}
                      accept="application/pdf"
                      multiple
                      className="w-full"
                    />
                  </div>
                )}
                
                {/* 기타 문서 */}
                {fieldSetting.field_name === 'etc_documents' && isFieldVisible('etc_documents') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getFieldLabel("etc_documents", "기타 문서")}
                      {isFieldRequired("etc_documents") && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <FileUploader
                      onFilesSelected={(files) => handleFileChange('etc_documents')(files.map(f => f.id))}
                      accept="application/pdf"
                      multiple
                      className="w-full"
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        );
        
      case 'reporter':
        return (
          <div className="space-y-4">
            <h2 className="text-lg md:text-xl font-semibold mb-4">보고자 정보</h2>
            {/* 보고자 이름 */}
            {isFieldVisible("reporter_name") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {getFieldLabel("reporter_name", "보고자 이름")}
                  {isFieldRequired("reporter_name") && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  name="reporter_name"
                  value={formData.reporter_name}
                  onChange={handleChange}
                  required={isFieldRequired("reporter_name")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                />
              </div>
            )}
            
            {/* 보고자 직책 */}
            {isFieldVisible("reporter_position") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {getFieldLabel("reporter_position", "보고자 직책")}
                  {isFieldRequired("reporter_position") && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  name="reporter_position"
                  value={formData.reporter_position}
                  onChange={handleChange}
                  required={isFieldRequired("reporter_position")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                />
              </div>
            )}
            
            {/* 보고자 소속 */}
            {isFieldVisible("reporter_belong") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {getFieldLabel("reporter_belong", "보고자 소속")}
                  {isFieldRequired("reporter_belong") && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  name="reporter_belong"
                  value={formData.reporter_belong}
                  onChange={handleChange}
                  required={isFieldRequired("reporter_belong")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                />
              </div>
            )}
            
            {/* 보고 경로 */}
            {isFieldVisible("report_channel") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {getFieldLabel("report_channel", "보고 경로")}
                  {isFieldRequired("report_channel") && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  name="report_channel"
                  value={formData.report_channel}
                  onChange={handleChange}
                  required={isFieldRequired("report_channel")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                />
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">사고 발생보고서 작성</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* 모바일 스텝 네비게이션 */}
      {isMobile && <MobileStepNavigation />}

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* 기본 정보 섹션 */}
        <div className={`bg-gray-50 p-3 md:p-4 rounded-md ${isMobile && currentStep !== 0 ? 'hidden' : ''}`}>
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">기본 정보</h2>
          
          {/* 기본정보 필드들을 순서대로 렌더링 */}
          {getFieldsInGroup('기본정보').map((fieldSetting) => (
            <React.Fragment key={fieldSetting.id}>
              {/* 회사명 필드 */}
              {fieldSetting.field_name === 'company_name' && isFieldVisible('company_name') && (
                <div className="mb-3 md:mb-4">
                  <div ref={companyDropdownRef} className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getFieldLabel("company_name", "회사명")}
                      {isFieldRequired("company_name") && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type="text"
                      value={companySearchTerm}
                      onChange={handleCompanySearchChange}
                      onFocus={() => setShowCompanyDropdown(true)}
                      required={isFieldRequired("company_name")}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                      placeholder="회사명 검색"
                    />
                    {showCompanyDropdown && filteredCompanies.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredCompanies.map((company) => (
                          <div
                            key={company.id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleCompanySelect(company)}
                          >
                            {company.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* 회사 코드 필드 */}
              {fieldSetting.field_name === 'company_code' && isFieldVisible('company_code') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {getFieldLabel("company_code", "회사 코드")}
                    {isFieldRequired("company_code") && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    name="company_code"
                    value={formData.company_code}
                    readOnly
                    disabled
                    className="w-full border border-gray-300 bg-gray-100 rounded-md px-3 py-2"
                    required={isFieldRequired("company_code")}
                  />
                </div>
              )}
              
              {/* 사업장명 필드 */}
              {fieldSetting.field_name === 'site_name' && isFieldVisible('site_name') && (
                <div className="mb-3 md:mb-4">
                  <div ref={siteDropdownRef} className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getFieldLabel("site_name", "사업장명")}
                      {isFieldRequired("site_name") && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type="text"
                      value={siteSearchTerm}
                      onChange={handleSiteSearchChange}
                      onFocus={() => setShowSiteDropdown(true)}
                      disabled={!selectedCompany}
                      required={isFieldRequired("site_name")}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                      placeholder={selectedCompany ? "사업장명 검색" : "먼저 회사를 선택하세요"}
                    />
                    {showSiteDropdown && filteredSites.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredSites.map((site) => (
                          <div
                            key={site.id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleSiteSelect(site)}
                          >
                            {site.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* 사업장 코드 필드 */}
              {fieldSetting.field_name === 'site_code' && isFieldVisible('site_code') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {getFieldLabel("site_code", "사업장 코드")}
                    {isFieldRequired("site_code") && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    name="site_code"
                    value={formData.site_code}
                    readOnly
                    disabled
                    className="w-full border border-gray-300 bg-gray-100 rounded-md px-3 py-2"
                    required={isFieldRequired("site_code")}
                  />
                </div>
              )}
              
              {/* 전체사고코드 필드 */}
              {fieldSetting.field_name === 'global_accident_no' && isFieldVisible('global_accident_no') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {getFieldLabel("global_accident_no", "전체사고코드 (자동생성)")}
                    {isFieldRequired("global_accident_no") && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    name="global_accident_no"
                    value={formData.global_accident_no}
                    readOnly
                    disabled
                    className="w-full border border-gray-300 bg-gray-100 rounded-md px-3 py-2"
                    placeholder={selectedCompany ? "회사 선택 시 자동 생성됩니다" : "회사를 먼저 선택해주세요"}
                    required={isFieldRequired("global_accident_no")}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    형식: [회사코드]-[연도]-[순번3자리]
                  </p>
                </div>
              )}
              
              {/* 사고 코드 필드 */}
              {fieldSetting.field_name === 'report_channel_no' && isFieldVisible('report_channel_no') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {getFieldLabel("report_channel_no", "사업장 사고 코드 (자동생성)")}
                    {isFieldRequired("report_channel_no") && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    name="report_channel_no"
                    value={formData.report_channel_no}
                    readOnly
                    disabled
                    className="w-full border border-gray-300 bg-gray-100 rounded-md px-3 py-2"
                    placeholder={selectedCompany && formData.site_code ? "사업장 선택 시 자동 생성됩니다" : "회사와 사업장을 먼저 선택해주세요"}
                    required={isFieldRequired("report_channel_no")}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    형식: [회사코드]-[사업장코드]-[순번3자리]-[YYYYMMDD]
                  </p>
                </div>
              )}
              
              {/* 협력업체 여부 필드 */}
              {fieldSetting.field_name === 'is_contractor' && isFieldVisible('is_contractor') && (
                <div className="mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_contractor"
                      checked={formData.is_contractor}
                      onChange={handleChange}
                      id="is_contractor"
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <label htmlFor="is_contractor" className="ml-2 text-sm font-medium text-gray-700">
                      {getFieldLabel("is_contractor", "협력업체 사고")}
                    </label>
                  </div>
                </div>
              )}
              
              {/* 협력업체명 필드 */}
              {fieldSetting.field_name === 'contractor_name' && isFieldVisible('contractor_name') && formData.is_contractor && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {getFieldLabel("contractor_name", "협력업체명")}
                    {isFieldRequired("contractor_name") && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    name="contractor_name"
                    value={formData.contractor_name}
                    onChange={handleChange}
                    required={isFieldRequired("contractor_name")}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              )}
              
              {/* 최초 보고 시간 필드 */}
              {fieldSetting.field_name === 'first_report_time' && isFieldVisible('first_report_time') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {getFieldLabel("first_report_time", "최초 보고 시간")}
                    {isFieldRequired("first_report_time") && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="datetime-local"
                    name="first_report_time"
                    value={formData.first_report_time}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required={isFieldRequired("first_report_time")}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* 사고 정보 섹션 */}
        <div className={`bg-gray-50 p-3 md:p-4 rounded-md ${isMobile && currentStep !== 1 ? 'hidden' : ''}`}>
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">사고 정보</h2>
          
          {/* 사고 정보 그룹의 필드들을 순서대로 렌더링 */}
          {getFieldsInGroup('사고정보').map((fieldSetting) => (
            <React.Fragment key={fieldSetting.id}>
              {/* 사고 발생 일시 */}
              {fieldSetting.field_name === 'acci_time' && isFieldVisible('acci_time') && (
                <div className="mb-3 md:mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {getFieldLabel("acci_time", "사고 발생 일시")}
                    {isFieldRequired("acci_time") && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="datetime-local"
                    name="acci_time"
                    value={formData.acci_time}
                    onChange={handleChange}
                    required={isFieldRequired("acci_time")}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                  />
                </div>
              )}
              
              {/* 사고 발생 장소 */}
              {fieldSetting.field_name === 'acci_location' && isFieldVisible('acci_location') && (
                <div className="mb-3 md:mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {getFieldLabel("acci_location", "사고 발생 장소")}
                    {isFieldRequired("acci_location") && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    name="acci_location"
                    value={formData.acci_location}
                    onChange={handleChange}
                    required={isFieldRequired("acci_location")}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                    placeholder="예: 제어반 앞, 적재장 3번 구역"
                  />
                </div>
              )}
              
              {/* 재해발생 형태 */}
              {fieldSetting.field_name === 'accident_type_level1' && isFieldVisible('accident_type_level1') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {getFieldLabel("accident_type_level1", "재해발생 형태")}
                    {isFieldRequired("accident_type_level1") && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <select
                    name="accident_type_level1"
                    value={formData.accident_type_level1}
                    onChange={handleChange}
                    required={isFieldRequired("accident_type_level1")}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">선택하세요</option>
                    <option value="인적">인적 (인명 피해)</option>
                    <option value="물적">물적 (재산 피해)</option>
                    <option value="복합">복합 (인적+물적)</option>
                  </select>
                </div>
              )}
              
              {/* 사고 유형 */}
              {fieldSetting.field_name === 'accident_type_level2' && isFieldVisible('accident_type_level2') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {getFieldLabel("accident_type_level2", "사고 유형")}
                    {isFieldRequired("accident_type_level2") && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <select
                    name="accident_type_level2"
                    value={formData.accident_type_level2}
                    onChange={handleChange}
                    required={isFieldRequired("accident_type_level2")}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
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
              
              {/* 사고 개요 */}
              {fieldSetting.field_name === 'acci_summary' && isFieldVisible('acci_summary') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {getFieldLabel("acci_summary", "사고 개요")}
                    {isFieldRequired("acci_summary") && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <textarea
                    name="acci_summary"
                    value={formData.acci_summary}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                    placeholder="사고 발생 경위를 간략히 설명해주세요"
                    required={isFieldRequired("acci_summary")}
                  />
                </div>
              )}
              
              {/* 사고 상세 내용 */}
              {fieldSetting.field_name === 'acci_detail' && isFieldVisible('acci_detail') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {getFieldLabel("acci_detail", "사고 상세 내용")}
                    {isFieldRequired("acci_detail") && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <textarea
                    name="acci_detail"
                    value={formData.acci_detail}
                    onChange={handleChange}
                    rows={4}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                    placeholder="사고 발생 상황과 원인 등을 상세히 기록해주세요"
                    required={isFieldRequired("acci_detail")}
                  />
                </div>
              )}
              
              {/* 재해자 수 (인적 또는 복합 선택 시에만 표시) */}
              {fieldSetting.field_name === 'victim_count' && isFieldVisible('victim_count') && (formData.accident_type_level1 === "인적" || formData.accident_type_level1 === "복합") && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {getFieldLabel("victim_count", "재해자 수")}
                    {isFieldRequired("victim_count") && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="number"
                    name="victim_count"
                    value={formData.victim_count}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    required={isFieldRequired("victim_count")}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* 재해자 정보 섹션 */}
        {(formData.accident_type_level1 === "인적" || formData.accident_type_level1 === "복합") && formData.victim_count > 0 && (
          <div className={`bg-gray-50 p-3 md:p-4 rounded-md ${isMobile && (formData.accident_type_level1 === "물적" || currentStep !== 2) ? 'hidden' : ''}`}>
            <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">재해자 정보</h2>
            
            {/* 재해자 정보를 재해자 수에 맞게 렌더링 */}
            {formData.victims.map((victim, index) => (
              <div key={index} className="mb-6 p-4 bg-white rounded-md border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-base md:text-lg font-medium">재해자 {index + 1}</h3>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeVictim(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      삭제
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {/* 재해자 이름 */}
                  {isFieldVisible("victim_name") && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {getFieldLabel("victim_name", "재해자 이름")}
                        {isFieldRequired("victim_name") && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <input
                        type="text"
                        name={`victim_name_${index}`}
                        value={formData.victims[index]?.name || ''}
                        onChange={(e) => handleVictimChange(index, 'name', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                        required={isFieldRequired("victim_name")}
                      />
                    </div>
                  )}
                  
                  {/* 재해자 나이 */}
                  {isFieldVisible("victim_age") && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {getFieldLabel("victim_age", "재해자 나이")}
                        {isFieldRequired("victim_age") && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <input
                        type="number"
                        name={`victim_age_${index}`}
                        value={formData.victims[index]?.age || ''}
                        onChange={(e) => handleVictimChange(index, 'age', parseInt(e.target.value) || 0)}
                        min="0"
                        max="120"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                        required={isFieldRequired("victim_age")}
                      />
                    </div>
                  )}
                  
                  {/* 재해자 소속 */}
                  {isFieldVisible("victim_belong") && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {getFieldLabel("victim_belong", "재해자 소속")}
                        {isFieldRequired("victim_belong") && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <input
                        type="text"
                        name={`victim_belong_${index}`}
                        value={formData.victims[index]?.belong || ''}
                        onChange={(e) => handleVictimChange(index, 'belong', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                        required={isFieldRequired("victim_belong")}
                      />
                    </div>
                  )}
                  
                  {/* 재해자 직무 */}
                  {isFieldVisible("victim_duty") && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {getFieldLabel("victim_duty", "재해자 직무")}
                        {isFieldRequired("victim_duty") && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <input
                        type="text"
                        name={`victim_duty_${index}`}
                        value={formData.victims[index]?.duty || ''}
                        onChange={(e) => handleVictimChange(index, 'duty', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                        required={isFieldRequired("victim_duty")}
                      />
                    </div>
                  )}
                  
                  {/* 부상 유형 */}
                  {isFieldVisible("injury_type") && (
                    <div className="mb-3 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {getFieldLabel("injury_type", "부상 유형")}
                        {isFieldRequired("injury_type") && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <select
                        name={`injury_type_${index}`}
                        value={formData.victims[index]?.injury_type || ''}
                        onChange={(e) => handleVictimChange(index, 'injury_type', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
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
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {getFieldLabel("ppe_worn", "보호구 착용 여부")}
                        {isFieldRequired("ppe_worn") && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <input
                        type="text"
                        name={`ppe_worn_${index}`}
                        value={formData.victims[index]?.ppe_worn || ''}
                        onChange={(e) => handleVictimChange(index, 'ppe_worn', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                        placeholder="예: 헬멧, 안전화 착용"
                        required={isFieldRequired("ppe_worn")}
                      />
                    </div>
                  )}
                  
                  {/* 응급조치 내역 */}
                  {isFieldVisible("first_aid") && (
                    <div className="mb-3 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {getFieldLabel("first_aid", "응급조치 내역")}
                        {isFieldRequired("first_aid") && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <textarea
                        name={`first_aid_${index}`}
                        value={formData.victims[index]?.first_aid || ''}
                        onChange={(e) => handleVictimChange(index, 'first_aid', e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                        placeholder="응급처치 내용, 병원 이송 여부 등"
                        required={isFieldRequired("first_aid")}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* 재해자 추가 버튼 */}
            <button
              type="button"
              onClick={addVictim}
              className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-base"
            >
              재해자 추가
            </button>
          </div>
        )}
        
        {/* 첨부 파일 섹션 */}
        <div className={`bg-gray-50 p-3 md:p-4 rounded-md ${isMobile && currentStep !== (formData.accident_type_level1 === "물적" ? 2 : 3) ? 'hidden' : ''}`}>
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">첨부 파일</h2>
          
          <div className="space-y-4">
            {/* 첨부 파일 그룹의 필드들을 순서대로 렌더링 */}
            {getFieldsInGroup('첨부파일').map((fieldSetting) => (
              <React.Fragment key={fieldSetting.id}>
                {/* 사고 현장 사진 */}
                {fieldSetting.field_name === 'scene_photos' && isFieldVisible('scene_photos') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getFieldLabel("scene_photos", "사고 현장 사진")}
                      {isFieldRequired("scene_photos") && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <FileUploader
                      onChange={(fileIds) => handleFileChange('scene_photos')(fileIds)}
                      required={isFieldRequired("scene_photos")}
                    />
                  </div>
                )}
                
                {/* CCTV 영상 */}
                {fieldSetting.field_name === 'cctv_video' && isFieldVisible('cctv_video') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getFieldLabel("cctv_video", "CCTV 영상")}
                      {isFieldRequired("cctv_video") && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <FileUploader
                      onChange={(fileIds) => handleFileChange('cctv_video')(fileIds)}
                      required={isFieldRequired("cctv_video")}
                    />
                  </div>
                )}
                
                {/* 관계자 진술서 */}
                {fieldSetting.field_name === 'statement_docs' && isFieldVisible('statement_docs') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getFieldLabel("statement_docs", "관계자 진술서")}
                      {isFieldRequired("statement_docs") && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <FileUploader
                      onChange={(fileIds) => handleFileChange('statement_docs')(fileIds)}
                      required={isFieldRequired("statement_docs")}
                    />
                  </div>
                )}
                
                {/* 기타 문서 */}
                {fieldSetting.field_name === 'etc_documents' && isFieldVisible('etc_documents') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {getFieldLabel("etc_documents", "기타 문서")}
                      {isFieldRequired("etc_documents") && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <FileUploader
                      onChange={(fileIds) => handleFileChange('etc_documents')(fileIds)}
                      required={isFieldRequired("etc_documents")}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        
        {/* 보고자 정보 섹션 */}
        <div className={`bg-gray-50 p-3 md:p-4 rounded-md ${isMobile && currentStep !== (formData.accident_type_level1 === "물적" ? 3 : 4) ? 'hidden' : ''}`}>
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">보고자 정보</h2>
          
          <div className="space-y-3">
            {/* 보고자 이름 */}
            {isFieldVisible("reporter_name") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {getFieldLabel("reporter_name", "보고자 이름")}
                  {isFieldRequired("reporter_name") && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  name="reporter_name"
                  value={formData.reporter_name}
                  onChange={handleChange}
                  required={isFieldRequired("reporter_name")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                />
              </div>
            )}
            
            {/* 보고자 직책 */}
            {isFieldVisible("reporter_position") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {getFieldLabel("reporter_position", "보고자 직책")}
                  {isFieldRequired("reporter_position") && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  name="reporter_position"
                  value={formData.reporter_position}
                  onChange={handleChange}
                  required={isFieldRequired("reporter_position")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                />
              </div>
            )}
            
            {/* 보고자 소속 */}
            {isFieldVisible("reporter_belong") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {getFieldLabel("reporter_belong", "보고자 소속")}
                  {isFieldRequired("reporter_belong") && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  name="reporter_belong"
                  value={formData.reporter_belong}
                  onChange={handleChange}
                  required={isFieldRequired("reporter_belong")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                />
              </div>
            )}
            
            {/* 보고 경로 */}
            {isFieldVisible("report_channel") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {getFieldLabel("report_channel", "보고 경로")}
                  {isFieldRequired("report_channel") && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  name="report_channel"
                  value={formData.report_channel}
                  onChange={handleChange}
                  required={isFieldRequired("report_channel")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-base"
                />
              </div>
            )}
          </div>
        </div>
        
        {/* 데스크톱 제출 버튼 */}
        {!isMobile && (
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-base"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-base"
            >
              저장
            </button>
          </div>
        )}
      </form>

      {/* 모바일 스텝 버튼 */}
      {isMobile && <MobileStepButtons />}
    </div>
  );
} 