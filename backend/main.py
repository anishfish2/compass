
from typing import Union
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import OpenAI, OpenAIError, AuthenticationError, RateLimitError
from dotenv import load_dotenv


load_dotenv()

client = OpenAI()


app = FastAPI()

class PromptRequest(BaseModel):
    prompt: str
    max_tokens: int = 150
    temperature: float = 0.7

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.post("/openai")
def call_openai(request: PromptRequest):
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": request.prompt}
            ],
            max_tokens=request.max_tokens,
            temperature=request.temperature
        )

        return {
            "prompt": request.prompt,
            "response": response.choices[0].message.content.strip(),
            "model": response.model
        }

    except AuthenticationError:
        raise HTTPException(status_code=401, detail="Invalid OpenAI API key")
    except RateLimitError:
        raise HTTPException(status_code=429, detail="OpenAI rate limit exceeded")
    except OpenAIError as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
