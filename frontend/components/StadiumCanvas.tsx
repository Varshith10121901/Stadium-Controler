'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useSwarmStore } from '@/lib/store';
import { useReducedMotion } from '@/lib/useReducedMotion';

const REAL_MADRID_GOLD = "#FEBE10";
const REAL_MADRID_NAVY = "#00529F";

interface StadiumCanvasProps {
  isDark: boolean;
  isRoofOpen: boolean;
  isPitchRetracted: boolean;
  selectedSeat: [number, number, number] | null;
  setSelectedSeat: (seat: [number, number, number] | null) => void;
  lockedSeats: any[];
  mappedPath?: Array<[number, number]>;
  isFollowingPath: boolean;
  setIsFollowingPath: (v: boolean) => void;
  isEmergency: boolean;
  waits: {
    rn: number;
    re: number;
    c1: number;
    c2: number;
    ga: number;
    gb: number;
    gc: number;
    gd: number;
  };
  isFpv: boolean;
  setIsFpv: (v: boolean) => void;
  requestPath: (type: string) => void;
}

function PhysicalPOI({ position, label, color, waitTime, isHotspot }: { position: [number, number, number], label: string, color: string, waitTime: string, isHotspot: boolean }) {
  const meshRef = useRef<THREE.Group>(null);
  
  const isGate = label.includes('Gate') || label.includes('EXIT');
  const isConcession = label.includes('Concession') || label.includes('Food');
  const isRestroom = label.includes('Restroom') || label.includes('Washroom');

  const structuralColor = '#1e293b'; 
  const angle = Math.atan2(position[0], position[2]);

  return (
    <group position={position} rotation={[0, angle, 0]} ref={meshRef}>
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

      {(isConcession || isRestroom) && (
         <group position={[0, 0, 0]}>
            <mesh position={[0, -1, 0]}>
               <boxGeometry args={[8, 0.5, 8]} />
               <meshStandardMaterial color={structuralColor} roughness={0.9} />
            </mesh>
            <mesh position={[0, 4, 0]}>
               <boxGeometry args={[7, 0.4, 7]} />
               <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} roughness={0.4} />
            </mesh>
            <mesh position={[-3, 1.5, -3]}><boxGeometry args={[0.4, 5, 0.4]} /><meshStandardMaterial color={structuralColor} /></mesh>
            <mesh position={[3, 1.5, -3]}><boxGeometry args={[0.4, 5, 0.4]} /><meshStandardMaterial color={structuralColor} /></mesh>
            <mesh position={[-3, 1.5, 3]}><boxGeometry args={[0.4, 5, 0.4]} /><meshStandardMaterial color={structuralColor} /></mesh>
            <mesh position={[3, 1.5, 3]}><boxGeometry args={[0.4, 5, 0.4]} /><meshStandardMaterial color={structuralColor} /></mesh>
         </group>
      )}

      <mesh position={[0, isGate ? 3 : 5, 0]}>
        <octahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isHotspot ? 2 : 0.8} />
      </mesh>
      
      {isHotspot && (
        <mesh position={[0, 0, 0]}>
           <cylinderGeometry args={[6, 6, 0.5, 32]} />
           <meshBasicMaterial color="#ef4444" transparent opacity={0.4} />
        </mesh>
      )}

      <Html position={[0, isGate ? 7 : 8, 0]} center >
         <div 
            role="status"
            aria-label={`${label}, status: ${waitTime}`}
            className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 whitespace-nowrap text-white pointer-events-none transform -translate-y-4 shadow-xl"
         >
            <p className="text-[10px] font-bold uppercase tracking-widest leading-tight">{label}</p>
            <p className={`text-[9px] font-black mt-0.5 ${isHotspot ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>{waitTime}</p>
         </div>
      </Html>
    </group>
  );
}

function SeatSelector({ 
   selectedSeat, setSelectedSeat, isFpv, setIsFpv, requestPath 
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
   const SEAT_COUNT = SECTS * RWS * SPR;
   
   const points = useMemo(() => {
      const arr = [];
      const sectorAngle = (Math.PI * 2) / SECTS;
      const aisleGap = 0.08;
      const playableAngle = sectorAngle - aisleGap;

      for (let s = 0; s < SECTS; s++) {
         for (let r = 0; r < RWS; r++) {
            const rowFactor = r / (RWS - 1);
            const radius = 26 + 28 * rowFactor;
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
            dummy.scale.set(1.8, 1.8, 1.8);
         } else {
            dummy.scale.set(1, 1, 1);
         }
         dummy.updateMatrix();
         mesh.setMatrixAt(i, dummy.matrix);
         
         let color = new THREE.Color("#cbd5e1");
         if (selectedSeat && selectedSeat[0] === p[0] && selectedSeat[2] === p[2]) {
            color = new THREE.Color(REAL_MADRID_GOLD);
         } else {
            const sectorIdx = Math.floor(i / (RWS * SPR));
            if (sectorIdx % 2 === 0) {
               color = new THREE.Color("#64748b");
            } else {
               color = new THREE.Color("#475569");
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
  const reducedMotion = useReducedMotion();
  
  const { agents: storeAgents } = useSwarmStore();
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
    const time = reducedMotion ? 0 : state.clock.getElapsedTime();
    
    for (let i = 0; i < activeCount; i++) {
      let x, z, y, isCongested;

      if (storeAgents.length > 0) {
         const agent = storeAgents[i];
         if (!agent) continue;
         x = (agent.x - 50) * 1.1;
         z = (agent.y - 50) * 1.1;
         const distCenter = Math.hypot(agent.x - 50, agent.y - 50);
         const rowFactor = Math.min(1, distCenter / 50);
         y = Math.pow(rowFactor, 1.5) * 20;
         isCongested = agent.status === 'waiting' || agent.status === 'congestion';
      } else {
         const agent = fallbackAgents[i];
         const speedMult = isEmergency ? 8 : 1;
         const sway = reducedMotion ? 0 : Math.sin(time * (agent.speed * speedMult) + agent.offset) * (isEmergency ? 3 : 1.5);
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
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      onComplete();
    }
  }, [reducedMotion, onComplete]);

  useFrame((state, delta) => {
     if (reducedMotion || !meshRef.current || pathPoints.length < 2) return;
     
     const speed = 12;
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

     setProgress(newProgress);
     meshRef.current.position.lerpVectors(currentSegStart, currentSegEnd, segmentFraction);
  });

  if (reducedMotion) return null;

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
  const reducedMotion = useReducedMotion();

  useFrame((_, delta) => {
    if (pitchRef.current) {
      if (reducedMotion) {
        pitchRef.current.position.y = isRetracted ? -15 : 0;
      } else {
        pitchRef.current.position.y = THREE.MathUtils.lerp(pitchRef.current.position.y, isRetracted ? -15 : 0, delta * 2);
      }
    }
  });

  const computedPoints = useMemo(() => {
     if (!mappedPath || mappedPath.length === 0 || !seat) return [];
     
     const coords = [];
     coords.push(new THREE.Vector3(seat[0], seat[1], seat[2]));

     for (let i = 0; i < mappedPath.length; i++) {
         const p = mappedPath[i];
         const worldX = (p[0] - 50) * 1.1; 
         const worldZ = (p[1] - 50) * 1.1;
         
         const r = Math.hypot(worldX, worldZ);
         const seatY = r < 25 ? 0 : ((r - 25) / 30) * 20;

         coords.push(new THREE.Vector3(worldX, seatY + 0.5, worldZ));
     }
     
     return coords;
  }, [mappedPath, seat]);

  return (
    <group ref={pitchRef}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[25, 40]} />
        <meshStandardMaterial color="#14532d" roughness={0.95} metalness={0.05} />
      </mesh>
      
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[23, 38]} />
        <meshBasicMaterial color="#ffffff" opacity={0.7} transparent wireframe />
      </mesh>

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

      <group position={[0, 0, 19]}>
         <mesh position={[-2.5, 1.3, 0]} castShadow><cylinderGeometry args={[0.08, 0.08, 2.6]} /><meshStandardMaterial color="#ffffff" roughness={0.2} /></mesh>
         <mesh position={[2.5, 1.3, 0]} castShadow><cylinderGeometry args={[0.08, 0.08, 2.6]} /><meshStandardMaterial color="#ffffff" roughness={0.2} /></mesh>
         <mesh position={[0, 2.6, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.08, 0.08, 5.0]} /><meshStandardMaterial color="#ffffff" roughness={0.2} /></mesh>
      </group>
      <group position={[0, 0, -19]}>
         <mesh position={[-2.5, 1.3, 0]} castShadow><cylinderGeometry args={[0.08, 0.08, 2.6]} /><meshStandardMaterial color="#ffffff" roughness={0.2} /></mesh>
         <mesh position={[2.5, 1.3, 0]} castShadow><cylinderGeometry args={[0.08, 0.08, 2.6]} /><meshStandardMaterial color="#ffffff" roughness={0.2} /></mesh>
         <mesh position={[0, 2.6, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.08, 0.08, 5.0]} /><meshStandardMaterial color="#ffffff" roughness={0.2} /></mesh>
      </group>
      
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

      {isFollowingPath && computedPoints.length > 0 && (
         <PathFollowerAgent pathPoints={computedPoints} onComplete={onCompletePath} />
      )}
    </group>
  );
}

function StadiumArchitecture({ isDark, isRoofOpen }: { isDark: boolean; isRoofOpen: boolean }) {
  const roofRef = useRef<THREE.Mesh>(null);
  const reducedMotion = useReducedMotion();

  useFrame((_, delta) => {
    if (roofRef.current) {
      if (reducedMotion) {
        roofRef.current.scale.setScalar(isRoofOpen ? 0.01 : 1);
      } else {
        roofRef.current.scale.setScalar(THREE.MathUtils.lerp(roofRef.current.scale.x, isRoofOpen ? 0.01 : 1, delta * 2));
      }
    }
  });

  return (
    <group scale={[1.4, 1, 1.1]}>
       <mesh position={[0, 10, 0]} receiveShadow>
          <cylinderGeometry args={[55, 25, 20, 64, 1, true]} />
          <meshStandardMaterial color={isDark ? "#1e293b" : "#cbd5e1"} side={THREE.DoubleSide} roughness={0.9} />
       </mesh>
       
       <mesh position={[0, 7.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[35.5, 36.8, 64]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
       </mesh>
       <mesh position={[0, 14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[45.5, 46.8, 64]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
       </mesh>

       <mesh position={[0, 10, 0]}>
          <cylinderGeometry args={[56, 56, 22, 64, 1, true]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.4} side={THREE.DoubleSide} />
       </mesh>

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
  const reducedMotion = useReducedMotion();

  useEffect(() => {
     setAnimStart(Date.now());
  }, [isFpv, mappedPath, isFollowingPath]);

  useFrame((state) => {
     const controls = state.controls as any;
     if (!controls || !animStart) return;

     if (isFpv && seat) {
        const targetCamPos = new THREE.Vector3(seat[0] * 0.95, seat[1] + 10, seat[2] * 0.95);
        if (reducedMotion) {
          camera.position.copy(targetCamPos);
        } else {
          if (Date.now() - animStart < 1500 || isFollowingPath) {
             camera.position.lerp(targetCamPos, 0.05);
          }
        }

        if (mappedPath && mappedPath.length > 0) {
            const targetPoi = mappedPath[mappedPath.length - 1];
            const worldX = (targetPoi[0] - 50) * 1.1; 
            const worldZ = (targetPoi[1] - 50) * 1.1;
            const r = Math.hypot(worldX, worldZ);
            const seatY = r < 25 ? 0 : ((r - 25) / 30) * 20;
            const targetLook = new THREE.Vector3(worldX, seatY, worldZ);

            if (reducedMotion) {
              controls.target.copy(targetLook);
            } else {
              if (Date.now() - animStart < 1000 || isFollowingPath) {
                  controls.target.lerp(targetLook, 0.05);
              }
            }
        } else {
            if (reducedMotion) {
              controls.target.set(0, 5, 0);
            } else {
              if (Date.now() - animStart < 1000) {
                  controls.target.lerp(new THREE.Vector3(0, 5, 0), 0.02);
              }
            }
        }
        controls.minDistance = 5;
     } else if (!isFpv) {
        if (reducedMotion) {
          controls.target.set(0, 5, 0);
          camera.position.set(0, 45, -60);
        } else {
          if (Date.now() - animStart < 1500) {
              controls.target.lerp(new THREE.Vector3(0, 5, 0), 0.05);
              camera.position.lerp(new THREE.Vector3(0, 45, -60), 0.05);
          }
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
       <mesh castShadow>
          <cylinderGeometry args={[0.2, 0.45, 22, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
       </mesh>
       <group position={[0, 11, 0]} rotation={[0.3, angle, 0]}>
          <mesh castShadow>
             <boxGeometry args={[3.2, 1.8, 0.5]} />
             <meshStandardMaterial color="#1e293b" roughness={0.5} />
          </mesh>
          {[-1.0, -0.35, 0.35, 1.0].map((off, idx) => (
             <mesh key={idx} position={[off, 0, 0.26]}>
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshBasicMaterial color="#fffbeb" />
             </mesh>
          ))}
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
       <mesh castShadow>
          <boxGeometry args={[14, 6.5, 0.8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.7} />
       </mesh>
       <mesh position={[0, 0, 0.41]}>
          <planeGeometry args={[13.2, 5.7]} />
          <meshBasicMaterial color="#020617" />
       </mesh>
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

export default function StadiumCanvas({
  isDark,
  isRoofOpen,
  isPitchRetracted,
  selectedSeat,
  setSelectedSeat,
  lockedSeats,
  mappedPath,
  isFollowingPath,
  setIsFollowingPath,
  isEmergency,
  waits,
  isFpv,
  setIsFpv,
  requestPath,
}: StadiumCanvasProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 45, -60], fov: 50 }}
      aria-label="3D Stadium crowd simulation — use the SwarmAI Assistant panel to navigate"
      role="application"
      tabIndex={0}
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

        <Scoreboard position={[0, 24, 52.5]} rotation={[0, Math.PI, 0]} />
        <Scoreboard position={[0, 24, -52.5]} rotation={[0, 0, 0]} />

        <Floodlight position={[42, 11, 42]} />
        <Floodlight position={[-42, 11, 42]} />
        <Floodlight position={[42, 11, -42]} />
        <Floodlight position={[-42, 11, -42]} />
        
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
        <CameraController isFpv={isFpv} seat={selectedSeat} mappedPath={mappedPath || []} isFollowingPath={isFollowingPath} />
        <OrbitControls makeDefault />
      </Suspense>
    </Canvas>
  );
}
