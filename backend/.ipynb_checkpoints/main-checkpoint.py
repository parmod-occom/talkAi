from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os, requests, uuid
from dotenv import load_dotenv

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Transcribe audio using Whisper API (OpenAI) or other — placeholder
def transcribe_audio(filepath):
    whisper_url = "https://api.openai.com/v1/audio/transcriptions"
    headers = {
        "Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}"
    }
    with open(filepath, "rb") as f:
        files = {"file": f, "model": (None, "whisper-1")}
        response = requests.post(whisper_url, headers=headers, files=files)
        print("Whisper API Status:", response)
        return response.json()["text"]

@app.post("/talk/")
async def talk(audio: UploadFile):
    #try:
    audio_path = f"temp_{uuid.uuid4()}.mp3"
    with open(audio_path, "wb") as f:
        f.write(await audio.read())

    # Step 1: Transcribe (Whisper API)
    user_text = transcribe_audio(audio_path)
    print("🗣️ Transcription:", user_text)

    # Step 2: Chat with GROQ
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
    print("🤖 GROQ Raw Response:", groq_response.status_code, groq_response.text)

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

    # except Exception as e:
    #     print("❌ Unexpected Error:", e)
    #     return {"error": "Internal Server Error", "detail": str(e)}


@app.get("/audio/{filename}")
def get_audio(filename: str):
    return FileResponse(filename, media_type="audio/mpeg")
