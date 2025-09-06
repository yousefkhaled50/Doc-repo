// src/pages/Upload.jsx
import { useState } from "react";
import { uploadDoc } from "../api";

export default function UploadPage({ token }) {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState(null);
  const [uploadedBy, setUploadedBy] = useState("");
  const [uploadedAt, setUploadedAt] = useState("");
  const [versionNum, setVersionNum] = useState("");

  async function handleUpload(e) {
    e.preventDefault();
    if (!token) return alert("Please login first");
    if (!file) return alert("Pick a file");

    // You may need to update your backend to accept these fields
    const res = await uploadDoc(token, title, tags, file, uploadedBy, uploadedAt, versionNum);
    if (res?.doc_id || res?.id) {
      alert("Uploaded successfully!");
      setTitle(""); setTags(""); setFile(null);
      setUploadedBy(""); setUploadedAt(""); setVersionNum("");
    } else {
      alert(res?.detail || "Upload failed");
    }
  }

  return (
    <div className="container">
      <h2>Upload Document</h2>
      <form className="form" onSubmit={handleUpload}>
        <input type="text" placeholder="Title" value={title} onChange={(e)=>setTitle(e.target.value)} required />
        <input type="text" placeholder="Tags (comma separated)" value={tags} onChange={(e)=>setTags(e.target.value)} />
        <input type="file" onChange={(e)=>setFile(e.target.files[0] || null)} required />
        <input type="text" placeholder="Uploaded By" value={uploadedBy} onChange={(e)=>setUploadedBy(e.target.value)} />
        <input type="text" placeholder="Uploaded At" value={uploadedAt} onChange={(e)=>setUploadedAt(e.target.value)} />
        <input type="text" placeholder="Version Number" value={versionNum} onChange={(e)=>setVersionNum(e.target.value)} />
        <button className="btn" type="submit">Upload</button>
      </form>
    </div>
  );
}
