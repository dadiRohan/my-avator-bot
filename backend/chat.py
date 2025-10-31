import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_reply(user_msg: str, system_prompt: str = "You are a friendly AI avatar.") -> str:
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_msg}
        ],
        temperature=0.7,
        max_tokens=500,
    )
    return resp.choices[0].message.content
