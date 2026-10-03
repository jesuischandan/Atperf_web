from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid
import shutil
from pathlib import Path

import models
import schemas
from database import get_gcp_db

router = APIRouter(tags=["Use Cases"])

# Base media directory — all uploads and gallery scans use this
MEDIA_DIR = Path(__file__).parent.parent.parent / "frontend" / "public" / "media"

def get_media_subdir(mime_type: str) -> tuple[Path, str]:
    """Return (absolute_dir, url_subpath) based on file MIME type."""
    if mime_type.startswith("video/"):
        return MEDIA_DIR / "videos", "videos"
    elif mime_type == "application/pdf":
        return MEDIA_DIR / "pdfs", "pdfs"
    else:
        return MEDIA_DIR / "images", "images"


# ─────────────────────────────────────────────
# IMPORTANT: Static sub-routes must come BEFORE /{id} routes
# to prevent FastAPI from treating "gallery", "upload" as IDs
# ─────────────────────────────────────────────

@router.get("/use-cases/gallery")
def get_media_gallery():
    """Scan centralized media/ directory and return categorized file list."""
    if not MEDIA_DIR.exists():
        return {"photos": [], "videos": [], "pdfs": [], "logos": []}

    photos = []
    videos = []
    pdfs = []
    logos = []

    category_map = {
        "images": photos,
        "videos": videos,
        "pdfs": pdfs,
        "logos": logos,
    }

    for subdir_name, target_list in category_map.items():
        subdir = MEDIA_DIR / subdir_name
        if not subdir.exists():
            continue
        for file in subdir.iterdir():
            if file.is_file() and not file.name.startswith('.'):
                target_list.append({
                    "name": file.name,
                    "url": f"/media/{subdir_name}/{file.name}",
                    "folder": subdir_name,
                    "created": file.stat().st_ctime
                })

    return {
        "photos": sorted(photos, key=lambda x: x["created"], reverse=True),
        "videos": sorted(videos, key=lambda x: x["created"], reverse=True),
        "pdfs": sorted(pdfs, key=lambda x: x["created"], reverse=True),
        "logos": sorted(logos, key=lambda x: x["created"], reverse=True),
    }


@router.post("/use-cases/upload")
async def upload_use_case_file(
    file: UploadFile = File(...),
    company_name: str = Form(default=""),
    year: str = Form(default=str(datetime.now().year))
):
    """Upload a media file into the centralized media/ directory."""
    content_type = file.content_type or ""
    dest_dir, url_subpath = get_media_subdir(content_type)
    dest_dir.mkdir(parents=True, exist_ok=True)

    safe_name = "".join(c for c in (file.filename or "upload") if c.isalnum() or c in "._- ").strip().replace(" ", "_")
    if not safe_name:
        safe_name = f"upload_{uuid.uuid4().hex[:8]}"

    file_path = dest_dir / safe_name
    if file_path.exists():
        stem = Path(safe_name).stem
        suffix = Path(safe_name).suffix
        safe_name = f"{stem}_{uuid.uuid4().hex[:6]}{suffix}"
        file_path = dest_dir / safe_name

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "filename": safe_name,
        "url": f"/media/{url_subpath}/{safe_name}",
        "folder": url_subpath,
    }


@router.delete("/use-cases/gallery/file")
async def delete_gallery_file(url: str):
    """Delete a file from the centralized media library by its public URL."""
    if not url.startswith("/media/"):
        raise HTTPException(status_code=400, detail="Invalid media URL")

    rel_path = url.lstrip("/")
    file_path = Path(__file__).parent.parent.parent / "frontend" / "public" / rel_path

    try:
        file_path.resolve().relative_to(MEDIA_DIR.resolve())
    except ValueError:
        raise HTTPException(status_code=400, detail="Path traversal detected")

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    file_path.unlink()
    return {"deleted": url}


# ─────────────────────────────────────────────
# Parameterized /{id} routes — AFTER static routes
# ─────────────────────────────────────────────

@router.get("/use-cases", response_model=List[schemas.UseCaseResponse])
def list_use_cases(status: Optional[str] = None, gcp_db: Session = Depends(get_gcp_db)):
    """List use cases. Pass status='published' or 'draft'."""
    query = gcp_db.query(models.UseCase)
    if status:
        query = query.filter(models.UseCase.status == status)
    return query.order_by(models.UseCase.created_at.desc()).all()


def get_use_case_by_identifier(db, identifier: str):
    from sqlalchemy import func
    try:
        uuid.UUID(identifier)
        return db.query(models.UseCase).filter(models.UseCase.id == identifier).first()
    except ValueError:
        return db.query(models.UseCase).filter(
            func.replace(func.lower(models.UseCase.title), ' ', '-') == identifier
        ).first()


@router.get("/use-cases/{id}", response_model=schemas.UseCaseResponse)
def get_use_case(id: str, gcp_db: Session = Depends(get_gcp_db)):
    uc = get_use_case_by_identifier(gcp_db, id)
    if not uc:
        raise HTTPException(status_code=404, detail="Use case not found")
    return uc


@router.post("/use-cases", response_model=schemas.UseCaseResponse, status_code=201)
def create_use_case(payload: schemas.UseCaseCreate, gcp_db: Session = Depends(get_gcp_db)):
    uc = models.UseCase(**payload.model_dump())
    gcp_db.add(uc)
    gcp_db.commit()
    gcp_db.refresh(uc)
    return uc


@router.patch("/use-cases/{id}", response_model=schemas.UseCaseResponse)
def update_use_case(id: str, payload: schemas.UseCaseUpdate, gcp_db: Session = Depends(get_gcp_db)):
    uc = gcp_db.query(models.UseCase).filter(models.UseCase.id == id).first()
    if not uc:
        raise HTTPException(status_code=404, detail="Use case not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(uc, key, val)

    gcp_db.commit()
    gcp_db.refresh(uc)
    return uc


@router.delete("/use-cases/{id}", status_code=204)
def delete_use_case(id: str, gcp_db: Session = Depends(get_gcp_db)):
    uc = gcp_db.query(models.UseCase).filter(models.UseCase.id == id).first()
    if not uc:
        raise HTTPException(status_code=404, detail="Use case not found")
    gcp_db.delete(uc)
    gcp_db.commit()


@router.post("/use-cases/{id}/like")
def like_use_case(id: str, gcp_db: Session = Depends(get_gcp_db)):
    uc = get_use_case_by_identifier(gcp_db, id)
    if not uc:
        raise HTTPException(status_code=404, detail="Use case not found")
    uc.likes_count += 1
    gcp_db.commit()
    return {"likes_count": uc.likes_count}


@router.post("/use-cases/{id}/comments", response_model=schemas.UseCaseCommentResponse)
def add_use_case_comment(id: str, payload: schemas.UseCaseCommentCreate, gcp_db: Session = Depends(get_gcp_db)):
    uc = get_use_case_by_identifier(gcp_db, id)
    if not uc:
        raise HTTPException(status_code=404, detail="Use case not found")

    comment = models.UseCaseComment(
        use_case_id=uc.id,
        author_name=payload.author_name,
        content=payload.content
    )
    gcp_db.add(comment)
    gcp_db.commit()
    gcp_db.refresh(comment)
    return comment


@router.post("/use-cases/{id}/comments/{comment_id}/reply", response_model=schemas.UseCaseCommentResponse)
def reply_use_case_comment(id: str, comment_id: str, payload: schemas.UseCaseCommentReplyCreate, gcp_db: Session = Depends(get_gcp_db)):
    uc = get_use_case_by_identifier(gcp_db, id)
    if not uc:
        raise HTTPException(status_code=404, detail="Use case not found")

    comment = gcp_db.query(models.UseCaseComment).filter(
        models.UseCaseComment.id == comment_id,
        models.UseCaseComment.use_case_id == uc.id
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    comment.author_reply = payload.reply_content
    comment.author_replied_at = datetime.utcnow()

    gcp_db.commit()
    gcp_db.refresh(comment)
    return comment


@router.delete("/use-cases/{id}/comments/{comment_id}", status_code=204)
def delete_use_case_comment(id: str, comment_id: str, gcp_db: Session = Depends(get_gcp_db)):
    uc = get_use_case_by_identifier(gcp_db, id)
    if not uc:
        raise HTTPException(status_code=404, detail="Use case not found")

    comment = gcp_db.query(models.UseCaseComment).filter(
        models.UseCaseComment.id == comment_id,
        models.UseCaseComment.use_case_id == uc.id
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    gcp_db.delete(comment)
    gcp_db.commit()
