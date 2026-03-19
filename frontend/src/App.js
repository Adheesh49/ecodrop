import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";

// PAGES
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Items from "./pages/Items";
import ItemDetail from "./pages/ItemDetail";
import AddItem from "./pages/AddItem"; // EDIT: added AddItem page

// LAYOUT
import Layout from "./components/Layout";

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("darkMode") === "true";
    setDarkMode(saved);
    document.body.classList.toggle("dark-mode", saved);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", newMode);
    document.body.classList.toggle("dark-mode", newMode);
  };

  return (
    <BrowserRouter>
      <div className={darkMode ? "app dark" : "app"}>
        <Routes>

          {/* PUBLIC — wrapped in Layout for public Header + Footer */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/login" element={<Layout><Login /></Layout>} />
          <Route path="/register" element={<Layout><Register /></Layout>} />

          {/* DASHBOARD — DashboardLayout is used internally */}
          <Route path="/dashboard" element={<Dashboard toggleDarkMode={toggleDarkMode} />} />
          <Route path="/items" element={<Items toggleDarkMode={toggleDarkMode} />} />
          <Route path="/items/:id" element={<ItemDetail toggleDarkMode={toggleDarkMode} />} />
          {/* EDIT: Add Item is its own page, accessible from nav and items page button */}
          <Route path="/add-item" element={<AddItem toggleDarkMode={toggleDarkMode} />} />
          <Route path="/admin-dashboard" element={<AdminDashboard toggleDarkMode={toggleDarkMode} />} />

        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;