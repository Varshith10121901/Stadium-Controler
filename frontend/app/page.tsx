'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { Shield, Wifi, Sun, Moon, MessageSquare, Send, X, MapPin, Search, Navigation, Lock, Users, Coins, Clock, Eye, EyeOff, Footprints, Coffee, DoorOpen, Waves } from 'lucide-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useSwarmStore } from '@/lib/store';

// === CONSTANTS ===
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
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
   const [mesh, setMesh] = useState<THREE.InstancedMesh | null>(null);
   const dummy = useMemo(() => new THREE.Object3D(), []);
   
   const SECTS = 16;
   const RWS = 15;
   const SPR = 20;
   const SEAT_COUNT = SECTS * RWS * SPR; // 4800
   
   const points = useMemo(() => {
      const arr = [];
      const sectorAngle = (Math.PI * 2) / SECTS;
      const aisleGap = 0.08; // gap in radians for radial stairways
      const playableAngle = sectorAngle - aisleGap;

      for (let s = 0; s < SECTS; s++) {
         for (let r = 0; r < RWS; r++) {
            const rowFactor = r / (RWS - 1);
            const radius = 26 + 28 * rowFactor;
            // Linear scaling grandstand height
            const y = Math.pow(rowFactor, 1.5) * 19.5;
            
            for (let j = 0; j < SPR; j++) {
               const angle = s * sectorAngle + aisleGap / 2 + (j / (SPR - 1 || 1)) * playableAngle;
               arr.push([Math.cos(angle) * radius, y, Math.sin(angle) * radius]);
            }
         }
      }
      return arr;
   }, []);

   useEffect(() => {
      if (!mesh) return;
      for (let i = 0; i < SEAT_COUNT; i++) {
         const p = points[i];
         if (!p) continue;
         dummy.position.set(p[0], p[1], p[2]);
         if (selectedSeat && selectedSeat[0] === p[0] && selectedSeat[2] === p[2]) {
            dummy.scale.set(1.8, 1.8, 1.8); // Enlarge selected seat
         } else {
            dummy.scale.set(1, 1, 1);
         }
         dummy.updateMatrix();
         mesh.setMatrixAt(i, dummy.matrix);
         
         let color = new THREE.Color("#cbd5e1");
         if (selectedSeat && selectedSeat[0] === p[0] && selectedSeat[2] === p[2]) {
            color = new THREE.Color(REAL_MADRID_GOLD);
         } else {
            // Give slightly varied coloring to sections for extra premium stadium feel
            const sectorIdx = Math.floor(i / (RWS * SPR));
            if (sectorIdx % 2 === 0) {
               color = new THREE.Color("#64748b"); // Slate gray section
            } else {
               color = new THREE.Color("#475569"); // Darker slate section
            }
         }
         mesh.setColorAt(i, color);
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
   }, [mesh, selectedSeat, points, dummy]);

   return (
     <group>
       <instancedMesh 
          ref={setMesh} 
          args={[undefined, undefined, SEAT_COUNT]}
          onClick={(e) => {
             e.stopPropagation();
             if (e.instanceId !== undefined) {
                setSelectedSeat(points[e.instanceId] as [number, number, number]);
             }
          }}
       >
         <boxGeometry args={[0.6, 0.35, 0.6]} />
         <meshStandardMaterial roughness={0.6} transparent opacity={0.8} />
       </instancedMesh>
     </group>
   );
}

function Swarm({ count = 500, isDark, isEmergency }: { count?: number, isDark: boolean, isEmergency?: boolean }) {
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
      {/* ── Grass Pitch Surface ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[25, 40]} />
        <meshStandardMaterial color="#14532d" roughness={0.95} metalness={0.05} />
      </mesh>
      
      {/* ── Pitch Boundary White Lines ── */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[23, 38]} />
        <meshBasicMaterial color="#ffffff" opacity={0.7} transparent wireframe />
      </mesh>

      {/* ── Midfield Center Circle and Line ── */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[23, 0.15]} />
        <meshBasicMaterial color="#ffffff" opacity={0.7} transparent />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.5, 4.65, 32]} />
        <meshBasicMaterial color="#ffffff" opacity={0.7} transparent />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 16]} />
        <meshBasicMaterial color="#ffffff" opacity={0.9} transparent />
      </mesh>

      {/* ── Penalty Areas ── */}
      {/* North Penalty Box */}
      <mesh position={[0, 0.03, 13]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 0.15]} />
        <meshBasicMaterial color="#ffffff" opacity={0.7} transparent />
      </mesh>
      <mesh position={[-6, 0.03, 16]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.15, 6]} />
        <meshBasicMaterial color="#ffffff" opacity={0.7} transparent />
      </mesh>
      <mesh position={[6, 0.03, 16]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.15, 6]} />
        <meshBasicMaterial color="#ffffff" opacity={0.7} transparent />
      </mesh>

      {/* South Penalty Box */}
      <mesh position={[0, 0.03, -13]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 0.15]} />
        <meshBasicMaterial color="#ffffff" opacity={0.7} transparent />
      </mesh>
      <mesh position={[-6, 0.03, -16]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.15, 6]} />
        <meshBasicMaterial color="#ffffff" opacity={0.7} transparent />
      </mesh>
      <mesh position={[6, 0.03, -16]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.15, 6]} />
        <meshBasicMaterial color="#ffffff" opacity={0.7} transparent />
      </mesh>

      {/* ── 3D Goalposts ── */}
      {/* North Goalpost */}
      <group position={[0, 0, 19]}>
         <mesh position={[-2.5, 1.3, 0]} castShadow><cylinderGeometry args={[0.08, 0.08, 2.6]} /><meshStandardMaterial color="#ffffff" roughness={0.2} /></mesh>
         <mesh position={[2.5, 1.3, 0]} castShadow><cylinderGeometry args={[0.08, 0.08, 2.6]} /><meshStandardMaterial color="#ffffff" roughness={0.2} /></mesh>
         <mesh position={[0, 2.6, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.08, 0.08, 5.0]} /><meshStandardMaterial color="#ffffff" roughness={0.2} /></mesh>
      </group>
      {/* South Goalpost */}
      <group position={[0, 0, -19]}>
         <mesh position={[-2.5, 1.3, 0]} castShadow><cylinderGeometry args={[0.08, 0.08, 2.6]} /><meshStandardMaterial color="#ffffff" roughness={0.2} /></mesh>
         <mesh position={[2.5, 1.3, 0]} castShadow><cylinderGeometry args={[0.08, 0.08, 2.6]} /><meshStandardMaterial color="#ffffff" roughness={0.2} /></mesh>
         <mesh position={[0, 2.6, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.08, 0.08, 5.0]} /><meshStandardMaterial color="#ffffff" roughness={0.2} /></mesh>
      </group>
      
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
       {/* ── Seating Bowl Main Shell ── */}
       <mesh position={[0, 10, 0]} receiveShadow>
          <cylinderGeometry args={[55, 25, 20, 64, 1, true]} />
          <meshStandardMaterial color={isDark ? "#1e293b" : "#cbd5e1"} side={THREE.DoubleSide} roughness={0.9} />
       </mesh>
       
       {/* ── Concrete Walkway Rings / Concourse walkway dividers ── */}
       <mesh position={[0, 7.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[35.5, 36.8, 64]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
       </mesh>
       <mesh position={[0, 14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[45.5, 46.8, 64]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
       </mesh>

       {/* ── Outer Facade Cylindrical Shell ── */}
       <mesh position={[0, 10, 0]}>
          <cylinderGeometry args={[56, 56, 22, 64, 1, true]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.4} side={THREE.DoubleSide} />
       </mesh>

       {/* ── 16 External Architectural Support Columns ── */}
       {Array.from({ length: 16 }).map((_, idx) => {
          const angle = (idx / 16) * Math.PI * 2;
          const px = Math.cos(angle) * 56.2;
          const pz = Math.sin(angle) * 56.2;
          return (
             <mesh key={idx} position={[px, 10, pz]} castShadow>
                <boxGeometry args={[1, 20, 1.6]} />
                <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
             </mesh>
          );
       })}

       {/* ── Grand Stadium Roof ── */}
       <mesh ref={roofRef} position={[0, 21, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <circleGeometry args={[56, 64]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
       </mesh>
    </group>
  );
}

function CameraController({ isFpv, seat, mappedPath, isFollowingPath }: { isFpv: boolean, seat: [number,number,number]|null, mappedPath: Array<[number,number]>, isFollowingPath: boolean }) {
  const { camera } = useThree();
  const [animStart, setAnimStart] = useState<number | null>(null);

  // Mark animation timer precisely when perspective mode changes
  useEffect(() => {
     setAnimStart(Date.now());
  }, [isFpv, mappedPath, isFollowingPath]);

  useFrame((state) => {
     const controls = state.controls as any;
     if (!controls || !animStart) return;

     if (isFpv && seat) {
        if (Date.now() - animStart < 1500 || isFollowingPath) {
           // Elevate camera significantly inside FPV to guarantee no heads/seats block the view of the green routing line
           camera.position.lerp(new THREE.Vector3(seat[0] * 0.95, seat[1] + 10, seat[2] * 0.95), 0.05);

           if (mappedPath && mappedPath.length > 0) {
               if (Date.now() - animStart < 1000 || isFollowingPath) {
                   const target = mappedPath[mappedPath.length - 1];
                   const worldX = (target[0] - 50) * 1.1; 
                   const worldZ = (target[1] - 50) * 1.1;
                   
                   // Calculate exact structural height of the POI target
                   const r = Math.hypot(worldX, worldZ);
                   const seatY = r < 25 ? 0 : ((r - 25) / 30) * 20;
                   
                   controls.target.lerp(new THREE.Vector3(worldX, seatY, worldZ), 0.05);
               }
           } else {
               // Initial look towards the center, but allow free movement afterwards
               if (Date.now() - animStart < 1000) {
                   controls.target.lerp(new THREE.Vector3(0, 5, 0), 0.02);
               }
           }
        }
        
        controls.minDistance = 5;
     } else if (!isFpv) {
        if (Date.now() - animStart < 1500) {
            // Normal stadium zoom out back to center
            controls.target.lerp(new THREE.Vector3(0, 5, 0), 0.05);
            camera.position.lerp(new THREE.Vector3(0, 45, -60), 0.05);
        }
        controls.minDistance = 20;
      }
   });
   return null;
}

function Floodlight({ position }: { position: [number, number, number] }) {
  const angle = Math.atan2(-position[0], -position[2]);
  return (
    <group position={position}>
       {/* Support Pole */}
       <mesh castShadow>
          <cylinderGeometry args={[0.2, 0.45, 22, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
       </mesh>
       {/* Floodlight Head Frame */}
       <group position={[0, 11, 0]} rotation={[0.3, angle, 0]}>
          <mesh castShadow>
             <boxGeometry args={[3.2, 1.8, 0.5]} />
             <meshStandardMaterial color="#1e293b" roughness={0.5} />
          </mesh>
          {/* Glowing Halogen Bulbs */}
          {[-1.0, -0.35, 0.35, 1.0].map((off, idx) => (
             <mesh key={idx} position={[off, 0, 0.26]}>
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshBasicMaterial color="#fffbeb" />
             </mesh>
          ))}
          {/* SpotLight directing down onto the pitch */}
          <spotLight 
             color="#ffffff" 
             intensity={28} 
             distance={80} 
             angle={0.6} 
             penumbra={0.6} 
             castShadow
             position={[0, 0, 0.4]}
          />
       </group>
    </group>
  );
}

function Scoreboard({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
       {/* Structure board */}
       <mesh castShadow>
          <boxGeometry args={[14, 6.5, 0.8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.7} />
       </mesh>
       {/* Display screen glow */}
       <mesh position={[0, 0, 0.41]}>
          <planeGeometry args={[13.2, 5.7]} />
          <meshBasicMaterial color="#020617" />
       </mesh>
       {/* HTML embedded scoreboard metrics */}
       <Html position={[0, 0, 0.45]} transform occlude center distanceFactor={14}>
          <div className="w-[500px] h-[220px] bg-slate-950 text-white font-mono p-5 flex flex-col justify-between border-4 border-slate-800 rounded-3xl select-none">
             <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-md font-black text-[#FEBE10] tracking-widest">SWARMAI BERNABEU</span>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] rounded-full font-bold border border-emerald-500/40 animate-pulse">SYSTEM ACTIVE</span>
             </div>
             <div className="flex justify-around items-center my-2">
                <div className="text-center">
                   <p className="text-gray-500 text-[9px] uppercase tracking-wider font-bold">Total Crowd</p>
                   <p className="text-3xl font-black text-white mt-0.5">81,354</p>
                </div>
                <div className="w-[1px] h-10 bg-slate-800" />
                <div className="text-center">
                   <p className="text-gray-500 text-[9px] uppercase tracking-wider font-bold">Wait Saved</p>
                   <p className="text-3xl font-black text-emerald-400 mt-0.5">42%</p>
                </div>
                <div className="w-[1px] h-10 bg-slate-800" />
                <div className="text-center">
                   <p className="text-gray-500 text-[9px] uppercase tracking-wider font-bold">P2P Nodes</p>
                   <p className="text-3xl font-black text-white mt-0.5">99.8%</p>
                </div>
             </div>
             <div className="flex justify-between text-[9px] text-gray-600 font-bold border-t border-slate-800 pt-2">
                <span>ESTADIO SANTIAGO BERNABEU</span>
                <span>SAFETY STATE: OPTIMAL 🟢</span>
             </div>
          </div>
       </Html>
    </group>
  );
}

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

  // Fetch lock on mount (gracefully skip if backend offline)
  useEffect(() => {
     fetch(`${API_URL}/api/seats/locked`)
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
        fetch(`${API_URL}/api/seats/lock`, {
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
               const pathRes = await fetch(`${API_URL}/api/routes/path?start_x=${sx}&start_y=${sy}&target_type=${target_type}`);
               if (pathRes.ok) {
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
            const geminiRes = await fetch(`${API_URL}/api/chat`, {
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
      <div className="absolute inset-0 z-0" role="img" aria-label="Interactive 3D Bernabeu Stadium with real-time crowd simulation powered by SwarmAI">
        <Canvas
          shadows
          camera={{ position: [0, 45, -60], fov: 50 }}
          aria-label="3D Stadium crowd simulation — use the SwarmAI Assistant panel to navigate"
          role="application"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'c') setIsChatOpen(o => !o);
            if (e.key === 'Escape') setIsChatOpen(false);
          }}
        >
          <color attach="background" args={[isDark ? '#020617' : '#f8fafc']} />
          <fogExp2 attach="fog" args={[isDark ? '#020617' : '#f8fafc', 0.008]} />
          <ambientLight intensity={isDark ? 0.4 : 0.8} />
          <directionalLight
             position={[20, 50, -20]}
             intensity={isDark ? 0.3 : 1.2}
             castShadow
             shadow-mapSize-width={1024}
             shadow-mapSize-height={1024}
          />
          <hemisphereLight
             intensity={isDark ? 0.2 : 0.4}
             color={isDark ? "#1e293b" : "#e2e8f0"}
             groundColor={isDark ? "#0f172a" : "#cbd5e1"}
          />
          
          <Suspense fallback={null}>
            <StadiumArchitecture isDark={isDark} isRoofOpen={isRoofOpen} />
            <Pitch isRetracted={isPitchRetracted} seat={selectedSeat} mappedPath={mappedPath} isFollowingPath={isFollowingPath} onCompletePath={() => setIsFollowingPath(false)} />
            <Swarm count={500} isDark={isDark} isEmergency={isEmergency} />

            {/* ── Realistic Scoreboards ── */}
            <Scoreboard position={[0, 24, 52.5]} rotation={[0, Math.PI, 0]} />
            <Scoreboard position={[0, 24, -52.5]} rotation={[0, 0, 0]} />

            {/* ── Realistic Floodlight Towers ── */}
            <Floodlight position={[42, 11, 42]} />
            <Floodlight position={[-42, 11, 42]} />
            <Floodlight position={[42, 11, -42]} />
            <Floodlight position={[-42, 11, -42]} />
            
            {/* Interactive Physical Structures placed firmly on the peripheral Radius limits ~r=50/55 */}
            <PhysicalPOI position={[-38, 20, 38]} label="🛍️ Merch Store (North)" color="#a855f7" waitTime={waits.rn > 0 ? `${waits.rn} MIN WAIT` : "FREE 🟢"} isHotspot={waits.rn > 10} />
            <PhysicalPOI position={[38, 20, -38]} label="🛍️ Merch Store (East)" color="#a855f7" waitTime={waits.re > 0 ? `${waits.re} MIN WAIT` : "FREE 🟢"} isHotspot={waits.re > 10} />
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
            <CameraController isFpv={isFpv} seat={selectedSeat} mappedPath={mappedPath} isFollowingPath={isFollowingPath} />
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
