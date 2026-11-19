import { useAuth } from "../context/useAuth";
import { Link } from "react-router-dom";

const roleNames = {
  administrator: "Administrator",
  investigation_officer: "Investigation Officer",
  forensic_analyst: "Forensic Analyst",
  authorized_reviewer: "Authorized Reviewer",
};

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h2>Digital Evidence Vault</h2>
          <span>Evidence Management System</span>
        </div>

        <button onClick={logout} className="logout-button">
          Logout
        </button>
      </header>

      <main className="dashboard-content">
        <p className="dashboard-label">OVERVIEW</p>

        <h1>Welcome, {user?.name || "User"}</h1>

        <p className="dashboard-role">{roleNames[user?.role] || user?.role}</p>

        <div className="dashboard-card">
          <h3>Authentication Successful</h3>
          <p>You are securely logged in to the Digital Evidence Vault.</p>

          <p>
            <strong>Email:</strong> {user?.email}
          </p>
          <p>
            <strong>User ID:</strong> {user?.userId}
          </p>
          <p>
            <strong>Role:</strong> {user?.role}
          </p>
        </div>

        <h2 className="modules-heading">System Modules</h2>

        <div className="module-grid">
          {user?.role === "administrator" && (
            <Link to="/users" className="module-card module-link">
              User Management
            </Link>
          )}

          <Link to="/cases" className="module-card module-link">
            <h3>Case Management</h3>
            <p>Create, search, view and manage investigation cases.</p>
          </Link>

          {/* Navigates to the Evidence Management module. */}
          <Link to="/evidence" className="module-card module-link">
            <h3>Evidence Management</h3>
            <p>View, upload and manage digital evidence records.</p>
          </Link>

          <Link to="/custody" className="module-card module-link">
            <h3>Chain of Custody</h3>
            <p>View evidence custody records and transfer history.</p>
          </Link>

          <div className="module-card">
            <h3>Audit Management</h3>
            <p>Review system audit activities.</p>
          </div>

          <div className="module-card">
            <h3>Report Management</h3>
            <p>Generate and review system reports.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
