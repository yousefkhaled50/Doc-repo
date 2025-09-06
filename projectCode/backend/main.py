import os
import jwt 
from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm, HTTPAuthorizationCredentials, HTTPBearer
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from database import Base, engine, SessionLocal
from models import User, Document, DocumentVersion, Tag, DocumentTags, Permission
from schemas import UserCreate, UserOut, DocumentOut, DocumentVersionOut
from auth import get_password_hash, verify_password, create_access_token
from typing import List

# ----------------- FastAPI App & Middleware -----------------
app = FastAPI()
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Security -----------------
security = HTTPBearer()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ----------------- DB Setup -----------------
Base.metadata.create_all(bind=engine)
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ----------------- Dependencies -----------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ----------------- Endpoints -----------------

@app.post("/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    hashed_pw = get_password_hash(user.password)
    db_user = User(username=user.username, password=hashed_pw, role=user.role, dep_id=user.dep_id)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.user_id)})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/document/{doc_id}", response_model=DocumentOut)
def get_document(doc_id: int, db: Session = Depends(get_db), credentials: HTTPAuthorizationCredentials = Security(security)):
    try:
        payload = jwt.decode(credentials.credentials, options={"verify_signature": False})
        user_id = int(payload.get("sub"))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user or user.dep_id not in [1, 2]:
        raise HTTPException(status_code=403, detail="Access denied: department not allowed")
    doc = db.query(Document).filter(Document.doc_id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    # Get tags and versions
    tags = doc.tags
    versions = db.query(DocumentVersion).filter(DocumentVersion.doc_id == doc.doc_id).all()
    # Serialize
    from schemas import DocumentOut, TagOut, DocumentVersionOut
    return DocumentOut(
        doc_id=doc.doc_id,
        title=doc.title,
        current_ver_id=doc.current_ver_id,
        tags=[TagOut.from_orm(t) for t in tags],
        versions=[DocumentVersionOut.from_orm(v) for v in versions]
    )

# ----------------- Upload Document -----------------
@app.post("/upload", response_model=DocumentOut)
def upload_document(
    title: str = Form(...),
    tags: str = Form(...),  # comma-separated
    file: UploadFile = File(...),
    uploaded_by: int = Form(None),
    uploaded_at: str = Form(None),
    version_num: int = Form(None),
    db: Session = Depends(get_db)
):
    filepath = os.path.join(UPLOAD_DIR, file.filename)
    with open(filepath, "wb") as f:
        f.write(file.file.read())

    # Create document
    db_doc = Document(title=title)
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)

    # Add tags
    for tag_name in tags.split(","):
        tag_name = tag_name.strip()
        tag = db.query(Tag).filter(Tag.name == tag_name).first()
        if not tag:
            tag = Tag(name=tag_name)
            db.add(tag)
            db.commit()
            db.refresh(tag)
        db.execute(
            DocumentTags.__table__.insert().values(doc_id=db_doc.doc_id, tag_id=tag.tag_id)
        )

    # Create first version
    # Parse uploaded_at if provided
    from datetime import datetime
    upload_date = None
    if uploaded_at:
        try:
            upload_date = datetime.fromisoformat(uploaded_at)
        except Exception:
            upload_date = datetime.utcnow()
    else:
        upload_date = datetime.utcnow()

    version = DocumentVersion(
        doc_id=db_doc.doc_id,
        uploaded_by=uploaded_by if uploaded_by else 1,
        ver_num=version_num if version_num else 1,
        file_path=file.filename,
        upload_date=upload_date
    )
    db.add(version)
    db.commit()
    db.refresh(version)

    db_doc.current_ver_id = version.version_id
    db.commit()

    return db_doc

# ----------------- Search Documents -----------------
@app.get("/search", response_model=List[DocumentOut])
def search_documents(q: str, db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.title.contains(q)).all()
    from schemas import DocumentOut, TagOut, DocumentVersionOut
    result = []
    for doc in docs:
        tags = doc.tags
        versions = db.query(DocumentVersion).filter(DocumentVersion.doc_id == doc.doc_id).all()
        result.append(DocumentOut(
            doc_id=doc.doc_id,
            title=doc.title,
            current_ver_id=doc.current_ver_id,
            tags=[TagOut.from_orm(t) for t in tags],
            versions=[DocumentVersionOut.from_orm(v) for v in versions]
        ))
    return result

# ----------------- Download Document -----------------
@app.get("/download/{doc_id}")
def download_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.doc_id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    version = db.query(DocumentVersion).filter(DocumentVersion.version_id == doc.current_ver_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="No version found")
    filepath = os.path.join(UPLOAD_DIR, version.file_path)
    return FileResponse(filepath, filename=version.file_path)

# ----------------- Version History -----------------
@app.get("/versions/{doc_id}", response_model=List[DocumentVersionOut])
def get_versions(doc_id: int, db: Session = Depends(get_db)):
    return db.query(DocumentVersion).filter(DocumentVersion.doc_id == doc_id).all()

# ----------------- Preview File Content -----------------
@app.get("/preview/{doc_id}/{version_id}")
def preview_file(doc_id: int, version_id: int, db: Session = Depends(get_db)):
    version = db.query(DocumentVersion).filter(DocumentVersion.version_id == version_id, DocumentVersion.doc_id == doc_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    filepath = os.path.join(UPLOAD_DIR, version.file_path)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    # Detect file type
    import mimetypes
    mime, _ = mimetypes.guess_type(filepath)
    if mime and mime.startswith("image/"):
        with open(filepath, "rb") as f:
            return Response(content=f.read(), media_type=mime)
    elif mime and (mime.startswith("text/") or mime in ["application/json", "application/xml"]):
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            return Response(content=f.read(), media_type=mime or "text/plain")
    else:
        raise HTTPException(status_code=415, detail="Preview not supported for this file type")