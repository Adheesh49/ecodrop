import { Link } from "react-router-dom";
// EDIT: removed all inline styles — moved to Home.css so dark mode CSS can override them
import "./Home.css";

function Home() {
  return (
    <div className="home-container">

      <h1 className="home-logo">EcoDrop</h1>

      <p className="home-tagline">
        Share. Borrow. Reduce Waste.
      </p>

      <p className="home-desc">
        EcoDrop helps communities share household items instead of buying new ones.
        Save money and reduce environmental waste.
      </p>

      <div className="home-buttons">

        <Link to="/login">
          <button className="home-login-btn">Login</button>
        </Link>

        <Link to="/register">
          <button className="home-register-btn">Register</button>
        </Link>

      </div>

    </div>
  );
}

export default Home;