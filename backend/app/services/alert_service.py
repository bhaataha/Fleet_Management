"""
Alert Service - Business logic for creating and managing alerts
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional, List
from datetime import datetime, timedelta
from uuid import UUID

from app.models.alert import Alert, AlertType, AlertSeverity, AlertCategory, AlertStatus
from app.schemas.alert import AlertCreate, AlertUpdate
import logging

logger = logging.getLogger(__name__)


class AlertService:
    """Service for managing alerts"""
    
    @staticmethod
    def create_alert(
        db: Session,
        alert_data: AlertCreate
    ) -> Alert:
        """
        Create new alert
        
        Args:
            db: Database session
            alert_data: Alert creation data
            
        Returns:
            Created alert
        """
        alert = Alert(
            org_id=alert_data.org_id,
            alert_type=alert_data.alert_type,
            severity=alert_data.severity,
            category=alert_data.category,
            title=alert_data.title,
            message=alert_data.message,
            action_url=alert_data.action_url,
            entity_type=alert_data.entity_type,
            entity_id=alert_data.entity_id,
            created_for_user_id=alert_data.created_for_user_id,
            created_for_role=alert_data.created_for_role,
            expires_at=alert_data.expires_at,
            alert_metadata=alert_data.alert_metadata or {},
            status=AlertStatus.UNREAD.value
        )
        
        db.add(alert)
        db.commit()
        db.refresh(alert)
        
        logger.info(f"Created alert {alert.id}: {alert.alert_type} for org {alert.org_id}")
        
        return alert
    
    @staticmethod
    def get_alerts(
        db: Session,
        org_id: UUID,
        user_id: Optional[int] = None,
        user_role: Optional[str] = None,
        status: Optional[AlertStatus] = None,
        category: Optional[AlertCategory] = None,
        severity: Optional[AlertSeverity] = None,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[Alert], int]:
        """
        Get alerts for organization with filters
        
        Args:
            db: Database session
            org_id: Organization ID
            user_id: Filter by user ID
            user_role: User role for role-based alerts
            status: Filter by status
            category: Filter by category
            severity: Filter by severity
            skip: Pagination offset
            limit: Pagination limit
            
        Returns:
            Tuple of (alerts list, total count)
        """
        query = db.query(Alert).filter(Alert.org_id == org_id)
        
        # User-specific or role-based alerts
        if user_id or user_role:
            user_filter = []
            if user_id:
                user_filter.append(Alert.created_for_user_id == user_id)
            if user_role:
                user_filter.append(Alert.created_for_role == user_role)
            # Also include alerts for "all" (null user_id and null role)
            user_filter.append(
                and_(
                    Alert.created_for_user_id.is_(None),
                    Alert.created_for_role.is_(None)
                )
            )
            query = query.filter(or_(*user_filter))
        
        # Status filter
        if status:
            query = query.filter(Alert.status == status.value)
        
        # Category filter
        if category:
            query = query.filter(Alert.category == category.value)
        
        # Severity filter
        if severity:
            query = query.filter(Alert.severity == severity.value)
        
        # Only active alerts (not expired)
        query = query.filter(
            or_(
                Alert.expires_at.is_(None),
                Alert.expires_at > datetime.utcnow()
            )
        )
        
        # Count total before pagination
        total = query.count()
        
        # Apply pagination and ordering
        alerts = query.order_by(Alert.created_at.desc()).offset(skip).limit(limit).all()
        
        return alerts, total
    
    @staticmethod
    def get_alert_by_id(
        db: Session,
        alert_id: int,
        org_id: UUID
    ) -> Optional[Alert]:
        """
        Get alert by ID (with org_id check)
        
        Args:
            db: Database session
            alert_id: Alert ID
            org_id: Organization ID
            
        Returns:
            Alert or None
        """
        return db.query(Alert).filter(
            Alert.id == alert_id,
            Alert.org_id == org_id
        ).first()
    
    @staticmethod
    def mark_as_read(
        db: Session,
        alert_id: int,
        org_id: UUID
    ) -> Optional[Alert]:
        """
        Mark alert as read
        
        Args:
            db: Database session
            alert_id: Alert ID
            org_id: Organization ID
            
        Returns:
            Updated alert or None
        """
        alert = AlertService.get_alert_by_id(db, alert_id, org_id)
        
        if not alert:
            return None
        
        if alert.status == AlertStatus.UNREAD.value:
            alert.status = AlertStatus.READ.value
            alert.read_at = datetime.utcnow()
            db.commit()
            db.refresh(alert)
            
            logger.info(f"Marked alert {alert_id} as read")
        
        return alert
    
    @staticmethod
    def dismiss_alert(
        db: Session,
        alert_id: int,
        org_id: UUID
    ) -> Optional[Alert]:
        """
        Dismiss alert
        
        Args:
            db: Database session
            alert_id: Alert ID
            org_id: Organization ID
            
        Returns:
            Updated alert or None
        """
        alert = AlertService.get_alert_by_id(db, alert_id, org_id)
        
        if not alert:
            return None
        
        alert.status = AlertStatus.DISMISSED.value
        alert.dismissed_at = datetime.utcnow()
        db.commit()
        db.refresh(alert)
        
        logger.info(f"Dismissed alert {alert_id}")
        
        return alert
    
    @staticmethod
    def resolve_alert(
        db: Session,
        alert_id: int,
        org_id: UUID,
        resolved_by: int
    ) -> Optional[Alert]:
        """
        Resolve alert
        
        Args:
            db: Database session
            alert_id: Alert ID
            org_id: Organization ID
            resolved_by: User ID who resolved
            
        Returns:
            Updated alert or None
        """
        alert = AlertService.get_alert_by_id(db, alert_id, org_id)
        
        if not alert:
            return None
        
        alert.status = AlertStatus.RESOLVED.value
        alert.resolved_at = datetime.utcnow()
        alert.resolved_by = resolved_by
        db.commit()
        db.refresh(alert)
        
        logger.info(f"Resolved alert {alert_id} by user {resolved_by}")
        
        return alert
    
    @staticmethod
    def get_unread_count(
        db: Session,
        org_id: UUID,
        user_id: Optional[int] = None,
        user_role: Optional[str] = None
    ) -> int:
        """
        Get count of unread alerts
        
        Args:
            db: Database session
            org_id: Organization ID
            user_id: Filter by user ID
            user_role: User role for role-based alerts
            
        Returns:
            Count of unread alerts
        """
        query = db.query(Alert).filter(
            Alert.org_id == org_id,
            Alert.status == AlertStatus.UNREAD.value
        )
        
        # User-specific or role-based alerts
        if user_id or user_role:
            user_filter = []
            if user_id:
                user_filter.append(Alert.created_for_user_id == user_id)
            if user_role:
                user_filter.append(Alert.created_for_role == user_role)
            # Also include alerts for "all"
            user_filter.append(
                and_(
                    Alert.created_for_user_id.is_(None),
                    Alert.created_for_role.is_(None)
                )
            )
            query = query.filter(or_(*user_filter))
        
        # Only active alerts (not expired)
        query = query.filter(
            or_(
                Alert.expires_at.is_(None),
                Alert.expires_at > datetime.utcnow()
            )
        )
        
        return query.count()
    
    @staticmethod
    def get_alert_stats(
        db: Session,
        org_id: UUID,
        user_id: Optional[int] = None,
        user_role: Optional[str] = None
    ) -> dict:
        """
        Get alert statistics
        
        Args:
            db: Database session
            org_id: Organization ID
            user_id: Filter by user ID
            user_role: User role
            
        Returns:
            Statistics dictionary
        """
        query = db.query(Alert).filter(Alert.org_id == org_id)
        
        # User-specific or role-based alerts
        if user_id or user_role:
            user_filter = []
            if user_id:
                user_filter.append(Alert.created_for_user_id == user_id)
            if user_role:
                user_filter.append(Alert.created_for_role == user_role)
            user_filter.append(
                and_(
                    Alert.created_for_user_id.is_(None),
                    Alert.created_for_role.is_(None)
                )
            )
            query = query.filter(or_(*user_filter))
        
        # Only active alerts
        query = query.filter(
            or_(
                Alert.expires_at.is_(None),
                Alert.expires_at > datetime.utcnow()
            )
        )
        
        all_alerts = query.all()
        
        total = len(all_alerts)
        unread = sum(1 for a in all_alerts if a.status == AlertStatus.UNREAD.value)
        
        by_severity = {}
        by_category = {}
        
        for alert in all_alerts:
            by_severity[alert.severity] = by_severity.get(alert.severity, 0) + 1
            by_category[alert.category] = by_category.get(alert.category, 0) + 1
        
        return {
            "total": total,
            "unread": unread,
            "by_severity": by_severity,
            "by_category": by_category
        }
    
    @staticmethod
    def cleanup_expired_alerts(db: Session) -> int:
        """
        Delete expired alerts
        
        Args:
            db: Database session
            
        Returns:
            Number of deleted alerts
        """
        count = db.query(Alert).filter(
            Alert.expires_at.isnot(None),
            Alert.expires_at < datetime.utcnow()
        ).delete()
        
        db.commit()
        
        logger.info(f"Cleaned up {count} expired alerts")
        
        return count
    
    @staticmethod
    def auto_resolve_outdated_alerts(
        db: Session,
        org_id: UUID,
        alert_type: AlertType,
        entity_type: str,
        entity_id: int
    ) -> int:
        """
        Auto-resolve alerts that are no longer relevant
        
        Example: Job was assigned, so resolve JOB_NOT_ASSIGNED alert
        
        Args:
            db: Database session
            org_id: Organization ID
            alert_type: Type of alert to resolve
            entity_type: Entity type
            entity_id: Entity ID
            
        Returns:
            Number of resolved alerts
        """
        count = db.query(Alert).filter(
            Alert.org_id == org_id,
            Alert.alert_type == alert_type.value,
            Alert.entity_type == entity_type,
            Alert.entity_id == entity_id,
            Alert.status.in_([AlertStatus.UNREAD.value, AlertStatus.READ.value])
        ).update({
            "status": AlertStatus.RESOLVED.value,
            "resolved_at": datetime.utcnow()
        })
        
        db.commit()
        
        logger.info(f"Auto-resolved {count} {alert_type.value} alerts for {entity_type} {entity_id}")
        
        return count
