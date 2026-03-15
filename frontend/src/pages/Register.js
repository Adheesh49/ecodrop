import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/auth.css";

function Register() {

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="auth-container">
      <div className="auth-card">

        {/* Logo */}
        <div className="auth-logo">
          <img src="/images/ecodrop-logo.png" alt="EcoDrop Logo" />
        </div>

        <p className="auth-tagline">
          Deliver Smarter. Live Greener.
        </p>

        {/* Tabs */}
        <div className="auth-tabs">
          <Link to="/login" className="auth-tab">Login</Link>
          <Link to="/register" className="auth-tab active">Register</Link>
        </div>


        {/* Full Name */}
        <div className="auth-field">
          <label>Full Name</label>
          <input type="text" placeholder="Enter your full name"/>
        </div>


        {/* Email */}
        <div className="auth-field">
          <label>Email Address</label>
          <input type="email" placeholder="Enter your email"/>
        </div>


        {/* Phone */}
        <div className="auth-field">
          <label>Phone Number</label>
          <input type="text" placeholder="Enter your phone number"/>
        </div>


        {/* Password */}
        <div className="auth-field">
          <label>Password</label>

          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
            />

            <button
              className="toggle-eye"
              onClick={() => setShowPassword(!showPassword)}
            >
              👁
            </button>
          </div>

        </div>


        {/* Confirm Password */}
        <div className="auth-field">
          <label>Confirm Password</label>
          <input type="password" placeholder="Confirm your password"/>
        </div>


        {/* Register Button */}
        <button className="auth-btn">
          Register
        </button>


        {/* Info Banner */}
        <div className="auth-banner">
          <span className="banner-icon">🌱</span>
          <p>
            <strong>Welcome to EcoDrop!</strong> Join our community of
            eco-conscious individuals sharing items sustainably while
            reducing waste and environmental impact.
          </p>
        </div>

      </div>
    </div>
  );
}

export default Register;