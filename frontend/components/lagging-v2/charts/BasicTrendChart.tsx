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
import { TrendChartData } from '../types';

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

interface Props {
  data: TrendChartData[];
  yearRange?: number;
  loading?: boolean;
}

export const BasicTrendChart: React.FC<Props> = ({ data, yearRange = 5, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="h-64 flex items-center justify-center">
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
        label: '재해건수',
        data: recentData.map(d => d.accidentCount),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        yAxisID: 'y',
      },
      {
        type: 'line' as const,
        label: '재해자수',
        data: recentData.map(d => d.victimCount),
        borderColor: 'rgb(251, 146, 60)',
        backgroundColor: 'rgba(251, 146, 60, 0.1)',
        yAxisID: 'y',
      },
      {
        type: 'bar' as const,
        label: '물적피해',
        data: recentData.map(d => d.propertyDamage),
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
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
        text: '재해건수 및 재해자수 추이',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            if (context.dataset.label === '물적피해') {
              return `${context.dataset.label}: ₩${context.parsed.y.toLocaleString()}`;
            }
            return `${context.dataset.label}: ${context.parsed.y}`;
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
          text: '건수/명',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: '금액 (원)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="h-64">
        <Chart type='bar' data={chartData} options={options} />
      </div>
      <div className="mt-4 text-xs text-gray-500">
        * 최근 {yearRange}개년 데이터 표시
      </div>
    </div>
  );
};