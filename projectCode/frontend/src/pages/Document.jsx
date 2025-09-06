// src/pages/Document.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getDocument, apiBaseUrl, previewFile } from "../api";

export default function DocumentPage({ token }) {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [preview, setPreview] = useState({}); // versionId -> {type, data}
  const [loadingPreview, setLoadingPreview] = useState(null);

  useEffect(() => {
    if (!token) return;
    getDocument(token, id).then(setDoc);
  }, [token, id]);

  async function handlePreview(versionId) {
    setLoadingPreview(versionId);
    const result = await previewFile(id, versionId);
    setPreview(prev => ({ ...prev, [versionId]: result }));
    setLoadingPreview(null);
  }

  if (!token) return <div className="container"><p>Please login first.</p></div>;
  if (!doc) return <div className="container"><p>Loading…</p></div>;

  return (
    <div className="container">
      <h2>{doc.title}</h2>

      {doc.tags?.length ? (
        <div className="stack" style={{ marginBottom: 12 }}>
          {doc.tags.map(t => <span className="tag" key={t.tag_id}>{t.name}</span>)}
        </div>
      ) : null}

      <h3>Versions</h3>
      <div style={{ marginTop: 8 }}>
        {doc.versions?.length ? doc.versions.map(v => (
          <div className="card" key={v.version_id}>
            <div className="space-between">
              <div>
                <div><strong>Version {v.ver_num}</strong></div>
                <div className="meta">{new Date(v.upload_date).toLocaleString()}</div>
              </div>
              <div className="row">
                <a className="btn" href={`${apiBaseUrl}/download/${doc.doc_id}`} target="_blank" rel="noreferrer">Download</a>
                <button className="btn-secondary" onClick={() => handlePreview(v.version_id)} disabled={loadingPreview === v.version_id}>
                  {loadingPreview === v.version_id ? "Loading..." : "Preview"}
                </button>
              </div>
            </div>
            {preview[v.version_id] && (
              <div style={{ marginTop: 12 }}>
                {preview[v.version_id].type === "image" ? (
                  <img src={preview[v.version_id].data} alt="Preview" style={{ maxWidth: "100%", maxHeight: 300 }} />
                ) : (
                  <pre style={{ background: "#f6f7fb", padding: 10, borderRadius: 8, maxHeight: 300, overflow: "auto" }}>{preview[v.version_id].data}</pre>
                )}
              </div>
            )}
          </div>
        )) : <p className="meta">No versions found.</p>}
      </div>
    </div>
  );
}
