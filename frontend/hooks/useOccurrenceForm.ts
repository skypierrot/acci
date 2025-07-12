import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { OccurrenceFormData, AccidentStats, VictimInfo, Attachment } from '../types/occurrence.types';
import { createInitialFormData, createInitialVictim, getSteps, adjustStepForAccidentType } from '../utils/occurrence.utils';
import { getCompanies, Company, Site } from '../services/company.service';
import { getFormSettings, FormFieldSetting, applyMobileGridSettings } from '../services/report_form.service';
import { createOccurrenceReport, updateOccurrenceReport } from '../services/occurrence/occurrence.service';
import { validateOccurrenceReport } from '../services/occurrence/occurrence.service';

export const useOccurrenceForm = (isEditMode: boolean = false, reportId?: string) => {
  const router = useRouter();
  // 폼 데이터 상태 관리
  const [formData, setFormData] = useState<OccurrenceFormData>(createInitialFormData());
  
  // 수정 모드용 원본 데이터 저장 (비교용)
  const [originalData, setOriginalData] = useState<Partial<OccurrenceFormData>>({});
  
  // 로딩 및 에러 상태 관리
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 회사 및 사업장 상태
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [siteSearchTerm, setSiteSearchTerm] = useState('');
  const [showSiteDropdown, setShowSiteDropdown] = useState(false);

  // 사고 코드 관련 상태
  const [accidentStats, setAccidentStats] = useState<AccidentStats>({
    companyAccidentCount: 0,
    siteAccidentCount: 0,
    companyYearlyCount: 0,
    siteYearlyCount: 0
  });

  // 양식 설정 관련 상태
  const [formSettings, setFormSettings] = useState<FormFieldSetting[]>([]);
  const [formSettingsLoaded, setFormSettingsLoaded] = useState(false);
  const [groupedSettings, setGroupedSettings] = useState<{ [key: string]: FormFieldSetting[] }>({});
  
  // 그리드 클래스 상태 (그룹별로 미리 계산된 클래스)
  const [gridClasses, setGridClasses] = useState<Record<string, string>>({
    '기본정보': 'grid grid-cols-1 md:grid-cols-3 gap-4', // 기본값으로 3열 설정
    '사고정보': 'grid grid-cols-1 md:grid-cols-3 gap-4',
    '재해자정보': 'grid grid-cols-1 md:grid-cols-2 gap-4',
    '첨부파일': 'grid grid-cols-1 md:grid-cols-2 gap-4',
    '보고자정보': 'grid grid-cols-1 md:grid-cols-2 gap-4'
  });

  // 모바일 스텝 관련 상태
  const [currentStep, setCurrentStep] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 감지 및 그리드 설정 업데이트
  useEffect(() => {
    const checkMobile = () => {
      const newIsMobile = window.innerWidth < 768;
      const wasChanged = isMobile !== newIsMobile;
      setIsMobile(newIsMobile);
      
      // 모바일/데스크톱 모드가 변경되면 그리드 설정 재계산
      if (wasChanged && formSettings.length > 0) {
        console.log(`[모바일 감지] 화면 모드 변경: ${newIsMobile ? '모바일' : '데스크톱'}`);
        
        // 원본 설정을 다시 로드하여 모바일 처리 적용
        const processedSettings = applyMobileGridSettings(formSettings, newIsMobile);
        
        // 그룹별 설정 재계산
        const grouped = processedSettings.reduce((acc: { [key: string]: FormFieldSetting[] }, setting) => {
          const group = setting.field_group || '기타';
          if (!acc[group]) {
            acc[group] = [];
          }
          acc[group].push(setting);
          return acc;
        }, {});
        
        setGroupedSettings(grouped);
        
        // 그리드 클래스 재계산
        const calculatedGridClasses: Record<string, string> = {};
        Object.keys(grouped).forEach(groupName => {
          const groupField = processedSettings.find(setting => setting.field_group === groupName);
          const cols = groupField?.group_cols || 2;
          
          switch (cols) {
            case 1:
              calculatedGridClasses[groupName] = 'grid grid-cols-1 gap-4';
              break;
            case 2:
              calculatedGridClasses[groupName] = 'grid grid-cols-1 md:grid-cols-2 gap-4';
              break;
            case 3:
              calculatedGridClasses[groupName] = 'grid grid-cols-1 md:grid-cols-3 gap-4';
              break;
            case 4:
              calculatedGridClasses[groupName] = 'grid grid-cols-1 md:grid-cols-4 gap-4';
              break;
            default:
              calculatedGridClasses[groupName] = 'grid grid-cols-1 md:grid-cols-2 gap-4';
          }
        });
        
        setGridClasses(calculatedGridClasses);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isMobile, formSettings]);

  // 양식 설정 로드
  useEffect(() => {
    const fetchFormSettings = async () => {
      try {
        console.log('[useOccurrenceForm] 설정 로드 시작');
        const settings = await getFormSettings('occurrence');
        console.log('[useOccurrenceForm] 설정 로드 완료:', settings.length, '개');
        
        // 모바일 환경에서는 그리드 설정을 1열로 변경
        const processedSettings = applyMobileGridSettings(settings, isMobile);
        
        setFormSettings(processedSettings);
        setFormSettingsLoaded(true);
        
        // 그룹별로 설정 정리
        const grouped = processedSettings.reduce((acc: { [key: string]: FormFieldSetting[] }, setting) => {
          const group = setting.field_group || '기타';
          if (!acc[group]) {
            acc[group] = [];
          }
          acc[group].push(setting);
          return acc;
        }, {});
        
        console.log('[useOccurrenceForm] 그룹별 설정:', Object.keys(grouped));
        setGroupedSettings(grouped);
        
        // 기본정보 그룹의 설정 확인
        const basicInfoField = settings.find(setting => setting.field_group === '기본정보');
        console.log('[useOccurrenceForm] 기본정보 그룹 첫 번째 필드:', basicInfoField);
        
        // 그리드 클래스 미리 계산
        const calculatedGridClasses: Record<string, string> = {};
        Object.keys(grouped).forEach(groupName => {
          const groupField = processedSettings.find(setting => setting.field_group === groupName);
          const cols = groupField?.group_cols || 2;
          
          switch (cols) {
            case 1:
              calculatedGridClasses[groupName] = 'grid grid-cols-1 gap-4';
              break;
            case 2:
              calculatedGridClasses[groupName] = 'grid grid-cols-1 md:grid-cols-2 gap-4';
              break;
            case 3:
              calculatedGridClasses[groupName] = 'grid grid-cols-1 md:grid-cols-3 gap-4';
              break;
            case 4:
              calculatedGridClasses[groupName] = 'grid grid-cols-1 md:grid-cols-4 gap-4';
              break;
            default:
              calculatedGridClasses[groupName] = 'grid grid-cols-1 md:grid-cols-2 gap-4';
          }
          
          console.log(`[그리드 클래스 계산] 그룹: ${groupName}, 열: ${cols}, 클래스: ${calculatedGridClasses[groupName]}`);
        });
        
        setGridClasses(calculatedGridClasses);
        console.log('[useOccurrenceForm] 설정 로드 및 그리드 클래스 계산 완료');
      } catch (error) {
        console.error('양식 설정 로드 실패:', error);
        setError('양식 설정을 불러오는데 실패했습니다.');
      }
    };

    fetchFormSettings();
  }, []);

  // 회사 목록 로드
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const companiesData = await getCompanies();
        setCompanies(companiesData);
      } catch (error) {
        console.error('회사 목록 로드 실패:', error);
        setError('회사 목록을 불러오는데 실패했습니다.');
      }
    };

    loadCompanies();
  }, []);

  // 양식 설정 관련 헬퍼 함수들
  const isFieldVisible = useCallback((fieldName: string): boolean => {
    const setting = formSettings.find(s => s.field_name === fieldName);
    const baseVisible = setting ? setting.is_visible : true;
    
    // 조건부 필드 로직
    if (!baseVisible) return false;
    
    // 협력업체명은 협력업체 여부가 true일 때만 표시
    if (fieldName === 'contractor_name') {
      return formData.is_contractor;
    }
    
    // 재해자 수는 인적 또는 복합 사고일 때만 표시
    if (fieldName === 'victim_count') {
      return formData.accident_type_level1 === '인적' || formData.accident_type_level1 === '복합';
    }
    
    return baseVisible;
  }, [formSettings, formData.is_contractor, formData.accident_type_level1]);

  const isFieldRequired = useCallback((fieldName: string): boolean => {
    const setting = formSettings.find(s => s.field_name === fieldName);
    return setting ? setting.is_required : false;
  }, [formSettings]);

  const getFieldLabel = useCallback((fieldName: string, defaultLabel: string): string => {
    const setting = formSettings.find(s => s.field_name === fieldName);
    return setting?.display_name || defaultLabel;
  }, [formSettings]);

  const getFieldsInGroup = useCallback((groupName: string): FormFieldSetting[] => {
    const groupFields = groupedSettings[groupName] || [];
    // display_order로 정렬하여 반환
    return groupFields.sort((a, b) => a.display_order - b.display_order);
  }, [groupedSettings]);

  const getDynamicGridClass = useCallback((groupName: string): string => {
    // 미리 계산된 그리드 클래스 반환 (정적)
    const gridClass = gridClasses[groupName] || 'grid grid-cols-1 md:grid-cols-2 gap-4';
    console.log(`[getDynamicGridClass] 그룹: ${groupName}, 클래스: ${gridClass}`);
    return gridClass;
  }, [gridClasses]);

  // 폼 데이터 변경 핸들러
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev };
      
      if (type === 'checkbox') {
        (newData as any)[name] = (e.target as HTMLInputElement).checked;
      } else if (type === 'number') {
        (newData as any)[name] = parseInt(value) || 0;
      } else {
        // select 요소에서 boolean 값 처리
        if (name === 'is_contractor') {
          (newData as any)[name] = value === 'true';
        } else {
          (newData as any)[name] = value;
        }
      }

      // 협력업체 여부가 변경되면 협력업체명 초기화
      if (name === 'is_contractor') {
        if (value === 'false' || !newData.is_contractor) {
          newData.contractor_name = '';
        }
      }

      // 사고 유형이 변경되면 재해자 수와 배열 초기화
      if (name === 'accident_type_level1') {
        if (value === '물적') {
          newData.victim_count = 0;
          newData.victims = [];
          // 물적피해 항목이 없으면 1개 추가
          if (!newData.property_damages || newData.property_damages.length === 0) {
            newData.property_damages = [{
              id: `property_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              damage_target: '',
              estimated_cost: 0,
              damage_content: '',
              shutdown_start_date: '',
              recovery_expected_date: ''
            }];
          }
        } else if ((value === '인적' || value === '복합') && newData.victim_count === 0) {
          newData.victim_count = 1;
          newData.victims = [createInitialVictim()];
          // 복합 사고일 때도 물적피해 항목이 없으면 1개 추가
          if (value === '복합' && (!newData.property_damages || newData.property_damages.length === 0)) {
            newData.property_damages = [{
              id: `property_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              damage_target: '',
              estimated_cost: 0,
              damage_content: '',
              shutdown_start_date: '',
              recovery_expected_date: ''
            }];
          }
        }
      }

      // 재해자 수가 변경되면 배열 조정
      if (name === 'victim_count') {
        const count = parseInt(value) || 0;
        const currentVictims = newData.victims;
        
        if (count > currentVictims.length) {
          // 재해자 추가
          const newVictims = [...currentVictims];
          for (let i = currentVictims.length; i < count; i++) {
            newVictims.push(createInitialVictim());
          }
          newData.victims = newVictims;
        } else if (count < currentVictims.length) {
          // 재해자 제거
          newData.victims = currentVictims.slice(0, count);
        }
      }

      return newData;
    });
  }, []);

  // 재해자 정보 변경 핸들러
  const handleVictimChange = useCallback((index: number, field: string, value: string | number) => {
    setFormData(prev => {
      const newVictims = [...prev.victims];
      if (newVictims[index]) {
        newVictims[index] = {
          ...newVictims[index],
          [field]: value
        };
      }
      return { ...prev, victims: newVictims };
    });
  }, []);

  // 재해자 추가
  const addVictim = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      victim_count: prev.victim_count + 1,
      victims: [...prev.victims, createInitialVictim()]
    }));
  }, []);

  // 재해자 제거
  const removeVictim = useCallback((index: number) => {
    setFormData(prev => {
      const newVictims = prev.victims.filter((_, i) => i !== index);
      return {
        ...prev,
        victim_count: Math.max(0, prev.victim_count - 1),
        victims: newVictims
      };
    });
  }, []);

  // 물적피해 정보 변경 핸들러
  const handlePropertyDamageChange = useCallback((index: number, field: string, value: string | number) => {
    setFormData(prev => {
      const newPropertyDamages = [...(prev.property_damages || [])];
      if (newPropertyDamages[index]) {
        newPropertyDamages[index] = {
          ...newPropertyDamages[index],
          [field]: value
        };
      }
      return { ...prev, property_damages: newPropertyDamages };
    });
  }, []);

  // 물적피해 추가
  const addPropertyDamage = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      property_damages: [
        ...(prev.property_damages || []),
        {
          id: `property_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          damage_target: '',
          estimated_cost: 0,
          damage_content: '',
          shutdown_start_date: '',
          recovery_expected_date: ''
        }
      ]
    }));
  }, []);

  // 물적피해 제거
  const removePropertyDamage = useCallback((index: number) => {
    setFormData(prev => {
      const newPropertyDamages = (prev.property_damages || []).filter((_, i) => i !== index);
      return {
        ...prev,
        property_damages: newPropertyDamages
      };
    });
  }, []);

  // 파일 변경 핸들러 (무한 렌더링 방지)
  const handleFileChange = useCallback((newAttachments: Attachment[]) => {
    setFormData(prev => ({
      ...prev,
      attachments: newAttachments
    }));
  }, []);

  // 회사 선택 핸들러
  const handleCompanySelect = useCallback(async (company: Company) => {
    setSelectedCompany(company);
    
    if (isEditMode) {
      // 수정 모드: 기존 회사와 비교해서 다르면 새로운 순번 생성
      const isCompanyChanged = originalData.company_code !== company.code;
      
      if (isCompanyChanged) {
        console.log('[수정 모드] 회사가 변경됨. 새로운 순번 생성:', originalData.company_code, '->', company.code);
        try {
          // 새로운 회사 순번 생성
          const currentYear = new Date().getFullYear();
          const response = await fetch(`/api/occurrence?sequence_type=company&sequence_code=${company.code}&sequence_year=${currentYear}`);
          const result = await response.json();
          
          const globalAccidentNo = `${company.code}-${currentYear}-${result.nextSequence}`;
          
          setFormData(prev => ({
            ...prev,
            company_name: company.name,
            company_code: company.code,
            site_name: '',
            site_code: '',
            global_accident_no: globalAccidentNo,
            accident_id: '' // 사업장 선택 전까지는 빈 값
          }));
        } catch (error) {
          console.error('순번 조회 실패:', error);
          const currentYear = new Date().getFullYear();
          const globalAccidentNo = `${company.code}-${currentYear}-001`;
          
          setFormData(prev => ({
            ...prev,
            company_name: company.name,
            company_code: company.code,
            site_name: '',
            site_code: '',
            global_accident_no: globalAccidentNo,
            accident_id: ''
          }));
        }
      } else {
        console.log('[수정 모드] 회사가 동일함. 원본 데이터 복원');
        // 같은 회사면 원본 데이터 복원
        setFormData(prev => ({
          ...prev,
          company_name: company.name,
          company_code: company.code,
          global_accident_no: originalData.global_accident_no || prev.global_accident_no,
          // 사업장 정보도 초기화 (원본으로 돌아갈 준비)
          site_name: '',
          site_code: '',
          accident_id: ''
        }));
      }
    } else {
      // 신규 작성 모드에서만 코드 생성
      try {
        // API를 통해 실제 순번 조회 (쿼리 파라미터 방식으로 변경)
        const currentYear = new Date().getFullYear();
        const response = await fetch(`/api/occurrence?sequence_type=company&sequence_code=${company.code}&sequence_year=${currentYear}`);
        const result = await response.json();
        
        const globalAccidentNo = `${company.code}-${currentYear}-${result.nextSequence}`;
        
        setFormData(prev => ({
          ...prev,
          company_name: company.name,
          company_code: company.code,
          site_name: '',
          site_code: '',
          global_accident_no: globalAccidentNo,
          accident_id: '' // 사업장 선택 전까지는 빈 값
        }));
      } catch (error) {
        console.error('순번 조회 실패:', error);
        // 오류 시 기본값 사용
        const currentYear = new Date().getFullYear();
        const globalAccidentNo = `${company.code}-${currentYear}-001`;
        
        setFormData(prev => ({
          ...prev,
          company_name: company.name,
          company_code: company.code,
          site_name: '',
          site_code: '',
          global_accident_no: globalAccidentNo,
          accident_id: ''
        }));
      }
    }
    
    setShowCompanyDropdown(false);
    setCompanySearchTerm(company.name);
  }, [isEditMode, originalData.company_code]);

  // 사업장 선택 핸들러
  const handleSiteSelect = useCallback(async (site: Site) => {
    if (isEditMode) {
      // 수정 모드: 원본 데이터와 정확히 비교
      const isOriginalCompanyAndSite = originalData.company_code === formData.company_code && 
                                      originalData.site_code === site.code;
      
      if (isOriginalCompanyAndSite) {
        console.log('[수정 모드] 원본 회사/사업장으로 복원. 원본 코드 복원:', originalData.accident_id);
        // 원본 회사/사업장으로 돌아온 경우 → 원본 코드 복원
        setFormData(prev => ({
          ...prev,
          site_name: site.name,
          site_code: site.code,
          accident_id: originalData.accident_id || prev.accident_id,
          global_accident_no: originalData.global_accident_no || prev.global_accident_no
        }));
      } else {
        console.log('[수정 모드] 사업장이 변경됨. 새로운 순번 생성:', originalData.site_code, '->', site.code);
        // 다른 사업장으로 변경된 경우 → 새로운 순번 생성
        try {
          // 새로운 사업장 순번 생성
          const currentYear = new Date().getFullYear();
          const response = await fetch(`/api/occurrence?sequence_type=site&sequence_code=${formData.company_code}-${site.code}&sequence_year=${currentYear}`);
          const result = await response.json();
          
          // 형식: [회사코드]-[사업장코드]-[년도]-[사업장 순번]
          const accidentId = `${formData.company_code}-${site.code}-${currentYear}-${result.nextSequence}`;
          
          setFormData(prev => ({
            ...prev,
            site_name: site.name,
            site_code: site.code,
            accident_id: accidentId
          }));
        } catch (error) {
          console.error('순번 조회 실패:', error);
          const currentYear = new Date().getFullYear();
          const accidentId = `${formData.company_code}-${site.code}-${currentYear}-001`;
          
          setFormData(prev => ({
            ...prev,
            site_name: site.name,
            site_code: site.code,
            accident_id: accidentId
          }));
        }
      }
    } else {
      // 신규 작성 모드에서만 코드 생성
      try {
        // API를 통해 실제 순번 조회 (쿼리 파라미터 방식으로 변경)
        const currentYear = new Date().getFullYear();
        const response = await fetch(`/api/occurrence?sequence_type=site&sequence_code=${formData.company_code}-${site.code}&sequence_year=${currentYear}`);
        const result = await response.json();
        
        // 형식: [회사코드]-[사업장코드]-[년도]-[사업장 순번]
        const accidentId = `${formData.company_code}-${site.code}-${currentYear}-${result.nextSequence}`;
        
        setFormData(prev => ({
          ...prev,
          site_name: site.name,
          site_code: site.code,
          accident_id: accidentId
        }));
      } catch (error) {
        console.error('순번 조회 실패:', error);
        // 오류 시 기본값 사용
        const currentYear = new Date().getFullYear();
        const accidentId = `${formData.company_code}-${site.code}-${currentYear}-001`;
        
        setFormData(prev => ({
          ...prev,
          site_name: site.name,
          site_code: site.code,
          accident_id: accidentId
        }));
      }
    }
    
    setShowSiteDropdown(false);
    setSiteSearchTerm(site.name);
  }, [formData.company_code, isEditMode, originalData.site_code, originalData.company_code]);

  // 스텝 네비게이션
  const goToNextStep = useCallback(() => {
    const steps = getSteps(formData.accident_type_level1);
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  }, [formData.accident_type_level1]);

  const goToPrevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((stepIndex: number) => {
    const steps = getSteps(formData.accident_type_level1);
    setCurrentStep(Math.min(Math.max(stepIndex, 0), steps.length - 1));
  }, [formData.accident_type_level1]);

  // 폼 제출
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // 유효성 검사 수행
    const validation = validateOccurrenceReport(formData);
    if (!validation.valid) {
      setError(validation.error || '유효성 검사 실패');
      setIsSubmitting(false);
      return;
    }

    try {
      if (isEditMode && reportId) {
        // 수정 모드
        console.log('[useOccurrenceForm] 수정 데이터 제출:', formData);
        const result = await updateOccurrenceReport(reportId, formData);
        if (result.success) {
        alert('보고서가 성공적으로 수정되었습니다.');
        router.push(`/occurrence/${reportId}`);
        } else {
          throw new Error(result.error || '수정 실패');
        }
      } else {
        // 생성 모드
        console.log('[useOccurrenceForm] 생성 데이터 제출:', formData);
        const result = await createOccurrenceReport(formData);
        if (result.success) {
        alert('사고 발생보고서가 성공적으로 제출되었습니다.');
          const newReportId = result.accident_id;
        if (!newReportId) {
          throw new Error('보고서 ID를 받지 못했습니다.');
        }
        // 페이지 이동
        router.push(`/occurrence/${newReportId}`);
        } else {
          throw new Error(result.error || '생성 실패');
        }
      }
      
    } catch (error) {
      console.error('제출 오류:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isEditMode, reportId, router]);

  return {
    // 상태
    formData,
    victims: formData.victims,
    isSubmitting,
    error,
    companies,
    sites: selectedCompany?.sites || [],
    selectedCompany,
    selectedSite: { name: formData.site_name, code: formData.site_code },
    companySearchTerm,
    showCompanyDropdown,
    siteSearchTerm,
    showSiteDropdown,
    accidentStats,
    formSettings,
    formSettingsLoaded,
    currentStep,
    isMobile,
    steps: getSteps(formData.accident_type_level1),

    // 핸들러
    handleChange,
    handleVictimChange,
    addVictim,
    removeVictim,
    handlePropertyDamageChange,
    addPropertyDamage,
    removePropertyDamage,
    handleFileChange,
    handleCompanySelect,
    handleSiteSelect,
    handleSubmit,

    // 네비게이션
    goToNextStep,
    goToPrevStep,
    goToStep,

    // 헬퍼 함수
    isFieldVisible,
    isFieldRequired,
    getFieldLabel,
    getFieldsInGroup,
    getDynamicGridClass,

    // 상태 업데이트 (수정 페이지용)
    setFormData,
    setOriginalData, // 원본 데이터 설정 함수 추가
    setVictims: (victims: VictimInfo[]) => {
      setFormData(prev => ({ ...prev, victims }));
    },
    setSelectedCompany: (company: Company | null) => {
      setSelectedCompany(company);
    },
    setSelectedSite: (site: Site | null) => {
      // site 정보를 formData에 반영
      if (site) {
        setFormData(prev => ({
          ...prev,
          site_name: site.name,
          site_code: site.code
        }));
      }
    },
    setCompanySearchTerm,
    setShowCompanyDropdown,
    setSiteSearchTerm,
    setShowSiteDropdown,
    setError,
    setCurrentStep
  };
}; 