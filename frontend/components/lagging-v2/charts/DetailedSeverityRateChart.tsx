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
  Legend
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
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const recentData = data.slice(-yearRange);

  const chartData = {
    labels: recentData.map(d => d.year),
    datasets: [
      {
        type: 'line' as const,
        label: '강도율 종합',
        data: recentData.map(d => d.severityRate.total),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        yAxisID: 'y',
        tension: 0.1,
      },
      {
        type: 'line' as const,
        label: '강도율 임직원',
        data: recentData.map(d => d.severityRate.employee),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        yAxisID: 'y',
        borderDash: [5, 5],
        tension: 0.1,
      },
      {
        type: 'line' as const,
        label: '강도율 협력업체',
        data: recentData.map(d => d.severityRate.contractor),
        borderColor: 'rgb(251, 146, 60)',
        backgroundColor: 'rgba(251, 146, 60, 0.1)',
        yAxisID: 'y',
        borderDash: [5, 5],
        tension: 0.1,
      },
      {
        type: 'bar' as const,
        label: '근로손실일수',
        data: recentData.map(d => d.lossDays.total),
        backgroundColor: 'rgba(156, 163, 175, 0.3)',
        yAxisID: 'y1',
      },
    ],
  };

  const options: ChartOptions<'line' | 'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '강도율 상세 추이',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            if (context.dataset.label === '근로손실일수') {
              return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}일`;
            }
            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: '강도율',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: '근로손실일수',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="h-80">
        <Chart type='bar' data={chartData} options={options} />
      </div>
      <div className="mt-4 text-xs text-gray-500">
        * 최근 {yearRange}개년 데이터 표시
        <br />
        * 강도율 = 근로손실일수 / 근로시간 × 1,000
        <br />
        * 사망 = 7,500일, 실제 근로손실일은 복귀일 - 휴업시작일
      </div>
    </div>
  );
};