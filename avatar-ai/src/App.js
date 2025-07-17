import logo from './logo.svg';
import './App.css';
import React, { useState } from 'react';
import axios from 'axios';
import TalkingAvatar  from './TalkingAvatar.tsx';
import TalkToAI  from './TalkToAI.tsx';

function App() {
  const [audioURL, setAudioURL] = useState(null);
  const [text, setText] = useState(null);
  const [reply, setReply] = useState('');
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const chunks = [];
  const [audioPath, setAudioPath] = useState('harvard.wav');
  const [visemes, setVisemes] = useState([]);

  const startRecording = async () => {
    setReply('');
    setAudioURL(null);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    recorder.start();
    setRecording(true);
    setMediaRecorder(recorder);

    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = async () => {
      const audioBlob = new Blob(chunks, { type: 'audio/mp3' });
      const formData = new FormData();
      formData.append('audio', audioBlob, 'user_audio.mp3');

      const res = await axios.post('http://localhost:8000/speak/', formData);
      setReply(res.data.reply_text);
      console.log('visemes:::::',res.data.visemes);
      setAudioPath(res.data.audio_path);
      setAudioURL(res.data.audio_path);
      setVisemes(res.data.visemes);
    };
  };

  const stopRecording = () => {
    mediaRecorder.stop();
    setRecording(false);
  };

  const speak = async () => {
    const formData = {
      text: text 
    };

    const res = await axios.post('http://localhost:8000/speak/', formData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    setReply(res.data.reply_text);
    console.log('visemes:::::',res.data.visemes);
    setAudioPath(res.data.audio_path);
    setAudioURL(res.data.audio_path);
    setVisemes(res.data.visemes);
  };
  
  const handleChange = (e) => {
    const inputValue = e.target.value;
    setText(inputValue);
  };

  return (
    <>
      <div style={{ marginTop: 50 }}>
        {/* <Avatar speaking={!!audioURL} /> */}
        <TalkingAvatar audioPath={audioURL || audioPath} visemes={visemes} />
        <br />
        <button onClick={recording ? stopRecording : startRecording}>
          🎤 {recording ? 'Stop' : 'Talk to Avatar'}
        </button>
        <p><strong>AI:</strong> {reply}</p>
        {audioURL && <audio src={audioURL} controls autoPlay />}
      </div>
        {/** 
        <div id="controls" style={{ marginTop: 50 }}>
          <textarea
            rows="4"
            cols="50"
            placeholder="Type something to speak..."
            value={text}
            onChange={handleChange}
          />
          <button onClick={speak}>Speak</button>
        </div>
        */}
        <TalkToAI />
    </>
  );
}

export default App;
