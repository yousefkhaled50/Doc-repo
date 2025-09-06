// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";


export default function Navbar({ token }) {
  const navigate = useNavigate();

  if (!token) return null;

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="navbar">
      <div className="brand">📂 DocRepo</div>
      <div>
        <Link to="/upload">Upload</Link>
        <Link to="/search">Search</Link>
        <Link to="/view-document">View Document</Link>
        <button className="btn-link" onClick={logout}>Logout</button>
      </div>
    </div>
  );
}
