from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.middleware.tenant import get_current_org_id, get_current_user_id
from app.models.push_subscription import PushSubscription
from app.schemas.push import (
    PushSubscriptionCreate,
    PushUnsubscribeRequest,
    PushPublicKeyResponse,
    PushTestResponse,
)
from app.core.config import settings
from app.services.push_service import send_push_to_subscriptions

router = APIRouter(prefix="/push", tags=["push"])


@router.get("/public-key", response_model=PushPublicKeyResponse)
def get_public_key():
    if not settings.VAPID_PUBLIC_KEY:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="VAPID public key not configured",
        )
    return {"public_key": settings.VAPID_PUBLIC_KEY}


@router.post("/subscribe", response_model=dict)
def subscribe(
    payload: PushSubscriptionCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    org_id = get_current_org_id(request)
    user_id = get_current_user_id(request)

    existing = db.query(PushSubscription).filter(
        PushSubscription.org_id == org_id,
        PushSubscription.user_id == user_id,
        PushSubscription.endpoint == payload.endpoint,
    ).first()

    if existing:
        existing.p256dh = payload.keys.p256dh
        existing.auth = payload.keys.auth
        existing.user_agent = payload.user_agent
        existing.is_active = True
        existing.last_seen_at = datetime.utcnow()
        db.commit()
        return {"success": True, "id": existing.id}

    sub = PushSubscription(
        org_id=org_id,
        user_id=user_id,
        endpoint=payload.endpoint,
        p256dh=payload.keys.p256dh,
        auth=payload.keys.auth,
        user_agent=payload.user_agent,
        is_active=True,
        last_seen_at=datetime.utcnow(),
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return {"success": True, "id": sub.id}


@router.post("/unsubscribe", response_model=dict)
def unsubscribe(
    payload: PushUnsubscribeRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    org_id = get_current_org_id(request)
    user_id = get_current_user_id(request)

    sub = db.query(PushSubscription).filter(
        PushSubscription.org_id == org_id,
        PushSubscription.user_id == user_id,
        PushSubscription.endpoint == payload.endpoint,
    ).first()

    if not sub:
        return {"success": True}

    sub.is_active = False
    db.commit()
    return {"success": True}


@router.post("/test", response_model=PushTestResponse)
def test_push(
    request: Request,
    db: Session = Depends(get_db),
):
    org_id = get_current_org_id(request)
    user_id = get_current_user_id(request)

    subs = db.query(PushSubscription).filter(
        PushSubscription.org_id == org_id,
        PushSubscription.user_id == user_id,
        PushSubscription.is_active == True,
    ).all()

    sent = send_push_to_subscriptions(
        db,
        subs,
        {
            "title": "TruckFlow",
            "body": "בדיקת פוש",
            "tag": "test",
            "url": "/mobile/alerts",
        },
    )

    return {"success": True, "sent": sent}
