// src/pages/Login.jsx
import { useState } from "react";
import { login } from "../api";
import { Link } from "react-router-dom";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    const data = await login(username, password);
    if (data && data.access_token) {
      localStorage.setItem("token", data.access_token);
      onLogin(data.access_token);
      alert("Logged in!");
    } else {
      alert(data?.detail || "Login failed");
    }
  }



  return (
    <div className="container">
  <h2>Login</h2>
  <p>Don't have an account? <Link to="/register">Register here</Link></p>
      <form className="form" onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="space-between">
          <button className="btn" type="submit">Login</button>
        </div>
      </form>
    </div>
  );
}
