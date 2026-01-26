"""Common response schemas"""

from pydantic import BaseModel
from typing import Optional


class Message(BaseModel):
    """Generic message response"""
    message: str
    detail: Optional[str] = None


class ErrorResponse(BaseModel):
    """Error response"""
    error: str
    detail: Optional[str] = None
    status_code: int


class SuccessResponse(BaseModel):
    """Success response"""
    success: bool
    message: str
    data: Optional[dict] = None
