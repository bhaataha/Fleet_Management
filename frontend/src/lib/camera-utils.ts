/**
 * Camera Utilities for Mobile PWA
 * Handle camera access, photo capture, and image compression
 */

export interface CameraOptions {
  facingMode?: 'user' | 'environment'
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

export interface CompressOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  quality?: number
  fileType?: string
}

/**
 * Check if camera is available on device
 */
export async function isCameraAvailable(): Promise<boolean> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return false
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.some(device => device.kind === 'videoinput')
  } catch (error) {
    console.error('[Camera] Error checking camera availability:', error)
    return false
  }
}

/**
 * Request camera permission
 */
export async function requestCameraPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' } 
    })
    
    // Stop all tracks (we just wanted to check permission)
    stream.getTracks().forEach(track => track.stop())
    
    return true
  } catch (error: any) {
    console.error('[Camera] Permission denied:', error)
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      throw new Error('נדרשת הרשאה לגישה למצלמה. אנא אפשר גישה בהגדרות הדפדפן.')
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      throw new Error('לא נמצאה מצלמה במכשיר זה')
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      throw new Error('המצלמה בשימוש על ידי אפליקציה אחרת')
    } else {
      throw new Error('שגיאה בגישה למצלמה: ' + error.message)
    }
  }
}

/**
 * Open camera stream
 */
export async function openCameraStream(options: CameraOptions = {}): Promise<MediaStream> {
  const {
    facingMode = 'environment', // Default to back camera
    maxWidth = 1920,
    maxHeight = 1080,
  } = options

  try {
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: maxWidth },
        height: { ideal: maxHeight },
      },
      audio: false,
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    return stream
  } catch (error: any) {
    console.error('[Camera] Failed to open stream:', error)
    throw new Error('לא ניתן לפתוח את המצלמה')
  }
}

/**
 * Capture photo from video stream
 */
export function capturePhotoFromStream(
  videoElement: HTMLVideoElement,
  options: { quality?: number } = {}
): Blob {
  const { quality = 0.92 } = options

  const canvas = document.createElement('canvas')
  canvas.width = videoElement.videoWidth
  canvas.height = videoElement.videoHeight

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Failed to get canvas context')
  }

  // Draw video frame to canvas
  context.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

  // Convert to blob
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create blob from canvas'))
        }
      },
      'image/jpeg',
      quality
    )
  })
}

/**
 * Compress image file
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxSizeMB = 1,
    maxWidthOrHeight = 1920,
    quality = 0.8,
    fileType = 'image/jpeg',
  } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidthOrHeight) {
            height = (height * maxWidthOrHeight) / width
            width = maxWidthOrHeight
          }
        } else {
          if (height > maxWidthOrHeight) {
            width = (width * maxWidthOrHeight) / height
            height = maxWidthOrHeight
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        // Draw image with white background (for transparent PNGs)
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to blob
        canvas.toBlob(
          async (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }

            // Check if size is acceptable
            const sizeMB = blob.size / 1024 / 1024

            if (sizeMB > maxSizeMB && quality > 0.1) {
              // Try again with lower quality
              const newQuality = Math.max(0.1, quality - 0.1)
              try {
                const compressed = await compressImage(file, {
                  ...options,
                  quality: newQuality,
                })
                resolve(compressed)
              } catch (error) {
                reject(error)
              }
            } else {
              // Create new file from blob
              const compressedFile = new File([blob], file.name, {
                type: fileType,
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            }
          },
          fileType,
          quality
        )
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }

      img.src = e.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Convert blob to file
 */
export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, {
    type: blob.type,
    lastModified: Date.now(),
  })
}

/**
 * Get file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'סוג קובץ לא נתמך. השתמש ב-JPEG, PNG או WebP',
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'הקובץ גדול מדי. גודל מקסימלי: 10MB',
    }
  }

  return { valid: true }
}
