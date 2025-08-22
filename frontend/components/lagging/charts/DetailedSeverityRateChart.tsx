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

interface DetailedSeverityData {
  year: number;
  severityRate: {
    total: number;
    employee: number;
    contractor: number;
  };
  lossDays: {
    total: number;
    employee: number;
    contractor: number;
  };
}

interface Props {
  data: DetailedSeverityData[];
  yearRange?: number;
  loading?: boolean;
}

export const DetailedSeverityRateChart: React.FC<Props> = ({ 
  data, 
  yearRange = 10,
  loading 
}) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">강도율 상세 차트를 준비하는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 데이터 정렬 및 필터링
  const sortedData = [...data].sort((a, b) => a.year - b.year);
  const recentData = sortedData.slice(-yearRange);

  // 통합 차트 데이터 준비
  const chartData = React.useMemo(() => {
    const years = recentData.map(d => d.year);
    
    return {
      labels: years,
      datasets: [
        // 강도율 라인 차트들 (좌측 Y축)
        {
          type: 'line' as const,
          label: '강도율 종합',
          data: recentData.map(d => d.severityRate.total),
          borderColor: '#DC2626', // 진한 빨간색 - 경고/위험 강조
          backgroundColor: 'rgba(220, 38, 38, 0.12)',
          borderWidth: 3,
          pointBackgroundColor: '#DC2626',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          tension: 0.4,
          fill: true,
          yAxisID: 'y',
          order: 1
        },
        {
          type: 'line' as const,
          label: '강도율 임직원',
          data: recentData.map(d => d.severityRate.employee),
          borderColor: '#1E40AF', // 진한 파란색 - 임직원
          backgroundColor: 'rgba(30, 64, 175, 0.05)',
          borderWidth: 2,
          borderDash: [5, 5],
          pointBackgroundColor: '#1E40AF',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.4,
          fill: false,
          yAxisID: 'y',
          order: 2
        },
        {
          type: 'line' as const,
          label: '강도율 협력업체',
          data: recentData.map(d => d.severityRate.contractor),
          borderColor: '#B45309', // 진한 오렌지색 - 협력업체
          backgroundColor: 'rgba(180, 83, 9, 0.05)',
          borderWidth: 2,
          borderDash: [5, 5],
          pointBackgroundColor: '#B45309',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.4,
          fill: false,
          yAxisID: 'y',
          order: 3
        },
        // 근로손실일수 스택 막대 (우측 Y축)
        {
          type: 'bar' as const,
          label: '임직원 손실일수',
          data: recentData.map(d => d.lossDays.employee),
          backgroundColor: 'rgba(16, 185, 129, 0.8)', // 밝은 청록색 - 임직원
          borderColor: '#10B981',
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
          yAxisID: 'y1',
          stack: 'lossDays',
          order: 4
        },
        {
          type: 'bar' as const,
          label: '협력업체 손실일수',
          data: recentData.map(d => d.lossDays.contractor),
          backgroundColor: 'rgba(251, 146, 60, 0.8)', // 밝은 오렌지색 - 협력업체
          borderColor: '#FB923C',
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
          yAxisID: 'y1',
          stack: 'lossDays',
          order: 5
        }
      ]
    };
  }, [recentData]);

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
            
            if (label.includes('강도율')) {
              return `${label}: ${value.toFixed(2)}`;
            } else {
              return `${label}: ${value.toLocaleString()}일`;
            }
          },
          labelPointStyle: (context) => {
            return {
              pointStyle: context.dataset.type === 'bar' ? 'rect' : 'circle',
              rotation: 0
            };
          },
          footer: (tooltipItems) => {
            const severityTotal = tooltipItems
              .filter(item => item.dataset.label?.includes('강도율 종합'))
              .map(item => item.parsed.y)[0];
            const lossDaysEmployee = tooltipItems
              .filter(item => item.dataset.label?.includes('임직원 손실일수'))
              .map(item => item.parsed.y)[0] || 0;
            const lossDaysContractor = tooltipItems
              .filter(item => item.dataset.label?.includes('협력업체 손실일수'))
              .map(item => item.parsed.y)[0] || 0;
            
            let footer = '';
            if (severityTotal !== undefined) {
              footer += `강도율 종합: ${severityTotal.toFixed(2)}\n`;
            }
            if (lossDaysEmployee !== undefined && lossDaysContractor !== undefined) {
              const totalLossDays = lossDaysEmployee + lossDaysContractor;
              footer += `총 손실일수: ${totalLossDays.toLocaleString()}일`;
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
          text: '강도율',
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
            return Number(value).toFixed(1);
          },
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: '근로손실일수',
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
            return `${Number(value).toLocaleString()}일`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">강도율 상세 분석</h3>
          <p className="text-sm text-gray-500">강도율 및 근로손실일수 상세 추이</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <p className="font-medium text-gray-800 mb-2">📈 강도율 (Severity Rate)</p>
            <p>• <span className="text-red-600 font-medium">실선</span>: 종합 강도율 (면적 표시)</p>
            <p>• <span className="text-blue-800 font-medium">점선</span>: 임직원별 강도율</p>
            <p>• <span className="text-amber-700 font-medium">점선</span>: 협력업체별 강도율</p>
          </div>
          <div>
            <p className="font-medium text-gray-800 mb-2">📊 근로손실일수</p>
            <p>• <span className="text-emerald-500 font-medium">막대</span>: 임직원 손실일수</p>
            <p>• <span className="text-orange-500 font-medium">막대</span>: 협력업체 손실일수</p>
            <p className="text-xs text-gray-500 mt-2">💡 스택형으로 전체 손실일수 표시</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            <strong>강도율 산식:</strong> 근로손실일수 ÷ 근로시간 × 1,000 | <strong>사망자 환산:</strong> 7,500일 | <strong>손실일수:</strong> 복귀일 - 휴업시작일 + 1
          </p>
        </div>
      </div>
    </div>
  );
};