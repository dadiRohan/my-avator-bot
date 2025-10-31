import os
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def synthesize(text: str, voice: str = "coral", instructions: str | None = None) -> Path:
    payload = {
        "model": "gpt-4o-mini-tts",
        "voice": voice,
        "input": text,
    }
    if instructions:
        payload["instructions"] = instructions

    speech = client.audio.speech.create(**payload)
    out_path = Path("output/speech.mp3")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(speech.read())
    return out_path
