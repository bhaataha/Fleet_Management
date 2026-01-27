"""
Quick test script to manually run alert jobs and check for expiring insurance/test
"""
import sys
sys.path.insert(0, '/app')

from app.services.alert_jobs import check_insurance_expiry, check_test_expiry
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

logger.info("=== Running Insurance Expiry Check ===")
check_insurance_expiry()

logger.info("\n=== Running Test Expiry Check ===")
check_test_expiry()

logger.info("\n✅ Jobs completed!")
