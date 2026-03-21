import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/auth.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async () => {
    try {
      const response = await axios.post(
        `${API}/register`,
        formData
      );

      alert(response.data.message);
      navigate("/login");

    } catch (error) {
      if (error.response) {
        alert(error.response.data.message);
      } else {
        alert("Server error");
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleRegister();
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        <div className="auth-logo">
          <img src="/images/ecodrop-logo.png" alt="EcoDrop Logo"/>
        </div>

        <p className="auth-tagline">Deliver Smarter. Live Greener.</p>

        <div className="auth-tabs">
          <Link to="/login" className="auth-tab">Login</Link>
          <Link to="/register" className="auth-tab active">Register</Link>
        </div>

        <div className="auth-field">
          <label>Name</label>
          <input
            name="name"
            placeholder="Enter your name"
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="auth-field">
          <label>Email</label>
          <input
            name="email"
            placeholder="Enter your email"
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="auth-field">
          <label>Phone</label>
          <input
            name="phone"
            placeholder="Enter your phone"
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="auth-field">
          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
        </div>

        <button className="auth-btn" onClick={handleRegister}>
          Register
        </button>

      </div>
    </div>
  );
}

export default Register;