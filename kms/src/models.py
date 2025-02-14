from sqlalchemy import Column, String, LargeBinary, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class KeyEntry(Base):
    __tablename__ = "encryption_keys"

    file_id = Column(String, primary_key=True)
    # This will store both the nonce and encrypted key
    encryption_key = Column(LargeBinary, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_accessed = Column(DateTime, default=datetime.utcnow)