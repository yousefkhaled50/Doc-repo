// src/pages/Search.jsx
import { useState } from "react";
import { searchDocs, previewFile } from "../api";
import { Link } from "react-router-dom";

export default function SearchPage({ token }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [preview, setPreview] = useState({}); // docId -> {type, data}
  const [loadingPreview, setLoadingPreview] = useState(null);

  async function onSearch(e) {
    e.preventDefault();
    if (!token) return alert("Please login first");
    const data = await searchDocs(token, q);
    setResults(Array.isArray(data) ? data : []);
    setPreview({});
  }

  async function handlePreview(docId, versionId) {
    setLoadingPreview(docId);
    const result = await previewFile(docId, versionId);
    setPreview(prev => ({ ...prev, [docId]: result }));
    setLoadingPreview(null);
  }

  return (
    <div className="container">
      <h2>Search Documents</h2>
      <form className="form" onSubmit={onSearch}>
        <input type="text" placeholder="Search by title, tag, uploader…" value={q} onChange={e=>setQ(e.target.value)} />
        <button className="btn" type="submit">Search</button>
      </form>

      <div style={{ marginTop: 16 }}>
        {results.map(doc => (
          <div className="card" key={doc.doc_id || doc.id}>
            <div className="space-between">
              <div>
                <strong>{doc.title}</strong>
                {doc.tags?.length ? (
                  <div className="stack" style={{ marginTop: 6 }}>
                    {doc.tags.map(t => <span className="tag" key={t.tag_id || t.name}>{t.name}</span>)}
                  </div>
                ) : null}
              </div>
              <div className="row">
                {doc.versions && doc.versions.length > 0 && (
                  <button className="btn-secondary" style={{ marginLeft: 0 }} onClick={() => handlePreview(doc.doc_id, doc.versions[0].version_id)} disabled={loadingPreview === doc.doc_id}>
                    {loadingPreview === doc.doc_id ? "Loading..." : "Open Content"}
                  </button>
                )}
              </div>
            </div>
            {preview[doc.doc_id] && (
              <div style={{ marginTop: 12 }}>
                {preview[doc.doc_id].type === "image" ? (
                  <img src={preview[doc.doc_id].data} alt="Preview" style={{ maxWidth: "100%", maxHeight: 300 }} />
                ) : (
                  <pre style={{ background: "#f6f7fb", padding: 10, borderRadius: 8, maxHeight: 300, overflow: "auto" }}>{preview[doc.doc_id].data}</pre>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
