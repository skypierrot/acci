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
import { ConstantType } from '../types';

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

// 빗살무늬 패턴 생성 함수
const createDiagonalPattern = (color: string, canvas?: HTMLCanvasElement) => {
  if (!canvas) return color;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return color;
  
  const patternCanvas = document.createElement('canvas');
  patternCanvas.width = 10;
  patternCanvas.height = 10;
  const patternCtx = patternCanvas.getContext('2d');
  
  if (!patternCtx) return color;
  
  // 배경색 설정
  patternCtx.fillStyle = color;
  patternCtx.fillRect(0, 0, 10, 10);
  
  // 빗살무늬 그리기
  patternCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  patternCtx.lineWidth = 1;
  patternCtx.beginPath();
  patternCtx.moveTo(0, 0);
  patternCtx.lineTo(10, 10);
  patternCtx.moveTo(-2, 8);
  patternCtx.lineTo(2, 12);
  patternCtx.moveTo(8, -2);
  patternCtx.lineTo(12, 2);
  patternCtx.stroke();
  
  return ctx.createPattern(patternCanvas, 'repeat') || color;
};

export const DetailedSafetyIndexChart: React.FC<Props> = ({ 
  data, 
  yearRange = 10,
  constant,
  loading 
}) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">안전지표 상세 차트를 준비하는 중...</p>
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
        // LTIR 종합 선형그래프 (좌측 Y축)
        {
          type: 'line' as const,
          label: 'LTIR 종합',
          data: recentData.map(d => d.ltir.total),
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
          order: 1
        },
        // TRIR 종합 선형그래프 (좌측 Y축)
        {
          type: 'line' as const,
          label: 'TRIR 종합',
          data: recentData.map(d => d.trir.total),
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
          order: 2
        },
        // LTIR 임직원 막대 (우측 Y축)
        {
          type: 'bar' as const,
          label: 'LTIR 임직원',
          data: recentData.map(d => d.ltir.employee),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: '#3B82F6',
          borderWidth: 2,
          borderRadius: 4,
          borderSkipped: false,
          yAxisID: 'y1',
          barThickness: 'flex',
          maxBarThickness: 50,
          order: 3
        },
        // LTIR 협력업체 막대 (우측 Y축)
        {
          type: 'bar' as const,
          label: 'LTIR 협력업체',
          data: recentData.map(d => d.ltir.contractor),
          backgroundColor: (ctx: any) => {
            const chart = ctx.chart;
            const {ctx: canvasCtx, chartArea} = chart;
            if (!chartArea || !canvasCtx) {
              return 'rgba(245, 158, 11, 0.8)';
            }
            return createDiagonalPattern('rgba(245, 158, 11, 0.8)', canvasCtx.canvas);
          },
          borderColor: '#F59E0B',
          borderWidth: 2,
          borderRadius: 4,
          borderSkipped: false,
          yAxisID: 'y1',
          barThickness: 'flex',
          maxBarThickness: 50,
          order: 4
        },
        // TRIR 임직원 막대 (우측 Y축)
        {
          type: 'bar' as const,
          label: 'TRIR 임직원',
          data: recentData.map(d => d.trir.employee),
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
          borderColor: '#6366F1',
          borderWidth: 2,
          borderRadius: 4,
          borderSkipped: false,
          yAxisID: 'y1',
          barThickness: 'flex',
          maxBarThickness: 50,
          order: 5
        },
        // TRIR 협력업체 막대 (우측 Y축)
        {
          type: 'bar' as const,
          label: 'TRIR 협력업체',
          data: recentData.map(d => d.trir.contractor),
          backgroundColor: (ctx: any) => {
            const chart = ctx.chart;
            const {ctx: canvasCtx, chartArea} = chart;
            if (!chartArea || !canvasCtx) {
              return 'rgba(239, 68, 68, 0.8)';
            }
            return createDiagonalPattern('rgba(239, 68, 68, 0.8)', canvasCtx.canvas);
          },
          borderColor: '#EF4444',
          borderWidth: 2,
          borderRadius: 4,
          borderSkipped: false,
          yAxisID: 'y1',
          barThickness: 'flex',
          maxBarThickness: 50,
          order: 6
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
            return datasets.map((dataset, i) => {
              let fillStyle = dataset.borderColor;
              
              if (dataset.type === 'line') {
                fillStyle = dataset.borderColor;
              } else if (dataset.type === 'bar') {
                // 막대그래프의 경우 실제 backgroundColor 가져오기
                if (typeof dataset.backgroundColor === 'function') {
                  // 협력업체의 경우 빗살무늬 패턴이므로 기본 색상 사용
                  if (dataset.label?.includes('협력업체')) {
                    if (dataset.label?.includes('LTIR')) {
                      fillStyle = 'rgba(245, 158, 11, 0.8)'; // 주황색
                    } else if (dataset.label?.includes('TRIR')) {
                      fillStyle = 'rgba(239, 68, 68, 0.8)'; // 빨간색
                    }
                  }
                } else {
                  fillStyle = dataset.backgroundColor;
                }
              }
              
              return {
                text: dataset.label || '',
                fillStyle: fillStyle,
                strokeStyle: dataset.borderColor,
                lineWidth: dataset.type === 'line' ? 3 : 0,
                pointStyle: dataset.type === 'line' ? 'circle' : 'rect',
                hidden: !chart.isDatasetVisible(i),
                datasetIndex: i
              };
            });
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
            const value = context.parsed.y.toFixed(2);
            const constantText = constant === 200000 ? '20만시' : '100만시';
            return `${label}: ${value} (${constantText} 기준)`;
          },
          labelPointStyle: (context) => {
            return {
              pointStyle: context.dataset.type === 'bar' ? 'rect' : 'circle',
              rotation: 0
            };
          },
          footer: (tooltipItems) => {
            const ltirTotal = tooltipItems
              .filter(item => item.dataset.label?.includes('LTIR 종합'))
              .map(item => item.parsed.y)[0];
            const trirTotal = tooltipItems
              .filter(item => item.dataset.label?.includes('TRIR 종합'))
              .map(item => item.parsed.y)[0];
            
            let footer = '';
            if (ltirTotal !== undefined) {
              footer += `LTIR 종합: ${ltirTotal.toFixed(2)}\n`;
            }
            if (trirTotal !== undefined) {
              footer += `TRIR 종합: ${trirTotal.toFixed(2)}`;
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
          text: 'LTIR/TRIR 종합 지표',
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
          text: '임직원/협력업체별 지표',
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

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            안전지표 상세 분석 ({constant === 200000 ? '20만시' : '100만시'} 기준)
          </h3>
          <p className="text-sm text-gray-500">LTIR/TRIR 종합 및 임직원/협력업체별 상세 추이</p>
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
            <p className="font-medium text-gray-800 mb-2">📈 종합 지표 (선형)</p>
            <p>• <span className="text-green-500 font-medium">녹색 선</span>: LTIR 종합</p>
            <p>• <span className="text-purple-500 font-medium">보라 선</span>: TRIR 종합</p>
            <p className="text-xs text-gray-500 mt-1">면적 채움으로 표시</p>
          </div>
          <div>
            <p className="font-medium text-gray-800 mb-2">📊 LTIR 구분 (막대)</p>
            <p>• <span className="text-blue-500 font-medium">파란 막대</span>: 임직원</p>
            <p>• <span className="text-orange-500 font-medium">주황 빗살</span>: 협력업체</p>
          </div>
          <div>
            <p className="font-medium text-gray-800 mb-2">📊 TRIR 구분 (막대)</p>
            <p>• <span className="text-indigo-500 font-medium">남색 막대</span>: 임직원</p>
            <p>• <span className="text-red-500 font-medium">빨간 빗살</span>: 협력업체</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-500">
            <div>
              <p><strong>좌축:</strong> LTIR/TRIR 종합 지표 (선형그래프)</p>
              <p><strong>우축:</strong> 임직원/협력업체별 세부 지표 (막대그래프)</p>
            </div>
            <div>
              <p><strong>지표 정의:</strong> LTIR(사망,중상,경상,기타), TRIR(사망,중상,경상,병원치료,기타)</p>
              <p><strong>산출 기준:</strong> {constant === 200000 ? '20만' : '100만'}시간당 발생률 | 💡 LTIR ⊆ TRIR</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};