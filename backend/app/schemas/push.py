from pydantic import BaseModel
from typing import Optional


class PushSubscriptionKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscriptionCreate(BaseModel):
    endpoint: str
    keys: PushSubscriptionKeys
    user_agent: Optional[str] = None


class PushUnsubscribeRequest(BaseModel):
    endpoint: str


class PushPublicKeyResponse(BaseModel):
    public_key: str


class PushTestResponse(BaseModel):
    success: bool
    sent: int
