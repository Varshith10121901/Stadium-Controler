'use client';

import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis
} from 'recharts';

interface StatusPieChartProps {
  pieData: { name: string; label: string; value: number }[];
  STATUS_COLORS: Record<string, string>;
}

export function StatusPieChart({ pieData, STATUS_COLORS }: StatusPieChartProps) {
  return (
    <figure className="w-full h-full m-0 flex flex-col items-center">
      <figcaption className="sr-only">Visual distribution of attendee agent states (moving, waiting, or default)</figcaption>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={60}
            stroke="none"
            dataKey="value"
            nameKey="label"
          >
            {pieData.map((entry, index) => (
              <Cell key={index} fill={STATUS_COLORS[entry.name]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#000',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '0',
              fontSize: '10px',
              textTransform: 'uppercase'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </figure>
  );
}

interface DynamicsChartsProps {
  chartData: any[];
}

export function DynamicsCharts({ chartData }: DynamicsChartsProps) {
  return (
    <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
      <div className="border border-white/10 p-5 bg-white/5">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">
          Wait Time Algorithm vs Baseline
        </h3>
        <figure className="h-48 m-0">
          <figcaption className="sr-only">Line chart comparing average wait times of the SwarmAI system against standard baseline routing</figcaption>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="tick" hide />
              <YAxis tick={{ fontSize: 9, fill: '#888' }} width={30} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '10px' }} />
              <Line type="stepAfter" dataKey="Wait (Baseline)" stroke="#ef4444" strokeWidth={1} dot={false} />
              <Line type="stepAfter" dataKey="Wait (Swarm)" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </figure>
      </div>

      <div className="border border-white/10 p-5 bg-white/5">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">
          Efficiency Dynamics
        </h3>
        <figure className="h-48 m-0">
          <figcaption className="sr-only">Line chart showing flow efficiency percentage and congestion indexes over time</figcaption>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="tick" hide />
              <YAxis tick={{ fontSize: 9, fill: '#888' }} width={30} domain={[0, 100]} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '10px' }} />
              <Line type="monotone" dataKey="flow" stroke="#FEBE10" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="congestion" stroke="#4b5563" strokeWidth={1} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </figure>
      </div>
    </div>
  );
}
