/**
 * @file components/GridLayoutEditor.tsx
 * @description
 *  - 그리드 레이아웃 에디터 컴포넌트
 *  - 발생보고서 양식의 필드 크기와 위치를 설정하기 위한 UI
 */

import React, { useState, useEffect } from 'react';
// import { FormFieldSetting, GridLayout, updateGridLayout, getFormSettings } from '@/services/report_form.service';

/**
 * 그리드 레이아웃 에디터 컴포넌트
 * CSS Grid를 사용하여 드래그 앤 드롭 없이 직접 입력 방식으로 구현
 */
const GridLayoutEditor: React.FC<{
  fields: any[];
  onLayoutChange: (fields: any[]) => void;
  cols: number;
  rowHeight: number;
  gridDimensions: { width: number; height: number };
  reportType: string;
}> = ({
  fields,
  onLayoutChange,
  cols = 12,
  rowHeight = 50,
  gridDimensions = { width: 12, height: 20 },
  reportType
}) => {
  // 보이는 필드만 필터링
  const visibleFields = fields.filter(field => field.is_visible);

  return (
    <div className="grid-layout-editor">
      <div className="mb-4 flex space-x-2">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => console.log('자동 배치 기능이 비활성화되었습니다.')}
        >
          자동 배치
        </button>
        <button
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          onClick={() => console.log('레이아웃 초기화 기능이 비활성화되었습니다.')}
        >
          레이아웃 초기화
        </button>
        <div className="ml-auto text-sm text-gray-500">
          * 그리드 레이아웃 기능이 일시적으로 비활성화되었습니다.
        </div>
      </div>
      
      <div className="bg-gray-100 p-4 border rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">필드명</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">X 위치</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Y 위치</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">너비</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">높이</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {visibleFields.map(field => (
                <tr key={field.id || field.field_name} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{field.display_name}</div>
                    <div className="text-xs text-gray-500">{field.field_name}</div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <input
                      type="number"
                      disabled
                      className="w-16 border rounded px-2 py-1 bg-gray-100"
                    />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <input
                      type="number"
                      disabled
                      className="w-16 border rounded px-2 py-1 bg-gray-100"
                    />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <input
                      type="number"
                      disabled
                      className="w-16 border rounded px-2 py-1 bg-gray-100"
                    />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <input
                      type="number"
                      disabled
                      className="w-16 border rounded px-2 py-1 bg-gray-100"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-4">
        <h3 className="text-lg font-medium mb-2">미리보기</h3>
        <div className="p-4 bg-gray-50 border rounded-lg">
          <p className="text-gray-500">그리드 레이아웃 미리보기가 일시적으로 비활성화되었습니다.</p>
        </div>
      </div>
    </div>
  );
};

export default GridLayoutEditor; 