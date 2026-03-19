import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";

// EDIT: removed Header and Footer imports — each layout handles its own header/footer
// Layout.js wraps Home/Login/Register with the public Header + Footer
// DashboardLayout.js wraps Dashboard with DashboardHeader + Footer

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("darkMode") === "true";
    setDarkMode(saved);
    // sync document.body class on initial load so dark mode persists on refresh
    document.body.classList.toggle("dark-mode", saved);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", newMode);
    // apply dark-mode to document.body so ALL pages are affected globally
    document.body.classList.toggle("dark-mode", newMode);
  };

  return (
    <BrowserRouter>
      {/* EDIT: removed <Header> and <Footer> from here — they were rendering on every page
          including Dashboard, causing the double header/footer issue */}
      <div className={darkMode ? "app dark" : "app"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* pass toggleDarkMode to Dashboard so it reaches DashboardHeader */}
          <Route path="/dashboard" element={<Dashboard toggleDarkMode={toggleDarkMode} />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;