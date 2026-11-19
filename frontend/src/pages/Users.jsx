
import { useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/useAuth";

export default function Users() {
  const { user } = useAuth();

  // Stores the information entered in the user registration form.
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });

  // Tracks form submission and displays feedback.
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Updates the form whenever an input value changes.
  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  // Creates a new user account through the backend API.
  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      // POST /api/users creates a new account.
      const response = await api.post("/users", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      });

      setSuccessMessage(
        response.data.message || "User account created successfully."
      );

      // Clear the form after successful registration.
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "",
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create user account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Only administrators can access user management.
  if (user?.role !== "administrator") {
    return (
      <main className="cases-page">
        <section className="cases-panel">
          <h1>User Management</h1>
          <div className="error-message">
            You are not authorized to manage user accounts.
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="cases-page">
      {/* Page heading. */}
      <div className="page-heading">
        <div>
          <h1>User Management</h1>
          <p>Create and manage Digital Evidence Vault user accounts.</p>
        </div>
      </div>

      {/* User registration form. */}
      <section className="cases-panel">
        <div className="panel-heading">
          <div>
            <h2>Create New User</h2>
            <p className="muted-text">
              Register a user and assign an appropriate system role.
            </p>
          </div>
        </div>

        <form className="case-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="user-name">Full Name</label>
            <input
              id="user-name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="user-email">Email Address</label>
            <input
              id="user-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter email address"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="user-password">Password</label>
            <input
              id="user-password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter password (minimum 8 characters)"
              minLength={8}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="user-role">User Role</label>
            <select
              id="user-role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a role</option>
              <option value="administrator">Administrator</option>
              <option value="investigation_officer">
                Investigation Officer
              </option>
              <option value="forensic_analyst">Forensic Analyst</option>
              <option value="authorized_reviewer">
                Authorized Reviewer
              </option>
            </select>
          </div>

          {/* Display backend validation and submission feedback. */}
          {error && <div className="error-message">{error}</div>}

          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            {loading ? "Creating User..." : "Create User"}
          </button>
        </form>
      </section>
    </main>
  );
}