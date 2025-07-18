import { MutableRefObject } from "react";

export const applyVisemeAtTime = (
  visemes: { viseme: string; time: number }[],
  time: number,
  blendShapeRef: MutableRefObject<any>
) => {
  const current = (() => {
    for (let i = visemes.length - 1; i >= 0; i--) {
      if (visemes[i].time <= time) {
        return visemes[i];
      }
    }
    return undefined;
  })();
  if (current && blendShapeRef.current) {
    blendShapeRef.current.setWeightForViseme(current.viseme);
  }
};
