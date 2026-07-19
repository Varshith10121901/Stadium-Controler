import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusPieChart, DynamicsCharts } from './DashboardCharts';

// Mock Recharts elements to prevent JSDOM layout dimension errors
vi.mock('recharts', () => {
  return {
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
    Pie: ({ children }: any) => <div data-testid="pie">{children}</div>,
    Cell: () => <div data-testid="cell" />,
    Tooltip: () => <div data-testid="tooltip" />,
    LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
    Line: () => <div data-testid="line" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />
  };
});

describe('Dashboard Charts Components', () => {
  it('should render StatusPieChart with accessible caption and mocked segments', () => {
    const pieData = [
      { name: 'moving', label: 'In Motion', value: 120 },
      { name: 'waiting', label: 'Waiting', value: 80 }
    ];
    const STATUS_COLORS = {
      moving: '#10b981',
      waiting: '#f59e0b'
    };

    render(<StatusPieChart pieData={pieData} STATUS_COLORS={STATUS_COLORS} />);

    // Check accessible description caption
    const figcaption = screen.getByText(/Visual distribution of attendee agent states/);
    expect(figcaption).toBeInTheDocument();
    
    // Check that ResponsiveContainer rendered our mocked children
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('should render DynamicsCharts with metric titles', () => {
    const chartData = [
      { tick: 1, 'Wait (Baseline)': 40, 'Wait (Swarm)': 24, flow: 85, congestion: 10 }
    ];

    render(<DynamicsCharts chartData={chartData} />);

    expect(screen.getByText(/Wait Time Algorithm vs Baseline/)).toBeInTheDocument();
    expect(screen.getByText(/Efficiency Dynamics/)).toBeInTheDocument();
  });
});
