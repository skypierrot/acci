/**
 * @file components/GridFormRenderer.tsx
 * @description
 *  - 그리드 레이아웃을 기반으로 폼을 렌더링하는 컴포넌트
 *  - 사용자가 설정한 그리드 레이아웃에 따라 발생보고서 양식을 표시
 */

import React, { useMemo } from 'react';
import { FormFieldSetting, GridLayout } from '@/services/report_form.service';

// 필드 렌더링 컴포넌트 타입 정의
export type FieldRenderer = (field: FormFieldSetting, value: any, onChange: (value: any) => void) => React.ReactNode;

interface GridFormRendererProps {
  fields: FormFieldSetting[];
  values: Record<string, any>;
  onChange: (fieldName: string, value: any) => void;
  renderField: FieldRenderer;
  cols?: number;
  rowHeight?: number;
  isEditable?: boolean;
}

/**
 * 그리드 레이아웃 기반 폼 렌더러 컴포넌트
 * CSS Grid를 사용하여 레이아웃 구현
 */
const GridFormRenderer: React.FC<GridFormRendererProps> = ({
  fields,
  values,
  onChange,
  renderField,
  cols = 12,
  rowHeight = 50,
  isEditable = true
}) => {
  // 보이는 필드만 필터링
  const visibleFields = useMemo(() => 
    fields.filter(field => field.is_visible), [fields]
  );

  // 최대 Y 값 계산 (가장 아래 위치한 요소의 y + h)
  const maxRow = useMemo(() => {
    let maxY = 0;
    visibleFields.forEach(field => {
      const gridLayout = field.grid_layout || { x: 0, y: 0, w: 1, h: 1 };
      const bottomY = (gridLayout.y || 0) + (gridLayout.h || 1);
      if (bottomY > maxY) {
        maxY = bottomY;
      }
    });
    return maxY;
  }, [visibleFields]);

  // 값 변경 핸들러
  const handleFieldChange = (fieldName: string, value: any) => {
    onChange(fieldName, value);
  };

  // 필드를 그룹별로 분류
  const fieldGroups = useMemo(() => {
    const groups: Record<string, FormFieldSetting[]> = {};
    
    visibleFields.forEach(field => {
      const group = field.field_group || '기타';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(field);
    });
    
    return groups;
  }, [visibleFields]);

  return (
    <div className="grid-form-renderer">
      <div 
        className="grid gap-4 p-4 bg-white" 
        style={{ 
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridAutoRows: `${rowHeight}px`,
          minHeight: `${maxRow * rowHeight}px`
        }}
      >
        {visibleFields.map(field => {
          const gridLayout = field.grid_layout || { x: 0, y: 0, w: 1, h: 1 };
          const x = gridLayout.x || 0;
          const y = gridLayout.y || 0;
          const w = gridLayout.w || 1;
          const h = gridLayout.h || 1;
          
          return (
            <div 
              key={field.id || field.field_name}
              className="relative bg-white border rounded shadow p-2 overflow-auto"
              style={{
                gridColumn: `${x + 1} / span ${w}`,
                gridRow: `${y + 1} / span ${h}`,
              }}
            >
              <div className="font-medium text-sm mb-1">{field.display_name}</div>
              <div className="field-content">
                {renderField(field, values[field.field_name], (value) => handleFieldChange(field.field_name, value))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GridFormRenderer; 