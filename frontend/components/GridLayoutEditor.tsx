/**
 * @file components/GridLayoutEditor.tsx
 * @description
 *  - 그리드 레이아웃 에디터 컴포넌트
 *  - 발생보고서 양식의 필드 레이아웃을 템플릿 방식으로 설정
 */

import React, { useState, useEffect } from 'react';
import { 
  LAYOUT_TEMPLATES, 
  LayoutTemplate, 
  applyLayoutTemplate, 
  getGridClass, 
  saveLayoutSettings 
} from '../utils/layout.utils';



/**
 * 그리드 레이아웃 에디터 컴포넌트
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
  const [selectedTemplate, setSelectedTemplate] = useState<string>('compact');
  const [customLayout, setCustomLayout] = useState<{[groupName: string]: number}>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // 그룹별 필드 분류
  const groupedFields = fields.reduce((acc, field) => {
    const group = field.field_group || '기타';
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {} as {[key: string]: any[]});

  // 필드에서 실제 group_cols 값을 읽어서 초기값 설정
  useEffect(() => {
    if (fields.length > 0 && !isInitialized) {
      const initialLayout: {[groupName: string]: number} = {};
      
      // 각 그룹의 첫 번째 필드에서 group_cols 값 추출
      Object.entries(groupedFields).forEach(([groupName, groupFields]) => {
        if ((groupFields as any[]).length > 0) {
          const firstField = (groupFields as any[])[0];
          initialLayout[groupName] = firstField.group_cols || 2;
        }
      });
      
      console.log('[GridLayoutEditor] 초기 레이아웃 설정:', initialLayout);
      setCustomLayout(initialLayout);
      setIsInitialized(true);
    }
  }, [fields, groupedFields, isInitialized]);

  // 템플릿 적용
  const applyTemplate = (templateId: string) => {
    const template = LAYOUT_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    setSelectedTemplate(templateId);
    
    // 템플릿의 열 수를 customLayout에 반영
    const newLayout = { ...customLayout };
    Object.entries(template.layout).forEach(([groupName, config]) => {
      newLayout[groupName] = config.cols;
    });
    setCustomLayout(newLayout);
  };

  // 그룹별 열 수 변경
  const handleGroupColsChange = (groupName: string, cols: number) => {
    setCustomLayout(prev => ({
      ...prev,
      [groupName]: cols
    }));
    setSelectedTemplate('custom'); // 커스텀으로 변경
  };

  // 레이아웃 정보를 부모에게 전달
  useEffect(() => {
    if (isInitialized && Object.keys(customLayout).length > 0) {
      console.log('[GridLayoutEditor] 레이아웃 변경:', { selectedTemplate, customLayout });
      
      // 필드에 group_cols 정보 직접 추가
      const updatedFields = fields.map(field => ({
        ...field,
        group_cols: customLayout[field.field_group || '기타'] || 2
      }));
      
      console.log('[GridLayoutEditor] 업데이트된 필드들:', updatedFields);
      onLayoutChange(updatedFields);
    }
  }, [selectedTemplate, customLayout, isInitialized]); // fields 의존성 제거

  return (
    <div className="grid-layout-editor space-y-6">
      {/* 템플릿 선택 */}
      <div>
        <h3 className="text-lg font-semibold mb-3">레이아웃 템플릿</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {LAYOUT_TEMPLATES.map(template => (
            <div
              key={template.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedTemplate === template.id
                  ? 'border-slate-500 bg-slate-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => applyTemplate(template.id)}
            >
              <h4 className="font-medium text-gray-900">{template.name}</h4>
              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
            </div>
          ))}
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
              selectedTemplate === 'custom'
                ? 'border-slate-500 bg-slate-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedTemplate('custom')}
          >
            <h4 className="font-medium text-gray-900">커스텀 레이아웃</h4>
            <p className="text-sm text-gray-600 mt-1">직접 설정</p>
          </div>
        </div>
      </div>

      {/* 그룹별 열 수 설정 */}
      <div>
        <h3 className="text-lg font-semibold mb-3">그룹별 열 수 설정</h3>
        <div className="space-y-4">
          {Object.entries(groupedFields).map(([groupName, groupFields]) => (
            <div key={groupName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium text-gray-900">{groupName}</span>
                               <span className="ml-2 text-sm text-gray-500">
                 ({(groupFields as any[]).filter(f => f.is_visible).length}개 필드)
               </span>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">열 수:</label>
                <select
                  value={customLayout[groupName] || 2}
                  onChange={(e) => handleGroupColsChange(groupName, parseInt(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={1}>1열</option>
                  <option value={2}>2열</option>
                  <option value={3}>3열</option>
                  <option value={4}>4열</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 미리보기 */}
      <div>
        <h3 className="text-lg font-semibold mb-3">레이아웃 미리보기</h3>
        <div className="border rounded-lg p-4 bg-white">
                     {Object.entries(groupedFields).map(([groupName, groupFields]) => {
             const visibleFields = (groupFields as any[]).filter(f => f.is_visible);
             const cols = customLayout[groupName] || 2;
            
            if (visibleFields.length === 0) return null;
            
            return (
              <div key={groupName} className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">{groupName}</h4>
                <div 
                  className={`grid gap-2 ${
                    cols === 1 ? 'grid-cols-1' :
                    cols === 2 ? 'grid-cols-1 md:grid-cols-2' :
                    cols === 3 ? 'grid-cols-1 md:grid-cols-3' :
                    'grid-cols-1 md:grid-cols-4'
                  }`}
                >
                  {visibleFields.map(field => (
                    <div
                      key={field.id || field.field_name}
                      className="p-2 bg-slate-50 border border-slate-200 rounded text-sm"
                    >
                      {field.display_name}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 저장 안내 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-yellow-800">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-800">
              레이아웃 변경사항은 "변경사항 저장" 버튼을 클릭해야 적용됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GridLayoutEditor; 