import { useGLTF } from "@react-three/drei";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";

const visemeMap = {
  AA: 0,
  O: 1,
  BMP: 2,
  EH: 3,
  SH: 4,
  F: 5,
};

export const AvatarScene = forwardRef((props, ref) => {
  const avatar = useRef<Group>(null);
  const morphRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    setWeightForViseme: (viseme: string) => {
      const index = visemeMap[viseme];
      if (index !== undefined && morphRef.current) {
        const mesh = morphRef.current;
        mesh.morphTargetInfluences?.fill(0);
        mesh.morphTargetInfluences![index] = 1;
      }
    },
  }));

  const { scene } = useGLTF("models/avatar.glb");

  useEffect(() => {
    if (scene) {
      morphRef.current = scene.getObjectByName("MeshNameWithMorphs");
    }
  }, [scene]);

  return <primitive ref={avatar} object={scene} scale={1.5} position={[0, -1, 0]} />;
});
