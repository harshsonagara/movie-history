'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'

type MonthData   = { month: string; count: number }
type GenreData   = { name: string; percent: number; color: string }
type RatingData  = { rating: number; count: number }

const TOOLTIP_STYLE = {
  background: '#111420',
  border: '1px solid #1e2335',
  borderRadius: 8,
  color: '#f2f2f5',
  fontSize: 12,
}

export function MonthlyBarChart({ data }: { data: MonthData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
        <XAxis dataKey="month" tick={{ fill: '#6b7a99', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#6b7a99', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Bar dataKey="count" fill="#e8a020" radius={[4, 4, 0, 0]} name="Titles" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function GenrePieChart({ data, total }: { data: GenreData[]; total: number }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={75}
          dataKey="percent"
          nameKey="name"
          strokeWidth={0}
          label={false}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(v: number) => [`${v}%`, '']}
        />
        {/* Centre label via foreignObject isn't reliable; use absolute CSS instead */}
      </PieChart>
    </ResponsiveContainer>
  )
}
