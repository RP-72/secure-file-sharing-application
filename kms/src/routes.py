from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
import base64
import os
from typing import Optional
from pydantic import BaseModel
from .database import get_db
from .models import KeyEntry
from .crypto import encrypt_key, decrypt_key

router = APIRouter()

# Add Pydantic model for the request
class KeyRequest(BaseModel):
    encryption_key: str

class KeyCopyRequest(BaseModel):
    copy_from_file_id: str
    copy_to_file_id: str

@router.post("/keys/{file_id}")
async def store_key(
    file_id: str,
    key_request: KeyRequest,
    db: Session = Depends(get_db),
    authorization: str = Header(None)
):
    """Store an encryption key for a file"""
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization token provided")
    
    # Extract token from Bearer header
    try:
        token = authorization.split("Bearer ")[1]
    except IndexError:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    try:
        # Decode the base64 key
        key_bytes = base64.b64decode(key_request.encryption_key)
        
        # Encrypt the encryption key before storing
        encrypted_key, nonce = encrypt_key(key_bytes)
        
        # Combine nonce and encrypted key for storage
        stored_data = nonce + encrypted_key
        
        key_entry = KeyEntry(
            file_id=file_id,
            encryption_key=stored_data
        )
        
        db.add(key_entry)
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to store key")

@router.get("/keys/{file_id}")
async def get_key(
    file_id: str, 
    db: Session = Depends(get_db),
    authorization: str = Header(None)
):
    """Retrieve an encryption key for a file"""
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization token provided")
    
    # Extract token from Bearer header
    try:
        token = authorization.split("Bearer ")[1]
    except IndexError:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    # TODO: Implement proper auth verification
    # if not verify_auth(token, file_id):
    #     raise HTTPException(status_code=403, detail="Unauthorized")
    
    key_entry = db.query(KeyEntry).filter(KeyEntry.file_id == file_id).first()
    if not key_entry:
        raise HTTPException(status_code=404, detail="Key not found")
    
    try:
        # Extract nonce and encrypted key from stored data
        stored_data = key_entry.encryption_key
        nonce = stored_data[:12]
        encrypted_key = stored_data[12:]
        
        decrypted_key = decrypt_key(encrypted_key, nonce)
        return {"encryption_key": base64.b64encode(decrypted_key).decode()}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to decrypt key")

@router.post("/copy")
async def copy_key(
    key_copy: KeyCopyRequest,
    db: Session = Depends(get_db),
    authorization: str = Header(None)
):
    """Copy an encryption key from one file to another"""
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization token provided")
    
    # Extract token from Bearer header
    try:
        token = authorization.split("Bearer ")[1]
    except IndexError:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    # Get the source key entry
    source_key = db.query(KeyEntry).filter(KeyEntry.file_id == key_copy.copy_from_file_id).first()
    if not source_key:
        raise HTTPException(status_code=404, detail="Source key not found")
    
    try:
        # Create new key entry with the same encryption key
        new_key_entry = KeyEntry(
            file_id=key_copy.copy_to_file_id,
            encryption_key=source_key.encryption_key
        )
        
        db.add(new_key_entry)
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to copy key")

def verify_auth(auth_token: str, file_id: str) -> bool:
    """Verify the authentication token and user's permission to access the file"""
    # TODO: Implement authentication verification
    pass 