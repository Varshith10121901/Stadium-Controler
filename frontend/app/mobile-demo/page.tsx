'use client';

// ==============================================================================
// PHASE 4: THE ATTENDEE MOBILE APP (PWA MOCKUP FOR iOS/ANDROID)
// ==============================================================================
// This page acts as a breathtaking mobile UI simulation.
// To view this during your demo, use Chrome DevTools to set the viewport to iPhone 14.

import { useState, useEffect } from 'react';
import { Camera, MapPin, CheckCircle, Navigation, Clock, BellRing, Settings, Trophy, Wifi } from 'lucide-react';

export default function MobileAttendeeApp() {
  const [arActive, setArActive] = useState(false);
  const [notification, setNotification] = useState("");

  // Simulate an incoming AI route trigger
  useEffect(() => {
    setTimeout(() => {
      setNotification("AI Route Found: Avoid Gate C (15m wait), switch to Gate A (3m wait) to earn 200 Swarm Points! 🚀");
    }, 4500);
  }, []);

  return (
    <div className="w-full h-screen bg-black text-white font-sans overflow-hidden flex flex-col items-center justify-start relative">
      
      {/* SIMULATED iOS STATUS BAR */}
      <div className="w-full flex justify-between items-center px-6 pt-3 pb-2 text-[12px] font-bold z-50">
         <span>9:41</span>
         <div className="flex gap-1.5 items-center">
            <Wifi size={14} />
            <div className="w-6 h-3 bg-white rounded flex px-0.5 items-center justify-end">
               <div className="w-4 h-2 bg-black rounded-[1px]"/>
            </div>
         </div>
      </div>

      {notification && (
         <div className="absolute top-12 left-4 right-4 bg-white/10 backdrop-blur-3xl border border-white/20 p-4 rounded-3xl shadow-2xl z-50 animate-slide-up cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => setNotification("")}>
            <div className="flex gap-3">
               <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-emerald-400 rounded-full flex items-center justify-center shrink-0">
                  <BellRing size={20} className="text-white animate-bounce" />
               </div>
               <div>
                  <h3 className="font-bold text-sm text-white">SwarmAI Route Override</h3>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">{notification}</p>
               </div>
            </div>
         </div>
      )}

      {/* AR VIEW CONTROLLER */}
      {arActive ? (
         <div className="absolute inset-0 z-0 bg-zinc-900 flex flex-col justify-end items-center pb-32">
            {/* Fake Camera View using a gradient for presentation */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
            
            <div className="relative z-10 w-24 h-24 mb-10 border-[6px] border-emerald-400 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(52,211,153,0.5)] animate-pulse">
               <Navigation size={40} className="text-emerald-400" />
            </div>
            <h1 className="relative z-10 text-2xl font-black mb-2 text-emerald-400 shadow-black drop-shadow-md">Turn Right ahead</h1>
            <p className="relative z-10 text-white font-bold opacity-80 backdrop-blur-md px-4 py-2 bg-black/40 rounded-full text-sm">Gate A is 45 meters away.</p>
         </div>
      ) : (
         <div className="flex-1 w-full px-5 pt-8 overflow-y-auto">
            {/* MOBILE HERO */}
            <div className="mb-8">
               <h1 className="text-3xl font-black tracking-tight mb-1">Your Event</h1>
               <p className="text-gray-400 font-medium tracking-wide">Final Match - Narendra Modi Stadium</p>
            </div>

            {/* DYNAMIC WAYFINDING CARDS */}
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Live Queues</h2>
            <div className="space-y-4 mb-8">
               
               <div className="bg-gradient-to-br from-[#1c1c1e] to-black border border-white/5 p-5 rounded-[2rem] shadow-xl flex justify-between items-center">
                  <div className="flex gap-4 items-center">
                     <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/50">
                        <Clock size={20} className="text-rose-400" />
                     </div>
                     <div>
                        <h3 className="font-bold text-white mb-0.5">Restroom B</h3>
                        <p className="text-xs text-gray-400">15 min wait</p>
                     </div>
                  </div>
                  <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold">Avoid</div>
               </div>

               <div className="bg-gradient-to-br from-emerald-900/40 to-black border border-emerald-500/30 p-5 rounded-[2rem] shadow-xl flex justify-between items-center relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/20 blur-2xl rounded-full" />
                  <div className="flex gap-4 items-center relative z-10">
                     <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
                        <CheckCircle size={20} className="text-emerald-400" />
                     </div>
                     <div>
                        <h3 className="font-bold text-white mb-0.5">Restroom A</h3>
                        <p className="text-xs text-emerald-400">2 min wait</p>
                     </div>
                  </div>
                  <button onClick={() => setArActive(true)} className="relative z-10 px-4 py-2 bg-emerald-500 text-black rounded-full text-xs font-bold transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                     AR Route
                  </button>
               </div>

            </div>

            {/* GAMIFIED REWARDS */}
             <div className="bg-[#1c1c1e] p-6 rounded-[2rem] flex flex-col items-center justify-center text-center">
               <Trophy size={40} className="text-amber-400 mb-3" />
               <h3 className="font-bold text-lg">1,240 Swarm Points</h3>
               <p className="text-xs text-gray-400 mt-1 mb-4">You&apos;re helping balance the crowd!</p>
               <div className="w-full h-2 bg-black rounded-full overflow-hidden">
                  <div className="w-[70%] h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full" />
               </div>
               <p className="text-[10px] text-gray-500 font-bold uppercase mt-3 tracking-widest">260 points to Free Merch</p>
            </div>
         </div>
      )}

      {/* iOS STYLE BOTTOM CONSOLE */}
      <nav className="w-full bg-[#1c1c1e]/80 backdrop-blur-3xl pb-8 pt-4 px-8 flex justify-between items-center rounded-t-[2.5rem] border-t border-white/10 z-50">
         <button className="text-gray-400 hover:text-white transition-colors flex flex-col items-center gap-1.5" onClick={() => setArActive(false)}>
            <MapPin size={24} className={!arActive ? "text-emerald-400" : ""} />
            <span className="text-[9px] font-bold">MAP</span>
         </button>
         
         <div className="relative -top-8">
            <button 
               className="w-16 h-16 bg-gradient-to-tr from-emerald-400 to-blue-500 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(52,211,153,0.4)] text-black transition-transform active:scale-90"
               onClick={() => setArActive(!arActive)}
            >
               <Camera size={26} />
            </button>
            <span className="absolute -bottom-5 w-full text-center text-[9px] font-bold text-gray-300">AR VIEW</span>
         </div>

         <button className="text-gray-400 hover:text-white transition-colors flex flex-col items-center gap-1.5">
            <Settings size={24} />
            <span className="text-[9px] font-bold">MENU</span>
         </button>
      </nav>

    </div>
  );
}
