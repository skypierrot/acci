// 2025년 사고 발생보고서 20건 랜덤 생성 스크립트
// 회사/사업장: HHH/가상사업장(A), HHH/나상사업장(B)
// 인적/물적/복합에 따라 재해자/물적피해 정보도 랜덤 생성

import { writeFileSync } from 'fs';
import { db, tables, connectDB } from './index';
import { victims } from './schema/victims';
import { propertyDamage } from './schema/property_damage';

const companies = [
  { company_code: 'HHH', company_name: '사고나라', site_code: 'A', site_name: '가상사업장' },
  { company_code: 'HHH', company_name: '사고나라', site_code: 'B', site_name: '나상사업장' },
];

const accidentTypeLevel1List = ['인적', '물적', '복합'];
const accidentTypeLevel2List = [
  '떨어짐', '넘어짐', '부딪힘', '맞음', '무너짐', '끼임', '감전', '화재폭발', '터짐',
  '깨짐·부서짐', '타거나데임', '무리한동작', '이상온도물체접촉', '화학물질누출접촉',
  '산소결핍', '빠짐익사', '사업장내교통사고', '동물상해'
];
const workRelatedTypeList = ['업무중', '통근중', '기타'];
const reportChannelList = ['전화', '이메일', '직접 보고', '메신저', '앱', '기타'];
const positions = ['사원', '주임', '대리', '과장', '차장', '부장', '팀장'];
const belongs = ['생산팀', '안전팀', '관리팀', '기술팀', '품질팀'];
const injuryTypeList = ['응급처치', '병원치료', '경상', '중상', '사망', '기타'];
const propertyDamageTypeList = ['기계파손', '설비고장', '화재', '누수', '기타'];

// 사고 장소별 상세 정보
const locationDetails = {
  '1공장 입구': ['입구 계단', '출입문 앞', '안전모 대여소', '출입구 바닥'],
  '2공장 내부': ['생산라인 A', '조립작업장', '품질검사대', '창고 입구'],
  '창고 앞': ['창고 출입구', '적재장', '하역장', '창고 바닥'],
  '주차장': ['직원 주차장', '화물차 주차구역', '보행자 통로', '주차장 입구'],
  '옥상': ['옥상 출입구', '냉각탑 주변', '옥상 바닥', '옥상 난간'],
  '계단': ['1층 계단', '2층 계단', '지하 계단', '비상계단'],
  '기계실': ['발전기실', '냉각기실', '압축기실', '보일러실'],
  '작업장': ['조립작업장', '도장작업장', '용접작업장', '검사작업장']
};

// 사고 유형별 상세 설명 템플릿
const accidentDetailTemplates = {
  '떨어짐': {
    summary: ['높은 곳에서 떨어짐', '사다리에서 미끄러져 떨어짐', '발판에서 균형을 잃고 떨어짐'],
    detail: {
      before_work: [
        '고소작업을 위해 사다리를 설치하고 안전장비를 점검하는 과정에서 작업을 시작했습니다.',
        '옥상 냉각탑 점검 작업을 위해 발판을 설치하고 안전벨트를 착용한 후 작업을 시작했습니다.',
        '고소작업을 위해 작업대를 설치하고 안전장비를 점검한 후 작업을 시작했습니다.'
      ],
      worker_action: [
        '사다리 위에서 작업 중 안전벨트가 느슨해진 것을 발견했으나 작업을 계속 진행했습니다.',
        '발판 위에서 작업 중 균형을 잃어 안전장비를 잡으려 했으나 미끄러워서 떨어졌습니다.',
        '작업대 위에서 작업 중 안전장비가 부적절하게 착용된 상태로 작업을 계속했습니다.'
      ],
      cause_condition: [
        '사다리 설치가 불안정하고 안전벨트가 제대로 착용되지 않은 상태에서 작업이 진행되었습니다.',
        '발판 설치가 미흡하고 안전장비 점검이 부족한 상태에서 작업이 진행되었습니다.',
        '작업대 설치가 불안정하고 안전장비 착용이 부적절한 상태에서 작업이 진행되었습니다.'
      ],
      what_happened: [
        '사다리에서 작업 중 안전벨트가 풀리면서 약 3m 높이에서 떨어져 다리에 부상을 입었습니다.',
        '발판에서 작업 중 균형을 잃어 약 2.5m 높이에서 떨어져 팔과 어깨에 부상을 입었습니다.',
        '작업대에서 작업 중 안전장비가 제대로 작동하지 않아 약 4m 높이에서 떨어져 전신에 부상을 입었습니다.'
      ],
      initial_response: [
        '현장 작업자가 즉시 119에 신고하고 응급처치를 실시한 후 병원으로 이송했습니다.',
        '근처 작업자가 즉시 안전관리자에게 보고하고 응급처치를 실시한 후 병원으로 이송했습니다.',
        '작업반장이 즉시 사고를 확인하고 응급처치를 실시한 후 병원으로 이송했습니다.'
      ]
    }
  },
  '넘어짐': {
    summary: ['바닥에 넘어짐', '장애물에 걸려 넘어짐', '미끄러운 바닥에서 넘어짐'],
    detail: {
      before_work: [
        '작업장 바닥 청소 작업을 위해 청소 도구를 준비하고 작업을 시작했습니다.',
        '작업장 내 장애물 제거 작업을 위해 작업 도구를 준비하고 작업을 시작했습니다.',
        '비가 온 후 작업장 바닥 상태를 점검하고 작업을 시작했습니다.'
      ],
      worker_action: [
        '바닥 청소 중 미끄러운 바닥을 발견했으나 작업을 계속 진행했습니다.',
        '장애물 제거 작업 중 장애물에 걸려 넘어지려고 했으나 균형을 잃었습니다.',
        '미끄러운 바닥을 걸어가다가 안전 신발이 미끄러워서 넘어졌습니다.'
      ],
      cause_condition: [
        '작업장 바닥에 기름이나 물이 묻어있어 미끄러운 상태였습니다.',
        '작업장 내 장애물이 제대로 정리되지 않은 상태였습니다.',
        '비가 온 후 바닥이 미끄러운 상태였고 적절한 미끄럼 방지 조치가 없었습니다.'
      ],
      what_happened: [
        '미끄러운 바닥에서 작업 중 넘어져서 허리와 엉덩이에 부상을 입었습니다.',
        '장애물에 걸려 넘어져서 팔과 다리에 부상을 입었습니다.',
        '미끄러운 바닥에서 넘어져서 머리와 어깨에 부상을 입었습니다.'
      ],
      initial_response: [
        '근처 작업자가 즉시 응급처치를 실시하고 안전관리자에게 보고했습니다.',
        '작업반장이 즉시 사고를 확인하고 응급처치를 실시했습니다.',
        '현장 작업자가 즉시 119에 신고하고 응급처치를 실시했습니다.'
      ]
    }
  },
  '부딪힘': {
    summary: ['기계에 부딪힘', '벽에 부딪힘', '차량에 부딪힘'],
    detail: {
      before_work: [
        '기계 주변 작업을 위해 안전장비를 착용하고 작업을 시작했습니다.',
        '작업장 내 이동 중 안전 표시를 확인하고 이동을 시작했습니다.',
        '사업장 내 차량 통행로를 건너기 위해 안전을 확인하고 이동을 시작했습니다.'
      ],
      worker_action: [
        '기계 주변에서 작업 중 기계의 돌출부를 발견하지 못하고 부딪혔습니다.',
        '작업장 내 이동 중 벽이나 기둥을 발견하지 못하고 부딪혔습니다.',
        '차량 통행로를 건너는 중 차량을 발견하지 못하고 부딪혔습니다.'
      ],
      cause_condition: [
        '기계 주변 조명이 부족하고 안전거리가 확보되지 않은 상태였습니다.',
        '작업장 내 조명이 부족하고 안전 표시가 미흡한 상태였습니다.',
        '차량 통행로와 보행자 통로가 분리되지 않은 상태였습니다.'
      ],
      what_happened: [
        '기계의 돌출부에 부딪혀서 머리와 어깨에 부상을 입었습니다.',
        '벽이나 기둥에 부딪혀서 팔과 다리에 부상을 입었습니다.',
        '차량과 부딪혀서 전신에 중상을 입었습니다.'
      ],
      initial_response: [
        '기계 조작자가 즉시 기계를 정지하고 응급처치를 실시했습니다.',
        '근처 작업자가 즉시 안전관리자에게 보고하고 응급처치를 실시했습니다.',
        '차량 운전자가 즉시 119에 신고하고 응급처치를 실시했습니다.'
      ]
    }
  },
  '맞음': {
    summary: ['떨어지는 물체에 맞음', '기계 부품에 맞음', '공구에 맞음'],
    detail: {
      before_work: [
        '높은 곳에서 물건을 내리는 작업을 위해 안전모를 착용하고 작업을 시작했습니다.',
        '기계 작동 중 점검 작업을 위해 안전장비를 착용하고 작업을 시작했습니다.',
        '공구 사용 작업을 위해 보안경을 착용하고 작업을 시작했습니다.'
      ],
      worker_action: [
        '높은 곳에서 물건을 내리는 중 안전모가 제대로 착용되지 않은 상태였습니다.',
        '기계 작동 중 점검 작업을 위해 기계에 가까이 접근했습니다.',
        '공구 사용 중 튀어나온 파편을 피하지 못했습니다.'
      ],
      cause_condition: [
        '높은 곳에서 물건이 떨어질 위험이 있는 상태였고 안전모 착용이 미흡했습니다.',
        '기계가 작동 중인 상태에서 점검 작업이 진행되었습니다.',
        '공구 사용 시 보호장비가 부족한 상태였습니다.'
      ],
      what_happened: [
        '높은 곳에서 떨어지는 물체에 맞아서 머리와 어깨에 부상을 입었습니다.',
        '기계 작동 중 튀어나온 부품에 맞아서 팔과 다리에 부상을 입었습니다.',
        '공구 사용 중 튀어나온 파편에 맞아서 얼굴과 눈에 부상을 입었습니다.'
      ],
      initial_response: [
        '근처 작업자가 즉시 응급처치를 실시하고 안전관리자에게 보고했습니다.',
        '기계 조작자가 즉시 기계를 정지하고 응급처치를 실시했습니다.',
        '작업반장이 즉시 사고를 확인하고 응급처치를 실시했습니다.'
      ]
    }
  },
  '무너짐': {
    summary: ['적재물이 무너짐', '건축물 일부가 무너짐', '지지대가 무너짐'],
    detail: {
      before_work: [
        '창고 내 적재물 정리 작업을 위해 작업 도구를 준비하고 작업을 시작했습니다.',
        '건축물 점검 작업을 위해 안전장비를 착용하고 작업을 시작했습니다.',
        '지지대 설치 작업을 위해 작업 도구를 준비하고 작업을 시작했습니다.'
      ],
      worker_action: [
        '적재물 정리 작업 중 적재물이 무너질 위험을 발견했으나 작업을 계속했습니다.',
        '건축물 점검 중 건축물 일부가 무너질 위험을 발견했으나 작업을 계속했습니다.',
        '지지대 설치 작업 중 지지대가 무너질 위험을 발견했으나 작업을 계속했습니다.'
      ],
      cause_condition: [
        '적재물이 불안정하게 쌓여있는 상태였고 적재 방법이 부적절했습니다.',
        '건축물의 일부가 노후화되어 불안정한 상태였습니다.',
        '지지대 설치가 불안정하고 안전점검이 미흡한 상태였습니다.'
      ],
      what_happened: [
        '적재물이 무너져서 다리와 팔에 부상을 입었습니다.',
        '건축물 일부가 무너져서 전신에 중상을 입었습니다.',
        '지지대가 무너져서 머리와 어깨에 부상을 입었습니다.'
      ],
      initial_response: [
        '근처 작업자가 즉시 응급처치를 실시하고 안전관리자에게 보고했습니다.',
        '현장 작업자가 즉시 119에 신고하고 응급처치를 실시했습니다.',
        '작업반장이 즉시 사고를 확인하고 응급처치를 실시했습니다.'
      ]
    }
  },
  '끼임': {
    summary: ['기계에 끼임', '문에 끼임', '설비에 끼임'],
    detail: {
      before_work: [
        '기계 작동 중 점검 작업을 위해 안전장비를 착용하고 작업을 시작했습니다.',
        '자동문 사용을 위해 안전을 확인하고 문을 통과하려고 했습니다.',
        '설비 점검 작업을 위해 안전장비를 착용하고 작업을 시작했습니다.'
      ],
      worker_action: [
        '기계 작동 중 손을 기계에 넣어 점검 작업을 진행했습니다.',
        '자동문이 완전히 열리기 전에 문을 통과하려고 했습니다.',
        '설비의 움직이는 부분에 손을 넣어 점검 작업을 진행했습니다.'
      ],
      cause_condition: [
        '기계 보호장치가 제대로 작동하지 않는 상태였습니다.',
        '자동문 안전장치가 제대로 작동하지 않는 상태였습니다.',
        '설비 안전장치가 제대로 작동하지 않는 상태였습니다.'
      ],
      what_happened: [
        '기계 작동 중 손이 끼여서 손가락과 손목에 부상을 입었습니다.',
        '자동문에 손이 끼여서 손가락에 부상을 입었습니다.',
        '설비의 움직이는 부분에 손이 끼여서 팔에 부상을 입었습니다.'
      ],
      initial_response: [
        '기계 조작자가 즉시 기계를 정지하고 응급처치를 실시했습니다.',
        '근처 작업자가 즉시 응급처치를 실시하고 안전관리자에게 보고했습니다.',
        '설비 조작자가 즉시 설비를 정지하고 응급처치를 실시했습니다.'
      ]
    }
  },
  '감전': {
    summary: ['전기설비 감전', '전선 접촉 감전', '누전 감전'],
    detail: {
      before_work: [
        '전기설비 점검 작업을 위해 전기작업 자격을 확인하고 작업을 시작했습니다.',
        '전선 상태 점검 작업을 위해 안전장비를 착용하고 작업을 시작했습니다.',
        '전기설비 점검 작업을 위해 안전장비를 착용하고 작업을 시작했습니다.'
      ],
      worker_action: [
        '전기설비 작업 중 안전장비가 부족한 상태에서 작업을 진행했습니다.',
        '전선 상태 점검 중 손상된 전선에 접촉했습니다.',
        '전기설비 점검 중 누전된 설비에 접촉했습니다.'
      ],
      cause_condition: [
        '전기작업 자격이 부족하고 안전장비가 미흡한 상태였습니다.',
        '전선이 손상되어 노출된 상태였습니다.',
        '전기설비에 누전이 발생한 상태였습니다.'
      ],
      what_happened: [
        '전기설비에 감전되어 팔과 다리에 부상을 입었습니다.',
        '손상된 전선에 접촉하여 감전되어 전신에 중상을 입었습니다.',
        '누전된 전기설비에 접촉하여 감전되어 팔에 부상을 입었습니다.'
      ],
      initial_response: [
        '근처 작업자가 즉시 전원을 차단하고 응급처치를 실시했습니다.',
        '전기작업자가 즉시 전원을 차단하고 응급처치를 실시했습니다.',
        '안전관리자가 즉시 전원을 차단하고 응급처치를 실시했습니다.'
      ]
    }
  },
  '화재폭발': {
    summary: ['화재 발생', '가스 폭발', '화학물질 폭발'],
    detail: {
      before_work: [
        '화재 예방 점검 작업을 위해 소화기를 확인하고 작업을 시작했습니다.',
        '가스설비 점검 작업을 위해 누출 감지기를 확인하고 작업을 시작했습니다.',
        '화학물질 취급 작업을 위해 보호장비를 착용하고 작업을 시작했습니다.'
      ],
      worker_action: [
        '화재 예방 점검 중 화재 위험 요소를 발견했으나 적절한 조치를 취하지 못했습니다.',
        '가스설비 점검 중 가스 누출을 발견했으나 적절한 조치를 취하지 못했습니다.',
        '화학물질 취급 중 화학물질 반응을 발견했으나 적절한 조치를 취하지 못했습니다.'
      ],
      cause_condition: [
        '화재 예방 교육이 부족하고 소화기 점검이 미흡한 상태였습니다.',
        '가스설비 점검이 미흡하고 누출 감지기가 작동하지 않는 상태였습니다.',
        '화학물질 안전관리가 부족하고 보호장비가 미흡한 상태였습니다.'
      ],
      what_happened: [
        '작업장 내 화재가 발생하여 인적·물적 피해가 발생했습니다.',
        '가스 누출로 인한 폭발사고가 발생하여 인적·물적 피해가 발생했습니다.',
        '화학물질 반응으로 인한 폭발사고가 발생하여 인적·물적 피해가 발생했습니다.'
      ],
      initial_response: [
        '현장 작업자가 즉시 119에 신고하고 소화기로 초기 진화를 시도했습니다.',
        '가스설비 조작자가 즉시 가스 공급을 차단하고 대피를 실시했습니다.',
        '화학물질 취급자가 즉시 보호장비를 착용하고 대피를 실시했습니다.'
      ]
    }
  },
  '터짐': {
    summary: ['압력용기 터짐', '호스 터짐', '배관 터짐'],
    detail: {
      before_work: [
        '압력용기 점검 작업을 위해 안전장비를 착용하고 작업을 시작했습니다.',
        '호스 상태 점검 작업을 위해 안전장비를 착용하고 작업을 시작했습니다.',
        '배관 점검 작업을 위해 안전장비를 착용하고 작업을 시작했습니다.'
      ],
      worker_action: [
        '압력용기 점검 중 압력이 과도한 상태를 발견했으나 적절한 조치를 취하지 못했습니다.',
        '호스 상태 점검 중 호스가 노후화된 상태를 발견했으나 적절한 조치를 취하지 못했습니다.',
        '배관 점검 중 배관이 손상된 상태를 발견했으나 적절한 조치를 취하지 못했습니다.'
      ],
      cause_condition: [
        '압력용기 점검이 미흡하고 안전장치가 작동하지 않는 상태였습니다.',
        '호스 상태 점검이 미흡하고 정기 교체가 이루어지지 않은 상태였습니다.',
        '배관 상태 점검이 미흡하고 압력 조절장치가 작동하지 않는 상태였습니다.'
      ],
      what_happened: [
        '압력용기가 과압으로 인해 터져서 전신에 중상을 입었습니다.',
        '고압 호스가 터져서 팔과 다리에 부상을 입었습니다.',
        '배관이 터져서 전신에 중상을 입었습니다.'
      ],
      initial_response: [
        '압력용기 조작자가 즉시 압력을 낮추고 응급처치를 실시했습니다.',
        '호스 사용자가 즉시 압력을 차단하고 응급처치를 실시했습니다.',
        '배관 조작자가 즉시 압력을 차단하고 응급처치를 실시했습니다.'
      ]
    }
  },
  '깨짐·부서짐': {
    summary: ['유리 깨짐', '기계 부품 부서짐', '도구 부서짐'],
    detail: {
      before_work: [
        '유리창 점검 작업을 위해 안전유리를 확인하고 작업을 시작했습니다.',
        '기계 부품 점검 작업을 위해 보호장비를 착용하고 작업을 시작했습니다.',
        '공구 사용 작업을 위해 안전장비를 착용하고 작업을 시작했습니다.'
      ],
      worker_action: [
        '유리창 점검 중 유리가 깨질 위험을 발견했으나 작업을 계속했습니다.',
        '기계 부품 점검 중 부품이 부서질 위험을 발견했으나 작업을 계속했습니다.',
        '공구 사용 중 도구가 부서질 위험을 발견했으나 작업을 계속했습니다.'
      ],
      cause_condition: [
        '유리창이 노후화되어 깨질 위험이 있는 상태였습니다.',
        '기계 부품이 노후화되어 부서질 위험이 있는 상태였습니다.',
        '공구가 노후화되어 부서질 위험이 있는 상태였습니다.'
      ],
      what_happened: [
        '유리창이나 유리제품이 깨져서 팔과 다리에 부상을 입었습니다.',
        '기계 부품이 부서져서 튀어나온 파편에 맞아 얼굴에 부상을 입었습니다.',
        '공구가 부서져서 튀어나온 파편에 맞아 눈에 부상을 입었습니다.'
      ],
      initial_response: [
        '근처 작업자가 즉시 응급처치를 실시하고 안전관리자에게 보고했습니다.',
        '기계 조작자가 즉시 기계를 정지하고 응급처치를 실시했습니다.',
        '작업반장이 즉시 사고를 확인하고 응급처치를 실시했습니다.'
      ]
    }
  },
  '타거나데임': {
    summary: ['고온 물체에 데임', '화학물질에 데임', '증기에 데임'],
    detail: {
      before_work: [
        '고온 작업을 위해 보호장비를 착용하고 작업을 시작했습니다.',
        '화학물질 취급 작업을 위해 보호장비를 착용하고 작업을 시작했습니다.',
        '고온 증기 작업을 위해 보호장비를 착용하고 작업을 시작했습니다.'
      ],
      worker_action: [
        '고온 작업 중 고온 물체에 접촉하여 화상을 입었습니다.',
        '화학물질 취급 중 화학물질에 접촉하여 화상을 입었습니다.',
        '고온 증기 작업 중 증기에 노출되어 화상을 입었습니다.'
      ],
      cause_condition: [
        '고온 작업 시 보호장비가 부족하고 안전 거리가 확보되지 않은 상태였습니다.',
        '화학물질 안전관리가 부족하고 보호장비가 미흡한 상태였습니다.',
        '고온 증기 작업 시 보호장비가 부족하고 안전장치가 미흡한 상태였습니다.'
      ],
      what_happened: [
        '고온의 금속이나 기계에 접촉하여 팔과 다리에 화상을 입었습니다.',
        '화학물질에 접촉하여 손과 팔에 화상을 입었습니다.',
        '고온 증기에 노출되어 얼굴과 팔에 화상을 입었습니다.'
      ],
      initial_response: [
        '근처 작업자가 즉시 냉각 처치를 실시하고 안전관리자에게 보고했습니다.',
        '화학물질 취급자가 즉시 세척 처치를 실시하고 안전관리자에게 보고했습니다.',
        '작업반장이 즉시 냉각 처치를 실시하고 안전관리자에게 보고했습니다.'
      ]
    }
  },
  '무리한동작': {
    summary: ['무거운 물건 들기', '반복 동작', '부적절한 자세'],
    detail: {
      before_work: [
        '무거운 물건 운반 작업을 위해 보조장비를 준비하고 작업을 시작했습니다.',
        '반복적인 동작 작업을 위해 작업 자세를 점검하고 작업을 시작했습니다.',
        '부적절한 자세 작업을 위해 작업 환경을 점검하고 작업을 시작했습니다.'
      ],
      worker_action: [
        '무거운 물건을 들다가 적절한 들기 방법을 사용하지 못했습니다.',
        '반복적인 동작을 하다가 휴식 시간을 확보하지 못했습니다.',
        '부적절한 자세로 작업을 하다가 근골격계 질환이 발생했습니다.'
      ],
      cause_condition: [
        '무거운 물건 운반 시 보조장비가 부족하고 적절한 들기 방법 교육이 미흡했습니다.',
        '반복적인 동작 작업 시 휴식 시간이 부족하고 작업 자세 개선이 미흡했습니다.',
        '부적절한 자세 작업 시 작업 환경 개선이 미흡하고 안전 교육이 부족했습니다.'
      ],
      what_happened: [
        '무거운 물건을 들다가 허리와 어깨에 부상을 입었습니다.',
        '반복적인 동작으로 인해 근골격계 질환이 발생했습니다.',
        '부적절한 작업 자세로 인해 근골격계 질환이 발생했습니다.'
      ],
      initial_response: [
        '근처 작업자가 즉시 응급처치를 실시하고 안전관리자에게 보고했습니다.',
        '작업반장이 즉시 작업을 중단하고 응급처치를 실시했습니다.',
        '안전관리자가 즉시 작업을 중단하고 응급처치를 실시했습니다.'
      ]
    }
  },
  '이상온도물체접촉': {
    summary: ['고온 물체 접촉', '저온 물체 접촉', '급격한 온도 변화'],
    detail: {
      before_work: [
        '고온 작업을 위해 보호장비를 착용하고 작업을 시작했습니다.',
        '저온 작업을 위해 보호장비를 착용하고 작업을 시작했습니다.',
        '급격한 온도 변화 작업을 위해 보호장비를 착용하고 작업을 시작했습니다.'
      ],
      worker_action: [
        '고온 작업 중 고온 물체에 접촉하여 화상을 입었습니다.',
        '저온 작업 중 저온 물체에 접촉하여 동상을 입었습니다.',
        '급격한 온도 변화 작업 중 체온 조절에 문제가 발생했습니다.'
      ],
      cause_condition: [
        '고온 작업 시 보호장비가 부족하고 안전 거리가 확보되지 않은 상태였습니다.',
        '저온 작업 시 보호장비가 부족하고 작업 시간 제한이 미흡한 상태였습니다.',
        '급격한 온도 변화 작업 시 적절한 보호장비가 부족하고 작업 환경이 미흡했습니다.'
      ],
      what_happened: [
        '고온의 물체에 접촉하여 팔과 다리에 화상을 입었습니다.',
        '저온의 물체에 접촉하여 손과 발에 동상을 입었습니다.',
        '급격한 온도 변화로 인해 체온 조절에 문제가 발생했습니다.'
      ],
      initial_response: [
        '근처 작업자가 즉시 냉각 처치를 실시하고 안전관리자에게 보고했습니다.',
        '작업반장이 즉시 온도 조절 처치를 실시하고 안전관리자에게 보고했습니다.',
        '안전관리자가 즉시 온도 조절 처치를 실시하고 안전관리자에게 보고했습니다.'
      ]
    }
  },
  '화학물질누출접촉': {
    summary: ['화학물질 누출', '화학물질 접촉', '유해물질 노출'],
    detail: {
      before_work: [
        '화학물질 취급 작업을 위해 보호장비를 착용하고 작업을 시작했습니다.',
        '화학물질 점검 작업을 위해 보호장비를 착용하고 작업을 시작했습니다.',
        '유해물질 취급 작업을 위해 보호장비를 착용하고 작업을 시작했습니다.'
      ],
      worker_action: [
        '화학물질 취급 중 화학물질이 누출되어 피부에 접촉했습니다.',
        '화학물질 점검 중 화학물질에 직접 접촉했습니다.',
        '유해물질 취급 중 유해물질에 노출되었습니다.'
      ],
      cause_condition: [
        '화학물질 안전관리가 부족하고 보호장비가 미흡한 상태였습니다.',
        '화학물질 취급 교육이 부족하고 안전 작업 수칙이 미흡했습니다.',
        '유해물질 안전관리가 부족하고 환기시설이 미흡한 상태였습니다.'
      ],
      what_happened: [
        '화학물질이 누출되어 피부에 접촉하여 화상을 입었습니다.',
        '화학물질에 직접 접촉하여 피부에 부상을 입었습니다.',
        '유해물질에 노출되어 건강상 문제가 발생했습니다.'
      ],
      initial_response: [
        '화학물질 취급자가 즉시 세척 처치를 실시하고 안전관리자에게 보고했습니다.',
        '근처 작업자가 즉시 세척 처치를 실시하고 안전관리자에게 보고했습니다.',
        '안전관리자가 즉시 환기 처치를 실시하고 안전관리자에게 보고했습니다.'
      ]
    }
  },
  '산소결핍': {
    summary: ['밀폐공간 산소결핍', '가스 누출', '환기 부족'],
    detail: {
      before_work: [
        '밀폐공간 작업을 위해 산소농도 측정을 실시하고 작업을 시작했습니다.',
        '가스설비 점검 작업을 위해 누출 감지기를 확인하고 작업을 시작했습니다.',
        '환기시설 점검 작업을 위해 환기 상태를 확인하고 작업을 시작했습니다.'
      ],
      worker_action: [
        '밀폐공간 작업 중 산소농도가 낮아지는 것을 발견했으나 작업을 계속했습니다.',
        '가스설비 점검 중 가스 누출을 발견했으나 적절한 조치를 취하지 못했습니다.',
        '환기시설 점검 중 환기가 부족한 것을 발견했으나 작업을 계속했습니다.'
      ],
      cause_condition: [
        '밀폐공간 작업 전 산소농도 측정이 미흡한 상태였습니다.',
        '가스설비 점검이 미흡하고 누출 감지기가 작동하지 않는 상태였습니다.',
        '환기시설 점검이 미흡하고 환기가 부족한 상태였습니다.'
      ],
      what_happened: [
        '밀폐공간에서 산소결핍으로 인해 의식을 잃었습니다.',
        '가스 누출로 인해 산소결핍이 발생하여 의식을 잃었습니다.',
        '환기 부족으로 인해 산소결핍이 발생하여 의식을 잃었습니다.'
      ],
      initial_response: [
        '근처 작업자가 즉시 밀폐공간에서 대피시키고 응급처치를 실시했습니다.',
        '가스설비 조작자가 즉시 가스 공급을 차단하고 응급처치를 실시했습니다.',
        '환기시설 조작자가 즉시 환기를 강화하고 응급처치를 실시했습니다.'
      ]
    }
  },
  '빠짐익사': {
    summary: ['수조에 빠짐', '저수지에 빠짐', '배수구에 빠짐'],
    detail: {
      before_work: [
        '수조 주변 작업을 위해 안전장치를 확인하고 작업을 시작했습니다.',
        '저수지 주변 작업을 위해 구명장비를 확인하고 작업을 시작했습니다.',
        '배수구 주변 작업을 위해 안전장치를 확인하고 작업을 시작했습니다.'
      ],
      worker_action: [
        '수조 주변 작업 중 수조에 빠질 위험을 발견했으나 작업을 계속했습니다.',
        '저수지 주변 작업 중 저수지에 빠질 위험을 발견했으나 작업을 계속했습니다.',
        '배수구 주변 작업 중 배수구에 빠질 위험을 발견했으나 작업을 계속했습니다.'
      ],
      cause_condition: [
        '수조 주변 안전장치가 미흡하고 작업자 안내가 부족한 상태였습니다.',
        '저수지 주변 안전장치가 미흡하고 구명장비가 부족한 상태였습니다.',
        '배수구 주변 안전장치가 미흡하고 작업자 교육이 부족한 상태였습니다.'
      ],
      what_happened: [
        '작업 중 수조에 빠져 익사할 뻔했습니다.',
        '저수지 근처 작업 중 빠져 익사할 뻔했습니다.',
        '배수구에 빠져 익사할 뻔했습니다.'
      ],
      initial_response: [
        '근처 작업자가 즉시 구명장비를 사용하여 구조하고 응급처치를 실시했습니다.',
        '현장 작업자가 즉시 구명장비를 사용하여 구조하고 응급처치를 실시했습니다.',
        '작업반장이 즉시 구명장비를 사용하여 구조하고 응급처치를 실시했습니다.'
      ]
    }
  },
  '사업장내교통사고': {
    summary: ['차량 충돌', '보행자 사고', '장비 충돌'],
    detail: {
      before_work: [
        '사업장 내 차량 운전을 위해 안전 속도를 확인하고 운전을 시작했습니다.',
        '사업장 내 보행을 위해 안전 통로를 확인하고 이동을 시작했습니다.',
        '사업장 내 장비 운전을 위해 안전 속도를 확인하고 운전을 시작했습니다.'
      ],
      worker_action: [
        '사업장 내 차량 운전 중 보행자와 충돌했습니다.',
        '사업장 내 보행 중 차량과 충돌했습니다.',
        '사업장 내 장비 운전 중 차량과 충돌했습니다.'
      ],
      cause_condition: [
        '차량 통행로와 보행자 통로가 분리되지 않은 상태였습니다.',
        '차량 운전 교육이 부족하고 안전 속도 준수가 미흡했습니다.',
        '장비 운전 교육이 부족하고 안전 작업 수칙이 미흡했습니다.'
      ],
      what_happened: [
        '사업장 내 차량과 보행자가 충돌하여 전신에 중상을 입었습니다.',
        '사업장 내 차량 간 충돌사고가 발생했습니다.',
        '사업장 내 장비와 차량이 충돌하여 전신에 중상을 입었습니다.'
      ],
      initial_response: [
        '차량 운전자가 즉시 119에 신고하고 응급처치를 실시했습니다.',
        '근처 작업자가 즉시 119에 신고하고 응급처치를 실시했습니다.',
        '장비 운전자가 즉시 119에 신고하고 응급처치를 실시했습니다.'
      ]
    }
  },
  '동물상해': {
    summary: ['야생동물 상해', '반려동물 상해', '해충 접촉'],
    detail: {
      before_work: [
        '야생동물 출현 지역 작업을 위해 보호장비를 착용하고 작업을 시작했습니다.',
        '반려동물 관리 작업을 위해 안전 규정을 확인하고 작업을 시작했습니다.',
        '해충 방제 작업을 위해 보호장비를 착용하고 작업을 시작했습니다.'
      ],
      worker_action: [
        '야생동물 출현 지역 작업 중 야생동물에 의해 부상을 입었습니다.',
        '반려동물 관리 작업 중 반려동물에 의해 부상을 입었습니다.',
        '해충 방제 작업 중 해충에 접촉했습니다.'
      ],
      cause_condition: [
        '야생동물 출현 지역 안내가 부족하고 보호장비가 미흡한 상태였습니다.',
        '반려동물 관리 규정이 부족하고 안전 교육이 미흡한 상태였습니다.',
        '해충 방제가 부족하고 보호장비가 미흡한 상태였습니다.'
      ],
      what_happened: [
        '사업장 내 야생동물에 의해 팔과 다리에 부상을 입었습니다.',
        '반려동물에 의해 팔과 다리에 부상을 입었습니다.',
        '해충에 접촉하여 알레르기 반응이 발생했습니다.'
      ],
      initial_response: [
        '근처 작업자가 즉시 응급처치를 실시하고 안전관리자에게 보고했습니다.',
        '반려동물 관리자가 즉시 응급처치를 실시하고 안전관리자에게 보고했습니다.',
        '해충 방제자가 즉시 응급처치를 실시하고 안전관리자에게 보고했습니다.'
      ]
    }
  }
};

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate2025() {
  const start = new Date('2025-01-01T00:00:00').getTime();
  const end = new Date('2025-12-31T23:59:59').getTime();
  return new Date(start + Math.random() * (end - start));
}

function pad(n: number, width: number) {
  return n.toString().padStart(width, '0');
}

function randomName() {
  const first = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임'];
  const last = ['민수', '서연', '지훈', '지민', '현우', '수빈', '예진', '도현', '하은', '시우'];
  return randomPick(first) + randomPick(last);
}

// 상세한 사고 내용 생성 함수
function generateAccidentContent(accidentType: string, location: string, company: any) {
  const templates = accidentDetailTemplates[accidentType as keyof typeof accidentDetailTemplates];
  const locationDetail = randomPick(locationDetails[location as keyof typeof locationDetails] || ['']);
  
  const summary = randomPick(templates.summary);
  const detail = templates.detail;
  
  // 5개 항목별로 랜덤 선택
  const beforeWork = randomPick(detail.before_work);
  const workerAction = randomPick(detail.worker_action);
  const causeCondition = randomPick(detail.cause_condition);
  const whatHappened = randomPick(detail.what_happened);
  const initialResponse = randomPick(detail.initial_response);
  
  // 회사명과 사업장명을 포함한 더 상세한 내용 생성
  const enhancedBeforeWork = beforeWork.replace('작업장', `${company.site_name}`).replace('사업장', `${company.site_name}`);
  const enhancedWorkerAction = workerAction.replace('작업장', `${company.site_name}`).replace('사업장', `${company.site_name}`);
  const enhancedCauseCondition = causeCondition.replace('작업장', `${company.site_name}`).replace('사업장', `${company.site_name}`);
  const enhancedWhatHappened = whatHappened.replace('작업장', `${company.site_name}`).replace('사업장', `${company.site_name}`);
  const enhancedInitialResponse = initialResponse.replace('작업장', `${company.site_name}`).replace('사업장', `${company.site_name}`);
  
  return {
    summary: `${company.site_name} ${locationDetail}에서 ${summary}`,
    detail: `【사고 발생 전 작업 내용】\n${enhancedBeforeWork}\n\n【사고 발생 시점 작업자 행동】\n${enhancedWorkerAction}\n\n【사고가 발생하게 된 동작 및 기계 상태】\n${enhancedCauseCondition}\n\n【현장에서 어떤 일이 일어났는가】\n${enhancedWhatHappened}\n\n【사고 발생 후 초기 조치 및 대응】\n${enhancedInitialResponse}`
  };
}

function makeVictim() {
  return {
    name: randomName(),
    age: Math.floor(Math.random() * 30) + 20,
    belong: randomPick(belongs),
    duty: randomPick(positions),
    injury_type: randomPick(injuryTypeList),
    ppe_worn: Math.random() > 0.5 ? '착용' : '미착용',
    first_aid: Math.random() > 0.5 ? '실시' : '미실시',
  };
}

function makePropertyDamage() {
  return {
    damage_target: randomPick(['기계A', '설비B', '창고', '차량', '배관', '기타']),
    damage_type: randomPick(propertyDamageTypeList),
    estimated_cost: (Math.floor(Math.random() * 100) + 1) * 100,
    damage_content: randomPick(['파손', '고장', '누수', '화재', '기타']),
    shutdown_start_date: randomDate2025().toISOString(),
    recovery_expected_date: randomDate2025().toISOString(),
    recovery_plan: randomPick(['즉시 복구', '외주 수리', '부품 교체', '임시 조치']),
    etc_notes: '',
  };
}

// 더미 데이터 타입 정의
interface DummyReport {
  global_accident_no: string;
  accident_id: string;
  company_name: string;
  company_code: string;
  site_name: string;
  site_code: string;
  acci_time: string;
  acci_location: string;
  is_contractor: boolean;
  contractor_name: string;
  accident_type_level1: string;
  accident_type_level2: string;
  acci_summary: string;
  acci_detail: string;
  victim_count: number;
  victims: any[];
  property_damages: any[];
  report_channel: string;
  report_channel_no: string;
  first_report_time: string;
  reporter_name: string;
  reporter_position: string;
  reporter_belong: string;
  work_related_type: string;
  misc_classification: string;
  attachments: any[];
}

const reports: DummyReport[] = [];
for (let i = 0; i < 20; i++) {
  const company = randomPick(companies);
  const acci_time = randomDate2025();
  const accident_type_level1 = randomPick(accidentTypeLevel1List);
  const accident_type_level2 = randomPick(accidentTypeLevel2List);
  const is_contractor = Math.random() > 0.7;
  const victim_count = ['인적', '복합'].includes(accident_type_level1) ? Math.floor(Math.random() * 3) + 1 : 0;
  const property_damage_count = ['물적', '복합'].includes(accident_type_level1) ? Math.floor(Math.random() * 2) + 1 : 0;
  const acci_location = randomPick(['1공장 입구', '2공장 내부', '창고 앞', '주차장', '옥상', '계단', '기계실', '작업장']);
  
  // 상세한 사고 내용 생성
  const accidentContent = generateAccidentContent(accident_type_level2, acci_location, company);

  reports.push({
    global_accident_no: `${company.company_code}-2025-${pad(i+1,3)}`,
    accident_id: `${company.company_code}-${company.site_code}-2025-${pad(i+1,3)}`,
    company_name: company.company_name,
    company_code: company.company_code,
    site_name: company.site_name,
    site_code: company.site_code,
    acci_time: acci_time.toISOString(),
    acci_location,
    is_contractor,
    contractor_name: is_contractor ? randomName() + ' 협력사' : '',
    accident_type_level1,
    accident_type_level2,
    acci_summary: accidentContent.summary,
    acci_detail: accidentContent.detail,
    victim_count,
    victims: victim_count > 0 ? Array.from({length: victim_count}, makeVictim) : [],
    property_damages: property_damage_count > 0 ? Array.from({length: property_damage_count}, makePropertyDamage) : [],
    report_channel: randomPick(reportChannelList),
    report_channel_no: `RCN-${pad(i+1,4)}`,
    first_report_time: new Date(acci_time.getTime() + Math.floor(Math.random()*3600000)).toISOString(),
    reporter_name: randomName(),
    reporter_position: randomPick(positions),
    reporter_belong: randomPick(belongs),
    work_related_type: randomPick(workRelatedTypeList),
    misc_classification: '',
    attachments: [],
  });
}

// DB에 데이터 삽입
async function insertDummyData() {
  try {
    // DB 연결 초기화
    connectDB();
    
    console.log('2025년 사고 발생보고서 20건 더미 데이터를 DB에 삽입합니다...');
    
    for (const report of reports) {
      // 메인 사고 데이터 삽입
      const [insertedOccurrence] = await db().insert(tables.occurrenceReport).values({
        accident_id: report.accident_id,
        global_accident_no: report.global_accident_no,
        company_name: report.company_name,
        company_code: report.company_code,
        site_name: report.site_name,
        site_code: report.site_code,
        acci_time: new Date(report.acci_time),
        acci_location: report.acci_location,
        is_contractor: report.is_contractor,
        contractor_name: report.contractor_name,
        accident_type_level1: report.accident_type_level1,
        accident_type_level2: report.accident_type_level2,
        acci_summary: report.acci_summary,
        acci_detail: report.acci_detail,
        victim_count: report.victim_count,
        report_channel: report.report_channel,
        report_channel_no: report.report_channel_no,
        first_report_time: new Date(report.first_report_time),
        reporter_name: report.reporter_name,
        reporter_position: report.reporter_position,
        reporter_belong: report.reporter_belong,
        work_related_type: report.work_related_type,
        misc_classification: report.misc_classification,
        attachments: JSON.stringify(report.attachments),
      }).returning();

      // 재해자 데이터 삽입
      if (report.victims.length > 0) {
        const preparedVictims = report.victims.map((victim: any) => ({
          accident_id: report.accident_id,
          name: victim.name,
          age: victim.age,
          belong: victim.belong,
          duty: victim.duty,
          injury_type: victim.injury_type,
          ppe_worn: victim.ppe_worn,
          first_aid: victim.first_aid,
          created_at: new Date(),
          updated_at: new Date(),
        }));
        
        await db().insert(victims).values(preparedVictims);
      }

      // 물적피해 데이터 삽입
      if (report.property_damages.length > 0) {
        const preparedDamages = report.property_damages.map((damage: any) => ({
          accident_id: report.accident_id,
          damage_target: damage.damage_target,
          damage_type: damage.damage_type,
          estimated_cost: damage.estimated_cost,
          damage_content: damage.damage_content,
          shutdown_start_date: new Date(damage.shutdown_start_date),
          recovery_expected_date: new Date(damage.recovery_expected_date),
          recovery_plan: damage.recovery_plan,
          etc_notes: damage.etc_notes,
          created_at: new Date(),
          updated_at: new Date(),
        }));
        
        await db().insert(tables.propertyDamage).values(preparedDamages);
      }

      console.log(`✅ ${report.global_accident_no} - ${report.accident_type_level2} 사고 데이터 삽입 완료`);
    }

    console.log('🎉 2025년 사고 발생보고서 20건 더미 데이터 DB 삽입이 완료되었습니다!');
    
  } catch (error) {
    console.error('❌ 더미 데이터 삽입 중 오류 발생:', error);
    throw error;
  }
}

// 스크립트 실행
insertDummyData().catch(console.error); 