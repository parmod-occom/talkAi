import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Enhanced viseme shape mapping with more phonemes
const phonemeShapes: Record<string, { openness: number; width: number; pucker: number }> = {
  'AA': { openness: 0.8, width: 0.6, pucker: 0.0 }, // "father"
  'AE': { openness: 0.7, width: 0.8, pucker: 0.0 }, // "cat"
  'AH': { openness: 0.6, width: 0.4, pucker: 0.0 }, // "but"
  'AO': { openness: 0.7, width: 0.2, pucker: 0.3 }, // "thought"
  'AW': { openness: 0.6, width: 0.3, pucker: 0.4 }, // "how"
  'AY': { openness: 0.5, width: 0.6, pucker: 0.0 }, // "my"
  'EH': { openness: 0.4, width: 0.7, pucker: 0.0 }, // "bed"
  'ER': { openness: 0.4, width: 0.3, pucker: 0.2 }, // "bird"
  'EY': { openness: 0.3, width: 0.6, pucker: 0.0 }, // "bait"
  'IH': { openness: 0.2, width: 0.4, pucker: 0.0 }, // "bit"
  'IY': { openness: 0.1, width: 0.8, pucker: 0.0 }, // "beat"
  'OW': { openness: 0.4, width: 0.2, pucker: 0.7 }, // "boat"
  'OY': { openness: 0.5, width: 0.3, pucker: 0.5 }, // "boy"
  'UH': { openness: 0.3, width: 0.2, pucker: 0.4 }, // "book"
  'UW': { openness: 0.2, width: 0.1, pucker: 0.8 }, // "boot"
  'B': { openness: 0.0, width: 0.0, pucker: 0.0 },  // "bat"
  'CH': { openness: 0.2, width: 0.4, pucker: 0.0 }, // "chat"
  'D': { openness: 0.2, width: 0.3, pucker: 0.0 },  // "dog"
  'DH': { openness: 0.2, width: 0.4, pucker: 0.0 }, // "that"
  'F': { openness: 0.1, width: 0.3, pucker: 0.0 },  // "fat"
  'G': { openness: 0.3, width: 0.3, pucker: 0.0 },  // "go"
  'HH': { openness: 0.3, width: 0.2, pucker: 0.0 }, // "hat"
  'JH': { openness: 0.2, width: 0.4, pucker: 0.0 }, // "joy"
  'K': { openness: 0.3, width: 0.3, pucker: 0.0 },  // "cat"
  'L': { openness: 0.2, width: 0.3, pucker: 0.0 },  // "let"
  'M': { openness: 0.0, width: 0.0, pucker: 0.0 },  // "mat"
  'N': { openness: 0.1, width: 0.2, pucker: 0.0 },  // "net"
  'NG': { openness: 0.2, width: 0.2, pucker: 0.0 }, // "sing"
  'P': { openness: 0.0, width: 0.0, pucker: 0.0 },  // "pat"
  'R': { openness: 0.3, width: 0.2, pucker: 0.2 },  // "rat"
  'S': { openness: 0.1, width: 0.4, pucker: 0.0 },  // "sat"
  'SH': { openness: 0.2, width: 0.3, pucker: 0.3 }, // "she"
  'T': { openness: 0.2, width: 0.3, pucker: 0.0 },  // "top"
  'TH': { openness: 0.2, width: 0.4, pucker: 0.0 }, // "think"
  'V': { openness: 0.1, width: 0.3, pucker: 0.0 },  // "vat"
  'W': { openness: 0.2, width: 0.1, pucker: 0.7 },  // "wet"
  'Y': { openness: 0.2, width: 0.5, pucker: 0.0 },  // "yet"
  'Z': { openness: 0.1, width: 0.4, pucker: 0.0 },  // "zoo"
  'ZH': { openness: 0.2, width: 0.3, pucker: 0.2 }, // "measure"
  'sil': { openness: 0.0, width: 0.0, pucker: 0.0 },
};

type Viseme = {
  start: number;
  viseme: string;
};

function AvatarModel({
  visemes,
  audioRef,
}: {
  visemes: Viseme[];
  audioRef: React.RefObject<HTMLAudioElement | null>;
}) {
  const { scene } = useGLTF('/models/avatar.glb');
  const [currentShape, setCurrentShape] = useState({ openness: 0, width: 0, pucker: 0 });
  const [targetShape, setTargetShape] = useState({ openness: 0, width: 0, pucker: 0 });
  const [debugged, setDebugged] = useState(false);

  useFrame((state, delta) => {
    const audio = audioRef.current;
    if (!audio) return;

    // Debug morph targets once
    if (!debugged) {
      scene.traverse((child: any) => {
        if (child.isMesh && child.morphTargetDictionary) {
          console.log('Available morph targets:', Object.keys(child.morphTargetDictionary));
        }
      });
      console.log('Visemes data:', visemes);
      setDebugged(true);
    }

    const currentTime = audio.currentTime;
    let newTargetShape = phonemeShapes['sil'];
    
    if (!audio.paused && !audio.ended && visemes.length > 0) {
      for (let i = 0; i < visemes.length; i++) {
        const current = visemes[i];
        const next = visemes[i + 1];
        
        if (currentTime >= current.start && (!next || currentTime < next.start)) {
          newTargetShape = phonemeShapes[current.viseme] || phonemeShapes['sil'];
          break;
        }
      }
    }

    // Force immediate shape change for testing
    const lerpSpeed = 15.0;
    const newShape = {
      openness: THREE.MathUtils.lerp(currentShape.openness, newTargetShape.openness, delta * lerpSpeed),
      width: THREE.MathUtils.lerp(currentShape.width, newTargetShape.width, delta * lerpSpeed),
      pucker: THREE.MathUtils.lerp(currentShape.pucker, newTargetShape.pucker, delta * lerpSpeed)
    };
    
    setCurrentShape(newShape);

    // Apply to all meshes with morph targets
    scene.traverse((child: any) => {
      if (child.isMesh && child.morphTargetInfluences && child.morphTargetDictionary) {
        Object.entries(child.morphTargetDictionary).forEach(([key, idx]) => {
          const name = key.toLowerCase();
          const index = idx as number;
          
          // Try all possible mouth-related morph target names
          if (name.includes('mouth') || name.includes('jaw') || name.includes('lip') || 
              name.includes('oral') || name.includes('viseme') || name.includes('phoneme')) {
            
            // Apply openness to any mouth/jaw related targets
            if (name.includes('open') || name.includes('jaw') || name.includes('a') || name.includes('aa')) {
              child.morphTargetInfluences[index] = newShape.openness;
            }
            // Apply width to smile/wide targets  
            else if (name.includes('smile') || name.includes('wide') || name.includes('e') || name.includes('i')) {
              child.morphTargetInfluences[index] = newShape.width;
            }
            // Apply pucker to round/o targets
            else if (name.includes('pucker') || name.includes('round') || name.includes('o') || name.includes('u')) {
              child.morphTargetInfluences[index] = newShape.pucker;
            }
            // Generic application based on shape values
            else {
              const maxValue = Math.max(newShape.openness, newShape.width, newShape.pucker);
              child.morphTargetInfluences[index] = maxValue * 0.5;
            }
          }
        });
      }
    });
  });

  return <primitive object={scene} />;
}

export default function TalkingAvatar({
  audioPath,
  visemes,
  text,
}: {
  audioPath: string;
  visemes: Viseme[];
  text?: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && audioPath) {
      audio.src = audioPath;
      audio.load();
      
      const handleCanPlay = () => {
        console.log('Audio ready, duration:', audio.duration);
        audio.play().catch(console.error);
      };
      
      const handleTimeUpdate = () => {
        if (visemes.length > 0) {
          const currentTime = audio.currentTime;
          const activeViseme = visemes.find((v, i) => {
            const next = visemes[i + 1];
            return currentTime >= v.start && (!next || currentTime < next.start);
          });
          if (activeViseme) {
            console.log(`Time: ${currentTime.toFixed(2)}s, Viseme: ${activeViseme.viseme}`);
          }
        }
      };
      
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      
      return () => {
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [audioPath, visemes]);

  return (
    <div style={{ width: '300px', height: '300px', overflow: 'hidden' }}>
      <Canvas camera={{ position: [0, 1.6, 0.8], fov: 30 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[1, 1, 1]} />
        <Suspense fallback={null}>
          <AvatarModel visemes={visemes} audioRef={audioRef} />
        </Suspense>
        <OrbitControls 
          target={[0, 1.6, 0]} 
          enablePan={false} 
        />
      </Canvas>
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
}
