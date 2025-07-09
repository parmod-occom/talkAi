from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from transformers import pipeline
from pydub import AudioSegment
import os, requests, uuid
from dotenv import load_dotenv
import whisper

# Load environment variables
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

asr_model = whisper.load_model("small")

# FastAPI app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper: Convert MP3 to WAV
def convert_mp3_to_wav(mp3_path):
    wav_path = mp3_path.replace(".mp3", ".wav")
    sound = AudioSegment.from_mp3(mp3_path)
    sound.export(wav_path, format="wav")
    return wav_path

# Transcription using distil-whisper
def transcribe_audio(filepath):
    print(f"🎧 Converting and Transcribing: {filepath}")
    wav_path = convert_mp3_to_wav(filepath)
    result = transcriber(wav_path)
    print("📝 Transcribed text:", result["text"])
    return result["text"]

@app.post("/talk/")
async def talk(audio: UploadFile):
    audio_path = f"temp_{uuid.uuid4()}.mp3"
    with open(audio_path, "wb") as f:
        f.write(await audio.read())

    # Step 1: Transcribe
    user_text = transcribe_audio(audio_path)
    print("🗣️ Transcription:", user_text)

    # Step 2: Ask GROQ
    groq_response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "mixtral-8x7b-32768",
            "messages": [{"role": "user", "content": user_text}]
        }
    )

    print("🤖 GROQ Status:", groq_response.status_code)
    if groq_response.status_code != 200:
        return {"error": "Groq API failed", "detail": groq_response.text}

    reply = groq_response.json()["choices"][0]["message"]["content"]

    # Step 3: TTS with ElevenLabs
    tts_resp = requests.post(
        "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL",
        headers={
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json"
        },
        json={
            "text": reply,
            "voice_settings": {
                "stability": 0.75,
                "similarity_boost": 0.75
            }
        }
    )

    print("🗣️ ElevenLabs Status:", tts_resp.status_code)
    if tts_resp.status_code != 200:
        return {"error": "TTS failed", "detail": tts_resp.text}

    output_path = f"reply_{uuid.uuid4()}.mp3"
    with open(output_path, "wb") as f:
        f.write(tts_resp.content)

    return {
        "reply_text": reply,
        "audio_url": f"/audio/{output_path}"
    }

@app.get("/audio/{filename}")
def get_audio(filename: str):
    return FileResponse(filename, media_type="audio/mpeg")

@app.post("/test2/")
async def test2(audio: UploadFile):
    audio_path = f"temp/temp_{uuid.uuid4()}.mp3"
    with open(audio_path, "wb") as f:
        f.write(await audio.read())
        
    result = asr_model.transcribe(audio_path, beam_size=5)
    text = result["text"].strip()
    
    # Step 3: TTS with ElevenLabs
    tts_resp = requests.post(
        "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL",
        headers={
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json"
        },
        json={
            "text": text,
            "voice_settings": {
                "stability": 0.75,
                "similarity_boost": 0.75
            }
        }
    )

    print("🗣️ ElevenLabs Status:", tts_resp.status_code)

    if tts_resp.status_code != 200:
        return {"error": "TTS failed", "detail": tts_resp.text}

    output_path = f"temp/reply_{uuid.uuid4()}.mp3"
    with open(output_path, "wb") as f:
        f.write(tts_resp.content)

    return {
        "reply_text": text,
        "audio_url": f"/audio/{output_path}"
    }
