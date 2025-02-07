'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// More distinct color schemes
const colorSchemes = {
  default: ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
  ocean: ['#0EA5E9', '#0D9488', '#0284C7', '#0369A1', '#0891B2', '#0C4A6E'],
  forest: ['#22C55E', '#15803D', '#16A34A', '#166534', '#4D7C0F', '#3F6212'],
  sunset: ['#F97316', '#DC2626', '#EA580C', '#C2410C', '#FB923C', '#FDBA74']
};

interface StatisticsChartProps {
  data: number[];
  type: 'line' | 'bar' | 'pie';
  title: string;
  labels: string[];
  colorScheme?: keyof typeof colorSchemes;
  filterRange?: 'week' | 'month' | 'year';
  onFilterChange?: (range: string) => void;
}

export default function StatisticsChart({
  data,
  type,
  title,
  labels,
  colorScheme = 'default',
  filterRange,
  onFilterChange
}: StatisticsChartProps) {
  const colors = colorSchemes[colorScheme];

  const chartData = {
    labels,
    datasets: [
      {
        label: title,
        data: data,
        borderColor: type === 'pie' ? 'white' : colors[0],
        backgroundColor: type === 'pie'
          ? colors
          : `${colors[0]}99`,
        borderWidth: type === 'pie' ? 1 : 2,
        tension: 0.3,
        fill: type === 'line' ? 'origin' : undefined,
        hoverOffset: type === 'pie' ? 24 : undefined,
      },
    ],
  };

  const baseOptions = {
    responsive: true,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          },
          padding: 16
        }
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          family: "'Inter', sans-serif",
          weight: 'bold' as const
        },
        padding: { bottom: 16 }
      },
      tooltip: {
        enabled: true,
        mode: 'index' as const,
        intersect: false,
        backgroundColor: '#1F2937CC',
        titleFont: {
          size: 14,
          family: "'Inter', sans-serif"
        },
        bodyFont: {
          size: 12,
          family: "'Inter', sans-serif"
        },
        padding: 12,
        cornerRadius: 4,
        displayColors: true
      }
    }
  };

  const scaleOptions = {
    y: {
      beginAtZero: true,
      grid: {
        borderColor: '#E5E7EB',
        color: '#E5E7EB'
      },
      ticks: {
        font: {
          size: 11,
          family: "'Inter', sans-serif"
        }
      }
    },
    x: {
      grid: {
        display: false,
        borderColor: '#E5E7EB'
      },
      ticks: {
        font: {
          size: 11,
          family: "'Inter', sans-serif"
        }
      }
    }
  };

  if (type === 'pie') {
    return (
      <div className="relative">
        <Pie 
          data={chartData}
          options={{
            ...baseOptions,
            cutout: '0%',
            radius: '90%'
          }}
        />
      </div>
    );
  }

  if (type === 'bar') {
    return (
      <div className="relative">
        {filterRange && (
          <div className="absolute top-0 right-0 z-10 flex gap-2">
            <select
              className="text-sm border rounded-md px-2 py-1"
              onChange={(e) => onFilterChange?.(e.target.value)}
              value={filterRange}
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          </div>
        )}
        <Bar 
          data={chartData}
          options={{
            ...baseOptions,
            scales: scaleOptions
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative">
      {filterRange && (
        <div className="absolute top-0 right-0 z-10 flex gap-2">
          <select
            className="text-sm border rounded-md px-2 py-1"
            onChange={(e) => onFilterChange?.(e.target.value)}
            value={filterRange}
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      )}
      <Line 
        data={chartData}
        options={{
          ...baseOptions,
          scales: scaleOptions
        }}
      />
    </div>
  );
} 