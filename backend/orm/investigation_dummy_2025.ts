// 조사보고서 더미데이터 생성 스크립트
// 기존 발생보고서 데이터를 기반으로 조사보고서를 생성
// 물적피해정보와 인적피해정보는 30% 확률로 변경 (상해정도, 물적피해금액)

/* 더미데이터 생성 실행 명령어

docker exec -it accident-backend npx tsx orm/investigation_dummy_2025.ts

*/

/* 조사보고서 더미데이터 삭제 순차 실행

docker exec -it accident-postgres psql -U postgres -d postgres -c "DELETE FROM corrective_action;"
docker exec -it accident-postgres psql -U postgres -d postgres -c "DELETE FROM investigation_property_damage;"
docker exec -it accident-postgres psql -U postgres -d postgres -c "DELETE FROM investigation_victims;"
docker exec -it accident-postgres psql -U postgres -d postgres -c "DELETE FROM investigation_report;"

*/

import { writeFileSync } from 'fs';
import { db, tables, connectDB } from './index';
import { investigationVictims } from './schema/investigation_victims';
import { investigationPropertyDamage } from './schema/investigation_property_damage';
import { correctiveAction } from './schema/investigation';

// 조사보고서 상태 목록 (붙여쓰기 통일)
const investigationStatusList = ['조사진행', '조사완료', '대책이행', '조치완료'];

// 상해 정도 목록 (발생보고서보다 더 구체적)
const detailedInjuryTypes = [
  '응급처치', '병원치료', '경상', '중상', '사망',
  '골절', '열상', '타박상', '화상', '찰과상',
  '뇌진탕', '인대손상', '근육파열', '신경손상'
];

// 개선조치 유형
const actionTypes = ['기술적', '교육적', '관리적'];

// 진행 상태
const progressStatusList = ['대기', '진행', '완료', '지연'];

// 조사팀장/구성원 목록
const investigatorNames = [
  '김안전', '이점검', '박조사', '최분석', '정대책',
  '강예방', '조관리', '윤교육', '장기술', '임행정'
];

// 날씨 정보
const weatherTypes = ['맑음', '흐림', '비', '눈', '안개', '바람'];

// 원인분석 템플릿
const causeAnalysisTemplates = {
  '떨어짐': {
    direct: [
      '안전벨트 미착용으로 인한 추락',
      '사다리 설치 불량으로 인한 추락', 
      '발판 불안정으로 인한 추락',
      '안전난간 부족으로 인한 추락'
    ],
    root: [
      '고소작업 안전교육 부족',
      '안전장비 점검 체계 미흡',
      '작업절차서 준수 의식 부족',
      '안전관리자 현장 점검 소홀'
    ]
  },
  '넘어짐': {
    direct: [
      '바닥 미끄러움으로 인한 넘어짐',
      '장애물 방치로 인한 넘어짐',
      '조명 부족으로 인한 넘어짐',
      '안전신발 미착용으로 인한 넘어짐'
    ],
    root: [
      '작업장 정리정돈 관리 소홀',
      '안전점검 체계 미흡',
      '작업환경 개선 투자 부족',
      '근로자 안전의식 부족'
    ]
  },
  '부딪힘': {
    direct: [
      '시야 확보 불량으로 인한 충돌',
      '안전거리 미확보로 인한 충돌',
      '경고표시 부족으로 인한 충돌',
      '보호구 미착용으로 인한 충돌'
    ],
    root: [
      '안전표시 관리 체계 미흡',
      '작업공간 설계 부적절',
      '안전교육 실효성 부족',
      '위험성 평가 미흡'
    ]
  },
  '맞음': {
    direct: [
      '보호구 미착용으로 인한 충격',
      '안전장치 미작동으로 인한 충격',
      '작업절차 미준수로 인한 충격',
      '위험구역 접근으로 인한 충격'
    ],
    root: [
      '보호구 지급 및 관리 체계 미흡',
      '안전장치 점검 체계 부족',
      '작업절차 교육 부족',
      '위험구역 관리 소홀'
    ]
  },
  '무너짐': {
    direct: [
      '적재방법 부적절로 인한 붕괴',
      '지지구조 불량으로 인한 붕괴',
      '하중 초과로 인한 붕괴',
      '점검 소홀로 인한 붕괴'
    ],
    root: [
      '적재 작업절차 미흡',
      '구조물 안전점검 체계 부족',
      '하중 계산 및 관리 소홀',
      '정기점검 체계 미흡'
    ]
  },
  '끼임': {
    direct: [
      '안전장치 미작동으로 인한 끼임',
      '작업절차 미준수로 인한 끼임',
      '기계 정지 확인 소홀로 인한 끼임',
      '보호구 미착용으로 인한 끼임'
    ],
    root: [
      '기계 안전장치 점검 체계 미흡',
      '작업절차 교육 및 준수 관리 부족',
      '기계 조작 안전규정 미흡',
      '위험성 평가 및 개선 부족'
    ]
  },
  '감전': {
    direct: [
      '절연불량으로 인한 감전',
      '접지 불량으로 인한 감전',
      '습기 노출로 인한 감전',
      '무자격자 작업으로 인한 감전'
    ],
    root: [
      '전기설비 점검 체계 미흡',
      '전기안전 교육 부족',
      '작업환경 관리 소홀',
      '자격 관리 체계 미흡'
    ]
  },
  '화재폭발': {
    direct: [
      '점화원 관리 소홀로 인한 화재',
      '가연물 방치로 인한 화재',
      '안전장치 미작동으로 인한 폭발',
      '정전기 제거 소홀로 인한 폭발'
    ],
    root: [
      '화재예방 관리체계 미흡',
      '소방안전 교육 부족',
      '위험물 관리 체계 부족',
      '정기점검 및 정비 소홀'
    ]
  }
};

// 개선조치 템플릿
const correctiveActionTemplates = {
  '기술적': [
    '안전장치 설치 및 개선',
    '보호구 지급 및 교체',
    '안전시설 보강',
    '작업환경 개선',
    '기계설비 정비',
    '조명시설 개선',
    '환기시설 설치',
    '경고표시 설치'
  ],
  '교육적': [
    '안전교육 실시',
    '작업절차 교육',
    '위험성 인식 교육',
    '응급처치 교육',
    '보호구 착용 교육',
    '안전의식 제고 교육',
    '사고사례 교육',
    '법정 안전교육'
  ],
  '관리적': [
    '작업절차서 개정',
    '안전점검 체계 구축',
    '위험성 평가 실시',
    '안전규정 개정',
    '관리감독 강화',
    '정기점검 체계 구축',
    '안전관리 조직 개편',
    '안전성과 평가 체계 구축'
  ]
};

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function pad(n: number, width: number) {
  return n.toString().padStart(width, '0');
}

// 조사보고서용 개선된 재해자 정보 생성 (30% 확률로 상해정도 변경)
function createInvestigationVictim(originalVictim: any, shouldModify: boolean) {
  const victim = { ...originalVictim };
  
  if (shouldModify) {
    // 30% 확률로 상해정도를 더 구체적으로 변경
    victim.injury_type = randomPick(detailedInjuryTypes);
    
    // 추가 정보 생성
    victim.birth_date = `${1970 + Math.floor(Math.random() * 40)}-${pad(Math.floor(Math.random() * 12) + 1, 2)}-${pad(Math.floor(Math.random() * 28) + 1, 2)}`;
    victim.absence_start_date = `2025-${pad(Math.floor(Math.random() * 12) + 1, 2)}-${pad(Math.floor(Math.random() * 28) + 1, 2)}`;
    victim.return_expected_date = `2025-${pad(Math.floor(Math.random() * 12) + 1, 2)}-${pad(Math.floor(Math.random() * 28) + 1, 2)}`;
    victim.job_experience_duration = Math.floor(Math.random() * 20) + 1;
    victim.job_experience_unit = randomPick(['개월', '년']);
    victim.injury_location = randomPick(['머리', '목', '어깨', '팔', '손', '허리', '다리', '발', '전신']);
    victim.medical_opinion = randomPick([
      '2주 안정 치료 필요', 
      '1개월 통원 치료 필요',
      '3개월 재활 치료 필요',
      '수술 후 6개월 회복 필요',
      '영구 장애 우려'
    ]);
    victim.training_completed = randomPick(['완료', '미완료', '부분완료']);
    victim.etc_notes = Math.random() > 0.7 ? '추가 관찰 필요' : null;
  } else {
    // 기본 정보만 추가
    victim.birth_date = `${1970 + Math.floor(Math.random() * 40)}-${pad(Math.floor(Math.random() * 12) + 1, 2)}-${pad(Math.floor(Math.random() * 28) + 1, 2)}`;
    victim.job_experience_duration = Math.floor(Math.random() * 20) + 1;
    victim.job_experience_unit = randomPick(['개월', '년']);
    victim.injury_location = randomPick(['머리', '목', '어깨', '팔', '손', '허리', '다리', '발']);
    victim.training_completed = randomPick(['완료', '미완료']);
  }
  
  return victim;
}

// 조사보고서용 개선된 물적피해 정보 생성 (30% 확률로 피해금액 변경)
function createInvestigationPropertyDamage(originalDamage: any, shouldModify: boolean) {
  const damage = { ...originalDamage };
  
  if (shouldModify) {
    // 30% 확률로 피해금액을 조사 결과에 따라 변경 (±50% 범위)
    const variation = 0.5 + Math.random(); // 0.5 ~ 1.5 배율
    damage.estimated_cost = Math.floor(originalDamage.estimated_cost * variation);
  }
  
  // 조사보고서 전용 필드 추가
  const accidentDate = new Date('2025-01-01');
  damage.shutdown_start_date = randomDate(accidentDate, new Date(accidentDate.getTime() + 7 * 24 * 60 * 60 * 1000)); // 사고 후 1주일 내
  damage.recovery_expected_date = randomDate(damage.shutdown_start_date, new Date(damage.shutdown_start_date.getTime() + 30 * 24 * 60 * 60 * 1000)); // 중단 후 30일 내
  
  return damage;
}

// 원인분석 생성 (복수 가능)
function generateCauseAnalysis(accidentType: string, investigationStatus: string) {
  const templates = causeAnalysisTemplates[accidentType as keyof typeof causeAnalysisTemplates];
  
  // 조사진행 상태에서는 50% 확률로 원인분석이 없음
  if (investigationStatus === '조사진행' && Math.random() > 0.5) {
    return null;
  }
  
  if (!templates) {
    return {
      direct_causes: [`${accidentType} 관련 직접 원인`],
      root_causes: [`${accidentType} 관련 근본 원인`]
    };
  }
  
  // 직접원인 1-3개 생성
  const directCount = Math.floor(Math.random() * 3) + 1;
  const directCauses = [];
  for (let i = 0; i < directCount; i++) {
    directCauses.push(randomPick(templates.direct));
  }
  
  // 근본원인 1-2개 생성
  const rootCount = Math.floor(Math.random() * 2) + 1;
  const rootCauses = [];
  for (let i = 0; i < rootCount; i++) {
    rootCauses.push(randomPick(templates.root));
  }
  
  return {
    direct_causes: directCauses,
    root_causes: rootCauses
  };
}

// 개선조치 생성 (상태별 조건 적용)
function generateCorrectiveActions(accidentType: string, accidentId: string, investigationStatus: string) {
  // 조사진행 상태에서는 재발방지대책이 없음
  if (investigationStatus === '조사진행') {
    return [];
  }
  
  // 조사완료 상태에서는 50% 확률로 재발방지대책이 없음
  if (investigationStatus === '조사완료' && Math.random() > 0.5) {
    return [];
  }
  
  const actionCount = Math.floor(Math.random() * 4) + 2; // 2-5개 조치사항
  const actions = [];
  
  // 기준 날짜 (사고 발생 후 조사 완료 시점)
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - Math.floor(Math.random() * 30)); // 0-30일 전에 조사 완료
  
  for (let i = 0; i < actionCount; i++) {
    const actionType = randomPick(actionTypes);
    const templates = correctiveActionTemplates[actionType as keyof typeof correctiveActionTemplates];
    const title = randomPick(templates);
    
    // 예정일 설정 (조사 완료 후 30-90일)
    const scheduledDate = new Date(baseDate);
    scheduledDate.setDate(scheduledDate.getDate() + Math.floor(Math.random() * 60) + 30);
    
    let progressStatus: string;
    let completionDate: Date | null = null;
    
    // 상태별 진행 상황 결정
    if (investigationStatus === '조치완료') {
      // 조치완료: 모든 대책이 완료 상태
      progressStatus = '완료';
      completionDate = new Date(scheduledDate);
      completionDate.setDate(completionDate.getDate() - Math.floor(Math.random() * 10)); // 예정일보다 조금 일찍 완료
    } else if (investigationStatus === '대책이행') {
      // 대책이행: 다양한 상태 (대기, 진행, 완료, 지연)
      const today = new Date();
      
      if (scheduledDate < today) {
        // 예정일이 지난 경우
        if (Math.random() > 0.3) {
          // 70% 확률로 지연
          progressStatus = '지연';
        } else {
          // 30% 확률로 늦게 완료
          progressStatus = '완료';
          completionDate = new Date(today);
          completionDate.setDate(completionDate.getDate() - Math.floor(Math.random() * 5));
        }
      } else {
        // 예정일이 아직 안 지난 경우
        const statusOptions = ['대기', '진행', '완료'];
        const weights = [0.4, 0.4, 0.2]; // 대기 40%, 진행 40%, 완료 20%
        const rand = Math.random();
        
        if (rand < weights[0]) {
          progressStatus = '대기';
        } else if (rand < weights[0] + weights[1]) {
          progressStatus = '진행';
        } else {
          progressStatus = '완료';
          completionDate = new Date(today);
          completionDate.setDate(completionDate.getDate() - Math.floor(Math.random() * 10));
        }
      }
    } else {
      // 조사완료: 대부분 대기 상태
      progressStatus = Math.random() > 0.8 ? '진행' : '대기';
    }
    
    actions.push({
      investigation_id: accidentId,
      action_type: actionType,
      title: title,
      improvement_plan: `${title}를 통해 동일한 사고의 재발을 방지하고 작업장 안전을 확보합니다.`,
      progress_status: progressStatus,
      scheduled_date: scheduledDate.toISOString().split('T')[0],
      responsible_person: randomPick(investigatorNames),
      completion_date: completionDate ? completionDate.toISOString().split('T')[0] : null
    });
  }
  
  return actions;
}

// 조사보고서 더미데이터 생성
async function generateInvestigationReports() {
  try {
    // DB 연결 초기화
    connectDB();
    
    console.log('기존 발생보고서 데이터를 기반으로 조사보고서 더미데이터를 생성합니다...');
    
    // 기존 발생보고서 데이터 조회
    const occurrenceReports = await db()
      .select()
      .from(tables.occurrenceReport)
      .limit(50); // 최대 50건 처리
    
    if (!occurrenceReports.length) {
      throw new Error('발생보고서 데이터가 없습니다. 먼저 occurrence_dummy_2025.ts를 실행하세요.');
    }
    
    console.log(`${occurrenceReports.length}건의 발생보고서를 기반으로 조사보고서를 생성합니다.`);
    
    for (const occurrence of occurrenceReports) {
      // 조사 시작/종료 시간 생성
      const accidentTime = new Date(occurrence.acci_time!);
      const investigationStartTime = new Date(accidentTime.getTime() + Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000); // 사고 후 1-7일
      const investigationEndTime = new Date(investigationStartTime.getTime() + Math.floor(Math.random() * 14 + 7) * 24 * 60 * 60 * 1000); // 조사 시작 후 7-21일
      
      // 조사팀 구성
      const teamLead = randomPick(investigatorNames);
      const teamMembers = Array.from({length: Math.floor(Math.random() * 3) + 2}, () => randomPick(investigatorNames))
        .filter(member => member !== teamLead)
        .join(', ');
      
      // 30% 확률로 일부 정보 변경 여부 결정
      const shouldModifyInfo = Math.random() < 0.3;
      
      // 날씨 정보 생성 (조사 시점의 날씨)
      const investigationWeather = randomPick(weatherTypes);
      const investigationTemperature = Math.floor(Math.random() * 30) - 5; // -5도 ~ 25도
      const investigationHumidity = Math.floor(Math.random() * 40) + 40; // 40% ~ 80%
      const investigationWindSpeed = Math.floor(Math.random() * 15); // 0 ~ 15m/s
      
      // 조사보고서 상태 결정
      const investigationStatus = randomPick(investigationStatusList);
      
      // 원인분석 생성 (상태별 조건 적용)
      const causeAnalysis = generateCauseAnalysis(occurrence.accident_type_level2!, investigationStatus);
      
      // 조사보고서 메인 데이터 생성
      const investigationData = {
        accident_id: occurrence.accident_id!,
        investigation_start_time: investigationStartTime.toISOString(),
        investigation_end_time: investigationEndTime.toISOString(),
        investigation_team_lead: teamLead,
        investigation_team_members: teamMembers,
        investigation_location: occurrence.acci_location,
        
        // 원본 정보 (발생보고서에서 복사)
        original_global_accident_no: occurrence.global_accident_no,
        original_accident_id: occurrence.accident_id,
        original_acci_time: occurrence.acci_time?.toISOString(),
        original_weather: randomPick(weatherTypes),
        original_temperature: Math.floor(Math.random() * 30) - 5,
        original_humidity: Math.floor(Math.random() * 40) + 40,
        original_wind_speed: Math.floor(Math.random() * 15),
        original_weather_special: null,
        original_acci_location: occurrence.acci_location,
        original_accident_type_level1: occurrence.accident_type_level1,
        original_accident_type_level2: occurrence.accident_type_level2,
        original_accident_name: occurrence.accident_name,
        original_acci_summary: occurrence.acci_summary,
        original_acci_detail: occurrence.acci_detail,
        original_victim_count: occurrence.victim_count,
        
        // 조사 결과 정보 (일부는 원본과 동일, 일부는 조사를 통해 수정)
        investigation_global_accident_no: occurrence.global_accident_no,
        investigation_accident_id: occurrence.accident_id,
        investigation_acci_time: shouldModifyInfo 
          ? new Date(accidentTime.getTime() + (Math.random() - 0.5) * 2 * 60 * 60 * 1000).toISOString() // ±2시간 변경
          : occurrence.acci_time?.toISOString(),
        investigation_weather: investigationWeather,
        investigation_temperature: investigationTemperature,
        investigation_humidity: investigationHumidity,
        investigation_wind_speed: investigationWindSpeed,
        investigation_weather_special: Math.random() > 0.8 ? '강풍 주의보' : null,
        investigation_acci_location: shouldModifyInfo && Math.random() > 0.7
          ? occurrence.acci_location + ' 인근'
          : occurrence.acci_location,
        investigation_accident_type_level1: occurrence.accident_type_level1,
        investigation_accident_type_level2: occurrence.accident_type_level2,
        investigation_accident_name: occurrence.accident_name,
        investigation_acci_summary: shouldModifyInfo
          ? occurrence.acci_summary + ' (조사를 통해 추가 확인된 내용 포함)'
          : occurrence.acci_summary,
        investigation_acci_detail: occurrence.acci_detail + '\n\n【조사를 통해 확인된 추가 사항】\n현장 조사 결과 위 내용이 사실로 확인되었으며, 재발 방지를 위한 개선조치가 필요합니다.',
        investigation_victim_count: occurrence.victim_count,
        investigation_victims_json: '[]', // 별도 테이블로 관리
        
        // 피해 정보
        damage_cost: Math.floor(Math.random() * 10000) + 1000, // 1,000 ~ 11,000 천원
        
        // 원인 분석 (null 체크)
        direct_cause: causeAnalysis ? causeAnalysis.direct_causes[0] : null,
        root_cause: causeAnalysis ? causeAnalysis.root_causes[0] : null,
        
        // 대책 정보
        corrective_actions: '별도 개선조치 테이블 참조',
        action_schedule: `${investigationEndTime.toISOString().split('T')[0]}부터 90일간`,
        action_verifier: randomPick(investigatorNames),
        
        // 조사 결론
        investigation_conclusion: causeAnalysis 
          ? `${occurrence.accident_type_level2} 사고에 대한 조사 결과, ${causeAnalysis.direct_causes.join(', ')}이 직접 원인이며, ${causeAnalysis.root_causes.join(', ')}이 근본 원인으로 분석됩니다. 재발 방지를 위한 체계적인 개선조치가 필요합니다.`
          : `${occurrence.accident_type_level2} 사고에 대한 조사가 진행 중입니다.`,
        investigation_status: investigationStatus,
        investigation_summary: `조사기간: ${investigationStartTime.toISOString().split('T')[0]} ~ ${investigationEndTime.toISOString().split('T')[0]}\n조사팀장: ${teamLead}\n조사결과: ${causeAnalysis ? causeAnalysis.direct_causes.join(', ') : '조사 진행 중'}`,
        investigator_signature: teamLead,
        report_written_date: investigationEndTime.toISOString(),
        
        // 구조적 원인분석 및 재발방지대책 (JSON 필드) - 프론트엔드 기대 구조
        cause_analysis: causeAnalysis ? JSON.stringify({
          direct_cause: {
            unsafe_condition: causeAnalysis.direct_causes,
            unsafe_act: [`${occurrence.accident_type_level2} 관련 불안전한 행동`]
          },
          root_cause: {
            human_factor: causeAnalysis.root_causes,
            system_factor: [`${occurrence.accident_type_level2} 관련 시스템적 요인`]
          }
        }) : null,
        prevention_actions: JSON.stringify({
          technical_actions: [],
          educational_actions: [],
          managerial_actions: []
        }),
        
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      // 조사보고서 메인 데이터 삽입
      await db().insert(tables.investigationReport).values(investigationData);
      
      // 기존 발생보고서의 재해자 정보 조회 및 조사보고서용 재해자 정보 생성
      if (occurrence.victim_count && occurrence.victim_count > 0) {
        const originalVictims = await db()
          .select()
          .from(tables.victims)
          .where(eq(tables.victims.accident_id, occurrence.accident_id!));
        
        for (const originalVictim of originalVictims) {
          const investigationVictim = createInvestigationVictim(originalVictim, shouldModifyInfo);
          
          await db().insert(investigationVictims).values({
            accident_id: occurrence.accident_id!,
            name: investigationVictim.name,
            age: investigationVictim.age,
            belong: investigationVictim.belong,
            duty: investigationVictim.duty,
            injury_type: investigationVictim.injury_type,
            ppe_worn: investigationVictim.ppe_worn,
            first_aid: investigationVictim.first_aid,
            birth_date: investigationVictim.birth_date,
            absence_start_date: investigationVictim.absence_start_date,
            return_expected_date: investigationVictim.return_expected_date,
            job_experience_duration: investigationVictim.job_experience_duration,
            job_experience_unit: investigationVictim.job_experience_unit,
            injury_location: investigationVictim.injury_location,
            medical_opinion: investigationVictim.medical_opinion,
            training_completed: investigationVictim.training_completed,
            etc_notes: investigationVictim.etc_notes,
            created_at: new Date(),
            updated_at: new Date(),
          });
        }
      }
      
      // 기존 발생보고서의 물적피해 정보 조회 및 조사보고서용 물적피해 정보 생성
      const originalPropertyDamages = await db()
        .select()
        .from(tables.propertyDamage)
        .where(eq(tables.propertyDamage.accident_id, occurrence.accident_id!));
      
      for (const originalDamage of originalPropertyDamages) {
        const investigationDamage = createInvestigationPropertyDamage(originalDamage, shouldModifyInfo);
        
        await db().insert(investigationPropertyDamage).values({
          accident_id: occurrence.accident_id!,
          damage_target: investigationDamage.damage_target,
          estimated_cost: investigationDamage.estimated_cost,
          damage_content: investigationDamage.damage_content,
          shutdown_start_date: investigationDamage.shutdown_start_date,
          recovery_expected_date: investigationDamage.recovery_expected_date,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
      
      // 개선조치 데이터 생성 및 삽입
      const correctiveActions = generateCorrectiveActions(occurrence.accident_type_level2!, occurrence.accident_id!, investigationStatus);
      
      for (const action of correctiveActions) {
        await db().insert(correctiveAction).values(action);
      }
      
      // prevention_actions JSON 필드를 corrective_actions 데이터로 업데이트
      const preventionActionsJson = {
        technical_actions: correctiveActions
          .filter(action => action.action_type === '기술적')
          .map(action => ({
            id: `action_${Date.now()}_${Math.random()}`,
            title: action.title,
            action_type: 'technical',
            improvement_plan: action.improvement_plan,
            progress_status: action.progress_status === '완료' ? 'completed' : 
                           action.progress_status === '진행' ? 'in_progress' : 'pending',
            scheduled_date: action.scheduled_date,
            responsible_person: action.responsible_person,
            completion_date: action.completion_date
          })),
        educational_actions: correctiveActions
          .filter(action => action.action_type === '교육적')
          .map(action => ({
            id: `action_${Date.now()}_${Math.random()}`,
            title: action.title,
            action_type: 'educational',
            improvement_plan: action.improvement_plan,
            progress_status: action.progress_status === '완료' ? 'completed' : 
                           action.progress_status === '진행' ? 'in_progress' : 'pending',
            scheduled_date: action.scheduled_date,
            responsible_person: action.responsible_person,
            completion_date: action.completion_date
          })),
        managerial_actions: correctiveActions
          .filter(action => action.action_type === '관리적')
          .map(action => ({
            id: `action_${Date.now()}_${Math.random()}`,
            title: action.title,
            action_type: 'managerial',
            improvement_plan: action.improvement_plan,
            progress_status: action.progress_status === '완료' ? 'completed' : 
                           action.progress_status === '진행' ? 'in_progress' : 'pending',
            scheduled_date: action.scheduled_date,
            responsible_person: action.responsible_person,
            completion_date: action.completion_date
          }))
      };
      
      // investigation_report의 prevention_actions 필드 업데이트
      await db()
        .update(tables.investigationReport)
        .set({ 
          prevention_actions: JSON.stringify(preventionActionsJson)
        })
        .where(eq(tables.investigationReport.accident_id, occurrence.accident_id!));
      
      console.log(`✅ ${occurrence.accident_id} - 조사보고서 및 관련 데이터 생성 완료 (정보 변경: ${shouldModifyInfo ? 'Yes' : 'No'})`);
    }
    
    console.log('🎉 조사보고서 더미데이터 생성이 완료되었습니다!');
    
  } catch (error) {
    console.error('❌ 조사보고서 더미데이터 생성 중 오류 발생:', error);
    throw error;
  }
}

// 필요한 import 추가
import { eq } from 'drizzle-orm';

// 스크립트 실행
generateInvestigationReports().catch(console.error); 