// src/App.js
import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import UploadPage from "./pages/Upload";
import SearchPage from "./pages/Search";
import DocumentPage from "./pages/Document";
import ViewDocumentPage from "./pages/ViewDocument";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  const saveToken = (t) => {
    localStorage.setItem("token", t);
    setToken(t);
  };

  return (
    <BrowserRouter>
  {token && <Navbar token={token} />}
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage onLogin={saveToken} />} />
        <Route path="/register" element={<RegisterPage token={token} />} />
        <Route path="/upload" element={token ? <UploadPage token={token} /> : <Navigate to="/login" replace />} />
        <Route path="/search" element={token ? <SearchPage token={token} /> : <Navigate to="/login" replace />} />
  <Route path="/view-document" element={token ? <ViewDocumentPage token={token} /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<div style={{ padding: 20 }}>Not found.</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
