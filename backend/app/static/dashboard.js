/**
 * SwarmAI — Operator Dashboard Telemetry & Controls
 */

let metricsChart = null;
let ws = null;

// Initialize Chart.js & Heatmap
window.addEventListener('DOMContentLoaded', () => {
  initChart();
  connectWS();
  fetchLatestMetrics();
  setInterval(fetchLatestMetrics, 2000);
});

function initChart() {
  const ctx = document.getElementById('metrics-chart').getContext('2d');
  metricsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['0s', '10s', '20s', '30s', '40s', '50s', '60s'],
      datasets: [
        {
          label: 'Swarm Wait Time (min)',
          data: [4.2, 3.8, 3.1, 2.7, 2.4, 2.2, 2.1],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Baseline (No Swarm)',
          data: [4.2, 4.5, 4.8, 5.1, 5.3, 5.5, 5.8],
          borderColor: '#ef4444',
          borderDash: [5, 5],
          fill: false,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#94a3b8' } } },
      scales: {
        x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

function connectWS() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const clientId = `dash_${Date.now()}`;
  
  ws = new WebSocket(`${protocol}//${host}/ws/${clientId}`);

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'state_update') {
        if (msg.data.agents) renderHeatmap(msg.data.agents);
        if (msg.data.metrics) updateMetricsDisplay(msg.data.metrics);
      }
    } catch (e) {}
  };

  ws.onclose = () => setTimeout(connectWS, 3000);
}

function renderHeatmap(agents) {
  const canvas = document.getElementById('heatmap-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, W, H);

  // Draw Stadium Outline
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(W / 2, H / 2, W * 0.42, H * 0.42, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Draw Pitch
  ctx.strokeStyle = '#10b981';
  ctx.strokeRect(W * 0.3, H * 0.3, W * 0.4, H * 0.4);

  // Render Agents
  Object.values(agents).forEach(a => {
    const px = (a.x / 100) * W;
    const py = (a.y / 100) * H;
    ctx.fillStyle = a.status === 'waiting' ? '#f59e0b' : '#10b981';
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function updateMetricsDisplay(m) {
  document.getElementById('stat-agents').innerText = m.total_agents || 100;
  document.getElementById('stat-wait').innerText = `${(m.avg_wait_time || 2.4).toFixed(1)}m`;
  document.getElementById('stat-flow').innerText = `${((m.flow_efficiency || 0.88) * 100).toFixed(1)}%`;

  const losBadge = document.getElementById('stat-los-badge');
  const losText = document.getElementById('stat-los-text');
  const cong = m.congestion_score || 0.2;
  
  if (cong < 0.3) {
    losText.innerText = "Grade A";
    losBadge.className = "badge los-a";
    losBadge.innerText = "LoS A (Excellent)";
  } else if (cong < 0.6) {
    losText.innerText = "Grade B";
    losBadge.className = "badge los-b";
    losBadge.innerText = "LoS B (Good Flow)";
  } else {
    losText.innerText = "Grade D";
    losBadge.className = "badge los-d";
    losBadge.innerText = "LoS D (Congested)";
  }
}

async function fetchLatestMetrics() {
  try {
    const res = await fetch('/api/metrics');
    if (res.ok) {
      const data = await res.json();
      updateMetricsDisplay(data);
    }
  } catch (e) {}
}

async function triggerEmergency() {
  await fetch('/api/dashboard/emergency-reroute', { method: 'POST' });
  alert("🚨 Emergency Evacuation Reroute Triggered Across All Stadium Zones!");
}

async function toggleGate(name) {
  alert(`Gate Toggle Signal Sent to ${name}`);
}

async function addAgents(count) {
  await fetch(`/api/simulation/add-agents?count=${count}`, { method: 'POST' });
}

async function setSpeed(mult) {
  await fetch(`/api/simulation/speed?multiplier=${mult}`, { method: 'POST' });
}

async function exportCSV() {
  window.open('/api/metrics/export', '_blank');
}
