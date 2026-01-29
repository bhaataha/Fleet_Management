"""
Firebase Authentication Service
Handles phone OTP verification using Firebase Admin SDK
"""
import firebase_admin
from firebase_admin import credentials, auth
from app.core.config import settings
import logging
import os
from typing import Optional, Dict

logger = logging.getLogger(__name__)


class FirebaseService:
    """
    Firebase Admin SDK service for phone authentication
    Singleton pattern to ensure single initialization
    """
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize Firebase Admin SDK (only once)"""
        if not self._initialized:
            self._initialize_firebase()
            FirebaseService._initialized = True
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK with service account"""
        try:
            # Check if already initialized
            if firebase_admin._apps:
                logger.info("Firebase already initialized")
                return
            
            # Get service account path
            service_account_path = settings.FIREBASE_SERVICE_ACCOUNT_PATH
            
            if not os.path.exists(service_account_path):
                logger.error(f"Firebase service account file not found: {service_account_path}")
                raise FileNotFoundError(f"Service account file not found: {service_account_path}")
            
            # Initialize Firebase Admin
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred)
            
            logger.info("✅ Firebase Admin SDK initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Firebase: {e}")
            raise
    
    async def verify_id_token(self, id_token: str) -> Dict:
        """
        Verify Firebase ID token from client
        
        Args:
            id_token: Firebase ID token from client after phone verification
            
        Returns:
            dict: {
                'verified': bool,
                'uid': str (Firebase user ID),
                'phone': str (phone number),
                'email': Optional[str],
                'error': Optional[str]
            }
        """
        try:
            # Verify the ID token
            decoded_token = auth.verify_id_token(id_token)
            
            # Extract user info
            result = {
                'verified': True,
                'uid': decoded_token.get('uid'),
                'phone': decoded_token.get('phone_number'),
                'email': decoded_token.get('email'),
                'firebase_user_id': decoded_token.get('uid')
            }
            
            logger.info(f"✅ Token verified successfully for phone: {result['phone']}")
            return result
            
        except auth.InvalidIdTokenError as e:
            logger.error(f"❌ Invalid Firebase token: {e}")
            return {
                'verified': False,
                'error': 'Invalid authentication token'
            }
        except auth.ExpiredIdTokenError as e:
            logger.error(f"❌ Expired Firebase token: {e}")
            return {
                'verified': False,
                'error': 'Authentication token has expired'
            }
        except Exception as e:
            logger.error(f"❌ Token verification failed: {e}")
            return {
                'verified': False,
                'error': str(e)
            }
    
    async def get_user_by_phone(self, phone: str) -> Optional[auth.UserRecord]:
        """
        Get Firebase user by phone number
        
        Args:
            phone: Phone number in E.164 format (e.g., +972501234567)
            
        Returns:
            UserRecord if found, None otherwise
        """
        try:
            user = auth.get_user_by_phone_number(phone)
            logger.info(f"✅ Firebase user found: {user.uid}")
            return user
        except auth.UserNotFoundError:
            logger.info(f"ℹ️ No Firebase user found for phone: {phone}")
            return None
        except Exception as e:
            logger.error(f"❌ Error fetching Firebase user: {e}")
            raise
    
    async def create_user(self, phone: str, display_name: Optional[str] = None) -> auth.UserRecord:
        """
        Create a new Firebase user with phone number
        
        Args:
            phone: Phone number in E.164 format
            display_name: Optional display name
            
        Returns:
            UserRecord of created user
        """
        try:
            user = auth.create_user(
                phone_number=phone,
                display_name=display_name
            )
            logger.info(f"✅ Firebase user created: {user.uid}")
            return user
        except Exception as e:
            logger.error(f"❌ Failed to create Firebase user: {e}")
            raise
    
    async def delete_user(self, uid: str):
        """
        Delete a Firebase user
        
        Args:
            uid: Firebase user ID
        """
        try:
            auth.delete_user(uid)
            logger.info(f"✅ Firebase user deleted: {uid}")
        except Exception as e:
            logger.error(f"❌ Failed to delete Firebase user: {e}")
            raise
    
    def normalize_phone_to_e164(self, phone: str) -> str:
        """
        Normalize phone number to E.164 format for Firebase
        Israel example: 0501234567 -> +972501234567
        
        Args:
            phone: Phone number (various formats)
            
        Returns:
            Phone number in E.164 format
        """
        # Remove all non-digits
        cleaned = ''.join(filter(str.isdigit, phone))
        
        # Israeli phone number handling
        if cleaned.startswith('0'):
            # Remove leading 0 and add +972
            cleaned = '972' + cleaned[1:]
        elif not cleaned.startswith('972'):
            # If no country code, assume Israel
            cleaned = '972' + cleaned
        
        # Add + prefix
        if not cleaned.startswith('+'):
            cleaned = '+' + cleaned
        
        return cleaned


# Global singleton instance
firebase_service = FirebaseService()
