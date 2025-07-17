import React, { useState } from 'react';

const TalkToAI: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  // Function to call the AI API
  const askAI = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setResponse('');

    try {
      const res = await fetch('http://localhost:8000/talk-to-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) throw new Error('API request failed');

      const data = await res.json();

      if (data?.response) {
        setResponse(data.response);
        speakText(data.response); // Call TTS
      } else {
        setResponse('No response from AI.');
      }
    } catch (err) {
      console.error(err);
      setResponse('Error connecting to AI.');
    } finally {
      setLoading(false);
    }
  };

  // Function to speak the AI's response
  const speakText = (text: string) => {
    if (!window.speechSynthesis) {
      alert('Speech Synthesis not supported.');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; // Change to 'hi-IN' for Hindi
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    window.speechSynthesis.cancel(); // Stop any current speech
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: 'auto', fontFamily: 'Arial' }}>
      <h2>🤖 Talk to AI</h2>

      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask your question..."
        rows={4}
        style={{ width: '100%', padding: 10, fontSize: 16 }}
      />

      <button
        onClick={askAI}
        style={{ marginTop: 10, padding: '10px 20px', fontSize: 16 }}
        disabled={loading}
      >
        {loading ? 'Asking...' : 'Ask AI'}
      </button>

      <div
        style={{
          marginTop: 20,
          padding: 15,
          border: '1px solid #ccc',
          borderRadius: 5,
          backgroundColor: '#f9f9f9',
          minHeight: 100,
        }}
      >
        <strong>AI Response:</strong>
        <p>{response || 'No response yet.'}</p>
      </div>
    </div>
  );
};

export default TalkToAI;
