import React, { useEffect, useRef, useState } from 'react';
import TestAvatar from './TestAvatar.tsx';

const TalkToAI2: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [visemes, setVisemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechStartTime, setSpeechStartTime] = useState<number | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef<string>('');

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Your browser does not support Speech Recognition.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      transcriptRef.current = '';
      setListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const spokenText = event.results[0][0].transcript;
      transcriptRef.current = spokenText;
      setQuestion(spokenText);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      alert('Speech recognition error: ' + event.error);
    };

    recognition.onend = () => {
      setListening(false);
      const finalText = transcriptRef.current.trim();
      if (finalText) {
        askAI2(finalText);
      }
    };

    recognitionRef.current = recognition;
  }, []);

  const handleVoiceInput = () => {
    if (recognitionRef.current && !listening) {
      recognitionRef.current.start();
    }
  };

  const speakText = (text: string, onStart: () => void, onEnd: () => void) => {
    if (!window.speechSynthesis) {
      alert('Speech synthesis not supported.');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      const start = performance.now();
      setSpeechStartTime(start);
      onStart();
    };

    utterance.onend = () => {
      setSpeechStartTime(null);
      onEnd();
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const askAI = async (inputText?: string) => {
    const textToSend = inputText ?? question;
    if (!textToSend.trim()) return;

    setLoading(true);
    setResponse('');
    setVisemes([]);

    try {
      const res = await fetch('http://localhost:8000/talk-to-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: textToSend }),
      });

      const data = await res.json();

      if (data?.response) {
        setResponse(data.response);
        setVisemes(data.visemes);

        speakText(data.response, () => {
          console.log('Speech started');
        }, () => {
          console.log('Speech ended');
        });
      } else {
        setResponse('No response from AI.');
      }
    } catch (err) {
      console.error(err);
      setResponse('Error contacting AI.');
    } finally {
      setLoading(false);
    }
  };

  const askAI2 = async (inputText?: string) => {
    const textToSend = inputText ?? question;
    if (!textToSend.trim()) return;

    setLoading(true);
    setResponse('');
    setVisemes([]);

    try {
      const res = await fetch('http://localhost:8000/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: textToSend }),
      });

      const data = await res.json();

      if (data?.response) {
        setResponse(data.response);
        setVisemes(data.visemes);

        speakText(data.response, () => {
          console.log('Speech started');
        }, () => {
          console.log('Speech ended');
        });
      } else {
        setResponse('No response from AI.');
      }
    } catch (err) {
      console.error(err);
      setResponse('Error contacting AI.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: 'auto', fontFamily: 'Arial' }}>
      <h2>🎤 Ask AI with Your Voice</h2>

      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Speak or type your question..."
        rows={4}
        style={{ width: '100%', padding: 10, fontSize: 16 }}
      />

      <div style={{ marginTop: 10 }}>
        <button
          onClick={handleVoiceInput}
          disabled={listening}
          style={{
            padding: '10px 20px',
            fontSize: 16,
            marginRight: 10,
            backgroundColor: listening ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            cursor: listening ? 'not-allowed' : 'pointer',
          }}
        >
          {listening ? 'Listening...' : '🎙️ Speak'}
        </button>

        <button
          onClick={() => askAI2()}
          disabled={loading}
          style={{
            padding: '10px 20px',
            fontSize: 16,
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Asking...' : '🧠 Ask AI'}
        </button>
      </div>

      <div style={{ marginTop: 20, padding: 15, border: '1px solid #ccc', borderRadius: 5, backgroundColor: '#f9f9f9' }}>
        <TestAvatar visemes={visemes} text={response} speechStartTime={speechStartTime} />
        <strong>AI Response:</strong>
        <p>{response || 'No response yet.'}</p>
      </div>
    </div>
  );
};

export default TalkToAI2;
