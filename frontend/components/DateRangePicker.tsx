"use client";

import React, { useState } from 'react';
// import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
}

// 최근 9개 년도(올해~과거) 배열 생성
function getRecentYears(count = 9) {
  const thisYear = new Date().getFullYear();
  return Array.from({ length: count }, (_, i) => thisYear - i);
}

// 1~12월 한국어 라벨 배열
const MONTH_LABELS = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월'
];

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  placeholder = "월 범위 선택",
  className = ""
}) => {
  // 내부 상태: 어떤 필드를 선택 중인지, 년/월 선택 단계 구분
  const [isOpen, setIsOpen] = useState(false);
  const [selecting, setSelecting] = useState<'start' | 'end' | null>(null);
  const [yearStep, setYearStep] = useState<'start' | 'end' | null>(null); // 년도 선택 단계
  const [tempYear, setTempYear] = useState<number | null>(null); // 월 선택용 임시 년도

  // 년/월 선택 핸들러
  const handleYearClick = (year: number) => {
    setTempYear(year);
    setYearStep(null); // 월 선택 단계로 전환
  };
  const handleMonthClick = (monthIdx: number) => {
    if (tempYear === null) return;
    const date = new Date(tempYear, monthIdx, 1);
    if (selecting === 'start') {
      onStartDateChange(date);
      // UX: 시작월 선택 후 바로 종료월 선택으로 전환
      setSelecting('end');
      setYearStep('end');
      setTempYear(null);
    } else if (selecting === 'end') {
      onEndDateChange(date);
      setIsOpen(false);
      setSelecting(null);
      setYearStep(null);
      setTempYear(null);
    }
  };

  // YYYY-MM 포맷 문자열 반환
  const formatYYYYMM = (date: Date | null) => {
    if (!date) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  // 범위 표시 문자열
  const formatRange = () => {
    if (!startDate && !endDate) return placeholder;
    if (startDate && endDate) return `${formatYYYYMM(startDate)} ~ ${formatYYYYMM(endDate)}`;
    if (startDate) return `${formatYYYYMM(startDate)} ~`;
    if (endDate) return `~ ${formatYYYYMM(endDate)}`;
    return placeholder;
  };

  // 초기화
  const clearDates = () => {
    onStartDateChange(null);
    onEndDateChange(null);
    setSelecting(null);
    setYearStep(null);
    setTempYear(null);
  };

  // 년도 그리드 렌더링
  const renderYearGrid = (step: 'start' | 'end') => (
    <div className="grid grid-cols-3 gap-2 p-2">
      {getRecentYears().map((year) => (
        <button
          key={year}
          className="border rounded p-2 hover:bg-blue-100 text-center"
          onClick={() => handleYearClick(year)}
        >
          {year}
        </button>
      ))}
    </div>
  );

  // 월 그리드 렌더링
  const renderMonthGrid = () => (
    <div className="grid grid-cols-4 gap-2 p-2">
      {MONTH_LABELS.map((label, idx) => (
        <button
          key={label}
          className="border rounded p-2 hover:bg-blue-100 text-center"
          onClick={() => handleMonthClick(idx)}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center">
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => { setIsOpen(!isOpen); setSelecting('start'); setYearStep('start'); setTempYear(null); }}
            className="w-full border border-gray-300 rounded-md p-2 text-sm text-left bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <span className={!startDate && !endDate ? "text-gray-500" : ""}>
              {formatRange()}
            </span>
          </button>
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={clearDates}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
      </div>
      {isOpen && (
        <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg min-w-[320px]">
          <div className="p-4">
            {/* 년/월 선택 UI */}
            <div className="mb-2 flex gap-2">
              <button
                className={`px-3 py-1 rounded ${selecting === 'start' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                onClick={() => { setSelecting('start'); setYearStep('start'); setTempYear(null); }}
              >
                시작월
              </button>
              <button
                className={`px-3 py-1 rounded ${selecting === 'end' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                onClick={() => { setSelecting('end'); setYearStep('end'); setTempYear(null); }}
              >
                종료월
              </button>
            </div>
            {/* 년도 → 월 선택 단계 */}
            {yearStep && renderYearGrid(yearStep)}
            {!yearStep && renderMonthGrid()}
            <div className="mt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={clearDates}
                className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                초기화
              </button>
              <button
                type="button"
                onClick={() => { setIsOpen(false); setSelecting(null); setYearStep(null); setTempYear(null); }}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker; 