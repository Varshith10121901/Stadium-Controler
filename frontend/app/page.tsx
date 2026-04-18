'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Shield, Wifi, Sun, Moon, MessageSquare, Send, X, MapPin, Search, Navigation, Lock, Users, Coins, Clock, Eye, EyeOff, Footprints, Coffee, DoorOpen, Waves } from 'lucide-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useSwarmStore } from '@/lib/store';

// === CONSTANTS ===
const REAL_MADRID_GOLD = "#FEBE10";
const REAL_MADRID_NAVY = "#00529F";

// Architectural physical POI marker with dynamic building geometry
function PhysicalPOI({ position, label, color, waitTime, isHotspot }: { position: [number, number, number], label: string, color: string, waitTime: string, isHotspot: boolean }) {
  const meshRef = useRef<THREE.Group>(null);
  
  const isGate = label.includes('Gate') || label.includes('EXIT');
  const isConcession = label.includes('Concession') || label.includes('Food');
  const isRestroom = label.includes('Restroom') || label.includes('Washroom');

  const structuralColor = '#1e293b'; 
  const angle = Math.atan2(position[0], position[2]); // Point the object structure outwards radially

  return (
    <group position={position} rotation={[0, angle, 0]} ref={meshRef}>
      
      {/* ── GATES (Stairs connecting down outward) ── */}
      {isGate && (
         <group position={[0, -0.5, 0]}>
            {Array.from({ length: 15 }).map((_, i) => (
               <mesh key={i} position={[0, -i * 0.5, i * 1.2]}>
                  <boxGeometry args={[14, 0.5, 1.4]} />
                  <meshStandardMaterial color={structuralColor} roughness={0.9} />
               </mesh>
            ))}
         </group>
      )}

      {/* ── FOOD / RESTROOMS (Physical Stall Structures) ── */}
      {(isConcession || isRestroom) && (
         <group position={[0, 0, 0]}>
            {/* Ground Plate */}
            <mesh position={[0, -1, 0]}>
               <boxGeometry args={[8, 0.5, 8]} />
               <meshStandardMaterial color={structuralColor} roughness={0.9} />
            </mesh>
            {/* Canopy */}
            <mesh position={[0, 4, 0]}>
               <boxGeometry args={[7, 0.4, 7]} />
               <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} roughness={0.4} />
            </mesh>
            {/* Struts */}
            <mesh position={[-3, 1.5, -3]}><boxGeometry args={[0.4, 5, 0.4]} /><meshStandardMaterial color={structuralColor} /></mesh>
            <mesh position={[3, 1.5, -3]}><boxGeometry args={[0.4, 5, 0.4]} /><meshStandardMaterial color={structuralColor} /></mesh>
            <mesh position={[-3, 1.5, 3]}><boxGeometry args={[0.4, 5, 0.4]} /><meshStandardMaterial color={structuralColor} /></mesh>
            <mesh position={[3, 1.5, 3]}><boxGeometry args={[0.4, 5, 0.4]} /><meshStandardMaterial color={structuralColor} /></mesh>
         </group>
      )}

      {/* Identifier Orb core */}
      <mesh position={[0, isGate ? 3 : 5, 0]}>
        <octahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isHotspot ? 2 : 0.8} />
      </mesh>
      
      {/* Danger Zone Buffer ring */}
      {isHotspot && (
        <mesh position={[0, 0, 0]}>
           <cylinderGeometry args={[6, 6, 0.5, 32]} />
           <meshBasicMaterial color="#ef4444" transparent opacity={0.4} />
        </mesh>
      )}

      {/* Overlay Text */}
      <Html position={[0, isGate ? 7 : 8, 0]} center >
         <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 whitespace-nowrap text-white pointer-events-none transform -translate-y-4 shadow-xl">
            <p className="text-[10px] font-bold uppercase tracking-widest leading-tight">{label}</p>
            <p className={`text-[9px] font-black mt-0.5 ${isHotspot ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>{waitTime}</p>
         </div>
      </Html>
    </group>
  );
}

// 5000 Seat InstancedMesh with Raycast interaction
function SeatSelector({ 
   selectedSeat, setSelectedSeat, lockedSeats, isFpv, setIsFpv, requestPath 
}: { 
   selectedSeat: [number, number, number] | null, 
   setSelectedSeat: (v: [number, number, number]|null) => void, 
   lockedSeats: any[],
   isFpv: boolean,
   setIsFpv: (v: boolean) => void,
   requestPath: (type: string) => void
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const SEAT_COUNT = 5000;
  
  const points = useMemo(() => {
    const arr = [];
    for (let i = 0; i < SEAT_COUNT; i++) {
         const angle = (i / SEAT_COUNT) * Math.PI * 2 * 15;
         const rowFactor = (i % 15) / 15;
         const currentRadius = 25 + ((55 - 25) * rowFactor);
         const yBase = Math.pow(rowFactor, 1.5) * 20;
         arr.push([Math.cos(angle) * currentRadius, yBase, Math.sin(angle) * currentRadius]);
    }
    return arr;
  }, []);

  useFrame(() => {
     if (!meshRef.current) return;
     for (let i = 0; i < SEAT_COUNT; i++) {
        const p = points[i];
        dummy.position.set(p[0], p[1], p[2]);
        if (selectedSeat && selectedSeat[0] === p[0] && selectedSeat[2] === p[2]) {
           dummy.scale.set(2, 2, 2); // Enlarge selected seat
        } else {
           dummy.scale.set(1, 1, 1);
        }
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        
        let color = new THREE.Color("#cbd5e1");
        if (selectedSeat && selectedSeat[0] === p[0] && selectedSeat[2] === p[2]) color = new THREE.Color(REAL_MADRID_GOLD);
        meshRef.current.setColorAt(i, color);
     }
     meshRef.current.instanceMatrix.needsUpdate = true;
     if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh 
         ref={meshRef} 
         args={[undefined, undefined, SEAT_COUNT]}
         onClick={(e) => {
            e.stopPropagation();
            if (e.instanceId !== undefined) {
               setSelectedSeat(points[e.instanceId] as [number, number, number]);
            }
         }}
      >
        <boxGeometry args={[0.8, 0.4, 0.8]} />
        <meshStandardMaterial roughness={0.6} transparent opacity={0.4} />
      </instancedMesh>
      
    </group>
  );
}

function Swarm({ count = 3000, isDark, isEmergency }: { count?: number, isDark: boolean, isEmergency?: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const { agents: storeAgents, seatingMode } = useSwarmStore();
  const activeCount = storeAgents.length > 0 ? storeAgents.length : count;
  
  const fallbackAgents = useMemo(() => {
    return Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const rowFactor = Math.floor(Math.random() * 15) / 15; 
      const currentRadius = 25 + ((55 - 25) * rowFactor);
      const yBase = rowFactor * 20;

      return {
        baseX: Math.cos(angle) * currentRadius,
        baseZ: Math.sin(angle) * currentRadius,
        baseY: yBase,
        speed: 0.005 + Math.random() * 0.005,
        offset: Math.random() * Math.PI * 2,
        isCongested: Math.random() > 0.85
      };
    });
  }, [count]);

  const colorCache = useMemo(() => {
    return { 
      defaultColor: new THREE.Color(isDark ? "#ffffff" : REAL_MADRID_NAVY), 
      congestedColor: new THREE.Color("#ef4444") 
    };
  }, [isDark]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    
    for (let i = 0; i < activeCount; i++) {
      let x, z, y, isCongested;

      if (storeAgents.length > 0) {
         const agent = storeAgents[i];
         if (!agent) continue;
         x = (agent.x - 50) * 1.1; // scale canvas 0-100 to 3d world
         z = (agent.y - 50) * 1.1;
         const distCenter = Math.hypot(agent.x - 50, agent.y - 50);
         const rowFactor = Math.min(1, distCenter / 50);
         y = Math.pow(rowFactor, 1.5) * 20;
         isCongested = agent.status === 'waiting' || agent.status === 'congestion';
      } else {
         const agent = fallbackAgents[i];
         const speedMult = isEmergency ? 8 : 1;
         const sway = Math.sin(time * (agent.speed * speedMult) + agent.offset) * (isEmergency ? 3 : 1.5);
         const currentAngle = Math.atan2(agent.baseZ, agent.baseX) + (sway * 0.02);
         const dist = Math.hypot(agent.baseX, agent.baseZ);
         x = Math.cos(currentAngle) * dist;
         z = Math.sin(currentAngle) * dist;
         y = agent.baseY;
         isCongested = agent.isCongested;
      }
      
      dummy.position.set(x, y + 0.5, z);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      meshRef.current!.setColorAt(i, (isCongested || isEmergency) ? colorCache.congestedColor : colorCache.defaultColor);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, activeCount]}>
      <sphereGeometry args={[0.35, 16, 16]} />
      <meshStandardMaterial roughness={0.2} metalness={0.8} emissiveIntensity={1.5} toneMapped={false} />
    </instancedMesh>
  );
}

function PathFollowerAgent({ pathPoints, onComplete }: { pathPoints: THREE.Vector3[], onComplete: () => void }) {
  const meshRef = useRef<THREE.Group>(null);
  const [progress, setProgress] = useState(0);

  useFrame((state, delta) => {
     if (!meshRef.current || pathPoints.length < 2) return;
     
     const speed = 12; // Traversal units per second
     const newProgress = progress + (speed * delta);
     
     let accumulatedDist = 0;
     let currentSegStart = pathPoints[0];
     let currentSegEnd = pathPoints[1];
     let segmentFraction = 0;
     let found = false;

     for (let i = 0; i < pathPoints.length - 1; i++) {
        const p1 = pathPoints[i];
        const p2 = pathPoints[i + 1];
        const dist = p1.distanceTo(p2);
        
        if (newProgress <= accumulatedDist + dist) {
           currentSegStart = p1;
           currentSegEnd = p2;
           segmentFraction = (newProgress - accumulatedDist) / dist;
           found = true;
           break;
        }
        accumulatedDist += dist;
     }

     if (!found) {
        onComplete();
        return;
     }

     meshRef.current.position.lerpVectors(currentSegStart, currentSegEnd, segmentFraction);
     // Point physical capsule accurately onto the route
     meshRef.current.lookAt(new THREE.Vector3(currentSegEnd.x, meshRef.current.position.y, currentSegEnd.z));
     
     // Master Camera accurately tracks the agent physically!
     const controls = state.controls as any;
     if (controls && meshRef.current) {
        // Keeps camera targeting securely on the moving agent natively
        controls.target.lerp(meshRef.current.position, 0.1);
        
        // Calculate the pure trajectory (forward) vector of the agent
        const forwardVector = new THREE.Vector3().subVectors(currentSegEnd, currentSegStart).normalize();
        
        // Smoothly interpolate camera location to be directly behind and above the agent's current trajectory!
        const desiredPos = meshRef.current.position.clone()
             .add(forwardVector.clone().multiplyScalar(-10)) // Follow 10 units directly behind the route line
             .add(new THREE.Vector3(0, 7, 0)); // Elevated 7 units up for visibility
             
        state.camera.position.lerp(desiredPos, 0.05);
     }
     
     setProgress(newProgress);
  });

  return (
    <group ref={meshRef} position={pathPoints[0]}>
       <mesh position={[0, 1.5, 0]}>
          <capsuleGeometry args={[0.5, 1.2, 8, 16]} />
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={3} roughness={0.1} />
       </mesh>
       <pointLight color="#10b981" distance={15} intensity={5} position={[0, 2, 0]} />
    </group>
  );
}

function Pitch({ isRetracted, seat, mappedPath, isFollowingPath, onCompletePath }: { isRetracted: boolean, seat: [number,number,number]|null, mappedPath?: Array<[number, number]>, isFollowingPath: boolean, onCompletePath: () => void }) {
  const pitchRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if(pitchRef.current) pitchRef.current.position.y = THREE.MathUtils.lerp(pitchRef.current.position.y, isRetracted ? -15 : 0, delta * 2);
  });

  // Calculate 3D points based on A* path!
  const computedPoints = useMemo(() => {
     if (!mappedPath || mappedPath.length === 0 || !seat) return [];
     
     const coords = [];
     // 1. Line starts unequivocally at the Seat Face height
     coords.push(new THREE.Vector3(seat[0], seat[1], seat[2]));

     // 2. Trace the A* map points (which are in 0-100 logic coordinates). Convert them back to 3D world:
     for (let i = 0; i < mappedPath.length; i++) {
         const p = mappedPath[i];
         const worldX = (p[0] - 50) * 1.1; 
         const worldZ = (p[1] - 50) * 1.1;
         
         // Assess exact altitude on the physical Stadium Geometry
         const r = Math.hypot(worldX, worldZ);
         // The grandstand cylinder scales linearly from radius 25 (at y=0) to radius 55 (at y=20)
         const seatY = r < 25 ? 0 : ((r - 25) / 30) * 20;

         coords.push(new THREE.Vector3(worldX, seatY + 0.5, worldZ));
     }
     
     return coords;
  }, [mappedPath, seat]);

  return (
    <group ref={pitchRef}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[25, 40]} />
        <meshStandardMaterial color="#0b2b13" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[23, 38, 0.001]} />
        <meshBasicMaterial color="#ffffff" opacity={0.6} transparent wireframe />
      </mesh>
      
      {/* Live Direct A* Mapping Engine */}
      {computedPoints.length > 0 && (
         <Line 
           points={computedPoints} 
           color="#10b981" 
           lineWidth={3.5} 
           opacity={0.9}
           transparent
         />
      )}
      
      {seat && mappedPath && mappedPath.length > 0 && (
        <Html position={[0, 4, 0]} center>
           <div className="flex flex-col gap-1 items-center transform -translate-y-6 pointer-events-none">
              <div className="bg-black/90 p-2 rounded border border-[#10b981] shadow-2xl animate-pulse">
                <p className="text-[#10b981] text-[9px] font-black uppercase tracking-widest text-center">Optimum A* Path Calculated</p>
              </div>
           </div>
        </Html>
      )}

      {/* Renders physical Agent traversing if triggered */}
      {isFollowingPath && computedPoints.length > 0 && (
         <PathFollowerAgent pathPoints={computedPoints} onComplete={onCompletePath} />
      )}
    </group>
  );
}

function StadiumArchitecture({ isDark, isRoofOpen }: { isDark: boolean; isRoofOpen: boolean }) {
  const roofRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (roofRef.current) roofRef.current.scale.setScalar(THREE.MathUtils.lerp(roofRef.current.scale.x, isRoofOpen ? 0.01 : 1, delta * 2));
  });

  return (
    <group scale={[1.4, 1, 1.1]}>
       <mesh position={[0, 10, 0]} receiveShadow>
          <cylinderGeometry args={[55, 25, 20, 64, 1, true]} />
          <meshStandardMaterial color={isDark ? "#0f172a" : "#cbd5e1"} side={THREE.DoubleSide} roughness={0.8} />
       </mesh>
       <mesh position={[0, 10, 0]}>
          <cylinderGeometry args={[56, 56, 22, 64, 1, true]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} side={THREE.DoubleSide} />
       </mesh>
       <mesh ref={roofRef} position={[0, 21, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <circleGeometry args={[56, 64]} />
          <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
       </mesh>
    </group>
  );
}

function CameraController({ isFpv, seat, mappedPath }: { isFpv: boolean, seat: [number,number,number]|null, mappedPath: Array<[number,number]> }) {
  const { camera } = useThree();
  const [animStart, setAnimStart] = useState<number | null>(null);

  // Mark animation timer precisely when perspective mode changes
  useEffect(() => {
     setAnimStart(Date.now());
  }, [isFpv, mappedPath]);

  useFrame((state) => {
     const controls = state.controls as any;
     if (!controls || !animStart) return;

     if (isFpv && seat) {
        if (Date.now() - animStart < 1500) {
           // Elevate camera significantly inside FPV to guarantee no heads/seats block the view of the green routing line
           camera.position.lerp(new THREE.Vector3(seat[0] * 0.95, seat[1] + 10, seat[2] * 0.95), 0.05);

           if (mappedPath && mappedPath.length > 0) {
               const target = mappedPath[mappedPath.length - 1];
               const worldX = (target[0] - 50) * 1.1; 
               const worldZ = (target[1] - 50) * 1.1;
               
               // Calculate exact structural height of the POI target
               const r = Math.hypot(worldX, worldZ);
               const seatY = r < 25 ? 0 : ((r - 25) / 30) * 20;
               
               controls.target.lerp(new THREE.Vector3(worldX, seatY, worldZ), 0.05);
           } else {
               controls.target.lerp(new THREE.Vector3(0, 5, 0), 0.05);
           }
        }
        
        controls.minDistance = 5;
     } else if (!isFpv) {
        if (Date.now() - animStart < 1500) {
           if (mappedPath && mappedPath.length > 0 && seat) {
               // When requesting a route from the Aerial Global view, fly the camera to a raised panoramic observation angle 
               // stationed directly behind the user's seat, looking down at the targeted Store / Room
               const target = mappedPath[mappedPath.length - 1];
               const worldX = (target[0] - 50) * 1.1; 
               const worldZ = (target[1] - 50) * 1.1;
               
               const r = Math.hypot(worldX, worldZ);
               const seatY = r < 25 ? 0 : ((r - 25) / 30) * 20;

               controls.target.lerp(new THREE.Vector3(worldX, seatY, worldZ), 0.05);
               camera.position.lerp(new THREE.Vector3(seat[0] * 1.3, 35, seat[2] * 1.3), 0.05);
           } else {
               // Gentle zoom back out to center stage when nothing is active
               controls.target.lerp(new THREE.Vector3(0, 5, 0), 0.05);
               camera.position.lerp(new THREE.Vector3(0, 45, -60), 0.05);
           }
        }
        controls.minDistance = 20;
     }
  });
  return null;
}

// --- MAIN APP (UI OVERLAY) --- //

export default function App() {
  const [appState, setAppState] = useState<'intro' | 'login_attendee' | 'main'>('intro');
  const [username, setUsername] = useState('');
  const [lockedSeats, setLockedSeats] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'seat'|'metrics'>('seat');
  const [theme, setTheme] = useState('light');
  const isDark = theme === 'dark';

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

  // Fetch lock on mount
  useEffect(() => {
     fetch('http://localhost:8000/api/seats/locked')
        .then(r => r.json())
        .then(data => setLockedSeats(data))
        .catch(console.error);
  }, [appState]);

  // Attempt to claim seat on click
  useEffect(() => {
     if (selectedSeat && username) {
        // Seat bounding index as unique ID
        const seatId = `${selectedSeat[0].toFixed(2)}_${selectedSeat[2].toFixed(2)}`;
        fetch('http://localhost:8000/api/seats/lock', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user_id: username, seat_id: seatId })
        }).then(res => {
            if (res.status === 409) {
                alert("Seat is already reserved by someone else! Pick another.");
                setSelectedSeat(null);
            }
        });
     }
  }, [selectedSeat, username]);

  // Chatbot State
  const [chatMessages, setChatMessages] = useState([
    { text: "Welcome to SwarmAI! Click any seat block in the 3D stadium to claim it, or ask me for optimal routing directions.", isUser: false }
  ]);
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
     if (target_type === 'restroom') reply = "Virtual Buffer Zone deployed. Wait times assessed. I've highlighted the nearest free restroom on your 3D structural map. You are cleared to proceed.";
     else if (target_type === 'concession') reply = "Concessions traffic monitored. I've plotted the shortest vector to the nearest available food stall on your 3D structural map.";
     else reply = "Gate traffic analyzed. To avoid peak rush, I have calculated and mapped the fastest exit trajectory for your current location on the pitch.";

     setIsFpv(true); // Automatically trigger First Person View for visual tracking

     setTimeout(async () => {
         try {
            if (selectedSeat) {
               const sx = (selectedSeat[0] / 1.1) + 50;
               const sy = (selectedSeat[2] / 1.1) + 50;
               const pathRes = await fetch(`http://localhost:8000/api/routes/path?start_x=${sx}&start_y=${sy}&target_type=${target_type}`);
               if (pathRes.ok) {
                   const pathData = await pathRes.json();
                   setMappedPath(pathData.path);
                   setIsFollowingPath(false); // Reset tracing sequence
               }
            }
         } catch (e) {}
         setChatMessages(prev => [...prev, { text: reply, isUser: false }]);
     }, 1000);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    const newMsg = inputValue;
    setInputValue("");
    
    const lower = newMsg.toLowerCase();
    let target_type = "";
    
    if (lower.includes('bathroom') || lower.includes('restroom') || lower.includes('washroom')) target_type = "restroom";
    else if (lower.includes('food') || lower.includes('snack') || lower.includes('hungry') || lower.includes('concession')) target_type = "concession";
    else if (lower.includes('gate') || lower.includes('exit') || lower.includes('leave') || lower.includes('evacuate') || lower.includes('emergency')) {
       if (lower.includes('evacuate') || lower.includes('emergency')) setIsEmergency(true);
       target_type = "gate";
    }

    if (!target_type) {
        setChatMessages(prev => [...prev, { text: newMsg, isUser: true }, { text: "[SYSTEM OUT OF BOUNDS] I am specifically tuned for spatial routing in the stadium. Try asking me for 'restrooms', 'food', or 'exits'.", isUser: false }]);
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
    <div className={`relative w-screen h-screen overflow-hidden ${isDark ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'} font-sans`}>
      
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
        <Canvas shadows camera={{ position: [0, 45, -60], fov: 50 }}>
          <color attach="background" args={[isDark ? '#020617' : '#f8fafc']} />
          <fogExp2 attach="fog" args={[isDark ? '#020617' : '#f8fafc', 0.008]} />
          <Environment preset={isDark ? "night" : "city"} />
          <ambientLight intensity={isDark ? 0.2 : 0.7} />
          
          <Suspense fallback={null}>
            <StadiumArchitecture isDark={isDark} isRoofOpen={isRoofOpen} />
            <Pitch isRetracted={isPitchRetracted} seat={selectedSeat} mappedPath={mappedPath} isFollowingPath={isFollowingPath} onCompletePath={() => setIsFollowingPath(false)} />
            <Swarm count={3000} isDark={isDark} isEmergency={isEmergency} />
            
            {/* Interactive Physical Structures placed firmly on the peripheral Radius limits ~r=50/55 */}
            <PhysicalPOI position={[-38, 20, 38]} label="🚻 Restrooms (North)" color="#3b82f6" waitTime={waits.rn > 0 ? `${waits.rn} MIN WAIT` : "FREE 🟢"} isHotspot={waits.rn > 10} />
            <PhysicalPOI position={[38, 20, -38]} label="🚻 Restrooms (East)" color="#10b981" waitTime={waits.re > 0 ? `${waits.re} MIN WAIT` : "FREE 🟢"} isHotspot={waits.re > 10} />
            <PhysicalPOI position={[48, 20, 0]} label="🍔 Concessions 1" color="#f59e0b" waitTime={waits.c1 > 0 ? `${waits.c1} MIN WAIT` : "FREE 🟢"} isHotspot={waits.c1 > 10} />
            <PhysicalPOI position={[-48, 20, 0]} label="🍔 Concessions 2" color="#10b981" waitTime={waits.c2 > 0 ? `${waits.c2} MIN WAIT` : "FREE 🟢"} isHotspot={waits.c2 > 10} />
            
            <PhysicalPOI position={[0, 22, -52]} label="🚪 Gate A (EXIT)" color="#8b5cf6" waitTime={waits.ga > 0 ? `${waits.ga} MIN WAIT` : "FREE 🟢"} isHotspot={waits.ga > 10} />
            <PhysicalPOI position={[0, 22, 52]} label="🚪 Gate C (MEET)" color="#8b5cf6" waitTime={waits.gc > 0 ? `${waits.gc} MIN WAIT` : "FREE 🟢"} isHotspot={waits.gc > 10} />
            <PhysicalPOI position={[-52, 22, 0]} label="🚪 Gate B (EAST)" color="#8b5cf6" waitTime={waits.gb > 0 ? `${waits.gb} MIN WAIT` : "FREE 🟢"} isHotspot={waits.gb > 10} />
            <PhysicalPOI position={[52, 22, 0]} label="🚪 Gate D (WEST)" color="#8b5cf6" waitTime={waits.gd > 0 ? `${waits.gd} MIN WAIT` : "FREE 🟢"} isHotspot={waits.gd > 10} />

            <SeatSelector 
              selectedSeat={selectedSeat} 
              setSelectedSeat={setSelectedSeat} 
              lockedSeats={lockedSeats}
              isFpv={isFpv}
              setIsFpv={setIsFpv}
              requestPath={requestPath}
            />
            <CameraController isFpv={isFpv} seat={selectedSeat} mappedPath={mappedPath} />
          </Suspense>

          <OrbitControls 
             makeDefault 
             minPolarAngle={Math.PI / 4} 
             maxPolarAngle={Math.PI / 2.2}
             minDistance={30} maxDistance={140}
             target={[0, 10, 0]}
          />
        </Canvas>
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
                     className="w-full max-w-sm group relative px-10 py-4 mb-4 rounded-xl bg-gradient-to-r from-[#FEBE10] to-yellow-600 text-black font-black text-xs tracking-widest uppercase hover:scale-105 active:scale-95 transition-all shadow-xl overflow-hidden"
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
                 
                 <form onSubmit={(e) => { e.preventDefault(); if (username) setAppState('main'); }} className="w-full flex flex-col gap-4">
                     <input 
                         type="text"
                         value={username}
                         onChange={(e) => setUsername(e.target.value)}
                         placeholder="Enter Username"
                         className="w-full bg-black/50 border border-white/20 p-4 rounded text-center text-white tracking-widest uppercase focus:border-[#FEBE10] outline-none"
                     />
                     <button type="submit" disabled={!username} className="bg-[#FEBE10] text-black disabled:opacity-50 font-black uppercase px-6 py-4 rounded hover:bg-white hover:scale-[1.02] active:scale-95 transition-all">
                        Log In & Map Space
                     </button>
                 </form>
             </div>
         </div>
      )}

      {/* MAIN UI DASHBOARD */}
      <div className={`relative z-10 w-full h-full pointer-events-none transition-opacity duration-1000 flex flex-col ${appState === 'main' ? 'opacity-100' : 'opacity-0'}`}>
         
         <header className={`px-6 py-4 flex justify-between items-center pointer-events-auto backdrop-blur-xl border-b ${isDark ? 'bg-black/50 border-white/10' : 'bg-white/80 border-slate-200'}`}>
             <div className="flex items-center gap-3">
                 <Shield className="text-[#FEBE10]" size={28} />
                 <div>
                     <h1 className="font-black pt-1 text-xl tracking-widest uppercase leading-none">SwarmAI</h1>
                     <span className="text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5 opacity-70 mt-1">
                        <Wifi size={10} className="text-emerald-500 animate-pulse" /> Live Event
                     </span>
                 </div>
             </div>
             <div className="flex gap-2">
                <a href="/dashboard" className={`px-4 py-2 border rounded-xl font-bold flex items-center gap-2 text-[10px] uppercase tracking-widest transition-all hover:bg-[#FEBE10] hover:text-black ${isDark ? 'bg-[#FEBE10]/10 border-[#FEBE10]/30 text-[#FEBE10]' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                  📊 OPERATOR DASHBOARD
                </a>
                <button onClick={() => setIsEmergency(!isEmergency)} className={`px-4 py-2 border rounded-xl font-bold text-[10px] uppercase tracking-widest ${isEmergency ? 'bg-red-500 text-white animate-pulse' : isDark ? 'bg-black/50 border-white/20' : 'bg-white/80 border-slate-300'}`}>
                   {isEmergency ? 'REROUTING...' : 'EMERGENCY TRIGGER'}
                </button>
                <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className={`p-2 border rounded-xl ${isDark ? 'bg-black/50 border-white/20' : 'bg-white/80 border-slate-300'}`}>
                   {isDark ? <Sun size={14} /> : <Moon size={14} />}
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
                   
                   <div className="space-y-3">
                      <div className="flex justify-between items-end border-b border-white/5 pb-2">
                          <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">East Concession</span>
                          <div className="text-right">
                             <div className="text-emerald-400 font-mono text-xs font-black">2 MIN</div>
                             <div className="text-[8px] text-gray-500 uppercase">-4m Swarm Savings</div>
                          </div>
                      </div>
                      <div className="flex justify-between items-end border-b border-white/5 pb-2">
                          <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">North Restroom</span>
                          <div className="text-right">
                             <div className="text-red-400 font-mono text-xs font-black">18 SEC</div>
                             <div className="text-[8px] text-emerald-500 font-bold uppercase">Queue dropping 87%</div>
                          </div>
                      </div>
                   </div>
                </div>

             </div>

            {/* UNIFIED SIDEBAR SEAT MENU */}
            {selectedSeat && (
               <div className="pointer-events-auto absolute bottom-6 left-[calc(50%-60px)] -translate-x-1/2 flex items-center gap-4 px-6 py-3 rounded-full backdrop-blur-xl border border-black/25 shadow-2xl animate-in slide-in-from-bottom-8 z-20 bg-white/90 text-black">
                  {/* Gold AI Sparkle */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="#FEBE10" stroke="#d4a017" strokeWidth="0.5"/>
                    <path d="M19 2L19.75 4.75L22.5 5.5L19.75 6.25L19 9L18.25 6.25L15.5 5.5L18.25 4.75L19 2Z" fill="#FEBE10" opacity="0.8"/>
                    <path d="M5 16L5.5 17.75L7.25 18.25L5.5 18.75L5 20.5L4.5 18.75L2.75 18.25L4.5 17.75L5 16Z" fill="#FEBE10" opacity="0.6"/>
                  </svg>
                  
                  {/* SEAT INFO TEXT */}
                  <div className="flex flex-col items-center border-r border-black/20 pr-4">
                     <span className="font-black text-[9px] uppercase tracking-widest text-slate-800 whitespace-nowrap">My Seat</span>
                     <span className="text-[11px] font-mono font-bold text-black opacity-90">X: {selectedSeat[0].toFixed(1)} / Z: {selectedSeat[2].toFixed(1)}</span>
                  </div>

                  {/* NEIGHBORS METRIC */}
                  <div className="flex flex-col items-center border-r border-black/20 pr-4">
                     <span className="text-[9px] uppercase tracking-widest font-black opacity-80 whitespace-nowrap text-slate-800">Neighbors</span>
                     <span className="text-emerald-600 font-mono text-[11px] leading-none pt-0.5 font-extrabold">142</span>
                  </div>

                  {/* FPV TOGGLE */}
                  <button 
                     onClick={() => setIsFpv(!isFpv)}
                     className={`py-2 px-4 rounded-full text-[9px] flex items-center gap-2 font-black uppercase tracking-widest border shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap ${isFpv ? 'bg-red-500/20 text-red-700 border-red-500/40' : 'bg-slate-200/50 text-black border-black/30 hover:bg-slate-300/80'}`}
                  >
                     {isFpv ? <><EyeOff size={12}/> EXIT FPV</> : <><Eye size={12}/> VIEW FPV</>}
                  </button>

                  <div className="w-[1px] h-6 bg-black/20" />

                  {/* QUICK ROUTES */}
                  <div className="flex items-center gap-2">
                     <button onClick={() => requestPath('restroom')} className="flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-colors px-3 py-2 rounded-full text-[9px] font-black tracking-widest uppercase border whitespace-nowrap bg-blue-100 text-blue-900 border-blue-300 hover:shadow-md">
                         <Waves size={12}/> Restrooms
                     </button>
                     <button onClick={() => requestPath('concession')} className="flex items-center gap-2 hover:bg-amber-500 hover:text-white transition-colors px-3 py-2 rounded-full text-[9px] font-black tracking-widest uppercase border whitespace-nowrap bg-amber-100 text-amber-900 border-amber-300 hover:shadow-md">
                         <Coffee size={12}/> Food
                     </button>
                     <button onClick={() => requestPath('gate')} className="flex items-center gap-2 hover:bg-purple-600 hover:text-white transition-colors px-3 py-2 rounded-full text-[9px] font-black tracking-widest uppercase border whitespace-nowrap bg-purple-100 text-purple-900 border-purple-300 hover:shadow-md">
                         <DoorOpen size={12}/> Exit
                     </button>
                  </div>
                  
                  {/* FOLLOW PHYSICAL (only if path exists) */}
                  {mappedPath && mappedPath.length > 0 && (
                     <>
                        <div className="w-[1px] h-6 bg-black/20" />
                        <button 
                            onClick={() => setIsFollowingPath(true)}
                            disabled={isFollowingPath}
                            className={`flex items-center gap-2 py-2.5 px-5 rounded-full font-black uppercase text-[9px] tracking-widest transition-all whitespace-nowrap border-2 ${
                              isFollowingPath 
                                ? 'bg-emerald-200 text-emerald-800 border-emerald-400 cursor-not-allowed shadow-md' 
                                : 'bg-[#FEBE10] text-black border-[#d4a017] shadow-[0_0_20px_rgba(254,190,16,0.6),0_4px_12px_rgba(0,0,0,0.15)] hover:scale-105 active:scale-95 hover:shadow-[0_0_30px_rgba(254,190,16,0.9)] animate-pulse'
                            }`}
                        >
                            {isFollowingPath 
                              ? <><Footprints size={12} className="animate-bounce" /> Navigating...</> 
                              : <>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"/></svg>
                                  PHYSICAL TRAVERSAL
                                </>
                            }
                        </button>
                     </>
                  )}
               </div>
            )}

            {/* CHATBOT */}
            <div className="pointer-events-auto absolute bottom-24 right-6">
               {isChatOpen ? (
                  <div className={`w-80 h-96 rounded-[2rem] flex flex-col shadow-2xl border backdrop-blur-3xl ${isDark ? 'bg-black/80 border-white/20' : 'bg-white/95 border-slate-200'}`}>
                     <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#FEBE10]/10 rounded-t-[2rem]">
                        <span className="font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><MapPin size={12} className="text-[#FEBE10]" /> Swarm Assistant</span>
                        <X size={14} className="cursor-pointer opacity-50 hover:opacity-100" onClick={() => setIsChatOpen(false)} />
                     </div>
                     
                     <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 text-[11px] font-medium leading-relaxed">
                        {chatMessages.map((msg, idx) => (
                          <div key={idx} className={`p-3 rounded-2xl w-[85%] ${msg.isUser ? 'self-end bg-[#00529F] border-[#00529F] text-white shadow-md' : isDark ? 'self-start border bg-white/5 border-white/10 text-gray-200' : 'self-start border bg-slate-50 border-slate-200 text-slate-800'}`}>
                             {msg.text}
                          </div>
                        ))}
                        <div ref={chatBottomRef} />
                     </div>

                     <div className="px-4 pb-2 pt-2 flex gap-2 overflow-x-auto whitespace-nowrap border-t border-white/5 pointer-events-auto">
                        <button onClick={() => requestPath('restroom')} className={`bg-transparent hover:bg-[#FEBE10] hover:text-black transition-colors rounded-full px-3 py-1 text-[9px] uppercase border ${isDark ? 'border-white/20' : 'border-slate-300'} font-black tracking-widest`}>🚻 Nearby Restrooms</button>
                        <button onClick={() => requestPath('concession')} className={`bg-transparent hover:bg-[#FEBE10] hover:text-black transition-colors rounded-full px-3 py-1 text-[9px] uppercase border ${isDark ? 'border-white/20' : 'border-slate-300'} font-black tracking-widest`}>🍔 Nearby Food</button>
                        <button onClick={() => requestPath('gate')} className={`bg-transparent hover:bg-[#FEBE10] hover:text-black transition-colors rounded-full px-3 py-1 text-[9px] uppercase border ${isDark ? 'border-white/20' : 'border-slate-300'} font-black tracking-widest`}>🚪 Nearby Gates</button>
                     </div>
                     
                     <div className="p-3">
                        <form 
                          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
                          className={`flex items-center gap-2 p-1.5 pl-4 rounded-full border ${isDark ? 'bg-black/50 border-white/20' : 'bg-slate-100 border-slate-200'} shadow-inner focus-within:border-[#FEBE10] transition-colors`}
                        >
                           <input 
                             type="text" 
                             value={inputValue}
                             onChange={(e) => setInputValue(e.target.value)}
                             placeholder="Ask for restrooms, food, exits..." 
                             className="bg-transparent outline-none flex-1 text-[11px] placeholder:text-gray-500" 
                           />
                           <button type="submit" className="bg-[#FEBE10] p-2 rounded-full hover:scale-105 active:scale-95 transition-transform shadow-md">
                             <Send size={12} className="text-black ml-0.5" />
                           </button>
                        </form>
                     </div>
                  </div>
               ) : (
                  <button onClick={() => {
                     // Auto-assign a random seat to showcase features if none selected
                     if (!selectedSeat) {
                       const angle = Math.random() * Math.PI * 2;
                       const rowFactor = 0.3 + Math.random() * 0.6;
                       const r = 25 + (30 * rowFactor);
                       const rx = parseFloat((Math.cos(angle) * r).toFixed(1));
                       const rz = parseFloat((Math.sin(angle) * r).toFixed(1));
                       const ry = parseFloat((rowFactor * 18).toFixed(1));
                       setSelectedSeat([rx, ry, rz]);
                     }
                     setIsChatOpen(true);
                     setChatMessages(prev => [
                       ...prev,
                       { text: '👋 Welcome! A seat has been auto-assigned for you. Try tapping 🚻 Restrooms, 🍔 Food, or 🚪 Exit in the dock below to start smart navigation!', isUser: false }
                     ]);
                  }} className="px-6 py-4 rounded-full bg-gradient-to-r from-[#FEBE10] to-yellow-500 text-black font-black text-[11px] uppercase tracking-widest shadow-[0_10px_30px_rgba(254,190,16,0.4)] flex items-center gap-2 hover:scale-105 transition-transform animate-bounce">
                     <MessageSquare size={16} /> Help me route
                  </button>
               )}
            </div>

         </div>
      </div>
    </div>
  );
}
