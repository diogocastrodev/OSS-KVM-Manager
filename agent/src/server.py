from fastapi import FastAPI
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Request
from src.libs.virt.connection import get_connection_read_only
from src.routes import routes
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def check(request: Request, call_next):
    response = await call_next(request)
    
    return response

app.include_router(prefix="/api", router=routes.api_router)

def run():
    conn = get_connection_read_only()
    if (conn is None):
        raise Exception("Failed to establish read-only connection to libvirt"
                        " - is libvirtd running?")
    conn.close()
    uvicorn.run(app, host=os.getenv("HOST", "127.0.0.1"), port=int(os.getenv("PORT", 20256)))

if __name__ == "__main__":
    run()