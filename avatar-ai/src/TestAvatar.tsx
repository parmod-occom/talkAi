// import React, { useEffect, useRef, useState } from "react";
// import { Canvas } from "@react-three/fiber";
// import { OrbitControls } from "@react-three/drei";
// import { AvatarScene } from "./AvatarScene.tsx";
// import { applyVisemeAtTime } from "./visemeSync.tsx";

// export const TestAvatar = () => {
//   const avatarRef = useRef<any>();
//   // const [visemes, setVisemes] = useState<{ viseme: string; time: number }[]>([]);
//   // const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

//   // useEffect(() => {
//   //   // const fetchData = async () => {
//   //   //   const res = await fetch("http://localhost:8000/talk-to-ai?hhhhhh=88888888", {
//   //   //     method: "POST",
//   //   //     headers: { "Content-Type": "application/json" },
//   //   //     body: JSON.stringify({ question: "Hello!" }),
//   //   //   });

//   //   //   const data = await res.json();
//   //   //   setVisemes(data.visemes);

//   //   //   const blob = new Blob([data.audio], { type: "audio/wav" });
//   //   //   const audioUrl = URL.createObjectURL(blob);
//   //   //   const audioEl = new Audio(audioUrl);
//   //   //   setAudio(audioEl);
//   //   // };

//   //   // fetchData();
//   // }, []);

//   // const startLipSync = () => {
//   //   if (!audio || !avatarRef.current || !visemes.length) return;

//   //   const start = performance.now();
//   //   audio.play();

//   //   const loop = () => {
//   //     const time = (performance.now() - start) / 1000;
//   //     applyVisemeAtTime(visemes, time, avatarRef);
//   //     if (!audio.paused) requestAnimationFrame(loop);
//   //   };

//   //   loop();
//   // };

//   // useEffect(() => {
//   //   if (audio) {
//   //     audio.onplay = startLipSync;
//   //   }
//   // }, [audio]);

//   return (
//      <div style={{ width: '300px', height: '300px', overflow: 'hidden' }}>
//         <Canvas camera={{ position: [0, 1.6, 0.8], fov: 30 }}>
//           <ambientLight intensity={0.5} />
//           <directionalLight position={[1, 1, 1]} />
//           <AvatarScene ref={avatarRef} />
//           <OrbitControls
//             target={[0, 1.6, 0]}  // Focus around avatar's face height
//             enablePan={false} 
//           />
//         </Canvas>
//       </div>
//   );
// };

import React, { useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const phonemeShapes: Record<string, { openness: number; width: number; pucker: number }> = {
  'AA': { openness: 0.8, width: 0.6, pucker: 0.0 },
  'EH': { openness: 0.4, width: 0.7, pucker: 0.0 },
  'M': { openness: 0.0, width: 0.0, pucker: 0.0 },
  'O': { openness: 0.5, width: 0.2, pucker: 0.5 },
  'F': { openness: 0.1, width: 0.3, pucker: 0.0 },
  'sil': { openness: 0, width: 0, pucker: 0 }
  // Add more as needed
};

type Viseme = { start: number; viseme: string };

function AvatarModel({
  visemes,
  speechStartTime
}: {
  visemes: Viseme[];
  speechStartTime: number | null;
}) {
  const { scene } = useGLTF('/models/avatar.glb');
  const [currentShape, setCurrentShape] = useState({ openness: 0, width: 0, pucker: 0 });

  useFrame((state, delta) => {
    const now = performance.now();
    const currentTime = speechStartTime ? (now - speechStartTime) / 1000 : 0;

    let targetShape = phonemeShapes['sil'];

    if (speechStartTime && visemes.length > 0) {
      for (let i = 0; i < visemes.length; i++) {
        const v = visemes[i];
        const next = visemes[i + 1];
        if (currentTime >= v.start && (!next || currentTime < next.start)) {
          targetShape = phonemeShapes[v.viseme] || phonemeShapes['sil'];
          break;
        }
      }
    }

    const lerpSpeed = 10;
    const newShape = {
      openness: THREE.MathUtils.lerp(currentShape.openness, targetShape.openness, delta * lerpSpeed),
      width: THREE.MathUtils.lerp(currentShape.width, targetShape.width, delta * lerpSpeed),
      pucker: THREE.MathUtils.lerp(currentShape.pucker, targetShape.pucker, delta * lerpSpeed)
    };

    setCurrentShape(newShape);

    scene.traverse((child: any) => {
      if (child.isMesh && child.morphTargetInfluences && child.morphTargetDictionary) {
        Object.entries(child.morphTargetDictionary).forEach(([name, idx]) => {
          const index = idx as number;
          const key = name.toLowerCase();
          if (key.includes('open')) child.morphTargetInfluences[index] = newShape.openness;
          else if (key.includes('wide')) child.morphTargetInfluences[index] = newShape.width;
          else if (key.includes('pucker') || key.includes('round')) child.morphTargetInfluences[index] = newShape.pucker;
        });
      }
    });
  });

  return <primitive object={scene} />;
}

export default function TestAvatar({
  visemes,
  text,
  speechStartTime
}: {
  visemes: Viseme[];
  text?: string;
  speechStartTime: number | null;
}) {
  return (
    <div style={{ width: '300px', height: '300px' }}>
      <Canvas camera={{ position: [0, 1.6, 0.8], fov: 30 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[1, 1, 1]} />
        <Suspense fallback={null}>
          <AvatarModel visemes={visemes} speechStartTime={speechStartTime} />
        </Suspense>
        <OrbitControls target={[0, 1.6, 0]} enablePan={false} />
      </Canvas>
    </div>
  );
}
