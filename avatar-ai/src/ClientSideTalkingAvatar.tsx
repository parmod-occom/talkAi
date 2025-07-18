import React, { useRef, useState, useEffect } from 'react';

type Viseme = {
  time: number;
  viseme: string;
};

const ClientSideTalkingAvatar: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [visemes, setVisemes] = useState<Viseme[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [currentViseme, setCurrentViseme] = useState<string>('NEUTRAL');
  const startTimeRef = useRef<number>(0);
  const visemeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const speakText = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const generatedVisemes: Viseme[] = [];
    startTimeRef.current = performance.now();

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const elapsed = (performance.now() - startTimeRef.current) / 1000;
        const char = text[event.charIndex] || ' ';
        const viseme = mapCharToViseme(char);
        generatedVisemes.push({ time: elapsed, viseme });
      }
    };

    utterance.onstart = () => {
      setSpeaking(true);
      setVisemes([]);
    };

    utterance.onend = () => {
      setSpeaking(false);
      setVisemes(generatedVisemes);
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const handleAsk = () => {
    if (!question.trim()) return;
    speakText(question);
  };

  const mapCharToViseme = (char: string): string => {
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    const lower = char.toLowerCase();
    if (vowels.includes(lower)) return 'VOWEL';
    if ('bmp'.includes(lower)) return 'CLOSED';
    if ('fv'.includes(lower)) return 'F';
    if ('tdn'.includes(lower)) return 'T';
    return 'NEUTRAL';
  };

  useEffect(() => {
    if (!speaking || visemes.length === 0) return;

    const start = performance.now();

    visemeTimerRef.current = setInterval(() => {
      const elapsed = (performance.now() - start) / 1000;
      const latest = visemes.findLast((v) => v.time <= elapsed);
      if (latest) {
        setCurrentViseme(latest.viseme);
      }
    }, 50);

    return () => {
      if (visemeTimerRef.current) {
        clearInterval(visemeTimerRef.current);
        visemeTimerRef.current = null;
      }
    };
  }, [visemes, speaking]);

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
      <h2>🗣️ AI Avatar (Client-Side TTS + Lip Sync)</h2>

      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={3}
        placeholder="Ask something..."
        style={{
          width: '100%',
          fontSize: 16,
          padding: 10,
          borderRadius: 6,
          border: '1px solid #ccc',
        }}
      />

      <button
        onClick={handleAsk}
        disabled={speaking}
        style={{
          marginTop: 10,
          padding: '10px 20px',
          background: '#0066ff',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
        }}
      >
        {speaking ? 'Speaking...' : 'Speak'}
      </button>

      <div style={{ marginTop: 40, textAlign: 'center', fontSize: 48 }}>
        <div>🧑</div>
        <div style={{ fontSize: 24 }}>Mouth: {currentViseme}</div>
      </div>
    </div>
  );
};

export default ClientSideTalkingAvatar;
