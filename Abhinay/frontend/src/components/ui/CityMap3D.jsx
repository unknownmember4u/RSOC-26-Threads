import React, { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, ContactShadows, Float } from '@react-three/drei';
import * as THREE from 'three';
import useGlobalStore from '@/state/globalStore';

/* ─── Mock District Geometries ─── */
const DISTRICT_LAYOUTS = [
  { id: 'Ahmedabad', label: 'Ahmedabad', pos: [-6, 0, -4], size: [3.5, 0.4, 3], health: 82 },
  { id: 'Bengaluru', label: 'Bengaluru', pos: [1, 0, -5], size: [4, 0.4, 3.5], health: 74 },
  { id: 'Chennai', label: 'Chennai', pos: [-4, 0, 1], size: [3, 0.4, 4], health: 58 },
  { id: 'Dehradun', pos: [4, 0, -2], size: [3, 0.4, 3], health: 88, label: 'Dehradun' },
  { id: 'Indore', pos: [-7, 0, 5], size: [3.2, 0.4, 3.2], health: 79, label: 'Indore' },
  { id: 'Lucknow', pos: [0, 0, 4], size: [3.5, 0.4, 3.5], health: 32, label: 'Lucknow' },
  { id: 'Nagpur', pos: [7, 0, -6], size: [4, 0.4, 3], health: 52, label: 'Nagpur' },
  { id: 'Pune', pos: [6, 0, 3], size: [3.5, 0.4, 4], health: 71, label: 'Pune' },
  { id: 'Thane', pos: [10, 0, 0], size: [3, 0.4, 3], health: 85, label: 'Thane' },
  { id: 'Visakhapatnam', pos: [2, 0, 10], size: [4, 0.4, 3], health: 68, label: 'Vizag' },
];

/* ─── Procedural Building Unit ─── */
function Building({ pos, size, healthColor, isActive, isHovered }) {
  const meshRef = useRef();
  
  return (
    <mesh position={pos} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial 
        color={isActive ? healthColor : '#1E291B'}
        emissive={healthColor}
        emissiveIntensity={isActive || isHovered ? 0.4 : 0.1}
        roughness={0.1}
        metalness={0.9}
        transparent
        opacity={0.9}
      />
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
        <lineBasicMaterial color={healthColor} transparent opacity={isActive ? 0.9 : 0.2} />
      </lineSegments>
    </mesh>
  );
}

function DistrictBlock({ data, isActive, isHovered, onHover, onClick }) {
  const groupRef = useRef();
  const targetY = isActive || isHovered ? 0.6 : 0;
  const healthColor = data.health >= 80 ? '#2ED573' : data.health >= 50 ? '#FFA502' : '#FF4757';

  // Deterministic seed based on district name
  const seed = data.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const getRand = (i) => {
    const x = Math.sin(seed + i) * 10000;
    return x - Math.floor(x);
  };

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.1);
    }
  });

  // Generate building grid (3x3)
  const buildings = [];
  const spacing = 0.8;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const idx = i * 3 + j;
      const h = 0.5 + getRand(idx) * 2.5;
      buildings.push({
        pos: [(i - 1) * spacing, h / 2, (j - 1) * spacing],
        size: [0.6, h, 0.6]
      });
    }
  }

  return (
    <group position={data.pos} onPointerOver={() => onHover(data)} onPointerOut={() => onHover(null)} onClick={() => onClick(data.id)}>
      <group ref={groupRef}>
        {buildings.map((b, i) => (
          <Building 
            key={i} 
            pos={b.pos} 
            size={b.size} 
            healthColor={healthColor} 
            isActive={isActive} 
            isHovered={isHovered} 
          />
        ))}
        
        {/* District Base Plate */}
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[data.size[0], 0.1, data.size[2]]} />
          <meshStandardMaterial color={isActive ? healthColor : '#112211'} transparent opacity={0.3} />
        </mesh>
      </group>
      
      {(isActive || isHovered) && (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <Text
            position={[0, 4, 0]}
            fontSize={0.45}
            color="#FFFFFF"
            anchorX="center"
            anchorY="middle"
            fontStyle="bold"
          >
            {data.label}
          </Text>
        </Float>
      )}
    </group>
  );
}



export default function CityMap3D() {
  const { selectedDistrict, setDistrict, theme } = useGlobalStore();
  const [hovered, setHovered] = useState(null);

  const selectedData = DISTRICT_LAYOUTS.find(d => d.id === selectedDistrict);
  const isDark = theme === 'dark';

  return (
    <div style={{ 
      width: '100%', height: '100%', minHeight: 400, position: 'relative', 
      background: isDark ? '#050805' : '#f1f5f9',
      transition: 'background 0.4s ease' 
    }}>
      <Suspense fallback={
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#84B179', fontSize: '0.6rem', letterSpacing: '0.2em' }}>
          LOADING GEOSPATIAL CORE...
        </div>
      }>
        <Canvas shadows gl={{ antialias: true, alpha: true }}>
          <PerspectiveCamera makeDefault position={[12, 12, 12]} fov={45} />
          
          <OrbitControls 
            enablePan={false} 
            minDistance={4} 
            maxDistance={30} 
            maxPolarAngle={Math.PI / 2.1} 
            makeDefault 
          />
          
          <ambientLight intensity={isDark ? 0.4 : 0.8} />
          <spotLight position={[10, 20, 10]} angle={0.15} penumbra={1} intensity={isDark ? 1500 : 2000} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={500} color="#84B179" />

          <group rotation={[0, -Math.PI / 4, 0]}>
            <gridHelper args={[40, 40, isDark ? '#112211' : '#cbd5e1', isDark ? '#081108' : '#e2e8f0']} position={[0, -0.1, 0]} />
            
            {DISTRICT_LAYOUTS.map((d) => (
              <DistrictBlock 
                key={d.id} 
                data={d} 
                isActive={selectedDistrict === d.id}
                isHovered={hovered?.id === d.id}
                onHover={setHovered}
                onClick={setDistrict}
              />
            ))}

            <mesh position={[0, -0.4, 0]}>
              <cylinderGeometry args={[2, 2.2, 0.4, 32]} />
              <meshStandardMaterial color={isDark ? "#0A110A" : "#cbd5e1"} metalness={0.8} roughness={0.2} />
            </mesh>
          </group>

          <ContactShadows position={[0, -0.1, 0]} opacity={isDark ? 0.4 : 0.2} scale={40} blur={2.5} far={4} />
        </Canvas>
      </Suspense>

      {/* ── 3D HUD (Theme Aware) ── */}
      <div style={{ position: 'absolute', top: 24, right: 24, pointerEvents: 'none', textAlign: 'right' }}>
        <div style={{ fontSize: '0.6rem', color: '#84B179', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 4, fontWeight: 700 }}>Geospatial Core</div>
        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: isDark ? '#FFFFFF' : '#1e293b', letterSpacing: '-0.02em' }}>
          {selectedDistrict === 'All Cities' ? 'GLOBAL OVERVIEW' : selectedDistrict.toUpperCase()}
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 24, left: 24, pointerEvents: 'none' }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: '#2ED573' }} />
            <span style={{ fontSize: '0.55rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Target Met</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: '#FFA502' }} />
            <span style={{ fontSize: '0.55rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Nominal</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: '#FF4757' }} />
            <span style={{ fontSize: '0.55rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Critical Alert</span>
          </div>
        </div>
      </div>
    </div>
  );
}
