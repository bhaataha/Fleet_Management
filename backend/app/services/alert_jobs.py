"""
Background jobs for alert checking
"""
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
import logging

from app.core.database import SessionLocal
from app.models import Job, Truck, Driver, Organization
from app.models.alert import Alert, AlertType, AlertSeverity, AlertCategory
from app.schemas.alert import AlertCreate
from app.services.alert_service import AlertService

logger = logging.getLogger(__name__)


def check_unassigned_jobs():
    """
    Check for jobs scheduled today or in the past that don't have driver/truck assigned
    
    Runs every 15 minutes
    Creates CRITICAL alerts for dispatchers
    """
    db = SessionLocal()
    
    try:
        # Get all active organizations
        orgs = db.query(Organization).filter(Organization.status == "active").all()
        
        for org in orgs:
            # Find unassigned jobs
            now = datetime.utcnow()
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            
            unassigned_jobs = db.query(Job).filter(
                Job.org_id == org.id,
                Job.scheduled_date >= today_start,
                Job.scheduled_date <= now + timedelta(hours=24),
                Job.status.in_(["PLANNED", "ASSIGNED"]),
                Job.driver_id.is_(None)  # No driver assigned
            ).all()
            
            for job in unassigned_jobs:
                # Check if alert already exists
                existing_alert = db.query(Alert).filter(
                    Alert.org_id == org.id,
                    Alert.alert_type == AlertType.JOB_NOT_ASSIGNED.value,
                    Alert.entity_type == "job",
                    Alert.entity_id == job.id,
                    Alert.status.in_(["UNREAD", "READ"])
                ).first()
                
                if not existing_alert:
                    # Create alert
                    alert_data = AlertCreate(
                        org_id=org.id,
                        alert_type=AlertType.JOB_NOT_ASSIGNED.value,
                        severity=AlertSeverity.CRITICAL.value,
                        category=AlertCategory.OPERATIONAL.value,
                        title=f"נסיעה #{job.id} לא משובצת",
                        message=f"נסיעה מתוכננת ל-{job.scheduled_date.strftime('%d/%m/%Y %H:%M')} ללא נהג",
                        action_url=f"/jobs/{job.id}",
                        entity_type="job",
                        entity_id=job.id,
                        created_for_role="dispatcher",
                        expires_at=job.scheduled_date + timedelta(hours=2)
                    )
                    
                    AlertService.create_alert(db, alert_data)
                    logger.info(f"Created JOB_NOT_ASSIGNED alert for job {job.id} in org {org.id}")
        
        logger.info("Finished checking unassigned jobs")
        
    except Exception as e:
        logger.error(f"Error checking unassigned jobs: {e}", exc_info=True)
    finally:
        db.close()


def check_insurance_expiry():
    """
    Check for trucks with insurance expiring in 30, 14, 7, 1 days
    
    Runs daily at 08:00
    Creates HIGH alerts for admins
    """
    db = SessionLocal()
    
    try:
        # Get all active organizations
        orgs = db.query(Organization).filter(Organization.status == "active").all()
        
        for org in orgs:
            now = datetime.now()
            
            # Check trucks with expiring insurance
            trucks = db.query(Truck).filter(
                Truck.org_id == org.id,
                Truck.is_active == True,
                Truck.insurance_expiry.isnot(None),
                Truck.insurance_expiry > now,
                Truck.insurance_expiry <= now + timedelta(days=30)
            ).all()
            
            for truck in trucks:
                # Make now timezone-aware if truck.insurance_expiry is timezone-aware
                expiry_date = truck.insurance_expiry.replace(tzinfo=None) if truck.insurance_expiry.tzinfo else truck.insurance_expiry
                days_until_expiry = (expiry_date - now).days
                
                # Determine threshold level (30, 14, 7, or 1 days)
                if days_until_expiry <= 1:
                    threshold = 1
                elif days_until_expiry <= 7:
                    threshold = 7
                elif days_until_expiry <= 14:
                    threshold = 14
                elif days_until_expiry <= 30:
                    threshold = 30
                else:
                    continue  # Skip if more than 30 days
                
                # Check if alert already exists for this threshold
                existing_alert = db.query(Alert).filter(
                    Alert.org_id == org.id,
                    Alert.alert_type == AlertType.INSURANCE_EXPIRY.value,
                    Alert.entity_type == "truck",
                    Alert.entity_id == truck.id,
                    Alert.status.in_(["UNREAD", "READ"]),
                    Alert.message.contains(f"תוקף ביטוח")
                ).first()
                
                if not existing_alert:
                    # Determine severity based on days left
                    if days_until_expiry <= 7:
                        severity = AlertSeverity.CRITICAL
                    elif days_until_expiry <= 14:
                        severity = AlertSeverity.HIGH
                    else:
                        severity = AlertSeverity.MEDIUM
                    
                    alert_data = AlertCreate(
                        org_id=org.id,
                        alert_type=AlertType.INSURANCE_EXPIRY.value,
                        severity=severity.value,
                        category=AlertCategory.MAINTENANCE.value,
                        title=f"ביטוח רכב {truck.plate_number} עומד לפוג",
                        message=f"ביטוח רכב {truck.plate_number} יפוג בעוד {days_until_expiry} ימים ({truck.insurance_expiry.strftime('%d/%m/%Y')})",
                        action_url=f"/fleet?truck={truck.id}",
                        entity_type="truck",
                        entity_id=truck.id,
                        created_for_role="admin",
                        expires_at=truck.insurance_expiry,
                        alert_metadata={"days_until_expiry": days_until_expiry}
                    )
                    
                    AlertService.create_alert(db, alert_data)
                    logger.info(f"Created INSURANCE_EXPIRY alert for truck {truck.id} in org {org.id}")
        
        logger.info("Finished checking insurance expiry")
        
    except Exception as e:
        logger.error(f"Error checking insurance expiry: {e}", exc_info=True)
    finally:
        db.close()


def check_test_expiry():
    """
    Check for trucks with test expiring in 30, 14, 7, 1 days
    
    Runs daily at 08:00
    Creates HIGH alerts for admins
    """
    db = SessionLocal()
    
    try:
        orgs = db.query(Organization).filter(Organization.status == "active").all()
        
        for org in orgs:
            now = datetime.now()
            
            trucks = db.query(Truck).filter(
                Truck.org_id == org.id,
                Truck.is_active == True,
                Truck.test_expiry.isnot(None),
                Truck.test_expiry > now,
                Truck.test_expiry <= now + timedelta(days=30)
            ).all()
            
            for truck in trucks:
                # Make timezone-naive for comparison
                expiry_date = truck.test_expiry.replace(tzinfo=None) if truck.test_expiry.tzinfo else truck.test_expiry
                days_until_expiry = (expiry_date - now).days
                
                # Determine threshold level
                if days_until_expiry <= 1:
                    threshold = 1
                elif days_until_expiry <= 7:
                    threshold = 7
                elif days_until_expiry <= 14:
                    threshold = 14
                elif days_until_expiry <= 30:
                    threshold = 30
                else:
                    continue
                
                # Check for existing alert
                existing_alert = db.query(Alert).filter(
                    Alert.org_id == org.id,
                    Alert.alert_type == AlertType.TEST_EXPIRY.value,
                    Alert.entity_type == "truck",
                    Alert.entity_id == truck.id,
                    Alert.status.in_(["UNREAD", "READ"]),
                    Alert.message.contains(f"תוקף טסט")
                ).first()
                
                if not existing_alert:
                    if days_until_expiry <= 7:
                        severity = AlertSeverity.CRITICAL
                    elif days_until_expiry <= 14:
                        severity = AlertSeverity.HIGH
                    else:
                        severity = AlertSeverity.MEDIUM
                    
                    alert_data = AlertCreate(
                        org_id=org.id,
                        alert_type=AlertType.TEST_EXPIRY.value,
                        severity=severity.value,
                        category=AlertCategory.MAINTENANCE.value,
                        title=f"טסט רכב {truck.plate_number} עומד לפוג",
                        message=f"טסט רכב {truck.plate_number} יפוג בעוד {days_until_expiry} ימים ({truck.test_expiry.strftime('%d/%m/%Y')})",
                        action_url=f"/fleet?truck={truck.id}",
                        entity_type="truck",
                        entity_id=truck.id,
                        created_for_role="admin",
                        expires_at=truck.test_expiry,
                        alert_metadata={"days_until_expiry": days_until_expiry}
                    )
                    
                    AlertService.create_alert(db, alert_data)
                    logger.info(f"Created TEST_EXPIRY alert for truck {truck.id} in org {org.id}")
        
        logger.info("Finished checking test expiry")
        
    except Exception as e:
        logger.error(f"Error checking test expiry: {e}", exc_info=True)
    finally:
        db.close()


def check_license_expiry():
    """
    Check for drivers with license expiring in 60, 30, 14, 7, 1 days
    
    Runs daily at 08:00
    Creates HIGH alerts for admins
    """
    db = SessionLocal()
    
    try:
        orgs = db.query(Organization).filter(Organization.status == "active").all()
        
        for org in orgs:
            now = datetime.now()
            
            drivers = db.query(Driver).filter(
                Driver.org_id == org.id,
                Driver.is_active == True,
                Driver.license_expiry.isnot(None),
                Driver.license_expiry > now,
                Driver.license_expiry <= now + timedelta(days=60)
            ).all()
            
            for driver in drivers:
                # Make timezone-naive for comparison
                expiry_date = driver.license_expiry.replace(tzinfo=None) if driver.license_expiry.tzinfo else driver.license_expiry
                days_until_expiry = (expiry_date - now).days
                
                if days_until_expiry not in [60, 30, 14, 7, 1]:
                    continue
                
                existing_alert = db.query(Alert).filter(
                    Alert.org_id == org.id,
                    Alert.alert_type == AlertType.LICENSE_EXPIRY.value,
                    Alert.entity_type == "driver",
                    Alert.entity_id == driver.id,
                    Alert.status.in_(["UNREAD", "READ"]),
                    Alert.message.contains(f"{days_until_expiry} ימים")
                ).first()
                
                if not existing_alert:
                    if days_until_expiry <= 7:
                        severity = AlertSeverity.CRITICAL
                    elif days_until_expiry <= 14:
                        severity = AlertSeverity.HIGH
                    else:
                        severity = AlertSeverity.MEDIUM
                    
                    alert_data = AlertCreate(
                        org_id=org.id,
                        alert_type=AlertType.LICENSE_EXPIRY.value,
                        severity=severity.value,
                        category=AlertCategory.MAINTENANCE.value,
                        title=f"רישיון {driver.name} עומד לפוג",
                        message=f"רישיון נהיגה של {driver.name} יפוג בעוד {days_until_expiry} ימים ({driver.license_expiry.strftime('%d/%m/%Y')})",
                        action_url=f"/fleet?driver={driver.id}",
                        entity_type="driver",
                        entity_id=driver.id,
                        created_for_role="admin",
                        expires_at=driver.license_expiry,
                        alert_metadata={"days_until_expiry": days_until_expiry}
                    )
                    
                    AlertService.create_alert(db, alert_data)
                    logger.info(f"Created LICENSE_EXPIRY alert for driver {driver.id} in org {org.id}")
        
        logger.info("Finished checking license expiry")
        
    except Exception as e:
        logger.error(f"Error checking license expiry: {e}", exc_info=True)
    finally:
        db.close()


def cleanup_expired_alerts():
    """
    Delete expired alerts
    
    Runs daily at 02:00
    """
    db = SessionLocal()
    
    try:
        count = AlertService.cleanup_expired_alerts(db)
        logger.info(f"Cleaned up {count} expired alerts")
    except Exception as e:
        logger.error(f"Error cleaning up expired alerts: {e}", exc_info=True)
    finally:
        db.close()
