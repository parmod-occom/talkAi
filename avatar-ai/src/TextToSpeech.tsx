import React, { useState } from 'react';

const TextToSpeech: React.FC = () => {
  const [text, setText] = useState<string>('');

  const handleSpeak = () => {
    if (!window.speechSynthesis) {
      alert('Speech Synthesis not supported in this browser.');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN'; // You can change this to "hi-IN" for Hindi, etc.
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>🗣️ Text to Speech (Client-side)</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder="Enter text to speak..."
        style={{ width: '100%', padding: '10px', fontSize: '16px' }}
      />
      <br />
      <button onClick={handleSpeak} style={{ marginTop: '10px', padding: '10px 20px' }}>
        🔊 Speak
      </button>
    </div>
  );
};

export default TextToSpeech;
