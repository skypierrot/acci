import React from 'react';
import { InvestigationReport } from '../../types/investigation.types';

interface AccidentComparisonSectionProps {
  report: InvestigationReport;
}

export const AccidentComparisonSection: React.FC<AccidentComparisonSectionProps> = ({ report }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">사고 정보 비교</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">구분</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">원본 정보</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">조사 수정 정보</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">사고번호</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{report.original_global_accident_no || '-'}</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{report.investigation_global_accident_no || '-'}</td>
            </tr>
            
            <tr>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">발생일시</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                {report.original_acci_time 
                  ? new Date(report.original_acci_time).toLocaleString('ko-KR')
                  : '-'
                }
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                {report.investigation_acci_time 
                  ? new Date(report.investigation_acci_time).toLocaleString('ko-KR')
                  : '-'
                }
              </td>
            </tr>
            
            <tr>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">기상정보</td>
              <td className="px-4 py-4 text-sm text-gray-900">
                <div className="space-y-1">
                  <div>날씨: {report.original_weather || '-'}</div>
                  <div>온도: {report.original_temperature !== undefined && report.original_temperature !== null ? `${report.original_temperature}°C` : '-'}</div>
                  <div>습도: {report.original_humidity !== undefined && report.original_humidity !== null ? `${report.original_humidity}%` : '-'}</div>
                  <div>바람: {report.original_wind_speed !== undefined && report.original_wind_speed !== null ? `${report.original_wind_speed}m/s` : '-'}</div>
                  {report.original_weather_special && <div>특보: {report.original_weather_special}</div>}
                </div>
              </td>
              <td className="px-4 py-4 text-sm text-gray-900">
                <div className="space-y-1">
                  <div>날씨: {report.investigation_weather || '-'}</div>
                  <div>온도: {report.investigation_temperature !== undefined && report.investigation_temperature !== null ? `${report.investigation_temperature}°C` : '-'}</div>
                  <div>습도: {report.investigation_humidity !== undefined && report.investigation_humidity !== null ? `${report.investigation_humidity}%` : '-'}</div>
                  <div>바람: {report.investigation_wind_speed !== undefined && report.investigation_wind_speed !== null ? `${report.investigation_wind_speed}m/s` : '-'}</div>
                  {report.investigation_weather_special && <div>특보: {report.investigation_weather_special}</div>}
                </div>
              </td>
            </tr>
            
            <tr>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">발생장소</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{report.original_acci_location || '-'}</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{report.investigation_acci_location || '-'}</td>
            </tr>
            
            <tr>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">사고유형</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                {report.original_accident_type_level1 && report.original_accident_type_level2
                  ? `${report.original_accident_type_level1} / ${report.original_accident_type_level2}`
                  : '-'
                }
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                {report.investigation_accident_type_level1 && report.investigation_accident_type_level2
                  ? `${report.investigation_accident_type_level1} / ${report.investigation_accident_type_level2}`
                  : '-'
                }
              </td>
            </tr>
            
            <tr>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">재해자 수</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{report.original_victim_count || 0}명</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{report.investigation_victim_count || 0}명</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}; 