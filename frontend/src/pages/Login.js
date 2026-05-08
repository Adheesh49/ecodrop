import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/auth.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Forgot password flow state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1=email, 2=question, 3=success
  const [forgotEmail, setForgotEmail] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API}/login`, { email, password });
      localStorage.setItem("role", response.data.role);
      localStorage.setItem("name", response.data.name);
      alert(response.data.message);
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

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  // Step 1 — find account by email
  const handleFindAccount = async () => {
    if (!forgotEmail.trim()) return setForgotError("Please enter your email");
    setLoading(true);
    setForgotError("");
    try {
      const res = await axios.post(`${API}/forgot-password/question`, {
        email: forgotEmail.trim()
      });
      setSecurityQuestion(res.data.question);
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.response?.data?.message || "Account not found");
    }
    setLoading(false);
  };

  // Step 2 — verify answer and reset password
  const handleResetPassword = async () => {
    setForgotError("");
    if (!securityAnswer.trim()) return setForgotError("Please answer the security question");
    if (!newPassword) return setForgotError("Please enter a new password");
    if (newPassword.length < 6) return setForgotError("Password must be at least 6 characters");
    if (newPassword !== confirmPassword) return setForgotError("Passwords do not match");

    setLoading(true);
    try {
      const res = await axios.post(`${API}/forgot-password/reset`, {
        email: forgotEmail.trim(),
        answer: securityAnswer.trim(),
        newPassword
      });
      setForgotMsg(res.data.message);
      setForgotStep(3);
    } catch (err) {
      setForgotError(err.response?.data?.message || "Reset failed. Try again.");
    }
    setLoading(false);
  };

  const resetForgotFlow = () => {
    setShowForgot(false);
    setForgotStep(1);
    setForgotEmail("");
    setSecurityQuestion("");
    setSecurityAnswer("");
    setNewPassword("");
    setConfirmPassword("");
    setForgotMsg("");
    setForgotError("");
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        <div className="auth-logo">
          <img src="/images/ecodrop-logo.png" alt="EcoDrop Logo"/>
        </div>

        <p className="auth-tagline">Deliver Smarter. Live Greener.</p>

        {!showForgot ? (
          <>
            <div className="auth-tabs">
              <Link to="/login" className="auth-tab active">Login</Link>
              <Link to="/register" className="auth-tab">Register</Link>
            </div>

            <div className="auth-field">
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="auth-field">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <button className="auth-btn" onClick={handleLogin}>
              Login
            </button>

            <button
              className="auth-forgot-btn"
              onClick={() => setShowForgot(true)}
            >
              Forgot password?
            </button>
          </>
        ) : (
          <>
            {/* FORGOT PASSWORD FLOW */}
            <div className="forgot-header">
              <button className="forgot-back" onClick={resetForgotFlow}>
                ← Back to Login
              </button>
              <h3 className="forgot-title">Reset Password</h3>
            </div>

            {/* STEP INDICATOR */}
            <div className="forgot-steps">
              <div className={`forgot-step ${forgotStep >= 1 ? "active" : ""}`}>
                <span>1</span>
                <label>Find Account</label>
              </div>
              <div className="forgot-step-line"/>
              <div className={`forgot-step ${forgotStep >= 2 ? "active" : ""}`}>
                <span>2</span>
                <label>Verify</label>
              </div>
              <div className="forgot-step-line"/>
              <div className={`forgot-step ${forgotStep >= 3 ? "active" : ""}`}>
                <span>3</span>
                <label>Done</label>
              </div>
            </div>

            {/* STEP 1 — EMAIL */}
            {forgotStep === 1 && (
              <>
                <p className="forgot-desc">
                  Enter your registered email address to find your account.
                </p>
                <div className="auth-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="Enter your registered email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleFindAccount(); }}
                  />
                </div>
                {forgotError && (
                  <p className="forgot-error">⚠️ {forgotError}</p>
                )}
                <button
                  className="auth-btn"
                  onClick={handleFindAccount}
                  disabled={loading}
                >
                  {loading ? "Searching..." : "Find My Account →"}
                </button>
              </>
            )}

            {/* STEP 2 — SECURITY QUESTION + NEW PASSWORD */}
            {forgotStep === 2 && (
              <>
                <p className="forgot-desc">
                  Answer your security question to verify your identity.
                </p>
                <div className="auth-field">
                  <label>Security Question</label>
                  <div className="forgot-question-box">
                    🔐 {securityQuestion}
                  </div>
                </div>
                <div className="auth-field">
                  <label>Your Answer</label>
                  <input
                    type="text"
                    placeholder="Enter your answer"
                    value={securityAnswer}
                    onChange={e => setSecurityAnswer(e.target.value)}
                  />
                </div>
                <div className="auth-field">
                  <label>New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password (min 6 characters)"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="auth-field">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleResetPassword(); }}
                  />
                </div>
                {forgotError && (
                  <p className="forgot-error">⚠️ {forgotError}</p>
                )}
                <button
                  className="auth-btn"
                  onClick={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Reset Password →"}
                </button>
              </>
            )}

            {/* STEP 3 — SUCCESS */}
            {forgotStep === 3 && (
              <div className="forgot-success">
                <span>✅</span>
                <h3>Password Reset!</h3>
                <p>{forgotMsg}</p>
                <button className="auth-btn" onClick={resetForgotFlow}>
                  Back to Login
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}

export default Login;