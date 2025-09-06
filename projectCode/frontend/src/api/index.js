// Preview file content (text or image)
export const previewFile = async (docId, versionId) => {
  const res = await fetch(`${API_URL}/preview/${docId}/${versionId}`);
  // For images, return blob; for text, return text
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.startsWith('image/')) {
    return { type: 'image', data: URL.createObjectURL(await res.blob()) };
  } else {
    return { type: 'text', data: await res.text() };
  }
};
// src/api/index.js
const API_URL = "http://127.0.0.1:8000";


export const login = async (username, password) => {
  const body = new URLSearchParams();
  body.append("username", username);
  body.append("password", password);

  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  return res.json();
};

export const register = async (username, password, role = "user", dep_id = 1) => {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, role, dep_id }),
  });
  return res.json();
};

export const uploadDoc = async (token, title, tags, file, uploadedBy, uploadedAt, versionNum) => {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("tags", tags);
  formData.append("file", file);
  if (uploadedBy) formData.append("uploaded_by", uploadedBy);
  if (uploadedAt) formData.append("uploaded_at", uploadedAt);
  if (versionNum) formData.append("version_num", versionNum);

  const res = await fetch(`${API_URL}/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return res.json();
};

export const searchDocs = async (token, q) => {
  const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(q)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const getDocument = async (token, id) => {
  const res = await fetch(`${API_URL}/document/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const apiBaseUrl = API_URL;
