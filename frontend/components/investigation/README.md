# Investigation Components

조사보고서 관련 컴포넌트들을 기능별로 분리하여 재사용 가능하게 구성했습니다.

## 📁 파일 구조

```
frontend/
├── types/
│   └── investigation.types.ts           # 모든 타입 정의
├── hooks/
│   ├── useInvestigationData.ts          # 데이터 로딩/저장 훅
│   └── useEditMode.ts                   # 편집 모드 관리 훅
└── components/investigation/
    ├── InvestigationHeader.tsx          # 헤더 및 액션 버튼
    ├── AlertMessage.tsx                 # 알림 메시지
    ├── InvestigationBasicInfoSection.tsx # 조사 기본 정보
    ├── AccidentComparisonSection.tsx    # 사고 정보 비교 테이블
    ├── AccidentContentSection.tsx      # 사고 내용 (일시, 기상, 위치, 유형 등)
    ├── VictimSection.tsx               # 재해자 정보 섹션
    ├── PropertyDamageSection.tsx       # 물적피해 섹션
    ├── CauseAnalysisSection.tsx        # 원인 분석, 대책, 결론
    └── index.ts                        # 컴포넌트 export
```

## 🎯 주요 컴포넌트

### 1. InvestigationHeader
- 조사보고서 헤더 및 액션 버튼 (편집모드, 저장, 취소)
- Props: `report`, `actionButtons`

### 2. AlertMessage
- 에러/성공 알림 메시지 표시
- Props: `type` ('error' | 'success'), `message`

### 3. InvestigationBasicInfoSection
- 조사 기본 정보 (조사팀장, 조사팀원, 조사장소, 조사 시작일/종료일, 보고서 작성일, 상태)
- Props: `report`, `editForm`, `editMode`, 핸들러 함수들, `getStatusColor`

### 4. AccidentComparisonSection
- 사고 정보 비교 테이블 (원본 정보 vs 조사 수정 정보)
- 사고번호, 발생일시, 기상정보, 발생장소, 사고유형, 재해자 수 비교
- Props: `report`

### 5. AccidentContentSection
- 사고 내용 상세 정보 (사고 발생 일시, 기상정보, 위치, 유형, 개요, 상세)
- 원본 데이터 불러오기 기능 포함
- Props: `report`, `editForm`, `editMode`, 핸들러 함수들, `onLoadOriginalData`

### 6. VictimSection
- 재해자 정보 관리 (동적 추가/삭제)
- 성명, 나이, 소속, 직무, 상해유형, 보호구착용, 응급처치 등
- Props: `report`, `editForm`, `editMode`, 핸들러 함수들

### 7. PropertyDamageSection
- 물적피해 정보 관리 (동적 추가/삭제)
- 피해대상물, 피해금액, 피해내용, 가동중단일, 예상복구일
- Props: `report`, `editForm`, `editMode`, 핸들러 함수들

### 8. CauseAnalysisSection
- 원인 분석 (직접 원인, 근본 원인)
- 대책 정보 (개선 대책, 완료 일정, 확인자)
- 조사 결론 (조사 결론, 조사 요약, 조사관 서명)
- Props: `report`, `editForm`, `editMode`, 핸들러 함수들

## 🔧 커스텀 훅

### 1. useInvestigationData
- 조사보고서 데이터 로딩, 저장, 상태 관리
- Return: `report`, `loading`, `error`, `saving`, `saveSuccess`, `fetchReport`, `saveReport`

### 2. useEditMode
- 편집 모드 토글, 폼 상태 관리, 모든 핸들러 함수
- Return: 편집 상태, 핸들러 함수들 (재해자, 물적피해, 원본데이터 로드 등)

## 📝 사용 예시

```tsx
import { useInvestigationData, useEditMode } from '../../../hooks';
import { 
  InvestigationHeader, 
  AlertMessage, 
  PropertyDamageSection, 
  VictimSection 
} from '../../../components/investigation';

export default function InvestigationDetailPage() {
  const params = useParams();
  const accidentId = params.id as string;
  
  // 데이터 관리
  const { report, loading, error, saving, saveSuccess, saveReport } = 
    useInvestigationData({ accidentId });
  
  // 편집 모드 관리
  const { editMode, editForm, toggleEditMode, handleSave, ...handlers } = 
    useEditMode({ report, onSave: saveReport });

  return (
    <div>
      <InvestigationHeader 
        report={report}
        actionButtons={{ editMode, saving, onToggleEditMode: toggleEditMode, onSave: handleSave }}
      />
      
      {error && <AlertMessage type="error" message={error} />}
      {saveSuccess && <AlertMessage type="success" message="저장되었습니다." />}
      
      <VictimSection
        report={report}
        editForm={editForm}
        editMode={editMode}
        {...handlers}
      />
      
      <PropertyDamageSection
        report={report}
        editForm={editForm}
        editMode={editMode}
        {...handlers}
      />
    </div>
  );
}
```

## ✨ 장점

1. **모듈화**: 각 섹션이 독립적인 컴포넌트로 분리
2. **재사용성**: 다른 페이지에서도 동일한 컴포넌트 활용 가능
3. **유지보수성**: 각 컴포넌트의 책임이 명확하게 분리
4. **타입 안정성**: TypeScript 타입 정의로 안전한 개발
5. **성능**: 필요한 컴포넌트만 리렌더링
6. **테스트 용이성**: 각 컴포넌트를 독립적으로 테스트 가능

## 🔄 향후 확장

- 각 컴포넌트별 단위 테스트 작성
- Storybook을 통한 컴포넌트 문서화
- 컴포넌트 레벨에서의 데이터 검증 로직 추가
- 접근성(a11y) 개선
- 다국어 지원 (i18n)
- 모바일 반응형 UI 최적화 