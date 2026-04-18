'use client';

/**
 * SwarmAI — Debug Panel
 * =======================
 * Shows live agent negotiation messages for judges/developers.
 * Connects to the debug WebSocket channel for real-time updates.
 */

import { useEffect, useState } from 'react';
import { useSwarmStore } from '@/lib/store';
import { connectWebSocket, subscribeDebug, fetchNegotiations } from '@/lib/websocket';
import { Terminal, Radio, Pause, Play, Trash2, Download } from 'lucide-react';

export default function DebugPage() {
  const { connected, negotiations, metrics, agents } = useSwarmStore();
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState<'all' | 'accepted' | 'rejected'>('all');
  const [localLog, setLocalLog] = useState<any[]>([]);

  // Connect and subscribe to debug channel
  useEffect(() => {
    connectWebSocket();
    const timer = setTimeout(() => subscribeDebug(), 1000);
    // Also fetch initial negotiations
    fetchNegotiations(50).then((data) => {
      if (data.negotiations) {
        setLocalLog(data.negotiations);
      }
    }).catch(() => {});
    return () => clearTimeout(timer);
  }, []);

  // Accumulate negotiations
  useEffect(() => {
    if (!paused && negotiations.length > 0) {
      const latest = negotiations[negotiations.length - 1];
      setLocalLog((prev) => [...prev, latest].slice(-200));
    }
  }, [negotiations, paused]);

  const filtered = localLog.filter((n) => {
    if (filter === 'accepted') return n.accepted;
    if (filter === 'rejected') return !n.accepted;
    return true;
  });

  const exportLog = () => {
    const text = filtered.map((n) =>
      `[Tick ${n.tick}] ${n.message || `${n.agent_a} ↔ ${n.agent_b}: ${n.outcome} (Δ${n.net_utility})`}`
    ).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'swarmai_negotiations.log';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-surface-0 bg-mesh">
      {/* Header */}
      <header className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Terminal size={24} className="text-neon-green" />
          <div>
            <h1 className="text-lg font-black text-gradient-green">SwarmAI Debug Console</h1>
            <p className="text-xs text-gray-500">
              {connected ? '🟢 Connected' : '🔴 Offline'} •
              Tick #{metrics.tick} •
              {agents.length} agents •
              {localLog.length} logged negotiations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filters */}
          {(['all', 'accepted', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === f
                  ? f === 'accepted' ? 'bg-green-500/20 text-green-400'
                    : f === 'rejected' ? 'bg-red-500/20 text-red-400'
                    : 'bg-swarm-500/20 text-swarm-400'
                  : 'bg-surface-2 text-gray-500'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}

          <button
            onClick={() => setPaused(!paused)}
            className={`p-2 rounded-lg transition-all ${
              paused ? 'bg-fire-500/20 text-fire-400' : 'bg-surface-2 text-gray-400'
            }`}
          >
            {paused ? <Play size={16} /> : <Pause size={16} />}
          </button>

          <button
            onClick={() => setLocalLog([])}
            className="p-2 bg-surface-2 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
          >
            <Trash2 size={16} />
          </button>

          <button
            onClick={exportLog}
            className="p-2 bg-surface-2 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <Download size={16} />
          </button>

          <a href="/dashboard" className="text-xs text-gray-500 hover:text-swarm-400 ml-2">
            ← Dashboard
          </a>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="px-6 py-3 flex gap-4 border-b border-gray-800/50">
        <Stat label="Total Negotiations" value={metrics.negotiations_total} />
        <Stat label="Successful" value={metrics.negotiations_success} color="text-green-400" />
        <Stat label="Success Rate" value={`${Math.round(metrics.negotiation_success_rate)}%`} color="text-neon-green" />
        <Stat label="Reroutes" value={metrics.reroutes_triggered} color="text-purple-400" />
        <Stat label="Active Nodes" value={metrics.total_agents} color="text-swarm-400" />
      </div>

      {/* Log */}
      <div className="px-6 py-4 font-mono text-xs space-y-1 max-h-[calc(100vh-180px)] overflow-y-auto">
        {paused && (
          <div className="text-center text-fire-400 text-xs py-2 animate-pulse">
            ⏸ PAUSED — New messages are buffered
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center text-gray-600 py-12">
            <Radio size={32} className="mx-auto mb-3 animate-pulse" />
            <p>Waiting for negotiation messages...</p>
            <p className="text-[10px] mt-1">Make sure the simulation is running</p>
          </div>
        ) : (
          filtered.map((neg, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 py-1.5 px-3 rounded-lg transition-colors hover:bg-surface-2/50 ${
                neg.accepted ? 'border-l-2 border-green-500/50' : 'border-l-2 border-red-500/50'
              }`}
            >
              <span className="text-gray-600 w-16 shrink-0">[T{neg.tick || '?'}]</span>
              <span className={`w-4 shrink-0 ${neg.accepted ? 'text-green-400' : 'text-red-400'}`}>
                {neg.accepted ? '✅' : '❌'}
              </span>
              <span className="text-gray-300 flex-1">
                {neg.message || `${(neg.agent_a || '').slice(0, 12)} ↔ ${(neg.agent_b || '').slice(0, 12)}: ${neg.outcome || (neg.accepted ? 'accepted' : 'rejected')} (Δ${typeof neg.net_utility === 'number' ? neg.net_utility.toFixed(3) : '?'})`}
              </span>
              <span className="text-gray-600 text-[10px] shrink-0">
                {neg.timestamp ? new Date(neg.timestamp).toLocaleTimeString() : ''}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: any; color?: string }) {
  return (
    <div>
      <span className={`font-bold ${color || 'text-white'}`}>{value}</span>{' '}
      <span className="text-gray-500">{label}</span>
    </div>
  );
}
