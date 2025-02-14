import re
import os
from typing import Optional
import unicodedata
import bleach

def sanitize_filename(filename: str) -> str:
    """Sanitize a filename removing any unsafe characters."""
    # Get the name and extension separately
    name, ext = os.path.splitext(filename)
    
    # Remove or replace unsafe characters
    name = unicodedata.normalize('NFKD', name).encode('ASCII', 'ignore').decode()
    name = re.sub(r'[^\w\s-]', '', name).strip()
    name = re.sub(r'[-\s]+', '-', name)
    
    # Ensure extension is safe
    ext = ext.lower()
    safe_extensions = {'.txt', '.pdf', '.doc', '.docx', '.xls', '.xlsx', 
                      '.png', '.jpg', '.jpeg', '.gif', '.mp3', '.mp4', '.zip'}
    
    if ext not in safe_extensions:
        ext = '.txt'  # Default to .txt if extension is not safe
    
    # Limit filename length
    if len(name) > 200:
        name = name[:200]
    
    return name + ext

def sanitize_email(email: str) -> Optional[str]:
    """Sanitize and validate email address."""
    email = email.strip().lower()
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not re.match(email_pattern, email):
        return None
        
    return email

def sanitize_html(content: str) -> str:
    """Sanitize HTML content."""
    allowed_tags = ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
    allowed_attrs = {}
    return bleach.clean(content, tags=allowed_tags, attributes=allowed_attrs)

def validate_file_size(size: int, max_size_mb: int = 10) -> bool:
    """Validate file size against maximum allowed size."""
    return size <= max_size_mb * 1024 * 1024

def validate_mime_type(mime_type: str) -> bool:
    """Validate mime type against allowed types."""
    allowed_mime_types = {
        'text/plain',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif',
        'audio/mpeg',
        'video/mp4',
        'application/zip'
    }
    return mime_type.lower() in allowed_mime_types 