// import React from 'react';

// function Avatar({ speaking }) {
//   return (
//     <div style={{
//       width: 200,
//       height: 200,
//       margin: 'auto',
//       borderRadius: '50%',
//       backgroundColor: '#f3f3f3',
//       display: 'flex',
//       justifyContent: 'center',
//       alignItems: 'center',
//       fontSize: 100,
//       animation: speaking ? 'pulse 1s infinite' : 'none'
//     }}>
//       😊
//     </div>
//   );
// }

// export default Avatar;


import React, { useEffect, useRef } from "react";

function Avatar({ audioPath, visemes }) {
  const audioRef = useRef(null);
  const mouthRef = useRef(null);

  const playVisemes = () => {
    const audio = audioRef.current;
    audio.play();

    visemes.forEach(({ start, viseme }) => {
      setTimeout(() => {
        mouthRef.current.innerText = viseme;
      }, start * 1000);
    });
  };

  useEffect(() => {
    if (audioPath && visemes.length) {
      playVisemes();
    }
  }, [audioPath, visemes]);

  return (
    <div style={{ marginTop: "2rem" }}>
      <audio ref={audioRef} src={audioPath}></audio>
      <div style={{ fontSize: "4rem" }}>🧑</div>
      <div
        ref={mouthRef}
        style={{
          fontSize: "2rem",
          marginTop: "-1rem",
          color: "red",
          transition: "all 0.1s",
        }}
      >
        👄
      </div>
    </div>
  );
}

export default Avatar;
