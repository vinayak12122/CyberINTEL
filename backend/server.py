from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.chat.chat_routes import router as chat_router
from api.chat.guest_routes import router as guest_chat_router
from api.auth.auth_routes import router as auth_router
import uvicorn

app = FastAPI(title="CyberINTEL", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(guest_chat_router, prefix="/guest",tags=["guest"])

app.include_router(chat_router, prefix="/auth/chat", tags=["chat"])
app.include_router(auth_router,prefix="/auth",tags=["auth"])

@app.get("/")
async def root():
    return {"message": "TREZIKON API Running"}

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=2007, reload=True)
