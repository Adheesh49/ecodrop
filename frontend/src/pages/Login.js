import { Link } from "react-router-dom";
import "../styles/auth.css";

function Login() {
  return (
    <div className="auth-container">

      <div className="auth-card">

        <h2>EcoDrop</h2>
        <p>Deliver Smarter. Live Greener.</p>

        <div className="switch-links">

          <Link to="/login" className="active">Login</Link>

          <Link to="/register">Register</Link>

        </div>

        <input type="email" placeholder="Email Address" />

        <input type="password" placeholder="Password" />

        <button className="auth-btn">Login as User</button>

      </div>

    </div>
  );
}

export default Login;