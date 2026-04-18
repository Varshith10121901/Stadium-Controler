'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSwarmStore } from '@/lib/store';
import {
  connectWebSocket, fetchStadium, bulkStart, triggerEmergency,
  toggleSwarm, exportMetricsCSV, resetSimulation, startSimulation,
  addAgents, setSimSpeed, fetchComparison, arrangeSeatingMode
} from '@/lib/websocket';
import { densityToColor, stadiumToCanvas, formatTime, formatNumber } from '@/lib/utils';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  AlertTriangle, Activity, Users, Zap, Download,
  RotateCcw, TrendingDown, Radio, Eye, Shield,
  Gauge, ArrowUpRight, ArrowDownRight, Layers, Cpu, MousePointer2
} from 'lucide-react';

export default function DashboardPage() {
  const {
    connected, agents, metrics, metricsHistory, densityMap, stadium,
    setStadium, simulationRunning, swarmEnabled,
  } = useSwarmStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [comparison, setComparison] = useState<any>(null);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [hasDeployedBulk, setHasDeployedBulk] = useState(false);
  const [simSpeed, setSimSpeedLocal] = useState(1);

  // Audience manipulation state
  const mouseHover = useRef<{x: number, y: number} | null>(null);
  const lastHoverUpdate = useRef<number>(0);
  const [hoveredAgents, setHoveredAgents] = useState<any[] | null>(null);

  // Gate Control references
  const [gateUI, setGateUI] = useState(0); // For react reactivity
  const gatesRef = useRef([
     { id: 1, name: 'Gate A', status: 'open', x: 50, y: 5 },
     { id: 2, name: 'Gate B', status: 'open', x: 95, y: 50 },
     { id: 3, name: 'Gate C', status: 'open', x: 50, y: 95 },
     { id: 4, name: 'Gate D', status: 'closed', x: 5, y: 50 }
  ]);

  useEffect(() => {
    connectWebSocket();
    fetchStadium().then(setStadium).catch(() => {
      setTimeout(() => fetchStadium().then(setStadium).catch(() => {}), 3000);
    });
    startSimulation(100).catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchComparison().then(setComparison).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const drawHeatmap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use current store state to avoid stale closures without needing dependency array triggers
    const state = useSwarmStore.getState();
    const currentAgents = state.agents;
    const currentDensity = state.densityMap;
    const currentStadium = state.stadium;

    const W = canvas.width;
    const H = canvas.height;
    const pad = 30;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);

    const [cx, cy] = stadiumToCanvas(50, 50, W, H, pad);
    const rx = (48 / 100) * (W - 2 * pad);
    const ry = (38 / 100) * (H - 2 * pad);

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#050505';
    ctx.fill();
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.45, ry * 0.45, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.strokeStyle = '#FEBE10'; 
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.restore();

    // Calculate Manual Congestion Map on Frontend for highest accuracy
    const GRID_SIZE = 20;
    const cellW = (W - 2 * pad) / GRID_SIZE;
    const cellH = (H - 2 * pad) / GRID_SIZE;
    const localDensity = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));

    for (const agent of currentAgents) {
      const c = Math.floor((agent.x / 100) * GRID_SIZE);
      const r = Math.floor((agent.y / 100) * GRID_SIZE);
      if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
         localDensity[r][c]++;
      }
    }

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx - 2, ry - 2, 0, 0, Math.PI * 2);
    ctx.clip();
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
         const d = localDensity[r][c];
         if (d > 3) { // Congestion threshold
             const alpha = Math.min((d - 3) / 10, 0.7); // Cap max opacity
             ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
             ctx.fillRect(pad + c * cellW, pad + r * cellH, cellW, cellH);
         }
      }
    }
    ctx.restore();

    if (mouseHover.current) {
        ctx.beginPath();
        ctx.arc(mouseHover.current.x, mouseHover.current.y, 40, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(254, 190, 16, 0.1)';
        ctx.fill();
        ctx.strokeStyle = '#FEBE10';
        ctx.setLineDash([2, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    const seatingMode = useSwarmStore.getState().seatingMode;
    
    let agentIndex = 0;
    const totalAgents = currentAgents.length || 1;
    let agentsUnderHover = 0;

    for (const agent of currentAgents) {
      let [ax, ay] = stadiumToCanvas(agent.x, agent.y, W, H, pad);
      agentIndex++;
      
      if (mouseHover.current && !seatingMode) {
         const dx = ax - mouseHover.current.x;
         const dy = ay - mouseHover.current.y;
         const dist = Math.sqrt(dx*dx + dy*dy);
         if (dist < 40) {
            agentsUnderHover++;
            const force = (40 - dist) / 40;
            ax += (dx / dist) * force * 15;
            ay += (dy / dist) * force * 15;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(ax - (dx/dist)*5, ay - (dy/dist)*5);
            ctx.strokeStyle = '#FEBE10';
            ctx.stroke();
         }
      }

      ctx.fillStyle = agent.is_real
        ? '#FEBE10'
        : agent.status === 'moving' ? '#3b82f6'
        : agent.status === 'waiting' ? '#ef4444'
        : '#ffffff';
      ctx.beginPath();
      ctx.arc(ax, ay, agent.is_real ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (mouseHover.current) {
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#FEBE10';
        ctx.textAlign = 'center';
        ctx.fillText('1980 BUFFER ZONE ACTIVE', mouseHover.current.x, mouseHover.current.y - 48);
        
        // Draw the dynamic count HUD
        ctx.fillStyle = '#ff4444';
        ctx.fillText(`AGENTS AFFECTED: ${agentsUnderHover}`, mouseHover.current.x, mouseHover.current.y + 54);
    }

    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    for (const g of gatesRef.current) {
        const [gx, gy] = stadiumToCanvas(g.x, g.y, W, H, pad);
        const isOpen = g.status === 'open';
        ctx.strokeStyle = isOpen ? '#10b981' : '#ef4444';
        ctx.strokeRect(gx - 11, gy - 7, 22, 14);
        ctx.fillStyle = isOpen ? '#10b981' : '#ef4444';
        ctx.fillText(g.name, gx, gy - 10);
        ctx.fillStyle = isOpen ? '#10b981' : '#ef4444';
        ctx.fillText(isOpen ? 'OPEN' : 'CLOSED', gx, gy + 3);
    }
    
    if (currentStadium) {
      for (const c of currentStadium.concessions) {
        const [px, py] = stadiumToCanvas(c.x, c.y, W, H, pad);
        ctx.fillStyle = '#FEBE10';
        ctx.fillRect(px - 3, py - 3, 6, 6);
      }
    }

  }, []);

  useEffect(() => {
    let animationFrameId: number;
    const render = () => {
      drawHeatmap();
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [drawHeatmap]);

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (parent && parent.clientWidth > 100) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientWidth * 0.55;
      }
    };
    
    // We wrap an immediate call and a slight delayed call 
    // to guarantee the element has shed 'display: hidden' before measuring
    resize();
    const t = setTimeout(resize, 50);

    window.addEventListener('resize', resize);
    return () => {
       window.removeEventListener('resize', resize);
       clearTimeout(t);
    };
  }, [showBeforeAfter]);

  const chartData = metricsHistory.slice(-60).map((m, i) => ({
    tick: m.tick || i,
    'Wait (Swarm)': Math.round(m.avg_wait_time * 10) / 10,
    'Wait (Baseline)': Math.round(m.avg_wait_time_no_swarm * 10) / 10,
    flow: Math.round(m.flow_efficiency),
    congestion: Math.round(m.congestion_score),
    agents: m.total_agents,
  }));

  const agentsToGraph = hoveredAgents !== null ? hoveredAgents : agents;

  const pieData = [
    { name: 'moving', label: 'In Motion', value: agentsToGraph.filter(a => a.status === 'moving').length },
    { name: 'waiting', label: 'Congested/Waiting', value: agentsToGraph.filter(a => a.status === 'waiting').length },
    { name: 'arrived', label: 'Arrived', value: agentsToGraph.filter(a => a.status === 'arrived').length },
    { name: 'default', label: 'Other', value: agentsToGraph.filter(a => a.status !== 'moving' && a.status !== 'waiting' && a.status !== 'arrived').length },
  ].filter(d => d.value > 0);

  const STATUS_COLORS: Record<string, string> = {
     'moving': '#3b82f6', // Match blue dots
     'waiting': '#ef4444', // Match red dots
     'arrived': '#4b5563',
     'default': '#ffffff' // Match white dots
  };

  const handleEmergency = async () => {
    setIsEmergency(true);
    await triggerEmergency();
    setTimeout(() => setIsEmergency(false), 5000);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
     const rect = canvasRef.current?.getBoundingClientRect();
     if (!rect) return;
     const mx = e.clientX - rect.left;
     const my = e.clientY - rect.top;
     mouseHover.current = { x: mx, y: my };

     // Throttle React state updates to ~10fps to avoid lag
     if (Date.now() - lastHoverUpdate.current > 100) {
        lastHoverUpdate.current = Date.now();
        const W = canvasRef.current?.width || 0;
        const H = canvasRef.current?.height || 0;
        const affected: any[] = [];
        
        for (const agent of useSwarmStore.getState().agents) {
           const [ax, ay] = stadiumToCanvas(agent.x, agent.y, W, H, 30);
           const dist = Math.hypot(ax - mx, ay - my);
           if (dist < 40) affected.push(agent);
        }
        setHoveredAgents(affected);
     }
  };

  const handleCanvasMouseLeave = () => {
      mouseHover.current = null;
      setHoveredAgents(null);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#FEBE10] selection:text-black">
      {/* ── Modern Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 px-8 py-5 border-b border-white/10 bg-black/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-10 h-10 border border-white/20 flex items-center justify-center rounded-lg">
             <Shield size={20} className="text-[#FEBE10]" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-[0.2em]">SwarmAI <span className="opacity-40">Operations</span></h1>
            <p className="text-[10px] text-emerald-500 font-mono mt-1 tracking-widest uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Metrics Active — TICK #{metrics.tick}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 border border-white/10 rounded-lg p-1 mr-2">
            {[1, 2, 5, 10].map((s) => (
              <button key={s} onClick={() => { setSimSpeedLocal(s); setSimSpeed(s); }} className={`px-3 py-1 rounded text-[10px] font-black transition-all ${simSpeed === s ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>
                {s}X
              </button>
            ))}
          </div>

          <button 
             onClick={async () => {
                if (hasDeployedBulk) {
                   try {
                       await resetSimulation();
                       await startSimulation(100);
                   } catch(e) {}
                   setHasDeployedBulk(false);
                } else {
                   try {
                       await bulkStart(1000);
                   } catch(e) {}
                   setHasDeployedBulk(true);
                }
             }} 
             className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
                hasDeployedBulk ? 'bg-red-500 text-white hover:bg-black border border-red-500' : 'bg-[#FEBE10] text-black hover:bg-white'
             }`}
          >
            {hasDeployedBulk ? 'Reset Swarm' : 'Deploy 1000 Agents'}
          </button>
          
          <button onClick={() => toggleSwarm()} className={`px-5 py-2.5 border text-[10px] font-black uppercase tracking-widest transition-colors ${swarmEnabled ? 'border-emerald-500 text-emerald-500 hover:bg-emerald-500/10' : 'border-red-500 text-red-500 hover:bg-red-500/10'}`}>
            Swarm {swarmEnabled ? 'ONLINE' : 'OFFLINE'}
          </button>

          <a href="/" className="px-4 py-2.5 border border-red-500/50 hover:bg-red-500/10 hover:border-red-500 text-[10px] text-red-500 font-bold uppercase tracking-widest transition-colors rounded">
            Exit to 3D View
          </a>
        </div>
      </header>

      {/* ── Main Grid ───────────────────────────────────────────────────── */}
      <div className="p-8 grid grid-cols-12 gap-6">
        


        {/* ── Center Map (Movable Audience layer) ────────────────────────────────────── */}
        <div className="col-span-8 border border-white/10 bg-black p-5 relative group">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2 text-white">
               <MousePointer2 size={16} className="text-[#FEBE10]" />
               Interactive Density Map
            </h2>
            <div className="flex gap-6 items-center">
               <span className="text-[10px] text-[#FEBE10] font-mono font-bold tracking-widest">
                  HOVER TO CREATE 1980 BUFFER ZONES
               </span>
               <button 
                  onClick={() => setShowBeforeAfter(!showBeforeAfter)} 
                  className={`px-5 py-2 border text-[10px] font-black uppercase tracking-widest transition-all ${showBeforeAfter ? 'bg-white text-black' : 'border-white/20 text-gray-400 hover:text-white hover:border-white/50'}`}
               >
                  Comparison Mode
               </button>
            </div>
          </div>

          {showBeforeAfter && comparison && (
             <div className="grid grid-cols-2 gap-px bg-white/10 h-96 border border-white/10">
                 <div className="bg-black p-6">
                    <h3 className="text-red-500 font-black uppercase tracking-widest text-[10px] mb-8">Raw Crowd / Baseline</h3>
                    <CompRow label="Wait Time" value={formatTime(comparison.without_swarm.avg_wait_time)} />
                    <CompRow label="Flow Metric" value={`${Math.round(comparison.without_swarm.flow_efficiency)}%`} />
                    <CompRow label="Congestion Risk" value={`${Math.round(comparison.without_swarm.congestion_score)}%`} />
                 </div>
                 <div className="bg-black p-6">
                    <h3 className="text-emerald-500 font-black uppercase tracking-widest text-[10px] mb-8">SwarmAI Routing Active</h3>
                    <CompRow label="Wait Time" value={formatTime(comparison.with_swarm.avg_wait_time)} />
                    <CompRow label="Flow Metric" value={`${Math.round(comparison.with_swarm.flow_efficiency)}%`} />
                    <CompRow label="Congestion Risk" value={`${Math.round(comparison.with_swarm.congestion_score)}%`} />
                 </div>
             </div>
          )}
          <canvas
              ref={canvasRef}
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={handleCanvasMouseLeave}
              className={`w-full h-auto cursor-crosshair border border-white/5 opacity-90 hover:opacity-100 transition-opacity ${showBeforeAfter ? 'hidden' : 'block'}`}
          />
        </div>

        {/* ── Status Panel ─────────────────────────────────────────── */}
        <div className="col-span-4 border border-white/10 bg-white/5 p-6 flex flex-col pt-5">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-6 border-b border-white/10 pb-4 flex justify-between">
            <span>Agent Status</span>
            {hoveredAgents !== null ? (
               <span className="text-red-500 font-mono tracking-tighter shadow-sm animate-pulse">BUFFER: {hoveredAgents.length}</span>
            ) : (
               <span className="text-[#FEBE10]">TOTAL: {agents.length}</span>
            )}
          </h2>
          <div className="h-40 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} stroke="none" dataKey="value" nameKey="label">
                  {pieData.map((entry, index) => <Cell key={index} fill={STATUS_COLORS[entry.name]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0', fontSize: '10px', textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-3 mt-auto">
             <div className="flex justify-between items-center bg-black/50 p-4 border-b border-white/5">
              <h2 className="text-[12px] font-black tracking-widest text-white flex items-center gap-2">
                <Users size={14} className="text-blue-500" />
                AGENT STATUS
              </h2>
              <div className="text-[10px] uppercase font-black text-white/50 tracking-widest">
                 {hoveredAgents !== null ? `BUFFER: ${hoveredAgents.length}` : ''}
              </div>
            </div>
            
            <div className="p-4 border-b border-white/5">
               <button 
                  onClick={async () => {
                     const nextState = !useSwarmStore.getState().seatingMode;
                     useSwarmStore.getState().setSeatingMode(nextState);
                     await arrangeSeatingMode(nextState);
                  }}
                  className={`w-full py-3 px-4 rounded text-[10px] font-black uppercase tracking-widest transition-all ${
                     useSwarmStore((s) => s.seatingMode) 
                     ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                     : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                  }`}
               >
                  {useSwarmStore((s) => s.seatingMode) ? 'Deactivate Seating Routine' : 'Arrange by Seat Number (Disperse Crowd)'}
               </button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
             <div className="flex justify-between items-end border-b border-white/5 pb-2">
                 <span className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-widest flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div> In Motion
                 </span>
                 <span className="text-white font-mono text-xs">{pieData.find(d => d.name === 'moving')?.value || 0}</span>
             </div>
             <div className="flex justify-between items-end border-b border-white/5 pb-2">
                 <span className="text-[10px] font-bold text-[#ef4444] uppercase tracking-widest flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-[#ef4444]"></div> Congested/Wait
                 </span>
                 <span className="text-red-500 font-mono text-xs">{pieData.find(d => d.name === 'waiting')?.value || 0}</span>
             </div>
             <div className="flex justify-between items-end border-b border-white/5 pb-2">
                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-[#ffffff]"></div> Default/Other
                 </span>
                 <span className="text-gray-400 font-mono text-xs">{pieData.find(d => d.name === 'default')?.value || 0}</span>
             </div>
          </div>
        </div>
      </div>

      {/* ── Charts ────────────────────────────────────────────────── */}
        <div className="col-span-12 grid grid-cols-2 gap-6 mt-4">
           <div className="border border-white/10 p-5">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6">Wait Time Algorithm vs Baseline</h3>
              <div className="h-48">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                       <XAxis dataKey="tick" hide />
                       <YAxis tick={{ fontSize: 9, fill: '#666' }} width={30} axisLine={false} tickLine={false} />
                       <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '10px' }} />
                       <Line type="stepAfter" dataKey="Wait (Baseline)" stroke="#ef4444" strokeWidth={1} dot={false} />
                       <Line type="stepAfter" dataKey="Wait (Swarm)" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                 </ResponsiveContainer>
              </div>
           </div>

           <div className="border border-white/10 p-5">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6">Efficiency Dynamics</h3>
              <div className="h-48">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                       <XAxis dataKey="tick" hide />
                       <YAxis tick={{ fontSize: 9, fill: '#666' }} width={30} domain={[0, 100]} axisLine={false} tickLine={false} />
                       <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '10px' }} />
                       <Line type="monotone" dataKey="flow" stroke="#FEBE10" strokeWidth={2} dot={false} />
                       <Line type="monotone" dataKey="congestion" stroke="#4b5563" strokeWidth={1} dot={false} />
                    </LineChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>

      </div>
      
      {/* ── Bottom Metrics ────────────────────────────────────────────────── */}
      <div className="p-8 grid grid-cols-12 gap-6 pt-0">
        <MetricCard label="Active Simulation Nodes" value={formatNumber(metrics.total_agents)} icon={Activity} color="text-white" />
        <MetricCard label="Wait Time Reduction" value={`${Math.round(metrics.wait_time_reduction_pct)}%`} icon={TrendingDown} color="text-white" />
        <MetricCard label="Route Efficiency" value={`${Math.round(metrics.flow_efficiency)}%`} icon={Gauge} color="text-white" />
        <MetricCard label="Peer Negotiations" value={formatNumber(metrics.negotiations_total)} icon={Zap} color="text-white" />
        <MetricCard label="Global Congestion" value={`${Math.round(metrics.congestion_score)}%`} icon={AlertTriangle} color="text-white" />
        
        <div className="col-span-2 border border-white/10 bg-white/5 p-5 flex flex-col justify-between">
           <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Gate Controls</div>
           <div className="grid grid-cols-2 gap-2 mb-4">
             {gatesRef.current.map(g => (
                <button 
                  key={g.id} 
                  onClick={() => { g.status = g.status === 'open' ? 'closed' : 'open'; setGateUI(v => v+1); }}
                  className={`py-1.5 text-[9px] font-black tracking-widest border transition-colors ${g.status === 'open' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/50' : 'bg-red-500/10 text-red-500 border-red-500/50'}`}
                >
                   {g.name}
                </button>
             ))}
           </div>
           
           <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Override</div>
           <button onClick={handleEmergency} disabled={isEmergency} className={`w-full py-2 font-black text-[10px] uppercase tracking-widest transition-all ${isEmergency ? 'bg-red-600 text-white animate-pulse' : 'border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white'}`}>
            {isEmergency ? 'EVACUATING...' : 'TRIGGER EVAC'}
           </button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="col-span-2 border border-white/10 bg-white/5 p-5 group hover:bg-white/10 transition-colors">
      <div className={`mb-4 flex items-center justify-between ${color}`}>
        <Icon size={18} />
      </div>
      <div className="text-3xl font-black mb-2 opacity-90 font-mono tracking-tighter">{value}</div>
      <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{label}</div>
    </div>
  );
}

function CompRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-end border-b border-white/10 pb-4 mb-4">
      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{label}</span>
      <span className="text-xl font-black font-mono tracking-tighter">{value}</span>
    </div>
  );
}
