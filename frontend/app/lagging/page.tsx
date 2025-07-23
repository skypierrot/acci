// /lagging 사고지표 페이지
import React from 'react';

export default function LaggingPage() {
  return (
    // max-w-4xl → max-w-7xl로 변경하여 폭 통일
    <div className="max-w-7xl mx-auto bg-white rounded-lg shadow p-8 mt-8">
      <h1 className="text-2xl font-bold mb-6">사고지표 (Lagging Indicator)</h1>
      <p className="text-gray-700 mb-4">
        사고지표(Lagging Indicator)는 과거에 발생한 사고, 재해, 손실 등의 결과를 측정하는 지표입니다.<br />
        본 페이지에서는 최근 사고 건수, 유형별 통계, 발생 추이 등 다양한 사고지표를 시각화할 예정입니다.
      </p>
      {/* 예시 더미 데이터 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">최근 1년간 사고 건수</h2>
        <ul className="list-disc pl-6 text-gray-600">
          <li>전체 사고: 12건</li>
          <li>중대 사고: 2건</li>
          <li>경미 사고: 10건</li>
        </ul>
      </div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">유형별 사고 통계</h2>
        <ul className="list-disc pl-6 text-gray-600">
          <li>추락: 4건</li>
          <li>끼임: 3건</li>
          <li>넘어짐: 2건</li>
          <li>기타: 3건</li>
        </ul>
      </div>
      <div className="text-gray-400 text-sm">※ 실제 데이터 및 차트는 추후 연동 예정</div>
    </div>
  );
} 