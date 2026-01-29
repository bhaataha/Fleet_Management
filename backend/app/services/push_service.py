"""Web Push notification service."""
from typing import List, Dict
import json
from datetime import datetime
from pywebpush import webpush, WebPushException
from sqlalchemy.orm import Session
from app.models.push_subscription import PushSubscription
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


def _build_payload(data: Dict) -> str:
    payload = {
        "title": data.get("title", "TruckFlow"),
        "body": data.get("body", "התראה חדשה"),
        "icon": data.get("icon", "/icon-192.svg"),
        "tag": data.get("tag", "alert"),
        "url": data.get("url", "/mobile/alerts"),
    }
    return json.dumps(payload, ensure_ascii=False)


def send_push_to_subscriptions(
    db: Session,
    subscriptions: List[PushSubscription],
    payload: Dict,
) -> int:
    if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PUBLIC_KEY:
        logger.warning("VAPID keys missing; push not sent.")
        return 0

    sent = 0
    data = _build_payload(payload)

    for sub in subscriptions:
        if not sub.is_active:
            continue
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=data,
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={
                    "sub": settings.VAPID_SUBJECT or "mailto:support@truckflow.site"
                },
            )
            sub.last_seen_at = datetime.utcnow()
            sent += 1
        except WebPushException as exc:
            logger.warning("Push failed for subscription %s: %s", sub.id, exc)
            status_code = getattr(getattr(exc, "response", None), "status_code", None)
            if status_code in (404, 410):
                sub.is_active = False
        except Exception as exc:
            logger.error("Unexpected push error for subscription %s: %s", sub.id, exc)
    db.commit()
    return sent
