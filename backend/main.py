from fastapi import FastAPI, UploadFile,Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse,JSONResponse
from transformers import pipeline
from pydub import AudioSegment
import os, requests, uuid
from dotenv import load_dotenv
import whisper
import json
import base64
from pydantic import BaseModel
import httpx
import os

# Load environment variables
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = "21m00Tcm4TlvDq8ikWAM"

asr_model = whisper.load_model("small")
# class Message(BaseModel):
#     message: str

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
    audio_path = f"temp_{uuid.uuid4()}.mp3"
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

    output_path = f"reply_{uuid.uuid4()}.mp3"
    with open(output_path, "wb") as f:
        f.write(tts_resp.content)

    return {
        "reply_text": text,
        "audio_url": f"/audio/{output_path}"
    }

@app.post("/speak2")
async def speak2(request: Request):
    data = await request.json()
    text = data["text"]

    # audio_path = f"temp_{uuid.uuid4()}.mp3"
    # with open(audio_path, "wb") as f:
    #     f.write(await audio.read())
        
    # result = asr_model.transcribe(audio_path, beam_size=5)
    # text = result["text"].strip()

    # sp = "hi pramod how are you, How I can help you"
    # text = sp.strip()

    #audio_path, visemes = generate_tts_with_visemes(text)
    #print("🗣️ ElevenLabs Audio Path:", audio_path, visemes)
    return JSONResponse({"audio_path": '', "visemes": [], "reply_text" : text})

@app.post("/speak/")
async def speak(audio: UploadFile):
    try:
        audio_path = f"temp_{uuid.uuid4()}.mp3"
        with open(audio_path, "wb") as f:
            f.write(await audio.read())
        result = asr_model.transcribe(audio_path, beam_size=5)
        text = result["text"].strip()
        reply = await chatbot(text)
        print("Received text:", reply)
        audio_path, visemes = generate_tts_with_visemes(reply)
        # Replace this with actual TTS logic
        return JSONResponse({
            "audio_path": audio_path, 
            "visemes": generate_visemes(reply), 
            "reply_text": reply
        })

    except Exception as e:
        print("Error parsing JSON:", e)
        return JSONResponse({"error": "Invalid JSON or request format"}, status_code=400)

@app.post("/talk-to-ai")
async def talkToAi(request: Request):
    data = await request.json()
    text = data["question"]
    reply = await chatbot(text)
    return JSONResponse({"response" : reply})

def generate_tts_with_visemes(text):
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}/stream"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Accept": "text/event-stream",
        "Content-Type": "application/json"
    }

    payload = {
        "text": text,
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        },
        "optimize_streaming_latency": 1,
        "output_format": "mp3_44100_128",
        "with_viseme": True
    }

    try:
        response = requests.post(url, json=payload, headers=headers, stream=True)
        response.raise_for_status()  # Raise HTTPError for bad status codes
    except requests.exceptions.RequestException as e:
        print(f"Error during API request: {e}")
        return None, []

    audio_filename = f"audio_{uuid.uuid4()}.mp3"
    audio_path = f"{audio_filename}"
    visemes = []
    
    try:
        for chunk in response.iter_content(chunk_size=1024):
            if b"viseme" in chunk:
                try:
                    part = chunk.decode("utf-8").strip()
                    if part.startswith("data:"):
                        json_part = part[5:]
                        viseme_data = json.loads(json_part)
                        visemes.append(viseme_data)
                except (UnicodeDecodeError, json.JSONDecodeError) as e:
                    print(f"Error decoding viseme data: {e}")
                    continue
            else:
                try:
                    with open(audio_path, "ab") as f:
                        f.write(chunk)
                except IOError as e:
                    print(f"Error writing audio file: {e}")
                    return None, visemes
    except Exception as e:
        print(f"i am here Unexpected error during response streaming: {e}")
        return f"Unexpected error during response streaming: {e}", visemes

    full_audio_url = 'http://127.0.0.1:8000/audio/' + audio_filename.lstrip("/")
    return full_audio_url, visemes


def generate_tts_with_visemes2(text):
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}/stream"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Accept": "text/event-stream",
        "Content-Type": "application/json"
    }

    payload = {
        "text": text,
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        },
        "optimize_streaming_latency": 1,
        "output_format": "mp3_44100_128",
        "with_viseme": True
    }

    try:
        response = requests.post(url, json=payload, headers=headers, stream=True)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Error during API request: {e}")
        return None, []

    audio_filename = f"audio_{uuid.uuid4()}.mp3"
    audio_path = f"{audio_filename}"
    visemes = []

    # We'll collect binary audio here
    audio_data = bytearray()

    buffer = ""
    for chunk in response.iter_lines(decode_unicode=True):
        if chunk:
            buffer += chunk + "\n"
            if chunk.strip() == "":
                # End of an event
                if "event: audio" in buffer:
                    # Extract data line
                    lines = buffer.strip().split("\n")
                    for line in lines:
                        if line.startswith("data:"):
                            b64data = line[5:].strip()
                            decoded_audio = base64.b64decode(b64data)
                            audio_data.extend(decoded_audio)

                elif "event: viseme" in buffer:
                    lines = buffer.strip().split("\n")
                    for line in lines:
                        if line.startswith("data:"):
                            json_part = line[5:].strip()
                            viseme_data = json.loads(json_part)
                            visemes.append(viseme_data)
                buffer = ""

    # Save audio file
    try:
        with open(audio_path, "wb") as f:
            f.write(audio_data)
    except IOError as e:
        print(f"Error writing audio file: {e}")
        return None, visemes

    full_audio_url = 'http://127.0.0.1:8000/audio/' + audio_filename.lstrip("/")
    return full_audio_url, visemes


def generate_visemes(text):
    """Generate approximate visemes based on text letters (toy example)"""
    char_to_viseme = {
        'a': 'AA', 'e': 'EH', 'i': 'IH', 'o': 'AO', 'u': 'UW',
        'b': 'B', 'p': 'P', 'm': 'M', 'f': 'F', 'v': 'V',
        't': 'T', 'd': 'D', 'n': 'N', 'l': 'L', 'r': 'R',
        's': 'S', 'z': 'Z', 'k': 'K', 'g': 'G', 'h': 'HH',
        'w': 'W', 'y': 'Y'
    }

    digraph_to_viseme = {
        'th': 'TH',
        'sh': 'SH',
        'ch': 'CH'
    }

    visemes = []
    i = 0
    time = 0.0
    text = text.lower()

    while i < len(text):
        if text[i] == ' ':
            time += 0.1
            i += 1
            continue

        # Check for digraph
        if i + 1 < len(text):
            pair = text[i:i+2]
            if pair in digraph_to_viseme:
                viseme = digraph_to_viseme[pair]
                visemes.append({"start": round(time, 2), "viseme": viseme})
                time += 0.15
                i += 2
                continue

        # Single character
        char = text[i]
        if char.isalpha():
            viseme = char_to_viseme.get(char, 'AA')
            visemes.append({"start": round(time, 2), "viseme": viseme})
            time += 0.15

        i += 1

    return visemes

async def chatbot(msg):
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    data = {
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": msg},
        ],
        "model": "llama-3.3-70b-versatile",
        "temperature": 0.7,
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=data
        )
        response.raise_for_status()
        result = response.json()
        print("🗣️ Groq Response:", result)
        return result["choices"][0]["message"]["content"]