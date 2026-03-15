import { Link } from "react-router-dom";
import "../styles/auth.css";

function Register() {
  return (
    <div className="auth-container">

      <div className="auth-card">

        <h2>Create Account</h2>

        <div className="switch-links">

          <Link to="/login">Login</Link>

          <Link to="/register" className="active">Register</Link>

        </div>

        <input type="text" placeholder="Full Name" />

        <input type="email" placeholder="Email Address" />

        <input type="password" placeholder="Password" />

        <button className="auth-btn">Register</button>

      </div>

    </div>
  );
}

export default Register;