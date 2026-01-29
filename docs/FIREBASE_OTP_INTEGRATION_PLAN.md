# Firebase OTP Integration Plan - TruckFlow System

## 📋 תכנית אינטגרציה מלאה

### שלב 1: הגדרת Firebase Project ✅

#### 1.1 יצירת פרויקט Firebase
```bash
# פעולות ב-Firebase Console (https://console.firebase.google.com):
1. Create New Project: "TruckFlow-Production"
2. Enable Authentication → Phone Auth
3. Get Firebase credentials:
   - API Key
   - Auth Domain
   - Project ID
```

#### 1.2 הורדת Service Account Key
```
Project Settings → Service Accounts → Generate New Private Key
שמור את הקובץ: firebase-service-account.json
```

---

### שלב 2: Backend Changes (Python/FastAPI)

#### 2.1 התקנת ספריות נדרשות
```bash
cd backend
pip install firebase-admin twilio  # או firebase_admin
```

עדכון `requirements.txt`:
```
firebase-admin==6.4.0
twilio==8.11.1  # אם משתמשים ב-Twilio לשליחת SMS
```

#### 2.2 יצירת Firebase Service
**קובץ חדש:** `backend/app/services/firebase_service.py`

```python
import firebase_admin
from firebase_admin import credentials, auth
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class FirebaseService:
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            self._initialize_firebase()
            self._initialized = True
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            cred_path = settings.FIREBASE_SERVICE_ACCOUNT_PATH
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin SDK initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")
            raise
    
    async def verify_otp(self, id_token: str) -> dict:
        """
        Verify Firebase ID token from client
        
        Args:
            id_token: Firebase ID token from client authentication
            
        Returns:
            dict with user info: {uid, phone_number, ...}
        """
        try:
            decoded_token = auth.verify_id_token(id_token)
            return {
                'uid': decoded_token.get('uid'),
                'phone': decoded_token.get('phone_number'),
                'email': decoded_token.get('email'),
                'verified': True
            }
        except Exception as e:
            logger.error(f"Token verification failed: {e}")
            return {'verified': False, 'error': str(e)}
    
    async def get_user_by_phone(self, phone: str):
        """Get Firebase user by phone number"""
        try:
            user = auth.get_user_by_phone_number(phone)
            return user
        except auth.UserNotFoundError:
            return None
        except Exception as e:
            logger.error(f"Error fetching user: {e}")
            raise

firebase_service = FirebaseService()
```

#### 2.3 עדכון config.py
**קובץ:** `backend/app/core/config.py`

הוסף:
```python
class Settings(BaseSettings):
    # ... existing settings ...
    
    # Firebase Configuration
    FIREBASE_API_KEY: str = Field(default="", env="FIREBASE_API_KEY")
    FIREBASE_AUTH_DOMAIN: str = Field(default="", env="FIREBASE_AUTH_DOMAIN")
    FIREBASE_PROJECT_ID: str = Field(default="", env="FIREBASE_PROJECT_ID")
    FIREBASE_SERVICE_ACCOUNT_PATH: str = Field(
        default="./firebase-service-account.json",
        env="FIREBASE_SERVICE_ACCOUNT_PATH"
    )
    
    # SMS Provider (Twilio or Firebase)
    SMS_PROVIDER: str = Field(default="firebase", env="SMS_PROVIDER")  # "firebase" or "twilio"
    TWILIO_ACCOUNT_SID: str = Field(default="", env="TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN: str = Field(default="", env="TWILIO_AUTH_TOKEN")
    TWILIO_PHONE_NUMBER: str = Field(default="", env="TWILIO_PHONE_NUMBER")
```

#### 2.4 עדכון Phone Auth Endpoint
**קובץ:** `backend/app/api/v1/endpoints/phone_auth.py`

```python
from app.services.firebase_service import firebase_service

@router.post("/verify-firebase-otp", response_model=LoginResponse)
async def verify_firebase_otp(
    firebase_token: str,
    org_slug: Optional[str] = None,
    request: Request = None,
    db: Session = Depends(get_db)
):
    """
    Verify Firebase OTP token and login user
    
    Client sends Firebase ID token after successful phone verification
    """
    # Verify Firebase token
    verification = await firebase_service.verify_otp(firebase_token)
    
    if not verification.get('verified'):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Firebase token: {verification.get('error')}"
        )
    
    phone = verification['phone']
    
    # Find user by phone
    normalized_phone = normalize_phone(phone)
    user = db.query(User).filter(User.phone == normalized_phone).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found with this phone number"
        )
    
    # Find organization
    org = None
    if org_slug:
        org = db.query(Organization).filter(Organization.slug == org_slug).first()
    else:
        org = db.query(Organization).filter(Organization.id == user.org_id).first()
    
    if not org or org.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization is not active"
        )
    
    # Create JWT token
    access_token = create_access_token_for_user(user)
    
    # Get permissions
    permissions = PermissionService.get_user_permissions(db, user.id, user.org_id)
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user.id,
            "name": user.name,
            "phone": user.phone,
            "email": user.email,
            "org_id": str(user.org_id),
            "org_role": user.org_role,
            "is_super_admin": user.is_super_admin
        },
        permissions=[p['name'] for p in permissions]
    )
```

---

### שלב 3: Frontend Changes (Next.js + TypeScript)

#### 3.1 התקנת Firebase SDK
```bash
cd frontend
npm install firebase
```

#### 3.2 יצירת Firebase Config
**קובץ חדש:** `frontend/src/lib/firebase.ts`

```typescript
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPhoneNumber, 
  RecaptchaVerifier,
  PhoneAuthProvider,
  signInWithCredential
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Phone Auth Helper Class
export class PhoneAuthService {
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private confirmationResult: any = null;
  
  /**
   * Initialize reCAPTCHA verifier (invisible or visible)
   */
  initRecaptcha(elementId: string = 'recaptcha-container', invisible: boolean = true) {
    this.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
      size: invisible ? 'invisible' : 'normal',
      callback: (response: any) => {
        console.log('reCAPTCHA verified');
      }
    });
  }
  
  /**
   * Send OTP to phone number
   */
  async sendOTP(phoneNumber: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.recaptchaVerifier) {
        throw new Error('reCAPTCHA not initialized');
      }
      
      // Format phone number (E.164 format: +972501234567)
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Send OTP
      this.confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        this.recaptchaVerifier
      );
      
      return {
        success: true,
        message: 'OTP sent successfully'
      };
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      
      // Reset reCAPTCHA on error
      if (this.recaptchaVerifier) {
        this.recaptchaVerifier.clear();
        this.recaptchaVerifier = null;
      }
      
      return {
        success: false,
        message: error.message || 'Failed to send OTP'
      };
    }
  }
  
  /**
   * Verify OTP code
   */
  async verifyOTP(code: string): Promise<{ success: boolean; idToken?: string; error?: string }> {
    try {
      if (!this.confirmationResult) {
        throw new Error('No confirmation result. Please send OTP first.');
      }
      
      // Verify OTP code
      const result = await this.confirmationResult.confirm(code);
      
      // Get ID token
      const idToken = await result.user.getIdToken();
      
      return {
        success: true,
        idToken
      };
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        error: error.message || 'Invalid OTP code'
      };
    }
  }
  
  /**
   * Format phone number to E.164 format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');
    
    // If starts with 0, replace with country code
    if (cleaned.startsWith('0')) {
      cleaned = '972' + cleaned.substring(1);
    }
    
    // Add + prefix
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }
  
  /**
   * Clean up
   */
  cleanup() {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
    }
    this.confirmationResult = null;
  }
}

export const phoneAuthService = new PhoneAuthService();
```

#### 3.3 עדכון Login Component
**קובץ:** `frontend/src/app/login/page.tsx` (או component נפרד)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { phoneAuthService } from '@/lib/firebase';
import { phoneAuthApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function PhoneLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Initialize reCAPTCHA
    phoneAuthService.initRecaptcha('recaptcha-container', true);
    
    return () => {
      phoneAuthService.cleanup();
    };
  }, []);
  
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await phoneAuthService.sendOTP(phone);
      
      if (result.success) {
        setStep('otp');
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Verify OTP with Firebase
      const result = await phoneAuthService.verifyOTP(otp);
      
      if (!result.success || !result.idToken) {
        setError(result.error || 'OTP verification failed');
        return;
      }
      
      // Send Firebase token to backend
      const loginResponse = await phoneAuthApi.verifyFirebaseOTP(result.idToken);
      
      // Save token and redirect
      localStorage.setItem('access_token', loginResponse.access_token);
      localStorage.setItem('user', JSON.stringify(loginResponse.user));
      
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          התחברות עם SMS
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {step === 'phone' ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                מספר טלפון
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="050-1234567"
                className="w-full px-4 py-2 border rounded-md"
                required
                dir="ltr"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'שולח...' : 'שלח קוד'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                קוד אימות (6 ספרות)
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="w-full px-4 py-2 border rounded-md text-center text-2xl tracking-widest"
                required
                dir="ltr"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'מאמת...' : 'התחבר'}
            </button>
            
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="w-full text-sm text-gray-600 hover:text-gray-800"
            >
              חזור לשינוי מספר
            </button>
          </form>
        )}
        
        {/* Hidden reCAPTCHA container */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}
```

#### 3.4 עדכון API Client
**קובץ:** `frontend/src/lib/api.ts`

הוסף:
```typescript
export const phoneAuthApi = {
  // ... existing methods ...
  
  verifyFirebaseOTP: (firebaseToken: string, orgSlug?: string) =>
    api.post<LoginResponse>('/phone-auth/verify-firebase-otp', {
      firebase_token: firebaseToken,
      org_slug: orgSlug
    }),
};
```

---

### שלב 4: Environment Variables

#### 4.1 Backend (.env.production)
```bash
# Firebase Configuration
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=/app/firebase-service-account.json

# SMS Provider
SMS_PROVIDER=firebase  # or "twilio"
```

#### 4.2 Frontend (.env.local)
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

---

### שלב 5: Docker Updates

#### 5.1 Backend Dockerfile
הוסף העתקת Service Account:
```dockerfile
# Copy Firebase service account key
COPY firebase-service-account.json /app/firebase-service-account.json
```

#### 5.2 .gitignore
```
# Firebase
firebase-service-account.json
.env.local
```

---

### שלב 6: Testing Plan

#### 6.1 Unit Tests
```python
# backend/tests/test_firebase_auth.py
import pytest
from app.services.firebase_service import firebase_service

def test_verify_valid_token():
    # Test with valid Firebase token
    result = await firebase_service.verify_otp("valid_token_here")
    assert result['verified'] == True

def test_verify_invalid_token():
    # Test with invalid token
    result = await firebase_service.verify_otp("invalid")
    assert result['verified'] == False
```

#### 6.2 Integration Tests
- Test complete flow: send OTP → verify → login
- Test error cases: expired OTP, wrong number, etc.
- Test rate limiting

---

### שלב 7: Security Considerations

1. **Rate Limiting**: הגבל מספר נסיונות OTP ליוזר/IP
2. **Phone Number Validation**: וודא פורמט תקין
3. **Token Expiry**: Firebase tokens פגים אחרי שעה
4. **HTTPS Only**: כל התקשורת דרך HTTPS
5. **reCAPTCHA**: מונע ספאם ובוטים

---

### שלב 8: Deployment Checklist

- [ ] Create Firebase project
- [ ] Download service account key
- [ ] Update backend dependencies
- [ ] Update frontend dependencies
- [ ] Configure environment variables
- [ ] Update Docker files
- [ ] Test locally
- [ ] Deploy to production
- [ ] Test in production
- [ ] Monitor logs

---

## 📊 תוכנית שלב-שלב

**איך נתחיל?**

1. אשר שיש לך גישה ל-Firebase Console
2. אני אכין את כל הקבצים הנדרשים
3. נעדכן את ה-Backend
4. נעדכן את ה-Frontend
5. נבדוק לוקאלית
6. Deploy לפרודקשן

**האם יש לך Firebase Project קיים, או שאני אתחיל מאפס?** 🚀
