import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { DetailedChartData } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  accidentData: DetailedChartData[];
  victimData: DetailedChartData[];
  yearRange?: number;
  loading?: boolean;
}

export const DetailedAccidentChart: React.FC<Props> = ({ 
  accidentData, 
  victimData,
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

  const recentData = accidentData.slice(-yearRange);
  const sites = new Set<string>();
  
  recentData.forEach(d => {
    if (d.bysite) {
      Object.keys(d.bysite).forEach(site => sites.add(site));
    }
  });

  const siteColors = [
    'rgba(59, 130, 246, 0.8)',
    'rgba(251, 146, 60, 0.8)',
    'rgba(34, 197, 94, 0.8)',
    'rgba(168, 85, 247, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(99, 102, 241, 0.8)',
  ];

  const datasets = Array.from(sites).map((site, index) => ({
    label: site,
    data: recentData.map(d => d.bysite?.[site] || 0),
    backgroundColor: siteColors[index % siteColors.length],
    stack: 'stack1',
  }));

  const chartData = {
    labels: recentData.map(d => d.year),
    datasets,
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '사업장별 재해건수 상세',
      },
      tooltip: {
        callbacks: {
          footer: (tooltipItems) => {
            const total = tooltipItems.reduce((sum, item) => sum + item.parsed.y, 0);
            return `전체: ${total}건`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: '사고 건수',
        },
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="h-80">
        <Bar data={chartData} options={options} />
      </div>
      <div className="mt-4 text-xs text-gray-500">
        * 최근 {yearRange}개년 사업장별 사고 분포
        <br />
        * 스택 차트로 전체 대비 사업장별 비중 확인 가능
      </div>
    </div>
  );
};