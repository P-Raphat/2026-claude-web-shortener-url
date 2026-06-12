"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface ClickChartProps {
  data: { date: string; count: number }[];
}

export function ClickChart({ data }: ClickChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#374151" }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#374151" }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", fontSize: 12 }}
          labelStyle={{ color: "#94a3b8", marginBottom: 4 }}
          itemStyle={{ color: "#e2e8f0" }}
        />
        <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#clickGradient)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
