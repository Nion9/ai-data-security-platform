from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
import os
import pandas as pd
import io
import json
import uuid
from typing import List, Optional, Dict, Any
import logging
from datetime import datetime

from app.database import get_db
from app.models import User, Dataset, AuditLog
from app.security import verify_token, sanitize_filename
from app.pii_detector import PIIDetector

router = APIRouter()
security = HTTPBearer()
logger = logging.getLogger(__name__)

# Initialize PII detector
pii_detector = PIIDetector()

# File upload directory
UPLOAD_DIR = "uploads"
PROCESSED_DIR = "processed"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Dependency to get current user from JWT token"""
    token = credentials.credentials
    payload = verify_token(token)
    user_id = payload.get("sub")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    return user

@router.post("/upload", response_model=Dict[str, Any])
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload and analyze file for PII"""
    
    # Validate file
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided"
        )
    
    # Sanitize filename
    safe_filename = sanitize_filename(file.filename)
    file_extension = os.path.splitext(safe_filename)[1].lower()
    
    # Validate file type
    allowed_extensions = {'.csv', '.xlsx', '.xls', '.json'}
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    # Validate file size (max 10MB)
    max_size = 10 * 1024 * 1024  # 10MB
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is 10MB"
        )
    
    # Read file content
    content = await file.read()
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}_{safe_filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Analyze file for PII
    try:
        analysis_results = None
        
        if file_extension == '.csv':
            analysis_results = pii_detector.analyze_csv(content)
        elif file_extension in ['.xlsx', '.xls']:
            # For Excel files, convert to CSV first
            df = pd.read_excel(io.BytesIO(content))
            csv_content = df.to_csv(index=False).encode('utf-8')
            analysis_results = pii_detector.analyze_csv(csv_content)
        elif file_extension == '.json':
            # For JSON files, convert to DataFrame first
            data = json.loads(content.decode('utf-8'))
            df = pd.DataFrame(data)
            csv_content = df.to_csv(index=False).encode('utf-8')
            analysis_results = pii_detector.analyze_csv(csv_content)
        
        # Save dataset record
        dataset = Dataset(
            user_id=current_user.id,
            original_filename=safe_filename,
            processed_filename=None,
            file_size=file_size,
            file_type=file_extension,
            sensitive_fields=analysis_results,
            total_records=analysis_results.get("total_rows", 0) if analysis_results else 0,
            pii_count=analysis_results.get("pii_summary", {}).get("total_pii", 0) if analysis_results else 0,
            status="analyzed",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        
        db.add(dataset)
        db.commit()
        db.refresh(dataset)
        
        # Log upload
        audit_log = AuditLog(
            user_id=current_user.id,
            action="UPLOAD_FILE",
            resource="DATASET",
            resource_id=dataset.id,
            details={"filename": safe_filename, "file_size": file_size},
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()
        
        return {
            "message": "File uploaded and analyzed successfully",
            "dataset_id": dataset.id,
            "original_filename": safe_filename,
            "analysis": analysis_results,
            "pii_detected": analysis_results.get("pii_summary", {}).get("total_pii", 0) > 0 if analysis_results else False
        }
        
    except Exception as e:
        logger.error(f"Error analyzing file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing file: {str(e)}"
        )

@router.post("/process/{dataset_id}")
async def process_dataset(
    dataset_id: str,
    action: str = Form(...),
    columns: Optional[List[str]] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process dataset to clean/redact PII"""
    
    # Validate action
    valid_actions = ["redact", "anonymize", "remove"]
    if action not in valid_actions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid action. Must be one of: {', '.join(valid_actions)}"
        )
    
    # Get dataset
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.user_id == current_user.id
    ).first()
    
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
    
    # Load original file
    original_file_path = os.path.join(UPLOAD_DIR, f"{dataset.id}_{dataset.original_filename}")
    if not os.path.exists(original_file_path):
        # Try to find by pattern
        for filename in os.listdir(UPLOAD_DIR):
            if filename.startswith(dataset.id):
                original_file_path = os.path.join(UPLOAD_DIR, filename)
                break
    
    if not os.path.exists(original_file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Original file not found"
        )
    
    try:
        # Read file based on type
        if dataset.file_type == '.csv':
            df = pd.read_csv(original_file_path)
        elif dataset.file_type in ['.xlsx', '.xls']:
            df = pd.read_excel(original_file_path)
        elif dataset.file_type == '.json':
            with open(original_file_path, 'r') as f:
                data = json.load(f)
            df = pd.DataFrame(data)
        else:
            raise ValueError(f"Unsupported file type: {dataset.file_type}")
        
        # Clean data
        df_clean = pii_detector.clean_data(df, action, columns)
        
        # Save processed file
        processed_filename = f"processed_{dataset.id}_{dataset.original_filename}"
        processed_file_path = os.path.join(PROCESSED_DIR, processed_filename)
        
        if dataset.file_type == '.csv':
            df_clean.to_csv(processed_file_path, index=False)
        elif dataset.file_type in ['.xlsx', '.xls']:
            df_clean.to_excel(processed_file_path, index=False)
        elif dataset.file_type == '.json':
            df_clean.to_json(processed_file_path, orient='records', indent=2)
        
        # Update dataset record
        dataset.processed_filename = processed_filename
        dataset.status = "processed"
        dataset.action_taken = action
        dataset.processed_at = datetime.utcnow()
        db.commit()
        
        # Log processing
        audit_log = AuditLog(
            user_id=current_user.id,
            action="PROCESS_DATA",
            resource="DATASET",
            resource_id=dataset.id,
            details={"action": action, "columns": columns},
            ip_address=None,
            user_agent=None
        )
        db.add(audit_log)
        db.commit()
        
        return {
            "message": f"Data {action} successfully",
            "dataset_id": dataset.id,
            "processed_file": processed_filename,
            "original_rows": len(df),
            "processed_rows": len(df_clean),
            "download_url": f"/api/data/download/{dataset.id}"
        }
        
    except Exception as e:
        logger.error(f"Error processing dataset: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing dataset: {str(e)}"
        )

@router.get("/download/{dataset_id}")
async def download_dataset(
    dataset_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download processed dataset"""
    
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.user_id == current_user.id,
        Dataset.status == "processed"
    ).first()
    
    if not dataset or not dataset.processed_filename:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Processed dataset not found"
        )
    
    file_path = os.path.join(PROCESSED_DIR, dataset.processed_filename)
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Log download
    audit_log = AuditLog(
        user_id=current_user.id,
        action="DOWNLOAD_FILE",
        resource="DATASET",
        resource_id=dataset.id,
        details={"filename": dataset.processed_filename},
        ip_address=None,
        user_agent=None
    )
    db.add(audit_log)
    db.commit()
    
    return FileResponse(
        path=file_path,
        filename=f"cleaned_{dataset.original_filename}",
        media_type="application/octet-stream"
    )

@router.get("/datasets")
async def get_user_datasets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all datasets for current user"""
    
    datasets = db.query(Dataset).filter(
        Dataset.user_id == current_user.id
    ).order_by(Dataset.created_at.desc()).all()
    
    return [
        {
            "id": ds.id,
            "original_filename": ds.original_filename,
            "processed_filename": ds.processed_filename,
            "file_size": ds.file_size,
            "status": ds.status,
            "pii_count": ds.pii_count,
            "total_records": ds.total_records,
            "action_taken": ds.action_taken,
            "created_at": ds.created_at.isoformat() if ds.created_at else None,
            "processed_at": ds.processed_at.isoformat() if ds.processed_at else None
        }
        for ds in datasets
    ]

@router.delete("/dataset/{dataset_id}")
async def delete_dataset(
    dataset_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete dataset and associated files"""
    
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.user_id == current_user.id
    ).first()
    
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
    
    # Delete files
    try:
        # Delete original file
        original_pattern = os.path.join(UPLOAD_DIR, f"{dataset.id}_*")
        import glob
        for file_path in glob.glob(original_pattern):
            os.remove(file_path)
        
        # Delete processed file
        if dataset.processed_filename:
            processed_path = os.path.join(PROCESSED_DIR, dataset.processed_filename)
            if os.path.exists(processed_path):
                os.remove(processed_path)
    except Exception as e:
        logger.error(f"Error deleting files: {str(e)}")
    
    # Delete from database
    db.delete(dataset)
    db.commit()
    
    # Log deletion
    audit_log = AuditLog(
        user_id=current_user.id,
        action="DELETE_DATASET",
        resource="DATASET",
        resource_id=dataset_id,
        details={"filename": dataset.original_filename},
        ip_address=None,
        user_agent=None
    )
    db.add(audit_log)
    db.commit()
    
    return {"message": "Dataset deleted successfully"}