import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {

  const navigate = useNavigate();

  useEffect(() => {

    const role = localStorage.getItem("role");

    // BLOCK NON ADMINS
    if (role !== "admin") {
      alert("Access denied");
      navigate("/login");
    }

  }, [navigate]); 

  return (
    <div style={{padding:"40px"}}>
      <h1>Admin Dashboard</h1>
      <p>Welcome Admin</p>
    </div>
  );
}

export default AdminDashboard;