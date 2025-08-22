import React from 'react';

interface Props {
  selectedYear: number;
  years: number[];
  onChange: (year: number) => void;
  loading?: boolean;
}

export const YearSelector: React.FC<Props> = ({ selectedYear, years, onChange, loading }) => {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="year-select" className="text-sm font-medium text-gray-700">
        조회년도:
      </label>
      <select
        id="year-select"
        value={selectedYear}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={loading}
        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}년
          </option>
        ))}
      </select>
    </div>
  );
};