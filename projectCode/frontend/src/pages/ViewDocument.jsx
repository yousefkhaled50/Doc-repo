import { useState, useEffect } from "react";
import { searchDocs, apiBaseUrl, previewFile } from "../api";
import { Link } from "react-router-dom";

export default function ViewDocumentPage({ token }) {
  const [allDocs, setAllDocs] = useState([]);
  const [groupedDocs, setGroupedDocs] = useState({});
  const [selectedTitle, setSelectedTitle] = useState("");
  const [preview, setPreview] = useState({}); // versionId -> {type, data}
  const [loadingPreview, setLoadingPreview] = useState(null);

  useEffect(() => {
    async function fetchAll() {
      const data = await searchDocs(token, "");
      setAllDocs(Array.isArray(data) ? data : []);
      // Group by title
      const grouped = {};
      (Array.isArray(data) ? data : []).forEach(doc => {
        if (!grouped[doc.title]) grouped[doc.title] = [];
        grouped[doc.title].push(doc);
      });
      setGroupedDocs(grouped);
    }
    if (token) fetchAll();
  }, [token]);

  function handleSelectTitle(e) {
    setSelectedTitle(e.target.value);
    setPreview({});
  }

  async function handlePreview(docId, versionId) {
    setLoadingPreview(versionId);
    const result = await previewFile(docId, versionId);
    setPreview(prev => ({ ...prev, [versionId]: result }));
    setLoadingPreview(null);
  }

  return (
    <div className="container">
      <h2>View Document</h2>
      <label>All Documents (by title): </label>
      <select value={selectedTitle} onChange={handleSelectTitle}>
        <option value="">Select a document title</option>
        {Object.keys(groupedDocs).map(title => (
          <option key={title} value={title}>{title}</option>
        ))}
      </select>
      {selectedTitle && (
        <div style={{ marginTop: 8 }}>
          <strong>Versions for "{selectedTitle}":</strong>
          <ul>
            {groupedDocs[selectedTitle].map(doc => (
              <li key={doc.doc_id}>
                <div>
                  <strong>ID:</strong> {doc.doc_id} 
                </div>
                <div><strong>Metadata:</strong></div>
                <ul>
                  {doc.versions?.map(v => (
                    <li key={v.version_id}>
                      <div><strong>Tags:</strong> {doc.tags?.map(t => t.name).join(', ') || 'None'}</div>
                      <div><strong>Uploaded By (User ID):</strong> {v.uploaded_by || 'N/A'}</div>
                      <div><strong>Uploaded At:</strong> {v.upload_date ? new Date(v.upload_date).toLocaleString() : 'N/A'}</div>
                      <div><strong>Version:</strong> {v.ver_num}</div>
                      <a href={`${apiBaseUrl}/download/${doc.doc_id}`} target="_blank" rel="noreferrer">Download</a>
                      <button className="btn-secondary" style={{ marginLeft: 8 }} onClick={() => handlePreview(doc.doc_id, v.version_id)} disabled={loadingPreview === v.version_id}>
                        {loadingPreview === v.version_id ? "Loading..." : "view Content"}
                      </button>
                      {preview[v.version_id] && (
                        <div style={{ marginTop: 12 }}>
                          {preview[v.version_id].type === "image" ? (
                            <img src={preview[v.version_id].data} alt="Preview" style={{ maxWidth: "100%", maxHeight: 300 }} />
                          ) : (
                            <pre style={{ background: "#f6f7fb", padding: 10, borderRadius: 8, maxHeight: 300, overflow: "auto" }}>{preview[v.version_id].data}</pre>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}