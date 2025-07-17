import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

// 🔧 Map from viseme name to morph target name
function getMorphTargetName(viseme) {
  const map = {
    sil: "viseme_sil",
    P: "viseme_PP",
    F: "viseme_FF",
    TH: "viseme_TH",
    D: "viseme_DD",
    K: "viseme_kk",
    CH: "viseme_CH",
    S: "viseme_SS",
    N: "viseme_nn",
    R: "viseme_RR",
    AA: "viseme_aa",
    E: "viseme_E",
    I: "viseme_I",
    O: "viseme_O",
    U: "viseme_U"
  };
  return map[viseme] || null;
}

function AvatarModel({ visemes, audioRef, isPlaying }) {
  const { scene } = useGLTF("/models/avatar.glb");
  const mouthMesh = useRef(null);

  useEffect(() => {
    scene.traverse((child) => {
      if (child.name === "Wolf3D_Head" && child.morphTargetInfluences) {
        mouthMesh.current = child;
        console.log("Morph Targets:", child.morphTargetDictionary);
      }
    });
  }, [scene]);

  useFrame(() => {
    if (!audioRef.current || !mouthMesh.current || !isPlaying) return;

    const influences = mouthMesh.current.morphTargetInfluences;
    const morphDict = mouthMesh.current.morphTargetDictionary;
    if (!influences || !morphDict) return;

    // Reset all morph targets
    for (let i = 0; i < influences.length; i++) {
      influences[i] = 0;
    }

    const currentTime = audioRef.current.currentTime;

    const activeViseme = visemes.find((v, i) => {
      const next = visemes[i + 1];
      return currentTime >= v.start && (!next || currentTime < next.start);
    });

    if (activeViseme) {
      const morphName = getMorphTargetName(activeViseme.viseme);
      if (morphName && morphDict[morphName] !== undefined) {
        const index = morphDict[morphName];
        influences[index] = 1; // Activate viseme
        console.log(`Time: ${currentTime.toFixed(2)}s → Viseme: ${activeViseme.viseme}`);
      }
    }
  });

  return <primitive object={scene} />;
}

export default function AvatarGLB({ audioPath, visemes, text }) {
  const audioRef = useRef();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVisemes, setCurrentVisemes] = useState([]);

  useEffect(() => {
    if (visemes && visemes.length > 0) {
      setCurrentVisemes(visemes);
    } else if (text) {
      // Fallback simple viseme mapping
      const words = text.split(" ");
      const basicVisemes = ["AA", "O", "E", "P", "TH", "CH"];
      const generated = [];
      let time = 0;

      for (let word of words) {
        const duration = word.length * 0.08;
        const viseme = basicVisemes[Math.floor(Math.random() * basicVisemes.length)];
        generated.push({ viseme, start: time, end: time + duration });
        time += duration + 0.05;
      }

      setCurrentVisemes(generated);
    }
  }, [visemes, text]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  useEffect(() => {
    if (audioPath && audioRef.current) {
      audioRef.current.load(); // reset source
      audioRef.current.play().catch(console.error);
    }
  }, [audioPath]);

  return (
    <div style={{ height: "300px" }}>
      <audio ref={audioRef} src={audioPath} />
      <Canvas camera={{ position: [0, 1.6, 0.8], fov: 35 }} style={{ height: "300px" }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[1, 1, 1]} />
        <AvatarModel visemes={currentVisemes} audioRef={audioRef} isPlaying={isPlaying} />
        <OrbitControls target={[0, 1.7, 0]} enableZoom={true} minDistance={0.5} maxDistance={2} />
      </Canvas>
    </div>
  );
}
