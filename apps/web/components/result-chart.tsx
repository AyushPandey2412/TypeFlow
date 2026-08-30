"use client";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ResultChart({ data }: { data: { second: number; wpm: number; raw: number; errors: number }[] }) {
  return <div className="chart"><div className="chart-legend"><span><i data-series="wpm"/>WPM</span><span><i data-series="raw"/>Raw</span></div><ResponsiveContainer width="100%" height={220}><LineChart data={data}><XAxis dataKey="second" stroke="var(--muted)"/><YAxis stroke="var(--muted)"/><Tooltip contentStyle={{background:"var(--panel)",color:"var(--text)",border:"1px solid var(--line)",borderRadius:6}}/><Line type="monotone" dataKey="wpm" stroke="var(--accent)" strokeWidth={2} dot={false}/><Line type="monotone" dataKey="raw" stroke="var(--chart-raw)" strokeWidth={1.5} dot={false}/></LineChart></ResponsiveContainer></div>;
}
