from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Department(Base):
    __tablename__ = "department"
    dep_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    users = relationship("User", back_populates="department")
    permissions = relationship("Permission", back_populates="department")


class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)
    dep_id = Column(Integer, ForeignKey("department.dep_id"))

    department = relationship("Department", back_populates="users")
    documents_uploaded = relationship("DocumentVersion", back_populates="uploader")


class Document(Base):
    __tablename__ = "documents"
    doc_id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    current_ver_id = Column(Integer, ForeignKey("document_version.version_id"), nullable=True)
    versions = relationship(
        "DocumentVersion",
        back_populates="document",
        foreign_keys="DocumentVersion.doc_id"
    )
    tags = relationship("Tag", secondary="document_tags", back_populates="documents")
    permissions = relationship("Permission", back_populates="document")


class DocumentVersion(Base):
    __tablename__ = "document_version"
    version_id = Column(Integer, primary_key=True, index=True)
    doc_id = Column(Integer, ForeignKey("documents.doc_id"))
    uploaded_by = Column(Integer, ForeignKey("users.user_id"))
    ver_num = Column(Integer, nullable=False)
    file_path = Column(String, nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    document = relationship(
        "Document",
        back_populates="versions",
        foreign_keys="DocumentVersion.doc_id"
    )
    uploader = relationship("User", back_populates="documents_uploaded")


class Tag(Base):
    __tablename__ = "tags"
    tag_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    documents = relationship("Document", secondary="document_tags", back_populates="tags")


class DocumentTags(Base):
    __tablename__ = "document_tags"
    doc_id = Column(Integer, ForeignKey("documents.doc_id"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.tag_id"), primary_key=True)


class Permission(Base):
    __tablename__ = "permission"
    document_id = Column(Integer, ForeignKey("documents.doc_id"), primary_key=True)
    department_id = Column(Integer, ForeignKey("department.dep_id"), primary_key=True)

    document = relationship("Document", back_populates="permissions")
    department = relationship("Department", back_populates="permissions")
