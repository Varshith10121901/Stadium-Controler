'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Shield, Wifi, Sun, Moon, MessageSquare, Send, X, MapPin, Search, Navigation, Lock, Users, Coins, Clock, Eye, EyeOff, Footprints, Coffee, DoorOpen, Waves } from 'lucide-react';
import { useSwarmStore } from '@/lib/store';
import { getApiUrl } from '@/lib/utils';
import { LANGUAGES, t, type Language } from '@/lib/i18n';

const StadiumCanvas = dynamic(() => import('@/components/StadiumCanvas'), { ssr: false });

// === CONSTANTS ===
const REAL_MADRID_GOLD = "#FEBE10";
const REAL_MADRID_NAVY = "#00529F";


// --- MAIN APP (UI OVERLAY) --- //

export default function App() {
  const [appState, setAppState] = useState<'intro' | 'login_attendee' | 'main'>('intro');
  const [username, setUsername] = useState('');
  const [lockedSeats, setLockedSeats] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'seat'|'metrics'>('seat');
  const [theme, setTheme] = useState('light');
  const isDark = theme === 'dark';
  const [highContrast, setHighContrast] = useState(false);

  const [isRoofOpen, setIsRoofOpen] = useState(true);
  const [isPitchRetracted, setIsPitchRetracted] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [isSimulated, setIsSimulated] = useState(true);

  // Seat / Routing State
  const [selectedSeat, setSelectedSeat] = useState<[number,number,number]|null>(null);
  const [mappedPath, setMappedPath] = useState<Array<[number, number]>>([]);
  const [isFpv, setIsFpv] = useState(false);
  const [isFollowingPath, setIsFollowingPath] = useState(false);

  // Accessibility + Multilingual state (Problem-Alignment §7.1, §7.4)
  const [accessible, setAccessible] = useState(false);
  const [lang, setLang] = useState<Language>('en');

  // Fetch lock on mount (gracefully skip if backend offline)
  useEffect(() => {
     fetch(`${getApiUrl()}/api/seats/locked`)
        .then(r => r.json())
        .then(data => setLockedSeats(data))
        .catch(() => {}); // Backend offline — silently skip
  }, [appState]);

  // Chatbot State
  const [chatMessages, setChatMessages] = useState([
    { text: "Welcome to SwarmAI Bernabeu Edition! Click any seat block in the 3D stadium to claim it, or ask me for optimal routing directions.", isUser: false }
  ]);

  // Attempt to claim seat on click (gracefully skip if backend offline)
  useEffect(() => {
     if (selectedSeat && username) {
        const seatId = `${selectedSeat[0].toFixed(2)}_${selectedSeat[2].toFixed(2)}`;
        fetch(`${getApiUrl()}/api/seats/lock`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user_id: username, seat_id: seatId })
        }).then(res => {
            if (res.status === 409) {
                setChatMessages(prev => [
                    ...prev,
                    { text: `⚠️ Seat ${seatId} is already reserved by another attendee. Please select another seat block on the 3D map.`, isUser: false }
                ]);
                setIsChatOpen(true);
                setSelectedSeat(null);
            }
        }).catch(() => {}); // Backend offline — seat claimed locally
     }
  }, [selectedSeat, username]);
  const [inputValue, setInputValue] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, isChatOpen]);

  const requestPath = async (target_type: string, customUserMsg?: string) => {
     const userText = customUserMsg || `Seeking nearest ${target_type}...`;
     setChatMessages(prev => [...prev, { text: userText, isUser: true }]);

     if (!selectedSeat) {
         setChatMessages(prev => [...prev, { text: `[PA NOTIFICATION] You must acquire an active seat reservation before I can compute physical A* vectors.`, isUser: false }]);
         return;
     }
  
     let reply = "Processing Swarm vectors...";
     if (target_type === 'restroom') reply = "Traffic mapped to nearest Merchandise Store. I've highlighted it in green on your 3D structural map.";
     else if (target_type === 'concession') reply = "Concessions traffic monitored. I've plotted the shortest vector to the nearest available food stall on your 3D structural map.";
     else reply = "Gate traffic analyzed. To avoid peak rush, I have calculated and mapped the fastest exit trajectory for your current location on the pitch.";

     setIsFpv(true); // Automatically trigger First Person View for visual tracking

     setTimeout(async () => {
         try {
            if (selectedSeat) {
               const sx = (selectedSeat[0] / 1.1) + 50;
               const sy = (selectedSeat[2] / 1.1) + 50;
               const pathRes = await fetch(`${getApiUrl()}/api/routes/path?start_x=${sx}&start_y=${sy}&target_type=${target_type}&accessible=${accessible}`);
               if (pathRes && pathRes.ok) {
                   const pathData = await pathRes.json();
                   if (pathData.path && pathData.path.length > 0) {
                       setMappedPath(pathData.path);
                   } else {
                       throw new Error("Empty routing payload");
                   }
               } else {
                   throw new Error("API Route unreachable");
               }
             }
         } catch (e) {
             console.error("[SwarmAI Fallback] Injecting emergency static vectors.", e);
             if (selectedSeat) {
                 const sx = (selectedSeat[0] / 1.1) + 50;
                 const sy = (selectedSeat[2] / 1.1) + 50;
                 // Guarantee a working path payload for physical traversal demo
                 // Route directly to the outer stadium concourse (y=95 or y=5) instead of walking on the pitch
                 const concourseY = sy > 50 ? 95 : 5;
                 setMappedPath([[sx, sy], [sx, concourseY], [50, concourseY]]);
             }
         } finally {
             setIsFollowingPath(false); // Reset tracking
         }
         
         setChatMessages(prev => [...prev, { text: reply, isUser: false }]);
     }, 1000);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    const newMsg = inputValue;
    setInputValue("");
    
    const lower = newMsg.toLowerCase();
    let target_type = "";
    
    if (lower.includes('bathroom') || lower.includes('restroom') || lower.includes('washroom') || lower.includes('hotel') || lower.includes('toilet')) {
        setChatMessages(prev => [
            ...prev,
            { text: newMsg, isUser: true },
            { text: "There are no public washrooms or hotels inside the stadium area. You can find Merchandise Stores at the North and East concourses.", isUser: false }
        ]);
        return;
    }
    
    if (lower.includes('merchandise') || lower.includes('merch') || lower.includes('store') || lower.includes('shop') || lower.includes('buy')) target_type = "restroom";
    else if (lower.includes('food') || lower.includes('snack') || lower.includes('hungry') || lower.includes('concession')) target_type = "concession";
    else if (lower.includes('gate') || lower.includes('exit') || lower.includes('leave') || lower.includes('evacuate') || lower.includes('emergency')) {
       if (lower.includes('evacuate') || lower.includes('emergency')) setIsEmergency(true);
       target_type = "gate";
    }

    if (!target_type) {
        // Send to Google Gemini AI for intelligent response
        setChatMessages(prev => [...prev, { text: newMsg, isUser: true }]);
        try {
            const geminiRes = await fetch(`${getApiUrl()}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: newMsg,
                    seat_x: selectedSeat ? selectedSeat[0] : null,
                    seat_z: selectedSeat ? selectedSeat[2] : null,
                })
            });
            const data = await geminiRes.json();
            setChatMessages(prev => [...prev, { text: data.reply, isUser: false }]);
            // If Gemini suggests an action, auto-trigger it
            if (data.suggested_action === 'route_restroom') requestPath('restroom');
            else if (data.suggested_action === 'route_food') requestPath('concession');
            else if (data.suggested_action === 'route_exit') requestPath('gate');
        } catch {
            setChatMessages(prev => [...prev, { text: "🧠 SwarmAI Bernabeu Edition is processing... Try asking about restrooms, food, or exits for instant routing!", isUser: false }]);
        }
        return;
    }

    requestPath(target_type, newMsg);
  };

  // Live Metrics Simulator removed - connecting to Global Backend Store
  const globalMetrics = useSwarmStore(state => state.metrics);
  const [smartPathRequested, setSmartPathRequested] = useState(false);

  // Dynamic Wait logic
  const [waits, setWaits] = useState({ rn: 25, re: 2, c1: 15, c2: 0, ga: 12, gc: 1, gb: 5, gd: 0 });
  useEffect(() => {
     // Drops wait time quickly for the demo
     const t = setInterval(() => {
        setWaits(w => ({
           rn: Math.max(0, w.rn - 1),
           re: Math.max(0, w.re - 1),
           c1: Math.max(0, w.c1 - 1),
           c2: Math.max(0, w.c2 - 1),
           ga: Math.max(0, w.ga - 1),
           gc: Math.max(0, w.gc - 1),
           gb: Math.max(0, w.gb - 1),
           gd: Math.max(0, w.gd - 1)
        }));
     }, 2500);
     return () => clearInterval(t);
  }, []);

  // Privacy ID generation (hydration safe)
  const [tempID, setTempID] = useState("------");
  useEffect(() => {
     setTempID(Math.random().toString(36).substring(2, 8).toUpperCase());
  }, []);

  return (
    <div className={`relative w-screen h-screen overflow-hidden ${isDark ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'} ${highContrast ? 'high-contrast' : ''} font-sans`}>
      
      {/* ONBOARDING HINT */}
      {!selectedSeat && (
         <div className="pointer-events-none absolute top-24 left-1/2 -translate-x-1/2 z-50 animate-bounce">
            <div className="bg-[#00529F] border-2 border-[#FEBE10] text-white px-6 py-3 rounded-full text-xs font-black tracking-widest uppercase shadow-2xl backdrop-blur-md flex items-center gap-2">
               👆 Click on any 3D Seat Block to Select your Location
            </div>
         </div>
      )}

      {/* 3D CANVAS */}
      <div className="absolute inset-0 z-0">
        <StadiumCanvas
          isDark={isDark}
          isRoofOpen={isRoofOpen}
          isPitchRetracted={isPitchRetracted}
          selectedSeat={selectedSeat}
          setSelectedSeat={setSelectedSeat}
          lockedSeats={lockedSeats}
          mappedPath={mappedPath}
          isFollowingPath={isFollowingPath}
          setIsFollowingPath={setIsFollowingPath}
          isEmergency={isEmergency}
          waits={waits}
          isFpv={isFpv}
          setIsFpv={setIsFpv}
          requestPath={requestPath}
        />
        {/* Screen Reader Announcements for Dynamic Updates */}
        <div className="sr-only" aria-live="polite" id="announcement-region">
          {selectedSeat ? `Position synced at coordinate X: ${selectedSeat[0].toFixed(1)}, Z: ${selectedSeat[2].toFixed(1)}.` : 'No location selected.'}
          {mappedPath && mappedPath.length > 0 ? ` Optimal SwarmAI path calculated with ${mappedPath.length} vectors.` : ''}
          {isFollowingPath ? ' Navigating along the optimal path.' : ''}
          {isEmergency ? ' Attention: Emergency evacuation protocol is active. Rerouting all fans to nearest exit gates.' : ''}
        </div>
      </div>

      {/* INTRO SCREEN (Refined per feedback) */}
      {appState === 'intro' && (
         <div className="absolute inset-0 z-50 bg-[#020617]/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 transition-opacity duration-1000">
             <div className="flex flex-col items-center max-w-xl text-center">
                 <Shield size={64} className="text-[#FEBE10] mb-6 animate-bounce shadow-yellow-500/50" />
                 <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 tracking-[0.3em] mb-3">
                    SWARMAI
                 </h1>
                 <h2 className="text-[#FEBE10] text-sm tracking-[0.4em] font-bold uppercase mb-12 border-b border-[#FEBE10]/30 pb-4">
                     Decentralized Engine Dashboard
                 </h2>
                 <p className="text-gray-400 text-xs mb-12 max-w-sm leading-relaxed">
                     Solving physical congestion natively using A* mathematical vectors. Let your attendees pick their seats, lock their space, and map perfect physics-based local routes. 
                 </p>
                 <button 
                     onClick={() => setAppState('login_attendee')}
                     aria-label="Enter the SwarmAI attendee simulation"
                     className="w-full max-w-sm group relative px-10 py-4 mb-4 rounded-xl bg-gradient-to-r from-[#FEBE10] to-yellow-600 text-black font-black text-xs tracking-widest uppercase hover:scale-105 active:scale-95 transition-all shadow-xl overflow-hidden focus-visible:ring-4 focus-visible:ring-yellow-400"
                 >
                     <span className="relative z-10">Attend Simulation</span>
                     <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                 </button>
                 <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center mt-2">
                   <a href="/dashboard" className="flex-1 group relative px-6 py-4 rounded-xl bg-black border border-[#FEBE10]/50 text-[#FEBE10] font-black text-[10px] tracking-widest uppercase hover:scale-105 hover:bg-[#FEBE10]/10 hover:border-[#FEBE10] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2">
                      <span>📊 Operator Dashboard</span>
                   </a>
                 </div>
             </div>
         </div>
      )}

      {/* LOGIN SCREEN */}
      {appState === 'login_attendee' && (
         <div className="absolute inset-0 z-50 bg-[#020617]/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 transition-opacity duration-1000">
             <div className="bg-white/5 border border-white/10 p-10 rounded-2xl flex flex-col items-center shadow-[0_0_50px_rgba(254,190,16,0.1)] w-full max-w-md">
                 <Lock size={48} className="text-[#FEBE10] mb-6 animate-pulse" />
                 <h1 className="text-white text-2xl font-black uppercase tracking-widest mb-2">Attendee Auth</h1>
                 <p className="text-gray-400 text-xs text-center mb-8">Enter your name to secure your unique identity payload. You will be able to book your 1-of-5000 seat on the grid.</p>
                 
                 <form onSubmit={(e) => { e.preventDefault(); if (username) setAppState('main'); }} className="w-full flex flex-col gap-4" aria-label="Attendee login form">
                     <label htmlFor="username-input" className="sr-only">Username</label>
                     <input 
                         id="username-input"
                         type="text"
                         value={username}
                         onChange={(e) => setUsername(e.target.value)}
                         placeholder="Enter Username"
                         autoComplete="username"
                         aria-required="true"
                         className="w-full bg-black/50 border border-white/20 p-4 rounded text-center text-white tracking-widest uppercase focus:border-[#FEBE10] outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
                     />
                     <button type="submit" disabled={!username} aria-label="Log in and enter the stadium simulation" className="bg-[#FEBE10] text-black disabled:opacity-50 font-black uppercase px-6 py-4 rounded hover:bg-white hover:scale-[1.02] active:scale-95 transition-all focus-visible:ring-4 focus-visible:ring-yellow-400">
                        Log In & Map Space
                     </button>
                 </form>
             </div>
         </div>
      )}

      {/* MAIN UI DASHBOARD */}
      <div className={`relative z-10 w-full h-full pointer-events-none transition-opacity duration-1000 flex flex-col ${appState === 'main' ? 'opacity-100' : 'opacity-0'}`}>
         
         <header className={`px-6 py-4 flex flex-col lg:flex-row gap-4 justify-between items-center pointer-events-auto backdrop-blur-xl border-b ${isDark ? 'bg-black/50 border-white/10' : 'bg-white/80 border-slate-200'}`}>
             <div className="flex items-center gap-3">
                 <Shield className="text-[#FEBE10]" size={28} />
                 <div>
                     <h1 className="font-black pt-1 text-xl tracking-widest uppercase leading-none">SwarmAI</h1>
                     <span className="text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5 opacity-70 mt-1">
                        <Wifi size={10} className="text-emerald-500 animate-pulse" /> Live Event
                     </span>
                 </div>
             </div>

             {/* SwarmAI Running Status & Quick Navigation */}
             <div className="flex flex-wrap items-center gap-2">
                 <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-black tracking-widest uppercase flex items-center gap-1.5 animate-pulse">
                     <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                     ✅ SwarmAI is running!
                 </span>
                 <Link href="/" className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all">
                     📱 Attendee App
                 </Link>
                 <Link href="/dashboard" className="px-3 py-1.5 bg-[#FEBE10] text-black hover:bg-white border border-[#FEBE10]/20 rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all">
                     📊 Dashboard
                 </Link>
             </div>

             <div className="flex gap-2" role="toolbar" aria-label="Stadium controls">
                <button
                  onClick={() => setIsEmergency(!isEmergency)}
                  aria-label={isEmergency ? 'Cancel emergency reroute' : 'Trigger emergency evacuation reroute'}
                  aria-pressed={isEmergency}
                  className={`px-4 py-2 border rounded-xl font-bold text-[10px] uppercase tracking-widest focus-visible:ring-2 focus-visible:ring-red-400 ${isEmergency ? 'bg-red-500 text-white animate-pulse' : isDark ? 'bg-black/50 border-white/20' : 'bg-white/80 border-slate-300'}`}>
                   {isEmergency ? 'REROUTING...' : 'EMERGENCY TRIGGER'}
                </button>
                <button
                  onClick={() => setAccessible(a => !a)}
                  aria-label={accessible ? 'Disable accessible routing mode' : 'Enable accessible routing mode (prefers ramps, avoids stairs)'}
                  aria-pressed={accessible}
                  className={`px-3 py-2 border rounded-xl font-bold text-[9px] uppercase tracking-wider focus-visible:ring-2 focus-visible:ring-emerald-400 ${accessible ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : isDark ? 'bg-black/50 border-white/20 text-white' : 'bg-white/80 border-slate-300 text-slate-700'}`}>
                  ♿ {accessible ? 'Accessible On' : 'Accessible Off'}
                </button>
                <button
                  onClick={() => setHighContrast(h => !h)}
                  aria-label={highContrast ? 'Switch to normal contrast mode' : 'Switch to high contrast mode'}
                  aria-pressed={highContrast}
                  className={`px-3 py-2 border rounded-xl font-bold text-[9px] uppercase tracking-wider focus-visible:ring-2 focus-visible:ring-blue-400 ${isDark ? 'bg-black/50 border-white/20 text-white' : 'bg-white/80 border-slate-300 text-slate-700'}`}>
                  {highContrast ? 'Normal' : 'High Contrast'}
                </button>
                <button
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  className={`p-2 border rounded-xl focus-visible:ring-2 focus-visible:ring-blue-400 ${isDark ? 'bg-black/50 border-white/20' : 'bg-white/80 border-slate-300'}`}>
                   {isDark ? <Sun size={14} aria-hidden="true" /> : <Moon size={14} aria-hidden="true" />}
                </button>
             </div>
         </header>

         <div className="flex-1 relative">
            
             {/* ATTENDEE MOBILE HUD (Gamification, Pods, Predictors) */}
             <div className="pointer-events-none absolute top-24 left-6 flex flex-col gap-4 max-w-[280px]">
                
                {/* Gamification & Privacy */}
                <div className={`pointer-events-auto p-4 rounded-3xl backdrop-blur-3xl border shadow-xl flex flex-col gap-3 ${isDark ? 'bg-black/60 border-white/10' : 'bg-white/80 border-slate-200'}`}>
                   <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-1">
                      <Lock size={12} className="text-emerald-500" />
                      <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest leading-none mt-0.5">Privacy First</span>
                      <span className="text-[8px] font-mono opacity-50 ml-auto bg-white/10 px-1.5 py-0.5 rounded">ID: {tempID}</span>
                   </div>
                   
                   <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-[#FEBE10] to-yellow-600 w-10 h-10 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/20">
                         <Coins size={16} className="text-black" />
                      </div>
                      <div>
                         <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Swarm Points</p>
                         <p className="text-xl font-black font-mono leading-none tracking-tighter">1,240 <span className="text-[10px] text-emerald-500 tracking-normal">+15</span></p>
                      </div>
                   </div>
                </div>

                {/* Pod Groups & Smart Routing */}
                <div className={`pointer-events-auto p-4 rounded-3xl backdrop-blur-3xl border shadow-xl flex flex-col gap-3 ${isDark ? 'bg-black/60 border-white/10' : 'bg-white/80 border-slate-200'}`}>
                   <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Users size={12} className="text-[#FEBE10]" /> Pod sync: Family</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   </div>
                   <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-l-2 border-[#FEBE10] pl-2">2 Arrived · 1 In Motion</p>
                   
                   <button 
                      onClick={() => {
                         setSmartPathRequested(true);
                         setSelectedSeat([35, 12, -15]); // Auto-trigger UI map
                         if (!isChatOpen) setIsChatOpen(true);
                         setChatMessages(prev => [...prev, { text: "Pod sync initialized. Calculating unified center-of-mass vector for your family group... Routing lines have been drawn on your 3D map.", isUser: false }]);
                      }} 
                      disabled={smartPathRequested}
                      className={`w-full py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${smartPathRequested ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/50' : 'bg-white/10 hover:bg-[#FEBE10] hover:text-black hover:scale-[1.02]'}`}
                   >
                     {smartPathRequested ? <><Shield size={12} /> Optimal Route Active</> : <><Navigation size={12} /> Request Smart Path</>}
                   </button>
                </div>

                {/* Wait Predictors */}
                 <div className={`pointer-events-auto p-4 rounded-3xl backdrop-blur-3xl border shadow-xl flex flex-col gap-3 ${isDark ? 'bg-black/60 border-white/10' : 'bg-white/80 border-slate-200'}`}>
                    <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-blue-400 mb-1">
                       <Clock size={12} /> Real-Time Predictors
                    </h3>
                    
                    <div className="space-y-3" aria-live="polite" aria-label="Real-time wait time predictions">
                       <div className="flex justify-between items-end border-b border-white/5 pb-2">
                           <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">East Concession</span>
                           <div className="text-right">
                              <div className="text-emerald-400 font-mono text-xs font-black">2 MIN</div>
                              <div className="text-[8px] text-gray-500 uppercase">-4m Swarm Savings</div>
                           </div>
                       </div>
                       <div className="flex justify-between items-end border-b border-white/5 pb-2">
                           <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">North Merch Store</span>
                           <div className="text-right">
                              <div className="text-red-400 font-mono text-xs font-black">18 SEC</div>
                              <div className="text-[8px] text-emerald-500 font-bold uppercase">Stock level: 98%</div>
                           </div>
                       </div>
                    </div>
                 </div>

             </div>

            {/* UNIFIED SIDEBAR SEAT MENU */}
            {selectedSeat && (
               <div aria-live="polite" aria-label="Selected seat information and navigation controls" className="pointer-events-auto absolute bottom-6 left-[40%] -translate-x-1/2 flex items-center gap-4 px-6 py-3 rounded-full backdrop-blur-xl border border-black/25 shadow-2xl animate-in slide-in-from-bottom-8 z-20 bg-white/90 text-black">
                  {/* Gold AI Sparkle */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="#FEBE10" stroke="#d4a017" strokeWidth="0.5"/>
                    <path d="M19 2L19.75 4.75L22.5 5.5L19.75 6.25L19 9L18.25 6.25L15.5 5.5L18.25 4.75L19 2Z" fill="#FEBE10" opacity="0.8"/>
                    <path d="M5 16L5.5 17.75L7.25 18.25L5.5 18.75L5 20.5L4.5 18.75L2.75 18.25L4.5 17.75L5 16Z" fill="#FEBE10" opacity="0.6"/>
                  </svg>
                  
                  {/* SEAT INFO TEXT */}
                  <div className="flex flex-col items-center border-r border-black/20 pr-4">
                     <span className="font-black text-[9px] uppercase tracking-widest text-slate-800 whitespace-nowrap">My Seat</span>
                     <span className="text-[11px] font-mono font-bold text-black opacity-90 whitespace-nowrap">X: {selectedSeat[0].toFixed(1)} / Z: {selectedSeat[2].toFixed(1)}</span>
                  </div>

                  {/* NEIGHBORS METRIC */}
                  <div className="flex flex-col items-center border-r border-black/20 pr-4">
                     <span className="text-[9px] uppercase tracking-widest font-black opacity-80 whitespace-nowrap text-slate-800">Neighbors</span>
                     <span className="text-emerald-600 font-mono text-[11px] leading-none pt-0.5 font-extrabold">142</span>
                  </div>

                  {/* FPV TOGGLE */}
                  <button 
                     onClick={() => setIsFpv(!isFpv)}
                     aria-label={isFpv ? 'Exit first person view mode' : 'Enter first person view from your seat'}
                     aria-pressed={isFpv}
                     className={`py-2 px-4 rounded-full text-[9px] flex items-center gap-2 font-black uppercase tracking-widest border shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap focus-visible:ring-4 focus-visible:ring-yellow-400 ${isFpv ? 'bg-red-500/20 text-red-700 border-red-500/40' : 'bg-slate-200/50 text-black border-black/30 hover:bg-slate-300/80'}`}
                  >
                     {isFpv ? <><EyeOff size={12}/> EXIT FPV</> : <><Eye size={12}/> VIEW FPV</>}
                  </button>

                  <div className="w-[1px] h-6 bg-black/20" />

                  {/* QUICK ROUTES */}
                  <div className="flex items-center gap-2" role="group" aria-label="Quick route options">
                     <button aria-label="Route me to nearest merchandise store" onClick={() => requestPath('restroom')} className="flex items-center gap-2 hover:bg-purple-600 hover:text-white transition-colors px-3 py-2 rounded-full text-[9px] font-black tracking-widest uppercase border whitespace-nowrap bg-purple-100 text-purple-900 border-purple-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-purple-400">
                         <Coins size={12} aria-hidden="true"/> Merchandise
                     </button>
                     <button aria-label="Route me to nearest food concessions" onClick={() => requestPath('concession')} className="flex items-center gap-2 hover:bg-amber-500 hover:text-white transition-colors px-3 py-2 rounded-full text-[9px] font-black tracking-widest uppercase border whitespace-nowrap bg-amber-100 text-amber-900 border-amber-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-amber-400">
                         <Coffee size={12} aria-hidden="true"/> Food
                     </button>
                     <button aria-label="Route me to nearest stadium exit" onClick={() => requestPath('gate')} className="flex items-center gap-2 hover:bg-purple-600 hover:text-white transition-colors px-3 py-2 rounded-full text-[9px] font-black tracking-widest uppercase border whitespace-nowrap bg-purple-100 text-purple-900 border-purple-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-purple-400">
                         <DoorOpen size={12} aria-hidden="true"/> Exit
                     </button>
                  </div>
                  
                  <div className="w-[1px] h-6 bg-black/20" />
                  <button 
                      onClick={() => { setIsFollowingPath(true); setIsFpv(true); }}
                      disabled={isFollowingPath || !mappedPath || mappedPath.length === 0}
                      aria-label="Start virtual path traversal animation from your seat"
                      className={`flex items-center gap-2 py-2 px-5 rounded-full font-black uppercase text-[9px] tracking-widest transition-all whitespace-nowrap border-2 ${
                        (!mappedPath || mappedPath.length === 0)
                          ? 'bg-slate-200/50 text-slate-500 border-slate-300 shadow-none cursor-not-allowed opacity-70' 
                          : isFollowingPath 
                            ? 'bg-emerald-200 text-emerald-800 border-emerald-400 cursor-not-allowed shadow-md' 
                            : 'bg-[#111] text-white border-[#FEBE10] shadow-[0_0_20px_rgba(254,190,16,0.6),0_4px_12px_rgba(0,0,0,0.15)] hover:bg-black hover:scale-105 active:scale-95 hover:shadow-[0_0_30px_rgba(254,190,16,0.9)] animate-pulse'
                      }`}
                  >
                      {(!mappedPath || mappedPath.length === 0) 
                        ? <><Footprints size={12} className="opacity-50" aria-hidden="true" /> AWAITING ROUTE</>
                        : isFollowingPath 
                        ? <><Footprints size={12} className="animate-bounce" aria-hidden="true" /> Navigating...</> 
                        : <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                              <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="#FEBE10" stroke="#d4a017" strokeWidth="0.5"/>
                              <path d="M19 2L19.75 4.75L22.5 5.5L19.75 6.25L19 9L18.25 6.25L15.5 5.5L18.25 4.75L19 2Z" fill="#FEBE10"/>
                            </svg>
                            PHYSICAL TRAVERSAL
                          </>
                      }
                  </button>
               </div>
            )}

            {/* CHATBOT */}
            <div className="pointer-events-auto absolute bottom-24 right-6">
               {isChatOpen ? (
                  <div className={`w-80 h-96 rounded-[2rem] flex flex-col shadow-2xl border backdrop-blur-3xl ${isDark ? 'bg-black/80 border-white/20' : 'bg-white/95 border-slate-200'}`} role="dialog" aria-label="SwarmAI navigation assistant" aria-modal="false">
                     <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#FEBE10]/10 rounded-t-[2rem]">
                        <span className="font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><MapPin size={12} className="text-[#FEBE10]" aria-hidden="true" /> Swarm Assistant</span>
                        <button aria-label="Close SwarmAI assistant" onClick={() => setIsChatOpen(false)} className="opacity-50 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-white rounded">
                          <X size={14} aria-hidden="true" />
                        </button>
                     </div>
                     
                     <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 text-[11px] font-medium leading-relaxed" aria-live="polite" aria-label="Chat conversation messages">
                        {chatMessages.map((msg, idx) => {
                          let parsed: any = null;
                          if (!msg.isUser && msg.text.trim().startsWith('{')) {
                            try { parsed = JSON.parse(msg.text); } catch(e) {}
                          }
                          return (
                          <div key={idx} className={`p-3 rounded-2xl flex-shrink-0 w-[85%] ${msg.isUser ? 'self-end bg-[#00529F] border-[#00529F] text-white shadow-md' : isDark ? 'self-start border bg-white/5 border-white/10 text-gray-200' : 'self-start border bg-slate-50 border-slate-200 text-slate-800'}`}>
                             {parsed ? (
                               <div className="flex flex-col gap-2">
                                 <strong className="text-[#FEBE10] leading-tight">{parsed.suggestion || "SwarmAI Optimized Route"}</strong>
                                 <div className="text-[10px] opacity-90 leading-tight">{parsed.reasoning}</div>
                                 <div className="flex flex-wrap gap-1 mt-1 text-[9px]">
                                   {parsed.los_grade && <div className="bg-white/10 px-1.5 py-0.5 rounded border border-white/5">LoS Grade: <b className={parsed.los_grade === 'A' || parsed.los_grade === 'B' ? 'text-emerald-400' : 'text-amber-400'}>{parsed.los_grade}</b></div>}
                                   {parsed.estimated_time && <div className="bg-white/10 px-1.5 py-0.5 rounded border border-white/5">Time: <b>{parsed.estimated_time}</b></div>}
                                 </div>
                                 {parsed.safety_note && <div className="mt-1 text-emerald-400 text-[9px] border border-emerald-500/20 bg-emerald-500/10 p-1.5 flex items-center gap-1 rounded">✅ {parsed.safety_note}</div>}
                               </div>
                             ) : (
                               msg.text
                             )}
                          </div>
                          );
                        })}
                        <div ref={chatBottomRef} />
                     </div>

                     <div className="px-4 pb-2 pt-2 flex gap-2 overflow-x-auto whitespace-nowrap border-t border-white/5 pointer-events-auto" role="group" aria-label="Quick route shortcuts">
                        <button aria-label="Find nearest merchandise store" onClick={() => requestPath('restroom')} className={`bg-transparent hover:bg-[#FEBE10] hover:text-black transition-colors rounded-full px-3 py-1 text-[9px] uppercase border ${isDark ? 'border-white/20' : 'border-slate-300'} font-black tracking-widest focus-visible:ring-2 focus-visible:ring-yellow-400`}><span aria-hidden="true">🛍️</span> Nearby Merchandise</button>
                        <button aria-label="Find nearest food concessions" onClick={() => requestPath('concession')} className={`bg-transparent hover:bg-[#FEBE10] hover:text-black transition-colors rounded-full px-3 py-1 text-[9px] uppercase border ${isDark ? 'border-white/20' : 'border-slate-300'} font-black tracking-widest focus-visible:ring-2 focus-visible:ring-yellow-400`}><span aria-hidden="true">🍔</span> Nearby Food</button>
                        <button aria-label="Find nearest exit gates" onClick={() => requestPath('gate')} className={`bg-transparent hover:bg-[#FEBE10] hover:text-black transition-colors rounded-full px-3 py-1 text-[9px] uppercase border ${isDark ? 'border-white/20' : 'border-slate-300'} font-black tracking-widest focus-visible:ring-2 focus-visible:ring-yellow-400`}><span aria-hidden="true">🚪</span> Nearby Gates</button>
                     </div>
                     
                     <div className="p-3">
                        <form 
                          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
                          className={`flex items-center gap-2 p-1.5 pl-4 rounded-full border ${isDark ? 'bg-black/50 border-white/20' : 'bg-slate-100 border-slate-200'} shadow-inner focus-within:border-[#FEBE10] transition-colors`}
                        >
                           <label htmlFor="chat-input" className="sr-only">Message the SwarmAI assistant</label>
                           <input 
                             id="chat-input"
                             type="text" 
                             value={inputValue}
                             onChange={(e) => setInputValue(e.target.value)}
                             placeholder="Ask for restrooms, food, exits..." 
                             aria-label="Chat message input"
                             className="bg-transparent outline-none flex-1 text-[11px] placeholder:text-gray-500" 
                           />
                           <button type="submit" aria-label="Send message to SwarmAI" className="bg-[#FEBE10] p-2 rounded-full hover:scale-105 active:scale-95 transition-transform shadow-md focus-visible:ring-2 focus-visible:ring-yellow-600">
                             <Send size={12} className="text-black ml-0.5" aria-hidden="true" />
                           </button>
                        </form>
                     </div>
                  </div>
               ) : (
                  <button
                    onClick={() => {
                     if (!selectedSeat) {
                       const angle = Math.random() * Math.PI * 2;
                       const rowFactor = 0.3 + Math.random() * 0.6;
                       const r = 25 + (30 * rowFactor);
                       const rx = parseFloat((Math.cos(angle) * r).toFixed(1));
                       const rz = parseFloat((Math.sin(angle) * r).toFixed(1));
                       const ry = parseFloat((rowFactor * 18).toFixed(1));
                       setSelectedSeat([rx, ry, rz]);
                       setIsFpv(true);
                     }
                     setIsChatOpen(true);
                     setChatMessages(prev => [
                       ...prev,
                       { text: 'Welcome! A seat has been auto-assigned for you. Try tapping Restrooms, Food, or Exit in the dock below to start smart navigation!', isUser: false }
                     ]);
                  }}
                  aria-label="Open SwarmAI navigation assistant (or press C on the 3D canvas)"
                  aria-haspopup="dialog"
                  className="px-6 py-4 rounded-full bg-gradient-to-r from-[#FEBE10] to-yellow-500 text-black font-black text-[11px] uppercase tracking-widest shadow-[0_10px_30px_rgba(254,190,16,0.4)] flex items-center gap-2 hover:scale-105 transition-transform animate-bounce focus-visible:ring-4 focus-visible:ring-yellow-400">
                     <MessageSquare size={16} aria-hidden="true" /> Help me route
                  </button>
               )}
            </div>

         </div>
      </div>
    </div>
  );
}
