'use client';

import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface GaugeChartProps {
  value: number;
  max: number;
  title: string;
  colorScheme?: 'success' | 'warning' | 'danger';
}

export default function GaugeChart({ 
  value, 
  max, 
  title,
  colorScheme = 'success' 
}: GaugeChartProps) {
  const percentage = (value / max) * 100;
  
  const colors = {
    success: ['#22C55E', '#E5E7EB'],
    warning: ['#F59E0B', '#E5E7EB'],
    danger: ['#EF4444', '#E5E7EB']
  };

  const data = {
    datasets: [{
      data: [percentage, 100 - percentage],
      backgroundColor: colors[colorScheme],
      borderWidth: 0,
      circumference: 180,
      rotation: 270,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false
      }
    },
    cutout: '75%'
  };

  return (
    <div className="relative h-48">
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold">{Math.round(percentage)}%</div>
        <div className="text-sm text-gray-500">{title}</div>
      </div>
    </div>
  );
} 