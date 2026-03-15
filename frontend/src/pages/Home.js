import { Link } from "react-router-dom";

function Home() {
  return (
    <div style={styles.container}>

      <h1 style={styles.logo}>EcoDrop</h1>

      <p style={styles.tagline}>
        Share. Borrow. Reduce Waste.
      </p>

      <p style={styles.desc}>
        EcoDrop helps communities share household items instead of buying new ones.
        Save money and reduce environmental waste.
      </p>

      <div style={styles.buttons}>

        <Link to="/login">
          <button style={styles.loginBtn}>Login</button>
        </Link>

        <Link to="/register">
          <button style={styles.registerBtn}>Register</button>
        </Link>

      </div>

    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#dff5e1",
    textAlign: "center"
  },

  logo: {
    fontSize: "48px",
    color: "#0a8f3d"
  },

  tagline: {
    fontSize: "22px",
    marginTop: "10px"
  },

  desc: {
    width: "400px",
    marginTop: "15px"
  },

  buttons: {
    marginTop: "30px"
  },

  loginBtn: {
    padding: "12px 30px",
    marginRight: "15px",
    background: "#0a8f3d",
    color: "white",
    border: "none",
    borderRadius: "6px"
  },

  registerBtn: {
    padding: "12px 30px",
    background: "#2ecc71",
    color: "white",
    border: "none",
    borderRadius: "6px"
  }
};

export default Home;