import React, { useEffect, useRef, useState } from 'react';

const AudioToText: React.FC = () => {
  const [transcript, setTranscript] = useState<string>('');
  const [listening, setListening] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null); // You can use a stricter type if desired

  // interface Window {
  //   webkitSpeechRecognition: typeof SpeechRecognition;
  // }

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let current = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        current += event.results[i][0].transcript;
      }
      setTranscript((prev) => prev + current);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech Recognition Error:', event.error);
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (listening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }

    setListening((prev) => !prev);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>🎤 Audio to Text (Client-side)</h2>
      <button onClick={toggleListening} style={{ padding: '10px 20px' }}>
        {listening ? '🛑 Stop Listening' : '🎙️ Start Listening'}
      </button>
      <div
        style={{
          marginTop: '20px',
          padding: '15px',
          border: '1px solid #ccc',
          borderRadius: '5px',
          backgroundColor: '#f9f9f9',
        }}
      >
        <strong>Transcript:</strong>
        <p>{transcript || 'No speech detected yet...'}</p>
      </div>
    </div>
  );
};

export default AudioToText;
