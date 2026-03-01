'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { MonthlyFrequency } from '@/db/queries/stats';

interface WorkoutHistoryChartProps {
  data: MonthlyFrequency[];
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <div className="mt-1 flex flex-col gap-1">
        <p className="text-sm font-bold text-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
          {payload[0].value} {payload[0].value === 1 ? 'workout' : 'workouts'}
        </p>
        {payload[1] && (
          <p className="text-sm font-bold text-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            {payload[1].value} min duration
          </p>
        )}
      </div>
    </div>
  );
}

export function WorkoutHistoryChart({ data }: WorkoutHistoryChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
        barCategoryGap={8}
      >
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
          dy={10}
        />
        <YAxis
          yAxisId="left"
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
          domain={[0, maxCount + 2]}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
          hide // Hide the right axis visually for a cleaner look
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: 'var(--color-muted)', opacity: 0.2, radius: 4 }}
        />
        <Bar
          yAxisId="left"
          dataKey="count"
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.count > 0 ? 'var(--color-chart-1, #f97316)' : 'var(--color-muted)'}
              opacity={entry.count > 0 ? 0.9 : 0.3}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
