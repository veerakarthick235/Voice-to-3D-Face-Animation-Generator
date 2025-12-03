from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Optional
import uuid
from datetime import datetime, timezone
import base64
import numpy as np

from phoneme_mapper import PhonemeMapper
from audio_processor import AudioProcessor


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Initialize audio processing modules
phoneme_mapper = PhonemeMapper()
audio_processor = AudioProcessor(sample_rate=16000)


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


class TextToAnimationRequest(BaseModel):
    text: str
    fps: int = 30


class AudioToAnimationRequest(BaseModel):
    audio_data: str  # Base64 encoded audio
    sample_rate: int = 16000
    fps: int = 30


class AnimationResponse(BaseModel):
    frames: List[Dict]
    duration: float
    fps: int
    total_frames: int


class AnimationSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    input_type: str  # 'text' or 'audio'
    input_data: str
    frames: List[Dict]
    duration: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Routes
@api_router.get("/")
async def root():
    return {"message": "Voice-to-3D Facial Animation API"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks


@api_router.post("/animate/text", response_model=AnimationResponse)
async def animate_from_text(request: TextToAnimationRequest):
    """Generate facial animation from text input"""
    try:
        # Generate animation sequence
        frames = phoneme_mapper.generate_animation_sequence(request.text, fps=request.fps)
        
        if not frames:
            raise HTTPException(status_code=400, detail="Could not generate animation from text")
        
        duration = frames[-1]['time'] if frames else 0.0
        
        # Store session in database
        session = AnimationSession(
            input_type='text',
            input_data=request.text,
            frames=frames,
            duration=duration
        )
        
        session_doc = session.model_dump()
        session_doc['created_at'] = session_doc['created_at'].isoformat()
        await db.animation_sessions.insert_one(session_doc)
        
        return AnimationResponse(
            frames=frames,
            duration=duration,
            fps=request.fps,
            total_frames=len(frames)
        )
    
    except Exception as e:
        logging.error(f"Error generating animation from text: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/animate/audio", response_model=AnimationResponse)
async def animate_from_audio(request: AudioToAnimationRequest):
    """Generate facial animation from audio input"""
    try:
        # Decode audio data
        audio_data = audio_processor.decode_audio_base64(request.audio_data)
        
        if len(audio_data) == 0:
            raise HTTPException(status_code=400, detail="Empty audio data")
        
        # Normalize audio
        audio_data = audio_processor.normalize_audio(audio_data)
        
        # Analyze audio and generate animation frames
        frames = phoneme_mapper.analyze_audio_features(audio_data, request.sample_rate)
        
        if not frames:
            raise HTTPException(status_code=400, detail="Could not generate animation from audio")
        
        duration = frames[-1]['time'] if frames else 0.0
        
        # Store session in database (without full audio data to save space)
        session = AnimationSession(
            input_type='audio',
            input_data=f"Audio: {len(audio_data)} samples @ {request.sample_rate}Hz",
            frames=frames,
            duration=duration
        )
        
        session_doc = session.model_dump()
        session_doc['created_at'] = session_doc['created_at'].isoformat()
        await db.animation_sessions.insert_one(session_doc)
        
        return AnimationResponse(
            frames=frames,
            duration=duration,
            fps=request.fps,
            total_frames=len(frames)
        )
    
    except Exception as e:
        logging.error(f"Error generating animation from audio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/sessions")
async def get_animation_sessions(limit: int = 10):
    """Get recent animation sessions"""
    sessions = await db.animation_sessions.find(
        {}, 
        {"_id": 0, "frames": 0}  # Exclude frames for performance
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    for session in sessions:
        if isinstance(session.get('created_at'), str):
            session['created_at'] = datetime.fromisoformat(session['created_at'])
    
    return sessions


@api_router.get("/visemes")
async def get_viseme_map():
    """Get the phoneme to viseme mapping"""
    return {"viseme_map": phoneme_mapper.viseme_map}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
