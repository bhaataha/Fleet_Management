"""
APScheduler setup for background jobs
"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
import logging

from app.services.alert_jobs import (
    check_unassigned_jobs,
    check_insurance_expiry,
    check_test_expiry,
    check_license_expiry,
    cleanup_expired_alerts
)

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = None


def init_scheduler():
    """
    Initialize and configure APScheduler with all alert jobs
    """
    global scheduler
    
    if scheduler is not None:
        logger.warning("Scheduler already initialized")
        return scheduler
    
    logger.info("Initializing APScheduler...")
    
    scheduler = BackgroundScheduler(
        timezone="Asia/Jerusalem",
        job_defaults={
            'coalesce': True,  # Combine multiple missed executions into one
            'max_instances': 1,  # Only one instance of each job at a time
            'misfire_grace_time': 300  # Allow 5 minutes grace for missed jobs
        }
    )
    
    # Job 1: Check unassigned jobs - Every 15 minutes
    scheduler.add_job(
        check_unassigned_jobs,
        trigger=IntervalTrigger(minutes=15),
        id='check_unassigned_jobs',
        name='Check Unassigned Jobs',
        replace_existing=True,
        next_run_time=datetime.now()  # Run immediately on startup
    )
    logger.info("✓ Scheduled: check_unassigned_jobs (every 15 minutes)")
    
    # Job 2: Check insurance expiry - Daily at 08:00
    scheduler.add_job(
        check_insurance_expiry,
        trigger=CronTrigger(hour=8, minute=0),
        id='check_insurance_expiry',
        name='Check Insurance Expiry',
        replace_existing=True,
        next_run_time=datetime.now()  # Run immediately on startup
    )
    logger.info("✓ Scheduled: check_insurance_expiry (daily at 08:00)")
    
    # Job 3: Check test expiry - Daily at 08:00
    scheduler.add_job(
        check_test_expiry,
        trigger=CronTrigger(hour=8, minute=0),
        id='check_test_expiry',
        name='Check Test Expiry',
        replace_existing=True,
        next_run_time=datetime.now()  # Run immediately on startup
    )
    logger.info("✓ Scheduled: check_test_expiry (daily at 08:00)")
    
    # Job 4: Check license expiry - Daily at 08:00
    scheduler.add_job(
        check_license_expiry,
        trigger=CronTrigger(hour=8, minute=0),
        id='check_license_expiry',
        name='Check License Expiry',
        replace_existing=True,
        next_run_time=datetime.now()  # Run immediately on startup
    )
    logger.info("✓ Scheduled: check_license_expiry (daily at 08:00)")
    
    # Job 5: Cleanup expired alerts - Daily at 02:00
    scheduler.add_job(
        cleanup_expired_alerts,
        trigger=CronTrigger(hour=2, minute=0),
        id='cleanup_expired_alerts',
        name='Cleanup Expired Alerts',
        replace_existing=True
    )
    logger.info("✓ Scheduled: cleanup_expired_alerts (daily at 02:00)")
    
    # Start the scheduler
    scheduler.start()
    logger.info("✅ APScheduler started successfully with 5 jobs")
    
    return scheduler


def shutdown_scheduler():
    """
    Gracefully shutdown the scheduler
    """
    global scheduler
    
    if scheduler is not None:
        logger.info("Shutting down APScheduler...")
        scheduler.shutdown(wait=True)
        scheduler = None
        logger.info("✅ APScheduler shut down successfully")


def get_scheduler():
    """
    Get the scheduler instance
    """
    return scheduler


def list_jobs():
    """
    List all scheduled jobs with their next run time
    """
    if scheduler is None:
        return []
    
    jobs_info = []
    for job in scheduler.get_jobs():
        jobs_info.append({
            'id': job.id,
            'name': job.name,
            'next_run': job.next_run_time.isoformat() if job.next_run_time else None,
            'trigger': str(job.trigger)
        })
    
    return jobs_info
