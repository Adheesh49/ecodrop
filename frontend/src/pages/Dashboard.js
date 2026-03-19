import DashboardLayout from "../layouts/DashboardLayout";

// EDIT: accept toggleDarkMode from App.js via the route prop
function Dashboard({ toggleDarkMode }) {
  return (
    // EDIT: forward toggleDarkMode down to DashboardLayout
    <DashboardLayout toggleDarkMode={toggleDarkMode}>
      <h1>Welcome back 👋</h1>
    </DashboardLayout>
  );
}

export default Dashboard;