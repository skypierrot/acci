"use client";

import React, { useState, useEffect } from "react";
import { 
  getFormSettings, 
  updateFormSettings, 
  resetFormSettings,
  FormFieldSetting 
} from "@/services/report_form.service";
import GridLayoutEditor from "@/components/GridLayoutEditor";

/**
 * @file app/settings/reports/page.tsx
 * @description
 *  - 보고서 양식 설정 관리 페이지
 *  - 발생보고서와 조사보고서 양식의 표시 여부, 필수 항목, 순서, 그리드 레이아웃 등을 관리
 */

export default function ReportFormSettingsPage() {
  // 상태 관리
  const [formFields, setFormFields] = useState<FormFieldSetting[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentReportType, setCurrentReportType] = useState<string>("occurrence");
  const [activeTab, setActiveTab] = useState<string>("occurrence");
  const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "success" | "error" | "unsaved">("idle");
  const [resettingStatus, setResettingStatus] = useState<"idle" | "resetting" | "success" | "error">("idle");
  const [groupedFields, setGroupedFields] = useState<{ [key: string]: FormFieldSetting[] }>({});
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [gridCols, setGridCols] = useState<number>(12);
  const [gridRowHeight, setGridRowHeight] = useState<number>(50);
  const [gridDimensions, setGridDimensions] = useState<{ width: number; height: number }>({ width: 12, height: 20 });

  // 보고서 양식 설정 조회
  useEffect(() => {
    fetchFormSettings(currentReportType);
  }, [currentReportType]);

  // 필드 그룹별로 정렬
  useEffect(() => {
    if (formFields.length > 0) {
      // 실제 폼에 존재하지 않는 필드 필터링 및 그룹 조정
      const validFields = formFields.map(field => {
        // 그룹 설정 조정
        if (field.field_name === 'is_contractor' || field.field_name === 'contractor_name') {
          return { ...field, field_group: '기본정보' }; // 협력업체 정보는 기본정보 그룹으로 이동
        }
        
        if (field.field_name === 'first_report_time') {
          return { ...field, field_group: '기본정보' }; // 최초보고시간은 기본정보 그룹으로 이동
        }
        
        return field;
      });
      
      const grouped = validFields.reduce((acc: { [key: string]: FormFieldSetting[] }, field) => {
        const group = field.field_group || "기타";
        if (!acc[group]) {
          acc[group] = [];
        }
        acc[group].push(field);
        return acc;
      }, {});

      // 각 그룹 내에서 display_order로 정렬
      Object.keys(grouped).forEach(group => {
        grouped[group].sort((a, b) => a.display_order - b.display_order);
      });

      setGroupedFields(grouped);
    }
  }, [formFields]);

  // 보고서 양식 설정 조회 함수
  const fetchFormSettings = async (reportType: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const settings = await getFormSettings(reportType);
      
      // 필요한 필드만 필터링
      const filteredSettings = settings.filter(field => {
        // 폼에 없는 필드는 무시
        const nonExistingFields = ['work_related_type', 'misc_classification', 'victims_json'];
        return !nonExistingFields.includes(field.field_name);
      });
      
      setFormFields(filteredSettings);
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "보고서 양식 설정을 조회하는 중 오류가 발생했습니다.");
      setLoading(false);
      console.error(`${reportType} 보고서 양식 설정 조회 오류:`, err);
    }
  };

  // 보고서 유형 변경 핸들러
  const handleReportTypeChange = (reportType: string) => {
    setCurrentReportType(reportType);
    setActiveTab(reportType);
  };

  // 필드 표시 여부 변경 핸들러
  const handleVisibilityChange = (fieldId: string, isVisible: boolean) => {
    setFormFields(prev => prev.map(field => {
      if (field.id === fieldId) {
        return { ...field, is_visible: isVisible };
      }
      return field;
    }));
  };

  // 필드 필수 여부 변경 핸들러
  const handleRequiredChange = (fieldId: string, isRequired: boolean) => {
    setFormFields(prev => prev.map(field => {
      if (field.id === fieldId) {
        return { ...field, is_required: isRequired };
      }
      return field;
    }));
  };

  // 필드 순서 변경 핸들러
  const handleOrderChange = (fieldId: string, direction: "up" | "down") => {
    const updatedFields = [...formFields];
    const fieldIndex = updatedFields.findIndex(field => field.id === fieldId);
    
    if (fieldIndex === -1) return;
    
    const field = updatedFields[fieldIndex];
    const fieldGroup = field.field_group;
    
    // 특정 그룹에 속한 보이는 필드만 필터링
    const visibleFieldsInSameGroup = updatedFields.filter(
      f => f.field_group === fieldGroup && f.is_visible
    );
    
    // 현재 필드의 그룹 내 인덱스 찾기
    const fieldGroupIndex = visibleFieldsInSameGroup.findIndex(f => f.id === fieldId);
    
    if (direction === "up" && fieldGroupIndex > 0) {
      // 위로 이동
      const targetField = visibleFieldsInSameGroup[fieldGroupIndex - 1];
      const tempOrder = field.display_order;
      
      // 순서 변경
      updatedFields[fieldIndex].display_order = targetField.display_order;
      updatedFields[updatedFields.findIndex(f => f.id === targetField.id)].display_order = tempOrder;
    } else if (direction === "down" && fieldGroupIndex < visibleFieldsInSameGroup.length - 1) {
      // 아래로 이동
      const targetField = visibleFieldsInSameGroup[fieldGroupIndex + 1];
      const tempOrder = field.display_order;
      
      // 순서 변경
      updatedFields[fieldIndex].display_order = targetField.display_order;
      updatedFields[updatedFields.findIndex(f => f.id === targetField.id)].display_order = tempOrder;
    }
    
    // 그룹별로 필드를 재정렬하여 순서 값을 연속적으로 만듦
    const groupedForReorder: Record<string, FormFieldSetting[]> = {};
    
    // 각 그룹별로 필드 분류
    updatedFields.forEach(field => {
      const group = field.field_group || '기타';
      if (!groupedForReorder[group]) {
        groupedForReorder[group] = [];
      }
      groupedForReorder[group].push(field);
    });
    
    // 각 그룹 내에서 현재 display_order 기준으로 정렬 후 연속된 값으로 재할당
    const finalFields: FormFieldSetting[] = [];
    
    // 그룹 순서 정의
    const groupOrder = ['기본정보', '사고정보', '재해자정보', '첨부파일', '보고자정보', '기타'];
    
    // 각 그룹의 시작 순서값 계산
    let lastOrder = 0;
    
    // 그룹 순서대로 처리
    groupOrder.forEach(group => {
      if (!groupedForReorder[group]) return; // 해당 그룹이 없으면 건너뛰기
      
      const groupFields = groupedForReorder[group].sort((a, b) => a.display_order - b.display_order);
      
      // 그룹 내 시작 순서는 이전 그룹의 마지막 순서 + 1
      const startOrder = lastOrder + 1;
      
      // 연속된 순서값 할당
      groupFields.forEach((field, i) => {
        field.display_order = startOrder + i;
        finalFields.push(field);
      });
      
      // 이 그룹의 마지막 순서값 저장
      lastOrder = startOrder + groupFields.length - 1;
    });
    
    // 최종 정렬된 필드로 상태 업데이트
    setFormFields(finalFields);
    
    // 저장 안내 표시
    setSavingStatus("unsaved");
  };

  // 그리드 레이아웃 변경 핸들러
  const handleGridLayoutChange = (updatedFields: FormFieldSetting[]) => {
    setFormFields(updatedFields);
    setSavingStatus("unsaved");
  };

  // 그리드 열 수 변경 핸들러
  const handleGridColsChange = (value: number) => {
    setGridCols(value);
    setGridDimensions(prev => ({ ...prev, width: value }));
  };

  // 그리드 행 높이 변경 핸들러
  const handleGridRowHeightChange = (value: number) => {
    setGridRowHeight(value);
  };

  // 양식 설정 저장 핸들러
  const handleSaveSettings = async () => {
    try {
      setSavingStatus("saving");
      setError(null);
      
      // 수정된 필드 설정 적용
      const updatedFields = formFields.map(field => {
        // 그룹 설정 조정
        if (field.field_name === 'is_contractor' || field.field_name === 'contractor_name') {
          return { ...field, field_group: '기본정보' }; // 협력업체 정보는 기본정보 그룹으로 이동
        }
        
        if (field.field_name === 'first_report_time') {
          return { ...field, field_group: '기본정보' }; // 최초보고시간은 기본정보 그룹으로 이동
        }
        
        return field;
      });
      
      await updateFormSettings(currentReportType, updatedFields);
      
      // 로컬 스토리지 업데이트 (클라이언트가 새로운 설정을 바로 사용할 수 있도록)
      localStorage.setItem(`${currentReportType}_form_settings`, JSON.stringify(updatedFields));
      
      setSavingStatus("success");
      setTimeout(() => setSavingStatus("idle"), 3000);
    } catch (err: any) {
      setError(err.message || "보고서 양식 설정을 저장하는 중 오류가 발생했습니다.");
      setSavingStatus("error");
      console.error(`${currentReportType} 보고서 양식 설정 저장 오류:`, err);
    }
  };

  // 양식 설정 초기화 핸들러
  const handleResetSettings = async () => {
    if (!confirm("정말 양식 설정을 초기화하시겠습니까? 모든 변경사항이 기본값으로 되돌아갑니다.")) {
      return;
    }
    
    try {
      setResettingStatus("resetting");
      setError(null);
      
      // 현재 재해자 수 필드 설정 저장
      const currentVictimCountSetting = formFields.find(field => field.field_name === 'victim_count');
      
      const resetSettings = await resetFormSettings(currentReportType);
      
      // 백엔드에서 데이터가 없으면 오류 표시 후 함수 종료
      if (!resetSettings || !Array.isArray(resetSettings)) {
        throw new Error("초기화된 설정 데이터를 받지 못했습니다");
      }
      
      // 필요한 필드만 필터링하고 그룹 설정 조정
      const filteredSettings = resetSettings
        .filter(field => {
          // 폼에 없는 필드는 무시
          const nonExistingFields = ['work_related_type', 'misc_classification', 'victims_json'];
          return !nonExistingFields.includes(field.field_name);
        })
        .map(field => {
          // 그룹 설정 조정
          if (field.field_name === 'is_contractor' || field.field_name === 'contractor_name') {
            return { ...field, field_group: '기본정보' }; // 협력업체 정보는 기본정보 그룹으로 이동
          }
          
          if (field.field_name === 'first_report_time') {
            return { ...field, field_group: '기본정보' }; // 최초보고시간은 기본정보 그룹으로 이동
          }
          
          // 재해자 수 필드 설정 유지
          if (field.field_name === 'victim_count' && currentVictimCountSetting) {
            return { ...field, ...currentVictimCountSetting };
          }
          
          return field;
        });
      
      setFormFields(filteredSettings);
      
      // 로컬 스토리지 업데이트 (클라이언트가 새로운 설정을 바로 사용할 수 있도록)
      localStorage.setItem(`${currentReportType}_form_settings`, JSON.stringify(filteredSettings));
      
      setResettingStatus("success");
      setTimeout(() => setResettingStatus("idle"), 3000);
    } catch (err: any) {
      setError(err.message || "보고서 양식 설정을 초기화하는 중 오류가 발생했습니다.");
      setResettingStatus("error");
      console.error(`${currentReportType} 보고서 양식 설정 초기화 오류:`, err);
    }
  };

  // 상태 표시 버튼 스타일 및 텍스트
  const getSaveButtonStyle = () => {
    switch (savingStatus) {
      case "saving":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "success":
        return "bg-green-500 hover:bg-green-600";
      case "error":
        return "bg-red-500 hover:bg-red-600";
      case "unsaved":
        return "bg-blue-500 hover:bg-blue-600 animate-pulse";
      default:
        return "bg-blue-500 hover:bg-blue-600";
    }
  };

  const getSaveButtonText = () => {
    switch (savingStatus) {
      case "saving":
        return "저장 중...";
      case "success":
        return "저장 완료!";
      case "error":
        return "저장 실패";
      case "unsaved":
        return "변경사항 저장";
      default:
        return "변경사항 저장";
    }
  };

  const getResetButtonStyle = () => {
    switch (resettingStatus) {
      case "resetting":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "success":
        return "bg-green-500 hover:bg-green-600";
      case "error":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const getResetButtonText = () => {
    switch (resettingStatus) {
      case "resetting":
        return "초기화 중...";
      case "success":
        return "초기화 완료!";
      case "error":
        return "초기화 실패";
      default:
        return "기본값으로 초기화";
    }
  };

  return (
    <div className="bg-white p-6 rounded-md shadow">
      <h1 className="text-2xl font-bold mb-6">보고서 양식 설정</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* 보고서 유형 탭 */}
      <div className="mb-6 border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
          <li className="mr-2">
            <button
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === "occurrence"
                  ? "text-blue-600 border-b-2 border-blue-600 active"
                  : "text-gray-500 border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300"
              }`}
              onClick={() => handleReportTypeChange("occurrence")}
            >
              발생보고서
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === "investigation"
                  ? "text-blue-600 border-b-2 border-blue-600 active"
                  : "text-gray-500 border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300"
              }`}
              onClick={() => handleReportTypeChange("investigation")}
              disabled={true} // 조사보고서는 아직 구현 안함
            >
              조사보고서 (준비중)
            </button>
          </li>
        </ul>
      </div>
      
      {/* 양식 설정 정보 */}
      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          {currentReportType === "occurrence" ? "발생보고서" : "조사보고서"} 양식의 항목 표시 여부, 필수 항목 지정, 순서 등을 설정할 수 있습니다.
          변경 사항은 저장 후 새로 작성되는 보고서부터 적용됩니다.
        </p>
        
        <div className="flex gap-2 mb-6">
          <button
            className={`px-4 py-2 text-white rounded ${getSaveButtonStyle()}`}
            onClick={handleSaveSettings}
            disabled={savingStatus === "saving"}
          >
            {getSaveButtonText()}
          </button>
          
          <button
            className={`px-4 py-2 text-white rounded ${getResetButtonStyle()}`}
            onClick={handleResetSettings}
            disabled={resettingStatus === "resetting"}
          >
            {getResetButtonText()}
          </button>
        </div>

        {/* 뷰 모드 선택 */}
        <div className="mb-4 border-b border-gray-200">
          <ul className="flex flex-wrap -mb-px text-sm font-medium">
            <li className="mr-2">
              <button
                className={`inline-block p-2 rounded-t-lg ${
                  viewMode === "list"
                    ? "text-blue-600 border-b-2 border-blue-600 active"
                    : "text-gray-500 border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300"
                }`}
                onClick={() => setViewMode("list")}
              >
                목록 뷰
              </button>
            </li>
            <li className="mr-2">
              <button
                className={`inline-block p-2 rounded-t-lg ${
                  viewMode === "grid"
                    ? "text-blue-600 border-b-2 border-blue-600 active"
                    : "text-gray-500 border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300"
                }`}
                onClick={() => setViewMode("grid")}
              >
                그리드 레이아웃
              </button>
            </li>
          </ul>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : viewMode === "list" ? (
        /* 필드 그룹별 항목 설정 목록 */
        <div className="space-y-8">
          {Object.entries(groupedFields).map(([group, fields]) => (
            <div key={group} className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">{group}</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        필드명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        표시 여부
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        필수 여부
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        표시 순서
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fields.map((field) => (
                      <tr key={field.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {field.display_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {field.field_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              checked={field.is_visible}
                              onChange={(e) => handleVisibilityChange(field.id!, e.target.checked)}
                            />
                            <span className="ml-2 text-sm text-gray-600">
                              {field.is_visible ? "표시" : "숨김"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              checked={field.is_required}
                              onChange={(e) => handleRequiredChange(field.id!, e.target.checked)}
                              disabled={!field.is_visible} // 숨김 필드는 필수 설정 불가
                            />
                            <span className="ml-2 text-sm text-gray-600">
                              {field.is_required ? "필수" : "선택"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <button
                              className="p-1 bg-gray-100 hover:bg-gray-200 rounded"
                              onClick={() => handleOrderChange(field.id!, "up")}
                              disabled={!field.is_visible} // 숨김 필드는 순서 변경 불가
                            >
                              <span className="sr-only">위로</span>
                              ↑
                            </button>
                            <button
                              className="p-1 bg-gray-100 hover:bg-gray-200 rounded"
                              onClick={() => handleOrderChange(field.id!, "down")}
                              disabled={!field.is_visible} // 숨김 필드는 순서 변경 불가
                            >
                              <span className="sr-only">아래로</span>
                              ↓
                            </button>
                            <span className="ml-2">{field.display_order}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 그리드 레이아웃 에디터 */
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">그리드 레이아웃 설정</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  그리드 가로 칸 수
                </label>
                <div className="flex items-center">
                  <input
                    type="range"
                    min="3"
                    max="24"
                    value={gridCols}
                    onChange={(e) => handleGridColsChange(parseInt(e.target.value))}
                    className="mr-2 w-full"
                  />
                  <span className="text-sm text-gray-500 w-10 text-right">{gridCols}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  행 높이 (픽셀)
                </label>
                <div className="flex items-center">
                  <input
                    type="range"
                    min="30"
                    max="100"
                    step="5"
                    value={gridRowHeight}
                    onChange={(e) => handleGridRowHeightChange(parseInt(e.target.value))}
                    className="mr-2 w-full"
                  />
                  <span className="text-sm text-gray-500 w-10 text-right">{gridRowHeight}</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mt-4">
                  * 항목을 드래그하여 위치를 변경하고, 모서리를 드래그하여 크기를 조절할 수 있습니다.
                </p>
              </div>
            </div>
            
            <GridLayoutEditor 
              fields={formFields}
              onLayoutChange={handleGridLayoutChange}
              cols={gridCols}
              rowHeight={gridRowHeight}
              gridDimensions={gridDimensions}
              reportType={currentReportType}
            />
          </div>
        </div>
      )}
    </div>
  );
} 