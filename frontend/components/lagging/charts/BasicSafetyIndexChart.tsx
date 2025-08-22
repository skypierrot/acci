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
import { SafetyIndexChartData, ConstantType } from '../types';

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
  data: SafetyIndexChartData[];
  yearRange?: number;
  constant: ConstantType;
  loading?: boolean;
}

export const BasicSafetyIndexChart: React.FC<Props> = ({ 
  data, 
  yearRange = 5, 
  constant,
  loading 
}) => {
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
        label: 'LTIR',
        data: recentData.map(d => d.ltir),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        yAxisID: 'y',
      },
      {
        type: 'line' as const,
        label: 'TRIR',
        data: recentData.map(d => d.trir),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        yAxisID: 'y',
      },
      {
        type: 'bar' as const,
        label: '강도율',
        data: recentData.map(d => d.severityRate),
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
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
        text: `안전지표 추이 (${constant === 200000 ? '20만시' : '100만시'} 기준)`,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y.toFixed(2);
            return `${context.dataset.label}: ${value}`;
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
          text: 'LTIR / TRIR',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: '강도율',
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
        * LTIR: Lost Time Injury Rate (사망, 중상, 경상, 기타)
        <br />
        * TRIR: Total Recordable Injury Rate (사망, 중상, 경상, 병원치료, 기타)
        <br />
        * 강도율: 근로손실일수 / 근로시간 × 1,000
      </div>
    </div>
  );
};