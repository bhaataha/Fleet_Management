"""
Storage service for file uploads
MVP: Local filesystem storage
Future: S3/MinIO support via USE_S3_STORAGE environment variable
"""
import os
from pathlib import Path
from typing import BinaryIO, Optional
from datetime import datetime
import uuid
import shutil


class StorageService:
    """
    File storage service with local filesystem (MVP) and optional S3 support.
    
    MVP Mode (default): Stores files in /app/uploads directory
    S3 Mode: Set USE_S3_STORAGE=true to enable MinIO/S3
    """
    
    def __init__(self):
        self.use_s3 = os.getenv("USE_S3_STORAGE", "false").lower() == "true"
        
        if self.use_s3:
            # S3/MinIO mode (production)
            import boto3
            from botocore.exceptions import ClientError
            
            self.endpoint = os.getenv("S3_ENDPOINT", "http://minio:9000")
            self.access_key = os.getenv("S3_ACCESS_KEY", "minioadmin")
            self.secret_key = os.getenv("S3_SECRET_KEY", "minioadmin")
            self.bucket = os.getenv("S3_BUCKET", "fleet-uploads")
            self.region = os.getenv("S3_REGION", "us-east-1")
            
            self.s3_client = boto3.client(
                's3',
                endpoint_url=self.endpoint,
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
                region_name=self.region
            )
            self._ensure_bucket_exists()
        else:
            # Local filesystem mode (MVP - default)
            self.storage_path = Path("/app/uploads")
            self.storage_path.mkdir(parents=True, exist_ok=True)
            print(f"📁 Storage: Local filesystem at {self.storage_path}")
    
    def upload_file(
        self,
        file: BinaryIO,
        filename: str,
        folder: str = "",
        content_type: Optional[str] = None
    ) -> str:
        """
        Upload a file to storage.
        
        Args:
            file: File-like object
            filename: Original filename
            folder: Optional subfolder (e.g., "jobs/123")
            content_type: MIME type
            
        Returns:
            Storage key (relative path)
        """
        # Generate unique filename: YYYYMMDD_HHMMSS_UUID.ext
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        file_ext = os.path.splitext(filename)[1].lower()
        storage_key = f"{folder}/{timestamp}_{unique_id}{file_ext}" if folder else f"{timestamp}_{unique_id}{file_ext}"
        
        if self.use_s3:
            # Upload to S3/MinIO
            extra_args = {}
            if content_type:
                extra_args['ContentType'] = content_type
            
            file.seek(0)
            self.s3_client.upload_fileobj(file, self.bucket, storage_key, ExtraArgs=extra_args)
        else:
            # Save to local filesystem
            file_path = self.storage_path / storage_key
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            file.seek(0)
            with open(file_path, 'wb') as dest:
                shutil.copyfileobj(file, dest)
        
        return storage_key
    
    def get_presigned_url(self, storage_key: str, expiration: int = 3600) -> str:
        """
        Get URL for accessing a file.
        
        Args:
            storage_key: File path
            expiration: Validity in seconds (S3 only)
            
        Returns:
            Access URL
        """
        if self.use_s3:
            # Generate S3 presigned URL
            return self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket, 'Key': storage_key},
                ExpiresIn=expiration
            )
        else:
            # Return local URL path (served by FastAPI static mount with /api prefix)
            return f"/api/uploads/{storage_key}"
    
    def delete_file(self, storage_key: str) -> bool:
        """Delete a file from storage."""
        try:
            if self.use_s3:
                self.s3_client.delete_object(Bucket=self.bucket, Key=storage_key)
            else:
                file_path = self.storage_path / storage_key
                if file_path.exists():
                    file_path.unlink()
            return True
        except Exception as e:
            print(f"❌ Error deleting {storage_key}: {e}")
            return False
    
    def file_exists(self, storage_key: str) -> bool:
        """Check if file exists."""
        try:
            if self.use_s3:
                self.s3_client.head_object(Bucket=self.bucket, Key=storage_key)
                return True
            else:
                return (self.storage_path / storage_key).exists()
        except:
            return False
    
    def _ensure_bucket_exists(self):
        """Create S3 bucket if it doesn't exist."""
        from botocore.exceptions import ClientError
        try:
            self.s3_client.head_bucket(Bucket=self.bucket)
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                self.s3_client.create_bucket(Bucket=self.bucket)
                print(f"✅ Created S3 bucket: {self.bucket}")


# Singleton instance
_storage_service = None


def get_storage_service() -> StorageService:
    """Get singleton StorageService instance."""
    global _storage_service
    if _storage_service is None:
        _storage_service = StorageService()
    return _storage_service
