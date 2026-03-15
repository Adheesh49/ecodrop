import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/auth.css";

function Login() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="auth-container">
      <div className="auth-card">

        {/* Logo */}
        <div className="auth-logo">
          <img src="/images/ecodrop-logo.png" alt="EcoDrop Logo" />
        </div>

        {/* Tagline */}
        <p className="auth-tagline">Deliver Smarter. Live Greener.</p>

        {/* Tab switcher */}
        <div className="auth-tabs">
          <Link to="/login" className="auth-tab active">Login</Link>
          <Link to="/register" className="auth-tab">Register</Link>
        </div>

        {/* Email field */}
        <div className="auth-field">
          <label>Email Address</label>
          <input type="email" placeholder="Enter your email" />
        </div>

        {/* Password field */}
        <div className="auth-field">
          <label>Password</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
            />
            <button
              className="toggle-eye"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Login button */}
        <button className="auth-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          Login as User
        </button>

        {/* Info banner */}
        <div className="auth-banner">
          <span className="banner-icon">🌿</span>
          <p>
            <strong>Welcome to EcoDrop!</strong> Join our community of eco-conscious
            individuals sharing items sustainably while reducing waste and
            environmental impact.
          </p>
        </div>

      </div>
    </div>
  );
}

export default Login;