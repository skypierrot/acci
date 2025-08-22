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
import { TrendChartData } from '../types';

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
  data: TrendChartData[];
  yearRange?: number;
  onYearRangeChange?: (range: number) => void;
  loading?: boolean;
}

export const BasicTrendChart: React.FC<Props> = ({ data, yearRange = 5, onYearRangeChange, loading }) => {
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
        label: '재해건수',
        data: recentData.map(d => d.accidentCount),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#3B82F6',
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
        label: '재해자수',
        data: recentData.map(d => d.victimCount),
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
      },
      {
        type: 'bar' as const,
        label: '물적피해',
        data: recentData.map(d => d.propertyDamage),
        backgroundColor: (ctx: any) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
          gradient.addColorStop(1, 'rgba(239, 68, 68, 0.2)');
          return gradient;
        },
        borderColor: '#EF4444',
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
            if (context.dataset.label === '물적피해') {
              return `${context.dataset.label}: ${(context.parsed.y / 1000000).toFixed(1)}백만원`;
            }
            return `${context.dataset.label}: ${context.parsed.y}${context.dataset.label === '재해건수' ? '건' : '명'}`;
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
          text: '건수 / 명',
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
          text: '피해금액 (백만원)',
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
            return `${(Number(value) / 1000000).toFixed(0)}M`;
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
          <h3 className="text-lg font-bold text-gray-900 mb-1">재해 현황 추이</h3>
          <p className="text-sm text-gray-500">사고건수 및 재해자수 변화</p>
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