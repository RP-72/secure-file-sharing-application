from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import router
from .database import get_db
from .models import Base
from sqlalchemy import create_engine
import os

app = FastAPI(title="Key Management Service")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://kms_user:kms_password@kms-db:5432/kms_db")
engine = create_engine(DATABASE_URL)
Base.metadata.create_all(bind=engine)

app.include_router(router)
