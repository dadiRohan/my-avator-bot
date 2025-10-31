import websocket, json, threading, time

def on_message(ws, message):
    print("\n🔁 SERVER replied:")
    try:
        payload = json.loads(message)
        print(json.dumps(payload, indent=2))
    except Exception as e:
        print("⚠️ Not JSON:", message)

def on_error(ws, error):
    print("❌ WS error:", error)

def on_close(ws, *args):
    print("⚪ WS closed")

def on_open(ws):
    print("✅ WS opened – type a line and press Enter")
    # read from stdin in a background thread so we don’t block the ws loop
    def run():
        while True:
            try:
                txt = input()
                if txt.lower() in ("exit", "quit"):
                    ws.close()
                    break
                ws.send(txt)
            except EOFError:
                break
    threading.Thread(target=run, daemon=True).start()

ws = websocket.WebSocketApp(
    "ws://127.0.0.1:8000/ws",
    on_open=on_open,
    on_message=on_message,
    on_error=on_error,
    on_close=on_close,
)
ws.run_forever()
