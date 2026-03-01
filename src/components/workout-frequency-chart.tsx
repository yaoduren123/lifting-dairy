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
import type { DailyFrequency } from '@/db/queries/stats';

interface WorkoutFrequencyChartProps {
  data: DailyFrequency[];
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-foreground">
        {payload[0].value} {payload[0].value === 1 ? 'workout' : 'workouts'}
      </p>
    </div>
  );
}

export function WorkoutFrequencyChart({ data }: WorkoutFrequencyChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart
        data={data}
        margin={{ top: 4, right: 0, left: -28, bottom: 0 }}
        barCategoryGap={1}
      >
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
          interval="preserveStartEnd"
          minTickGap={20}
        />
        <YAxis
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
          domain={[0, maxCount + 1]}
          ticks={maxCount <= 3 ? [0, 1, 2, 3] : undefined}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: 'var(--color-muted)', opacity: 0.15, radius: 3 }}
        />
        <Bar
          dataKey="count"
          radius={[3, 3, 0, 0]}
          maxBarSize={14}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.count > 0 ? 'var(--color-chart-1, #f97316)' : 'var(--color-muted)'}
              opacity={entry.count > 0 ? 0.85 : 0.2}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
