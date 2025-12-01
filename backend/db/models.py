from sqlalchemy import Column,Integer,Text,String,ForeignKey,DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base
import uuid

class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer,primary_key=True,index=True)

    session_id = Column(
        UUID(as_uuid=True),
        index=True,
        nullable=False,
    )
    role = Column(String,nullable=False)
    content = Column(Text,nullable=False)
    created_at = Column(DateTime,default=datetime.utcnow,nullable=False)
    last_activity = Column(DateTime, default=datetime.utcnow)

from sqlalchemy import (
    Column, String, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    name = Column(String, nullable=True)

    provider = Column(String, nullable=True)    
    provider_id = Column(String, nullable=True)  

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_login = Column(DateTime, nullable=True)

    sessions = relationship("ChatSession", back_populates="user")
    refresh_tokens = relationship("RefreshToken", back_populates="user")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))

    token_hash = Column(Text, nullable=False)
    issued_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False, nullable=False)

    client_ip = Column(Text, nullable=True)
    user_agent = Column(Text, nullable=True)

    user = relationship("User", back_populates="refresh_tokens")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    session_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    
    title = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_activity = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="sessions")
