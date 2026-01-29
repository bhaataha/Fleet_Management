/**
 * Firebase Authentication Service
 * 
 * Handles phone authentication with Firebase:
 * 1. Initialize Firebase app and reCAPTCHA
 * 2. Send OTP via Firebase Phone Auth
 * 3. Verify OTP and get ID token
 * 4. Send ID token to backend for JWT generation
 */

import { initializeApp, FirebaseApp } from 'firebase/app'
import { 
  getAuth, 
  Auth,
  signInWithPhoneNumber, 
  RecaptchaVerifier, 
  ConfirmationResult,
  PhoneAuthProvider,
  signInWithCredential
} from 'firebase/auth'

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
}

// Validate configuration
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error('❌ Firebase configuration missing! Check environment variables.')
}

// Initialize Firebase app (singleton)
let app: FirebaseApp | null = null
let auth: Auth | null = null

function initializeFirebase() {
  if (!app) {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    auth.languageCode = 'he' // Hebrew for Israeli users
    console.log('✅ Firebase initialized')
  }
  return { app, auth: auth! }
}

/**
 * Phone Authentication Service
 * 
 * Usage:
 * ```typescript
 * const authService = new PhoneAuthService()
 * 
 * // Step 1: Initialize reCAPTCHA
 * await authService.initRecaptcha('recaptcha-container')
 * 
 * // Step 2: Send OTP
 * await authService.sendOTP('+972501234567')
 * 
 * // Step 3: Verify OTP
 * const result = await authService.verifyOTP('123456')
 * if (result.success) {
 *   // Send result.idToken to backend
 * }
 * ```
 */
export class PhoneAuthService {
  private auth: Auth
  private recaptchaVerifier: RecaptchaVerifier | null = null
  private confirmationResult: ConfirmationResult | null = null
  
  constructor() {
    const { auth } = initializeFirebase()
    this.auth = auth
  }
  
  /**
   * Initialize reCAPTCHA verifier
   * Must be called before sending OTP
   * 
   * @param elementId - HTML element ID for reCAPTCHA (e.g., 'recaptcha-container')
   * @param invisible - Use invisible reCAPTCHA (default: true)
   */
  async initRecaptcha(elementId: string, invisible: boolean = true): Promise<void> {
    try {
      console.log('🔐 Initializing reCAPTCHA...')
      
      // Clear existing verifier
      if (this.recaptchaVerifier) {
        this.recaptchaVerifier.clear()
      }
      
      // Create new verifier
      this.recaptchaVerifier = new RecaptchaVerifier(
        this.auth,
        elementId,
        {
          size: invisible ? 'invisible' : 'normal',
          callback: () => {
            console.log('✅ reCAPTCHA solved')
          },
          'expired-callback': () => {
            console.warn('⚠️ reCAPTCHA expired')
          },
          'error-callback': (error: any) => {
            console.error('❌ reCAPTCHA error:', error)
          }
        }
      )
      
      // Render the reCAPTCHA
      await this.recaptchaVerifier.render()
      console.log('✅ reCAPTCHA initialized')
      
    } catch (error: any) {
      console.error('❌ Failed to initialize reCAPTCHA:', error)
      throw new Error(`reCAPTCHA initialization failed: ${error.message}`)
    }
  }
  
  /**
   * Send OTP to phone number
   * 
   * @param phoneNumber - Phone number in E.164 format (e.g., '+972501234567')
   * @returns Promise that resolves when OTP is sent
   */
  async sendOTP(phoneNumber: string): Promise<void> {
    try {
      if (!this.recaptchaVerifier) {
        throw new Error('reCAPTCHA not initialized. Call initRecaptcha() first.')
      }
      
      // Format phone number to E.164
      const formattedPhone = this.formatPhoneNumber(phoneNumber)
      console.log(`📱 Sending OTP to ${formattedPhone}...`)
      
      // Send OTP via Firebase
      this.confirmationResult = await signInWithPhoneNumber(
        this.auth,
        formattedPhone,
        this.recaptchaVerifier
      )
      
      console.log('✅ OTP sent successfully')
      
    } catch (error: any) {
      console.error('❌ Failed to send OTP:', error)
      
      // Reset reCAPTCHA on error
      if (this.recaptchaVerifier) {
        this.recaptchaVerifier.clear()
        this.recaptchaVerifier = null
      }
      
      // User-friendly error messages
      if (error.code === 'auth/invalid-phone-number') {
        throw new Error('מספר טלפון לא תקין')
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('יותר מדי ניסיונות. אנא נסה שוב מאוחר יותר')
      } else if (error.code === 'auth/quota-exceeded') {
        throw new Error('חריגה ממכסת SMS. אנא צור קשר עם התמיכה')
      } else {
        throw new Error(`שגיאה בשליחת קוד: ${error.message}`)
      }
    }
  }
  
  /**
   * Verify OTP code and get ID token
   * 
   * @param code - 6-digit OTP code from SMS
   * @returns Object with success status and ID token
   */
  async verifyOTP(code: string): Promise<{ success: boolean; idToken?: string; error?: string }> {
    try {
      if (!this.confirmationResult) {
        throw new Error('No OTP session. Call sendOTP() first.')
      }
      
      console.log('🔐 Verifying OTP code...')
      
      // Verify the code
      const userCredential = await this.confirmationResult.confirm(code)
      
      // Get ID token
      const idToken = await userCredential.user.getIdToken()
      
      console.log('✅ OTP verified successfully')
      
      return {
        success: true,
        idToken
      }
      
    } catch (error: any) {
      console.error('❌ Failed to verify OTP:', error)
      
      // User-friendly error messages
      let errorMessage = 'שגיאה באימות קוד'
      
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'קוד אימות שגוי'
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'פג תוקף הקוד. אנא בקש קוד חדש'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'יותר מדי ניסיונות. אנא נסה שוב מאוחר יותר'
      } else {
        errorMessage = error.message
      }
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }
  
  /**
   * Format phone number to E.164 format for Israel
   * 
   * Examples:
   * - '0501234567' -> '+972501234567'
   * - '050-123-4567' -> '+972501234567'
   * - '+972501234567' -> '+972501234567'
   * 
   * @param phone - Phone number in any format
   * @returns Phone number in E.164 format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '')
    
    // If starts with 0, replace with 972
    if (cleaned.startsWith('0')) {
      cleaned = '972' + cleaned.substring(1)
    }
    
    // Add + if not present
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned
    }
    
    return cleaned
  }
  
  /**
   * Cleanup resources
   * Call when component unmounts
   */
  cleanup(): void {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear()
      this.recaptchaVerifier = null
    }
    this.confirmationResult = null
    console.log('🧹 Firebase auth service cleaned up')
  }
  
  /**
   * Check if Firebase is properly configured
   */
  static isConfigured(): boolean {
    return !!(
      firebaseConfig.apiKey && 
      firebaseConfig.authDomain && 
      firebaseConfig.projectId
    )
  }
  
  /**
   * Get current Firebase configuration (for debugging)
   */
  static getConfig() {
    return {
      apiKey: firebaseConfig.apiKey ? '***' + firebaseConfig.apiKey.slice(-4) : 'missing',
      authDomain: firebaseConfig.authDomain || 'missing',
      projectId: firebaseConfig.projectId || 'missing',
      configured: PhoneAuthService.isConfigured()
    }
  }
}

// Export singleton instance for convenience
export const phoneAuthService = new PhoneAuthService()

// Export Firebase auth for advanced usage
export { auth }
