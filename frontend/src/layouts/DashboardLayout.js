import DashboardHeader from "../components/DashboardHeader";
import Footer from "../components/Footer";
import "../components/dashboardLayout.css";

function DashboardLayout({ children }) {
  return (
    <div className="dash-layout">
      <DashboardHeader />

      <div className="dash-content">
        {children}
      </div>

      <Footer />
    </div>
  );
}

export default DashboardLayout;