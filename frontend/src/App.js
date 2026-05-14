import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Items from "./pages/Items";
import ItemDetail from "./pages/ItemDetail";
import AddItem from "./pages/AddItem";
import Messages from "./pages/Messages";
import Courier from "./pages/Courier";
import MyOrders from "./pages/MyOrders";
import Layout from "./components/Layout";

// Protected route — redirects if role doesn't match
function ProtectedRoute({ children, allowedRoles }) {
  const role = localStorage.getItem("role");
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

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

          {/* PUBLIC */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/login" element={<Layout><Login /></Layout>} />
          <Route path="/register" element={<Layout><Register /></Layout>} />

          {/* REGULAR USER ROUTES */}
          <Route path="/dashboard" element={<Dashboard toggleDarkMode={toggleDarkMode} />} />
          <Route path="/items" element={<Items toggleDarkMode={toggleDarkMode} />} />
          <Route path="/items/:id" element={<ItemDetail toggleDarkMode={toggleDarkMode} />} />
          <Route path="/add-item" element={<AddItem toggleDarkMode={toggleDarkMode} />} />
          <Route path="/messages" element={<Messages toggleDarkMode={toggleDarkMode} />} />
          <Route path="/my-orders" element={<MyOrders toggleDarkMode={toggleDarkMode} />} />

          {/* COURIER ONLY — redirects regular users to dashboard */}
          <Route
            path="/courier"
            element={
              <ProtectedRoute allowedRoles={["courier", "admin"]}>
                <Courier toggleDarkMode={toggleDarkMode} />
              </ProtectedRoute>
            }
          />

          {/* ADMIN ONLY */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard toggleDarkMode={toggleDarkMode} />
              </ProtectedRoute>
            }
          />

        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;