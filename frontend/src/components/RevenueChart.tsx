'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueChartProps {
  data: any[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  // Format date for display (e.g. 2026-07-21 -> 21/07/2026)
  const formattedData = (data || []).map(item => {
    let displayDate = item.date;
    if (item.date && item.date.includes('-')) {
      const parts = item.date.split('-');
      if (parts.length === 3) {
        displayDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    return {
      ...item,
      displayDate
    };
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div style={{ width: '100%', height: 320, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <LineChart data={formattedData} margin={{ top: 15, right: 30, left: 20, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
          <XAxis 
            dataKey="displayDate" 
            stroke="#aaa" 
            tick={{ fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            stroke="#aaa" 
            tickFormatter={(val) => `${val / 1000000}M`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: any) => [formatCurrency(Number(value)), 'Doanh thu']}
            labelFormatter={(label) => `Ngày: ${label}`}
            contentStyle={{ backgroundColor: '#111', borderColor: '#444', borderRadius: '6px', color: '#fff' }} 
          />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="#0d6efd" 
            strokeWidth={3} 
            dot={{ r: 5, fill: '#0d6efd', stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 8, fill: '#ff4d4f' }}
            name="Doanh thu" 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
