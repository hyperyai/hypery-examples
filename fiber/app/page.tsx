'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import ChatInterface from '@/components/ChatInterface';

// Dynamically import Scene to avoid SSR issues with Three.js
const Scene = dynamic(() => import('@/components/Scene'), { ssr: false });

interface Model {
  id: string;
  geometry: 'box' | 'sphere' | 'cone' | 'torus' | 'cylinder';
  color: string;
  position: [number, number, number];
  scale: number;
}

export default function Home() {
  const [models, setModels] = useState<Model[]>([
    {
      id: '1',
      geometry: 'box',
      color: '#4A90E2',
      position: [0, 0, 0],
      scale: 1,
    },
  ]);

  const handleModelUpdate = useCallback((instruction: string) => {
    console.log('Model update instruction:', instruction);
    
    // Parse the AI response to update models
    // This is a simple parser - in production you'd want more sophisticated parsing
    const lowerInstruction = instruction.toLowerCase();
    
    // Add new models
    if (lowerInstruction.includes('add') || lowerInstruction.includes('create')) {
      const newModel: Model = {
        id: Date.now().toString(),
        geometry: 'sphere',
        color: '#E24A90',
        position: [Math.random() * 2 - 1, Math.random() * 2, Math.random() * 2 - 1],
        scale: 1,
      };

      // Detect geometry type
      if (lowerInstruction.includes('box') || lowerInstruction.includes('cube')) {
        newModel.geometry = 'box';
      } else if (lowerInstruction.includes('sphere') || lowerInstruction.includes('ball')) {
        newModel.geometry = 'sphere';
      } else if (lowerInstruction.includes('cone')) {
        newModel.geometry = 'cone';
      } else if (lowerInstruction.includes('torus') || lowerInstruction.includes('donut')) {
        newModel.geometry = 'torus';
      } else if (lowerInstruction.includes('cylinder')) {
        newModel.geometry = 'cylinder';
      }

      // Detect color
      const colorMatch = instruction.match(/#[0-9A-Fa-f]{6}|red|blue|green|yellow|purple|orange|pink|cyan|magenta|white|black|gray|grey/i);
      if (colorMatch) {
        const color = colorMatch[0].toLowerCase();
        const colorMap: Record<string, string> = {
          red: '#E24A4A',
          blue: '#4A90E2',
          green: '#4AE290',
          yellow: '#E2E24A',
          purple: '#904AE2',
          orange: '#E2904A',
          pink: '#E24A90',
          cyan: '#4AE2E2',
          magenta: '#E24AE2',
          white: '#FFFFFF',
          black: '#000000',
          gray: '#808080',
          grey: '#808080',
        };
        newModel.color = colorMap[color] || color;
      }

      setModels((prev) => [...prev, newModel]);
    }
    
    // Modify existing models
    else if (lowerInstruction.includes('change') || lowerInstruction.includes('make')) {
      const colorMatch = instruction.match(/#[0-9A-Fa-f]{6}|red|blue|green|yellow|purple|orange|pink|cyan|magenta|white|black|gray|grey/i);
      if (colorMatch) {
        const color = colorMatch[0].toLowerCase();
        const colorMap: Record<string, string> = {
          red: '#E24A4A',
          blue: '#4A90E2',
          green: '#4AE290',
          yellow: '#E2E24A',
          purple: '#904AE2',
          orange: '#E2904A',
          pink: '#E24A90',
          cyan: '#4AE2E2',
          magenta: '#E24AE2',
          white: '#FFFFFF',
          black: '#000000',
          gray: '#808080',
          grey: '#808080',
        };
        const newColor = colorMap[color] || color;
        
        setModels((prev) => 
          prev.map((model, index) => 
            index === prev.length - 1 ? { ...model, color: newColor } : model
          )
        );
      }
    }
    
    // Remove models
    else if (lowerInstruction.includes('remove') || lowerInstruction.includes('delete')) {
      setModels((prev) => prev.slice(0, -1));
    }
    
    // Clear all
    else if (lowerInstruction.includes('clear') || lowerInstruction.includes('reset')) {
      setModels([]);
    }
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* 3D Scene */}
      <div className="flex-1 h-full">
        <Scene models={models} />
      </div>
      
      {/* Chat Interface */}
      <div className="w-96 h-full">
        <ChatInterface onModelUpdate={handleModelUpdate} />
      </div>
    </div>
  );
}

