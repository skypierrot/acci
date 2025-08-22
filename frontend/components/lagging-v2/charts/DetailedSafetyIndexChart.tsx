import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ConstantType } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DetailedSafetyData {
  year: number;
  ltir: {
    total: number;
    employee: number;
    contractor: number;
  };
  trir: {
    total: number;
    employee: number;
    contractor: number;
  };
}

interface Props {
  data: DetailedSafetyData[];
  yearRange?: number;
  constant: ConstantType;
  loading?: boolean;
}

export const DetailedSafetyIndexChart: React.FC<Props> = ({ 
  data, 
  yearRange = 10,
  constant,
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

  const ltirChartData = {
    labels: recentData.map(d => d.year),
    datasets: [
      {
        label: 'LTIR 종합',
        data: recentData.map(d => d.ltir.total),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.1,
      },
      {
        label: 'LTIR 임직원',
        data: recentData.map(d => d.ltir.employee),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderDash: [5, 5],
        tension: 0.1,
      },
      {
        label: 'LTIR 협력업체',
        data: recentData.map(d => d.ltir.contractor),
        borderColor: 'rgb(251, 146, 60)',
        backgroundColor: 'rgba(251, 146, 60, 0.1)',
        borderDash: [5, 5],
        tension: 0.1,
      },
    ],
  };

  const trirChartData = {
    labels: recentData.map(d => d.year),
    datasets: [
      {
        label: 'TRIR 종합',
        data: recentData.map(d => d.trir.total),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        tension: 0.1,
      },
      {
        label: 'TRIR 임직원',
        data: recentData.map(d => d.trir.employee),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderDash: [5, 5],
        tension: 0.1,
      },
      {
        label: 'TRIR 협력업체',
        data: recentData.map(d => d.trir.contractor),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderDash: [5, 5],
        tension: 0.1,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: '지표 값',
        },
      },
    },
  };

  const ltirOptions = {
    ...options,
    plugins: {
      ...options.plugins,
      title: {
        display: true,
        text: `LTIR 상세 추이 (${constant === 200000 ? '20만시' : '100만시'} 기준)`,
      },
    },
  };

  const trirOptions = {
    ...options,
    plugins: {
      ...options.plugins,
      title: {
        display: true,
        text: `TRIR 상세 추이 (${constant === 200000 ? '20만시' : '100만시'} 기준)`,
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="h-64">
          <Line data={ltirChartData} options={ltirOptions} />
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="h-64">
          <Line data={trirChartData} options={trirOptions} />
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="text-xs text-gray-500">
          * 최근 {yearRange}개년 데이터 표시
          <br />
          * 실선: 종합 지표, 점선: 임직원/협력업체 구분 지표
          <br />
          * LTIR 대상: 사망, 중상, 경상, 기타
          <br />
          * TRIR 대상: 사망, 중상, 경상, 병원치료, 기타
        </div>
      </div>
    </div>
  );
};