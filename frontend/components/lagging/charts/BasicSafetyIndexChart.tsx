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
import { SafetyIndexChartData, ConstantType } from '../types';

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
  data: SafetyIndexChartData[];
  yearRange?: number;
  onYearRangeChange?: (range: number) => void;
  constant: ConstantType;
  loading?: boolean;
}

export const BasicSafetyIndexChart: React.FC<Props> = ({ 
  data, 
  yearRange = 5, 
  onYearRangeChange,
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

  // Sort by year ascending, then take last N years (최신년도가 오른쪽에 오도록)
  const sortedData = [...data].sort((a, b) => a.year - b.year);
  const recentData = sortedData.slice(-yearRange);

  const chartData = {
    labels: recentData.map(d => d.year),
    datasets: [
      {
        type: 'line' as const,
        label: 'LTIR',
        data: recentData.map(d => d.ltir),
        borderColor: '#22C55E',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#22C55E',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.4,
        fill: true,
        yAxisID: 'y',
      },
      {
        type: 'line' as const,
        label: 'TRIR',
        data: recentData.map(d => d.trir),
        borderColor: '#A855F7',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#A855F7',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.4,
        fill: true,
        yAxisID: 'y',
      },
      {
        type: 'bar' as const,
        label: '강도율',
        data: recentData.map(d => d.severityRate),
        backgroundColor: (ctx: any) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(99, 102, 241, 0.8)');
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0.2)');
          return gradient;
        },
        borderColor: '#6366F1',
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
        yAxisID: 'y1',
      },
    ],
  };

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
          padding: 20,
          font: {
            size: 12,
            weight: '500',
          },
          color: '#374151',
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            return datasets.map((dataset, i) => ({
              text: dataset.label || '',
              fillStyle: dataset.type === 'line' ? dataset.borderColor : dataset.borderColor,
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
        filter: function(tooltipItem) {
          return true;
        },
        callbacks: {
          title: (context) => {
            return `${context[0].label}년`;
          },
          label: (context) => {
            const value = context.parsed.y.toFixed(2);
            if (context.dataset.label === '강도율') {
              return `${context.dataset.label}: ${value}`;
            }
            return `${context.dataset.label}: ${value} (${constant === 200000 ? '20만시' : '100만시'} 기준)`;
          },
          labelPointStyle: (context) => {
            return {
              pointStyle: context.dataset.type === 'bar' ? 'rect' : 'circle',
              rotation: 0
            };
          },
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
          text: 'LTIR / TRIR',
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
          text: '강도율',
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
            return Number(value).toFixed(1);
          },
        },
      },
    },
  };

  const availableYears = [...new Set(data.map(d => d.year))].sort((a, b) => b - a);
  const maxYears = availableYears.length;

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">안전지표 추이</h3>
          <p className="text-sm text-gray-500">LTIR, TRIR 및 강도율 변화</p>
        </div>
        {onYearRangeChange && maxYears > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">기간:</span>
            <select
              value={yearRange}
              onChange={(e) => onYearRangeChange(parseInt(e.target.value))}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            >
              <option value={3}>최근 3년</option>
              <option value={5}>최근 5년</option>
              <option value={10}>최근 10년</option>
              <option value={maxYears}>전체년도 ({maxYears}년)</option>
            </select>
          </div>
        )}
      </div>
      <div className="h-80 mb-4">
        <Chart type='bar' data={chartData} options={options} />
      </div>
    </div>
  );
};