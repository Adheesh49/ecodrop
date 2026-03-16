function Dashboard() {

  const name = localStorage.getItem("name");

  return (
    <div style={{padding:"40px"}}>
      <h1>User Dashboard</h1>
      <p>Welcome {name}</p>
    </div>
  );

}

export default Dashboard;