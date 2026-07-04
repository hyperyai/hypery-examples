'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';

interface Model3DProps {
  geometry?: 'box' | 'sphere' | 'cone' | 'torus' | 'cylinder';
  color?: string;
  position?: [number, number, number];
  scale?: number;
}

function Model3D({ geometry = 'box', color = '#4A90E2', position = [0, 0, 0], scale = 1 }: Model3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      {geometry === 'box' && <boxGeometry args={[1, 1, 1]} />}
      {geometry === 'sphere' && <sphereGeometry args={[0.6, 16, 16]} />}
      {geometry === 'cone' && <coneGeometry args={[0.6, 1, 8]} />}
      {geometry === 'torus' && <torusGeometry args={[0.5, 0.2, 16, 32]} />}
      {geometry === 'cylinder' && <cylinderGeometry args={[0.5, 0.5, 1, 16]} />}
      <meshStandardMaterial color={color} roughness={0.5} metalness={0.2} />
    </mesh>
  );
}

interface SceneProps {
  models: Array<{
    id: string;
    geometry: 'box' | 'sphere' | 'cone' | 'torus' | 'cylinder';
    color: string;
    position: [number, number, number];
    scale: number;
  }>;
}

export default function Scene({ models }: SceneProps) {
  return (
    <div className="w-full h-full relative bg-gradient-to-br from-slate-900 to-slate-800">
      <Canvas shadows>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[3, 3, 5]} fov={50} />
          
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight 
            position={[5, 5, 5]} 
            intensity={1} 
            castShadow 
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <pointLight position={[-5, 5, -5]} intensity={0.5} />

          {/* Models */}
          {models.map((model) => (
            <Model3D 
              key={model.id}
              geometry={model.geometry}
              color={model.color}
              position={model.position}
              scale={model.scale}
            />
          ))}

          {/* Ground plane */}
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
            <planeGeometry args={[10, 10]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.1} />
          </mesh>

          {/* Environment and Controls */}
          <Environment preset="sunset" />
          <OrbitControls 
            enableDamping 
            dampingFactor={0.05}
            minDistance={2}
            maxDistance={10}
          />
        </Suspense>
      </Canvas>
      
      {/* Helper text overlay */}
      <div className="absolute top-4 left-4 text-white text-sm bg-black/50 px-3 py-2 rounded">
        <p className="font-semibold mb-1">Controls:</p>
        <p>• Left-click + drag: Rotate</p>
        <p>• Right-click + drag: Pan</p>
        <p>• Scroll: Zoom</p>
      </div>
    </div>
  );
}

