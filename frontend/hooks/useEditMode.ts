import { useState, useCallback } from 'react';
import { InvestigationReport, VictimInfo, PropertyDamageItem, OriginalDataField } from '../types/investigation.types';

interface UseEditModeProps {
  report: InvestigationReport | null;
  onSave: (data: Partial<InvestigationReport>) => Promise<void>;
}

interface UseEditModeReturn {
  editMode: boolean;
  editForm: Partial<InvestigationReport>;
  toggleEditMode: () => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDateClick: (e: React.MouseEvent<HTMLInputElement>) => void;
  handleSave: () => Promise<void>;
  
  // 재해자 관련
  handleVictimChange: (index: number, field: keyof VictimInfo, value: string | number) => void;
  addVictim: () => void;
  removeVictim: (index: number) => void;
  handleVictimCountChange: (newCount: number) => void;
  
  // 물적피해 관련
  addPropertyDamage: () => void;
  removePropertyDamage: (id: string) => void;
  handlePropertyDamageChange: (id: string, field: keyof PropertyDamageItem, value: string | number) => void;
  
  // 원본 데이터 로드
  loadOriginalData: (field: OriginalDataField) => void;
  updateOriginalVictims: (victims: VictimInfo[]) => void;
}

export const useEditMode = ({ report, onSave }: UseEditModeProps): UseEditModeReturn => {
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<InvestigationReport>>({});

  // 편집 폼 입력 처리
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // cause_analysis 필드 처리
    if (name === 'cause_analysis') {
      setEditForm(prev => ({
        ...prev,
        cause_analysis: value as any // CauseAnalysis 타입으로 처리됨
      }));
      return;
    }
    
    // prevention_actions 필드 처리
    if (name === 'prevention_actions') {
      setEditForm(prev => ({
        ...prev,
        prevention_actions: value as any // PreventionActions 타입으로 처리됨
      }));
      return;
    }
    
    // investigation_property_damage 필드 처리
    if (name === 'investigation_property_damage') {
      setEditForm(prev => ({
        ...prev,
        investigation_property_damage: value as any // PropertyDamageItem[] 타입으로 처리됨
      }));
      return;
    }
    
    setEditForm(prev => ({
      ...prev,
      [name]: name.includes('count') || name === 'damage_cost' ? (parseInt(value) || 0) : value
    }));
  }, []);

  // 날짜 필드 처리
  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // 날짜 필드 클릭 시 달력 다이얼 열기
  const handleDateClick = useCallback((e: React.MouseEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    input.showPicker?.();
  }, []);

  // 물적피해 항목 추가 (조사보고서용)
  const addPropertyDamage = useCallback(() => {
    const newDamage: PropertyDamageItem = {
      id: `damage_${Date.now()}`,
      damage_target: '',
      estimated_cost: 0,
      damage_content: '',
      shutdown_start_date: '', // 조사보고서용 필드 복구
      recovery_expected_date: '', // 조사보고서용 필드 복구
    };
    
    setEditForm(prev => ({
      ...prev,
      investigation_property_damage: [...(prev.investigation_property_damage || []), newDamage]
    }));
  }, []);

  // 물적피해 항목 삭제 (조사보고서용)
  const removePropertyDamage = useCallback((id: string) => {
    setEditForm(prev => ({
      ...prev,
      investigation_property_damage: (prev.investigation_property_damage || []).filter(damage => damage.id !== id)
    }));
  }, []);

  // 물적피해 항목 변경 (조사보고서용)
  const handlePropertyDamageChange = useCallback((id: string, field: keyof PropertyDamageItem, value: string | number) => {
    setEditForm(prev => ({
      ...prev,
      investigation_property_damage: (prev.investigation_property_damage || []).map(damage => 
        damage.id === id 
          ? { ...damage, [field]: field === 'estimated_cost' ? (typeof value === 'string' ? parseInt(value) || 0 : value) : value }
          : damage
      )
    }));
  }, []);

  // 원본 데이터 불러오기
  const loadOriginalData = useCallback(async (field: OriginalDataField) => {
    if (field === 'victims') {
      setEditForm(prev => {
        const originalVictims = prev.original_victims || [];
        const currentVictims = prev.investigation_victims || [];

        const updatedVictims = currentVictims.map((currentVictim, index) => {
          const originalVictim = originalVictims[index];
          if (!originalVictim) return currentVictim;

          return {
            name: originalVictim.name !== undefined ? originalVictim.name : '',
            age: originalVictim.age !== undefined ? originalVictim.age : 0,
            belong: originalVictim.belong !== undefined ? originalVictim.belong : '',
            duty: originalVictim.duty !== undefined ? originalVictim.duty : '',
            injury_type: originalVictim.injury_type !== undefined ? originalVictim.injury_type : '',
            ppe_worn: originalVictim.ppe_worn !== undefined ? originalVictim.ppe_worn : '',
            first_aid: originalVictim.first_aid !== undefined ? originalVictim.first_aid : '',
            birth_date: originalVictim.birth_date !== undefined ? originalVictim.birth_date : '',

            // 조사보고서 전용 필드들은 기존 값 유지
            absence_start_date: currentVictim.absence_start_date || '',
            return_expected_date: currentVictim.return_expected_date || '',

            // 메타 필드들
            victim_id: originalVictim.victim_id,
            accident_id: originalVictim.accident_id,
            created_at: originalVictim.created_at,
            updated_at: originalVictim.updated_at
          };
        });

        return {
          ...prev,
          investigation_victim_count: prev.original_victim_count || 0,
          investigation_victims: updatedVictims
        };
      });
    } else if (field === 'property_damage') {
      try {
        // accident_id 가져오기 (편집 모드에서는 report.accident_id, 생성 모드에서는 editForm.accident_id)
        const accidentId = report?.accident_id || editForm.accident_id;
        if (!accidentId) {
          throw new Error('사고 ID가 없습니다.');
        }
        
        // 발생보고서의 물적피해 정보를 API로 조회
        const response = await fetch(`/api/investigation/${accidentId}/original-property-damage`);
        if (!response.ok) {
          throw new Error('발생보고서 물적피해 정보 조회에 실패했습니다.');
        }
        
        const result = await response.json();
        const originalPropertyDamage = result.data || [];
        
        // 조사보고서용 물적피해 정보로 변환
        const investigationPropertyDamage = originalPropertyDamage.map((damage: any) => ({
          id: `damage_${Date.now()}_${Math.random()}`, // 고유 ID 생성
          damage_target: damage.damage_target || '',
          estimated_cost: damage.estimated_cost || 0,
          damage_content: damage.damage_content || '',
          shutdown_start_date: '', // 조사보고서 전용 필드
          recovery_expected_date: '', // 조사보고서 전용 필드
        }));
        
        setEditForm(prev => ({
          ...prev,
          investigation_property_damage: investigationPropertyDamage
        }));
      } catch (error) {
        console.error('발생보고서 물적피해 정보 불러오기 실패:', error);
        alert('발생보고서 물적피해 정보를 불러오는데 실패했습니다.');
      }
    } else if (field === 'summary') {
      setEditForm(prev => ({
        ...prev,
        investigation_acci_summary: prev.original_acci_summary || ''
      }));
    } else if (field === 'detail') {
      setEditForm(prev => ({
        ...prev,
        investigation_acci_detail: prev.original_acci_detail || ''
      }));
    } else if (field === 'time') {
      setEditForm(prev => ({
        ...prev,
        investigation_acci_time: prev.original_acci_time || ''
      }));
    } else if (field === 'location') {
      setEditForm(prev => ({
        ...prev,
        investigation_acci_location: prev.original_acci_location || ''
      }));
    } else if (field === 'type1') {
      setEditForm(prev => ({
        ...prev,
        investigation_accident_type_level1: prev.original_accident_type_level1 || ''
      }));
    } else if (field === 'type2') {
      setEditForm(prev => ({
        ...prev,
        investigation_accident_type_level2: prev.original_accident_type_level2 || ''
      }));
    } else if (field === 'weather') {
      setEditForm(prev => ({
        ...prev,
        investigation_weather: prev.original_weather || '',
        investigation_temperature: prev.original_temperature || 0,
        investigation_humidity: prev.original_humidity || 0,
        investigation_wind_speed: prev.original_wind_speed || 0,
        investigation_weather_special: prev.original_weather_special || ''
      }));
    }
  }, [report?.accident_id, editForm.accident_id]);

  // 재해자 정보 변경
  const handleVictimChange = useCallback((index: number, field: keyof VictimInfo, value: string | number) => {
    setEditForm(prev => ({
      ...prev,
      investigation_victims: (prev.investigation_victims || []).map((victim, i) => 
        i === index ? { ...victim, [field]: value } : victim
      )
    }));
  }, []);

  // 재해자 추가
  const addVictim = useCallback(() => {
    const newVictim: VictimInfo = {
      name: '',
      age: 0,
      belong: '',
      duty: '',
      injury_type: '',
      ppe_worn: '',
      first_aid: '',
      absence_start_date: '',
      return_expected_date: '',
      job_experience_duration: 0,
      job_experience_unit: '년'
    };
    
    setEditForm(prev => ({
      ...prev,
      investigation_victims: [...(prev.investigation_victims || []), newVictim],
      investigation_victim_count: (prev.investigation_victim_count || 0) + 1
    }));
  }, []);

  // 재해자 삭제
  const removeVictim = useCallback((index: number) => {
    setEditForm(prev => ({
      ...prev,
      investigation_victims: (prev.investigation_victims || []).filter((_, i) => i !== index),
      investigation_victim_count: Math.max(0, (prev.investigation_victim_count || 0) - 1)
    }));
  }, []);

  // 재해자 수 변경
  const handleVictimCountChange = useCallback((newCount: number) => {
    const currentVictims = editForm.investigation_victims || [];
    const currentCount = currentVictims.length;
    
    if (newCount > currentCount) {
      // 재해자 추가
      const victimsToAdd = newCount - currentCount;
      const newVictims = Array(victimsToAdd).fill(null).map(() => ({
        name: '',
        age: 0,
        belong: '',
        duty: '',
        injury_type: '',
        ppe_worn: '',
        first_aid: '',
        absence_start_date: '',
        return_expected_date: '',
        job_experience_duration: 0,
        job_experience_unit: '년'
      }));
      
      setEditForm(prev => ({
        ...prev,
        investigation_victim_count: newCount,
        investigation_victims: [...currentVictims, ...newVictims]
      }));
    } else if (newCount < currentCount) {
      // 재해자 삭제
      setEditForm(prev => ({
        ...prev,
        investigation_victim_count: newCount,
        investigation_victims: currentVictims.slice(0, newCount)
      }));
    }
  }, [editForm.investigation_victims]);

  // 편집 모드 토글
  const toggleEditMode = useCallback(() => {
    if (editMode && report) {
      // 편집 모드 해제 시 원본 데이터로 복원
      setEditForm(report);
    } else if (!editMode && report) {
      // 편집 모드 진입 시 재해자 정보 초기화
      const initialVictims = report.investigation_victims || [];
      const initialCount = report.investigation_victim_count || 0;
      
      // 재해자 수와 배열 크기가 맞지 않는 경우 조정
      if (initialCount > 0 && initialVictims.length === 0) {
        // 재해자 수는 있지만 배열이 비어있는 경우 빈 재해자 정보 생성
        const emptyVictims = Array(initialCount).fill(null).map(() => ({
          name: '',
          age: 0,
          belong: '',
          duty: '',
          injury_type: '',
          ppe_worn: '',
          first_aid: '',
          absence_start_date: '',
          return_expected_date: '',
          job_experience_duration: 0,
          job_experience_unit: '년'
        }));
        setEditForm({
          ...report,
          investigation_victims: emptyVictims,
          // 물적피해 데이터가 없으면 빈 배열로 초기화
          property_damages: report.property_damages || []
        });
      } else {
        setEditForm({
          ...report,
          // 물적피해 데이터가 없으면 빈 배열로 초기화
          property_damages: report.property_damages || []
        });
      }
    }
    setEditMode(!editMode);
  }, [editMode, report]);

  // 저장 처리
  const handleSave = useCallback(async () => {
    try {
      await onSave(editForm);
      setEditMode(false);
    } catch (error) {
      // 에러는 상위 컴포넌트에서 처리
      console.error('저장 실패:', error);
    }
  }, [editForm, onSave]);

  // 훅 내부
  const updateOriginalVictims = useCallback((victims: VictimInfo[]) => {
    setEditForm(prev => ({
      ...prev,
      original_victims: victims.map(v => ({ ...v })) // 안전한 복사
    }));
  }, []);

  return {
    editMode,
    editForm,
    toggleEditMode,
    handleInputChange,
    handleDateChange,
    handleDateClick,
    handleSave,
    handleVictimChange,
    addVictim,
    removeVictim,
    handleVictimCountChange,
    addPropertyDamage,
    removePropertyDamage,
    handlePropertyDamageChange,
    loadOriginalData,
    updateOriginalVictims
  };
}; 