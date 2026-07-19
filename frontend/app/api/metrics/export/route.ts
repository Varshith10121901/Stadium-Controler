import { generateHistory } from '@/lib/simulation';

/**
 * GET /api/metrics/export
 * Returns the metrics history as a downloadable CSV.
 */
export async function GET() {
  const history = generateHistory(100, 500, Math.floor(Date.now() / 60000));
  const header = [
    'tick', 'timestamp', 'total_agents', 'active_agents',
    'avg_wait_time', 'avg_wait_time_no_swarm', 'wait_time_reduction_pct',
    'flow_efficiency', 'congestion_score', 'negotiations_total', 'reroutes_triggered',
  ];
  const rows = history.map((m) => [
    m.tick, m.timestamp, m.total_agents, m.active_agents,
    m.avg_wait_time, m.avg_wait_time_no_swarm, m.wait_time_reduction_pct,
    m.flow_efficiency, m.congestion_score, m.negotiations_total, m.reroutes_triggered,
  ].join(','));
  const csv = [header.join(','), ...rows].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="swarmai_metrics.csv"',
    },
  });
}
