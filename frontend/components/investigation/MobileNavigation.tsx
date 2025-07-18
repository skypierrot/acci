import React from 'react';
import { InvestigationReport } from '../../types/investigation.types';

interface InvestigationMobileNavigationProps {
  report: InvestigationReport;
  editMode: boolean;
  currentStep: number;
  goToStep: (stepIndex: number) => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  onSave: () => void;
  saving: boolean;
}

// 조사보고서 스텝 정의
const getInvestigationSteps = () => [
  { id: 'basic', title: '조사기본정보', description: '조사팀, 일정 등' },
  { id: 'content', title: '사고내용', description: '사고 상세 정보' },
  { id: 'damage', title: '피해정보', description: '재해자 및 물적피해' },
  { id: 'analysis', title: '원인분석', description: '직접/근본 원인' },
  { id: 'action', title: '대책정보', description: '재발방지대책' },
  { id: 'conclusion', title: '조사결론', description: '결론 및 요약' }
];

export const InvestigationMobileStepNavigation: React.FC<InvestigationMobileNavigationProps> = ({
  report,
  editMode,
  currentStep,
  goToStep
}) => {
  const steps = getInvestigationSteps();

  if (!editMode) return null; // 편집 모드가 아니면 네비게이션 숨김

  return (
    <div className="bg-white border-b border-gray-200 p-4 mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">
          {steps[currentStep]?.title || '단계'}
        </h3>
        <span className="text-sm text-gray-500">
          {currentStep + 1} / {steps.length}
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">
        {steps[currentStep]?.description || ''}
      </p>
      
      {/* 진행 바 */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary-700 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>
      
      {/* 스텝 점들 */}
      <div className="flex justify-between mt-3">
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => goToStep(index)}
            className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
              index === currentStep
                ? 'bg-primary-700 text-white'
                : index < currentStep
                ? 'bg-green-500 text-white'
                : 'bg-gray-300 text-gray-600'
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export const InvestigationMobileStepButtons: React.FC<InvestigationMobileNavigationProps> = ({
  currentStep,
  goToNextStep,
  goToPrevStep,
  onSave,
  saving,
  editMode
}) => {
  const steps = getInvestigationSteps();

  if (!editMode) return null; // 편집 모드가 아니면 버튼 숨김

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
      <div className="flex justify-between space-x-3">
        {/* 이전 버튼 */}
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

        {/* 다음/저장 버튼 */}
        {currentStep === steps.length - 1 ? (
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className={`flex-1 px-4 py-3 rounded-md text-base font-medium ${
              saving
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-700 text-white hover:bg-primary-800'
            }`}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        ) : (
          <button
            type="button"
            onClick={goToNextStep}
            className="flex-1 px-4 py-3 rounded-md text-base font-medium bg-primary-700 text-white hover:bg-primary-800"
          >
            다음
          </button>
        )}
      </div>
    </div>
  );
};

export { getInvestigationSteps }; 