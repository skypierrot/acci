import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { DetailedChartData } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Props {
  accidentData: DetailedChartData[];
  victimData: DetailedChartData[];
  yearRange?: number;
  loading?: boolean;
}

// 사업장별 색상 팔레트
const SITE_COLORS = [
  '#A8D5BA', // 소프트 민트
  '#F4C2A1', // 피치  
  '#C7B7D1', // 소프트 라벤더
  '#B8D4E3', // 소프트 블루
  '#F7D794', // 소프트 옐로우
  '#D4A5A5', // 소프트 로즈
  '#A8C6DF', // 소프트 스카이
  '#C8E6C9', // 소프트 그린
];

// 색상 조정 함수들
const darkenColor = (color: string, amount: number = 0.3) => {
  const hex = color.replace('#', '');
  const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - Math.round(255 * amount));
  const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - Math.round(255 * amount));
  const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - Math.round(255 * amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const lightenColor = (color: string, amount: number = 0.15) => {
  const hex = color.replace('#', '');
  const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + Math.round(255 * amount));
  const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + Math.round(255 * amount));
  const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + Math.round(255 * amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

export const DetailedAccidentChart: React.FC<Props> = ({ 
  accidentData, 
  victimData,
  yearRange = 10, 
  loading 
}) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">상세 차트 데이터를 준비하는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 데이터 정렬 및 필터링
  const sortedAccidentData = [...accidentData].sort((a, b) => a.year - b.year);
  const sortedVictimData = [...victimData].sort((a, b) => a.year - b.year);
  const recentAccidentData = sortedAccidentData.slice(-yearRange);
  const recentVictimData = sortedVictimData.slice(-yearRange);

  // 사업장 목록 추출
  const sites = React.useMemo(() => {
    const allSites = new Set<string>();
    recentAccidentData.forEach(d => {
      if (d.bysite) {
        Object.keys(d.bysite).forEach(site => allSites.add(site));
      }
    });
    return Array.from(allSites);
  }, [recentAccidentData]);

  // 차트 데이터 준비
  const chartData = React.useMemo(() => {
    const years = recentAccidentData.map(d => d.year);
    const datasets: any[] = [];

    // 1. 재해자수 라인 (좌측 Y축) 
    datasets.push({
      type: 'line' as const,
      label: '총 재해자수',
      data: recentVictimData.map(d => d.total),
      borderColor: '#F59E0B',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      borderWidth: 3,
      pointBackgroundColor: '#F59E0B',
      pointBorderColor: '#FFFFFF',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8,
      tension: 0.4,
      fill: true,
      yAxisID: 'y',
      order: 1
    });

    // 2. 임직원/협력업체 재해자수 라인 (좌측 Y축)
    datasets.push({
      type: 'line' as const,
      label: '임직원 재해자수',
      data: recentVictimData.map(d => d.employee),
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.05)',
      borderWidth: 2,
      borderDash: [5, 5],
      pointBackgroundColor: '#3B82F6',
      pointBorderColor: '#FFFFFF',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.4,
      fill: false,
      yAxisID: 'y',
      order: 2
    });

    datasets.push({
      type: 'line' as const,
      label: '협력업체 재해자수',
      data: recentVictimData.map(d => d.contractor),
      borderColor: '#EF4444',
      backgroundColor: 'rgba(239, 68, 68, 0.05)',
      borderWidth: 2,
      borderDash: [3, 3],
      pointBackgroundColor: '#EF4444',
      pointBorderColor: '#FFFFFF',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.4,
      fill: false,
      yAxisID: 'y',
      order: 3
    });

    // 3. 사업장별 총 사고건수 적층 막대 (추가 정보로 표시)
    sites.forEach((site, siteIndex) => {
      const baseColor = SITE_COLORS[siteIndex % SITE_COLORS.length];
      
      datasets.push({
        type: 'bar' as const,
        label: `${site} 사고건수`,
        data: recentAccidentData.map(d => d.bysite?.[site] || 0),
        backgroundColor: `${baseColor}AA`, // 67% 투명도
        borderColor: baseColor,
        borderWidth: 1,
        borderRadius: 2,
        borderSkipped: false,
        yAxisID: 'y1',
        stack: 'sites', // 적층형 막대로 설정
        order: 4 + siteIndex
      });
    });

    return {
      labels: years,
      datasets
    };
  }, [recentAccidentData, recentVictimData, sites]);

  // 차트 옵션
  const options: ChartOptions<'line' | 'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        align: 'center' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
          font: {
            size: 11,
            weight: '500',
          },
          color: '#374151',
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            return datasets.map((dataset, i) => ({
              text: dataset.label || '',
              fillStyle: dataset.type === 'line' ? dataset.borderColor : dataset.backgroundColor,
              strokeStyle: dataset.borderColor,
              lineWidth: dataset.type === 'line' ? 3 : 0,
              pointStyle: dataset.type === 'line' ? 'circle' : 'rect',
              hidden: !chart.isDatasetVisible(i),
              datasetIndex: i
            }));
          }
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#111827',
        bodyColor: '#374151',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        usePointStyle: true,
        callbacks: {
          title: (context) => {
            return `${context[0].label}년`;
          },
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            
            if (label.includes('재해자수')) {
              return `${label}: ${value}명`;
            } else {
              return `${label}: ${value}건`;
            }
          },
          labelPointStyle: (context) => {
            return {
              pointStyle: context.dataset.type === 'bar' ? 'rect' : 'circle',
              rotation: 0
            };
          },
          footer: (tooltipItems) => {
            const totalVictims = tooltipItems
              .filter(item => item.dataset.label?.includes('총 재해자수'))
              .map(item => item.parsed.y)[0];
            const employeeVictims = tooltipItems
              .filter(item => item.dataset.label?.includes('임직원 재해자수'))
              .map(item => item.parsed.y)[0];
            const contractorVictims = tooltipItems
              .filter(item => item.dataset.label?.includes('협력업체 재해자수'))
              .map(item => item.parsed.y)[0];
            
            let footer = '';
            if (totalVictims !== undefined) {
              footer += `총 재해자수: ${totalVictims}명\n`;
            }
            if (employeeVictims !== undefined && contractorVictims !== undefined) {
              footer += `임직원: ${employeeVictims}명, 협력업체: ${contractorVictims}명`;
            }
            return footer;
          }
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
            weight: '500',
          },
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: '재해자수 (명)',
          color: '#374151',
          font: {
            size: 12,
            weight: '600',
          },
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
          lineWidth: 1,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          },
          callback: function(value) {
            return `${value}`;
          },
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: '사업장별 사고건수 (건)',
          color: '#374151',
          font: {
            size: 12,
            weight: '600',
          },
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          },
          callback: function(value) {
            return `${value}건`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">통합 사고 분석 차트</h3>
          <p className="text-sm text-gray-500">재해자수 추이 및 사업장별 사고건수 상세 분석</p>
        </div>
        <div className="text-sm text-gray-600">
          최근 {yearRange}개년 데이터
        </div>
      </div>
      
      <div className="h-96 mb-4">
        <Chart type='bar' data={chartData} options={options} />
      </div>
      
      {/* 차트 설명 */}
      <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <p className="font-medium text-gray-800 mb-1">📈 재해자수 추이</p>
            <p>• <span className="text-orange-500 font-medium">주황색 실선</span>: 총 재해자수</p>
            <p>• <span className="text-blue-500 font-medium">파란색 점선</span>: 임직원 재해자수</p>
            <p>• <span className="text-red-500 font-medium">빨간색 점선</span>: 협력업체 재해자수</p>
          </div>
          <div>
            <p className="font-medium text-gray-800 mb-1">🏭 사업장별 사고</p>
            <p>• <span className="text-gray-600 font-medium">적층 막대</span>: 각 사업장별</p>
            <p className="text-xs text-gray-500">사고건수 합계 표시</p>
          </div>
          <div>
            <p className="font-medium text-gray-800 mb-1">📊 데이터 구분</p>
            <p className="text-xs text-gray-500">좌축: 재해자수 (명)</p>
            <p className="text-xs text-gray-500">우축: 사고건수 (건)</p>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            💡 모든 데이터는 사고지표 카드와 동일한 산출 방법 적용 | 적층형 막대는 전체 사업장별 사고 합계를 시각화
          </p>
        </div>
      </div>
    </div>
  );
};