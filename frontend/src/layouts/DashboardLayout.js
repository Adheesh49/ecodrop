import DashboardHeader from "../components/DashboardHeader";
import Footer from "../components/Footer";
import "../components/dashboardLayout.css";

// EDIT: accept toggleDarkMode and forward it to DashboardHeader
function DashboardLayout({ children, toggleDarkMode }) {
  return (
    <div className="dash-layout">
      {/* EDIT: pass toggleDarkMode so DashboardHeader can call it from the dropdown */}
      <DashboardHeader toggleDarkMode={toggleDarkMode} />

      <div className="dash-content">
        {children}
      </div>

      <Footer />
    </div>
  );
}

export default DashboardLayout;