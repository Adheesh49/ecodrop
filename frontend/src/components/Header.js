import { Link } from "react-router-dom";
import "./Header.css";

function Header() {
  return (
    <header className="header">

      <div className="logo-container">

        <img
          src="/images/ecodrop-logo.png"
          alt="EcoDrop Logo"
          className="logo"
        />

        <h2>EcoDrop</h2>

      </div>

      <nav>

        <Link to="/">Home</Link>

        <Link to="/login">Login</Link>

        <Link to="/register">Register</Link>

      </nav>

    </header>
  );
}

export default Header;