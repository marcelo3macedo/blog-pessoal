"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { ChartConfig } from "./Chart";

const PALETTE = ["#7C3AED", "#F59E0B", "#10B981", "#EF4444", "#3B82F6", "#EC4899"];

const THEME = {
  light: { text: "#78716C", grid: "#E7E5DF", tooltipBg: "#FFFFFF", tooltipBorder: "#E7E5DF" },
  dark: { text: "#A8A29E", grid: "#2C2B27", tooltipBg: "#18180F", tooltipBorder: "#2C2B27" },
};

export default function ChartRenderer({ config, isDark }: { config: ChartConfig; isDark: boolean }) {
  const t = isDark ? THEME.dark : THEME.light;
  const xKey = config.xKey ?? "name";
  const tooltipStyle = {
    background: t.tooltipBg,
    border: `1px solid ${t.tooltipBorder}`,
    borderRadius: 8,
    fontSize: 13,
  };

  return (
    <div className="my-6 rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] p-5">
      {config.title && (
        <p className="mb-4 text-sm font-semibold text-[var(--color-ink)] dark:text-[var(--color-ink-dark)]">
          {config.title}
        </p>
      )}
      <ResponsiveContainer width="100%" height={320}>
        {config.type === "line" ? (
          <LineChart data={config.data}>
            <CartesianGrid strokeDasharray="3 3" stroke={t.grid} />
            <XAxis dataKey={xKey} stroke={t.text} fontSize={12} />
            <YAxis stroke={t.text} fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            {config.series.map((s, i) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label ?? s.key}
                stroke={s.color ?? PALETTE[i % PALETTE.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        ) : config.type === "area" ? (
          <AreaChart data={config.data}>
            <CartesianGrid strokeDasharray="3 3" stroke={t.grid} />
            <XAxis dataKey={xKey} stroke={t.text} fontSize={12} />
            <YAxis stroke={t.text} fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            {config.series.map((s, i) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label ?? s.key}
                stroke={s.color ?? PALETTE[i % PALETTE.length]}
                fill={s.color ?? PALETTE[i % PALETTE.length]}
                fillOpacity={0.2}
                stackId={config.stacked ? "1" : undefined}
              />
            ))}
          </AreaChart>
        ) : config.type === "bar" ? (
          <BarChart data={config.data}>
            <CartesianGrid strokeDasharray="3 3" stroke={t.grid} />
            <XAxis dataKey={xKey} stroke={t.text} fontSize={12} />
            <YAxis stroke={t.text} fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            {config.series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label ?? s.key}
                fill={s.color ?? PALETTE[i % PALETTE.length]}
                stackId={config.stacked ? "1" : undefined}
                radius={config.stacked ? undefined : [4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        ) : (
          <PieChart>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Pie
              data={config.data}
              dataKey={config.series[0]?.key ?? "value"}
              nameKey={xKey}
              outerRadius={110}
              label
            >
              {config.data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
