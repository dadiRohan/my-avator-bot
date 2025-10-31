# backend/server.py
import json
import pathlib
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles

from chat import get_reply          # your ChatGPT wrapper
from tts import synthesize          # your OpenAI TTS wrapper


app = FastAPI()
# The generated MP3 files are served from the "output" folder.
app.mount("/files", StaticFiles(directory="output"), name="files")


# ----------------------------------------------------------------------
# Optional helper – keep it commented out if you never want Rhubarb again.
# ----------------------------------------------------------------------
# def _get_visemes(audio_path: pathlib.Path) -> list[dict]:
#     """
#     Try to run Rhubarb and return the list of mouth cues.
#     If Rhubarb is not installed or fails, an empty list is returned.
#     """
#     try:
#         json_path = audio_path.with_suffix(".json")
#         # The subprocess will raise FileNotFoundError if rhubarb.exe is missing.
#         subprocess.run(
#             ["rhubarb", "-f", "json", "-o", str(json_path), str(audio_path)],
#             check=True,
#             stdout=subprocess.DEVNULL,
#             stderr=subprocess.DEVNULL,
#         )
#         with open(json_path, "r", encoding="utf-8") as f:
#             return json.load(f).get("mouthCues", [])
#     except Exception as exc:   # catches FileNotFoundError, CalledProcessError, etc.
#         print(f"⚠️ Rhubarb not usable – falling back to empty visemes ({exc})")
#         return []


# ----------------------------------------------------------------------
# WebSocket endpoint – **no Rhubarb** (visemes are always an empty list)
# ----------------------------------------------------------------------
@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            # 1️⃣ receive the user’s question
            txt = await ws.receive_text()
            print(f"🔧 Received from client: {txt!r}")

            # 2️⃣ generate the ChatGPT answer
            answer = get_reply(txt)

            # 3️⃣ generate speech (MP3) with OpenAI TTS
            audio_path = synthesize(answer, voice="coral")   # saves to output/

            # 4️⃣ **Visemes** – we simply send an empty list
            # visemes = _get_visemes(audio_path)   # <‑‑ uncomment if you install Rhubarb later
            visemes: list[dict] = []   # <-- static empty list

            # 5️⃣ send the payload back to the front‑end
            await ws.send_json(
                {
                    "text": answer,
                    "audioUrl": f"/files/{audio_path.name}",
                    "visemes": visemes,
                }
            )
    except WebSocketDisconnect:
        print("🔌 Client disconnected")
    except Exception as exc:
        # Any unexpected error – log it and close the socket cleanly
        print(f"❌ WS handler error → {type(exc).__name__}: {exc}")
        # send a tiny error object to the client (optional)
        try:
            await ws.send_json({"error": str(exc)})
        finally:
            await ws.close()


# ----------------------------------------------------------------------
# Simple health check
# ----------------------------------------------------------------------
@app.get("/")
async def root():
    return {"status": "avatarbot running"}
