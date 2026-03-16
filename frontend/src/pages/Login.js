import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/auth.css";

function Login() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {

    try {

      const response = await axios.post(
        "http://127.0.0.1:5000/login",
        {
          email: email,
          password: password
        }
      );

      // STORE USER INFO IN BROWSER
      localStorage.setItem("role", response.data.role);
      localStorage.setItem("name", response.data.name);

      alert(response.data.message);

      // REDIRECT BASED ON ROLE
      if (response.data.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/dashboard");
      }

    } catch (error) {

      if (error.response) {
        alert(error.response.data.message);
      } else {
        alert("Server error");
      }

    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        {/* Logo */}
        <div className="auth-logo">
          <img src="/images/ecodrop-logo.png" alt="EcoDrop Logo"/>
        </div>

        {/* Tagline */}
        <p className="auth-tagline">Deliver Smarter. Live Greener.</p>

        {/* Tabs */}
        <div className="auth-tabs">
          <Link to="/login" className="auth-tab active">Login</Link>
          <Link to="/register" className="auth-tab">Register</Link>
        </div>

        {/* Email */}
        <div className="auth-field">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="auth-field">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Login Button */}
        <button
          className="auth-btn"
          onClick={handleLogin}
        >
          Login
        </button>

      </div>
    </div>
  );
}

export default Login;