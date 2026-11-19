import { useEffect, useState } from "react";
import api from "../services/api";
 import { useAuth } from "../context/useAuth";;

const initialFilters = {
  caseId: "",
  title: "",
  status: "",
  startDate: "",
  endDate: "",
};

export default function Cases() {
  const { user } = useAuth();

  const [cases, setCases] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCase, setNewCase] = useState({
    title: "",
    description: "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  // Controls whether the case editing form is visible.
  const [editingCase, setEditingCase] = useState(false);

  // Stores the editable title and description of the selected case.
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
  });

  // Tracks whether the update request is being processed.
  const [updating, setUpdating] = useState(false);
  // Stores the User ID entered for case assignment.
  const [assignmentUserId, setAssignmentUserId] = useState("");

  // Tracks whether the assignment request is being processed.
  const [assigning, setAssigning] = useState(false);

  // Retrieve cases from the backend.
  const loadCases = async (searchFilters = {}) => {
    setLoading(true);
    setError("");
    setSearchMessage("");

    try {
      const params = {};

      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value.trim()) {
          params[key] = value.trim();
        }
      });

      const response = await api.get("/cases", { params });

      setCases(response.data.cases || []);
      setSearchMessage(
        `${response.data.count ?? response.data.cases?.length ?? 0} case(s) found.`,
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to retrieve case records.",
      );
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  // Load all cases when the page opens.
  // Retrieve the initial case list when the page opens.
// State updates happen after the API request completes.
useEffect(() => {
  let ignore = false;

  const fetchInitialCases = async () => {
    try {
      const response = await api.get("/cases");

      // Avoid updating state if the component has unmounted.
      if (ignore) return;

      setCases(response.data.cases || []);
      setSearchMessage(
        `${response.data.count ?? response.data.cases?.length ?? 0} case(s) found.`,
      );
    } catch (err) {
      if (ignore) return;

      setError(
        err.response?.data?.message || "Unable to retrieve case records.",
      );
      setCases([]);
    } finally {
      if (!ignore) {
        setLoading(false);
      }
    }
  };

  fetchInitialCases();

  return () => {
    ignore = true;
  };
}, []);

  // Update filter values.
  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Search using the selected filters.
  const handleSearch = (e) => {
    e.preventDefault();

    if (
      filters.startDate &&
      filters.endDate &&
      filters.startDate > filters.endDate
    ) {
      setError("Start date cannot be after end date.");
      return;
    }

    loadCases(filters);
  };

  // Reset filters and retrieve all cases.
  const handleReset = () => {
    setFilters(initialFilters);
    loadCases({});
  };

  const handleCreateCase = async (e) => {
    e.preventDefault();

    setError("");
    setSuccessMessage("");
    setCreating(true);

    try {
      const response = await api.post("/cases", {
        title: newCase.title.trim(),
        description: newCase.description.trim(),
      });

      setSuccessMessage(response.data.message || "Case created successfully.");

      setNewCase({
        title: "",
        description: "",
      });

      setShowCreateForm(false);

      // Refresh the case list.
      await loadCases(filters);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create case.");
    } finally {
      setCreating(false);
    }
  };

  // Retrieves complete information about a selected case.
  const handleViewCase = async (caseId) => {
    setError("");
    setSuccessMessage("");
    setSelectedCase(null);
    setDetailsLoading(true);
    // Close any previously opened editing form.
    setEditingCase(false);

    try {
      // Request the selected case using its unique case ID.
      const response = await api.get(`/cases/${encodeURIComponent(caseId)}`);

      // Store the case returned by the backend.
      setSelectedCase(response.data.case);
    } catch (err) {
      // Display the error returned by the backend.
      setError(
        err.response?.data?.message || "Unable to retrieve case details.",
      );
    } finally {
      setDetailsLoading(false);
    }
  };
  // Opens the edit form and fills it with the selected case's current data.
  const handleEditCase = () => {
    if (!selectedCase) return;

    setEditForm({
      title: selectedCase.title || "",
      description: selectedCase.description || "",
    });

    setEditingCase(true);
    setError("");
    setSuccessMessage("");
  };

  // Sends the updated case information to the backend.
  const handleUpdateCase = async (event) => {
    event.preventDefault();

    // Prevent submission if either required field is empty.
    if (!editForm.title.trim() || !editForm.description.trim()) {
      setError("Case title and description cannot be empty.");
      return;
    }

    setUpdating(true);
    setError("");
    setSuccessMessage("");

    try {
      // Update the selected case using its unique case ID.
      const response = await api.put(
        `/cases/${encodeURIComponent(selectedCase.caseId)}`,
        {
          title: editForm.title.trim(),
          description: editForm.description.trim(),
        },
      );

      // Store the updated case returned by the backend.
      const updatedCase = response.data.case;

      setSelectedCase(updatedCase);

      // Update the corresponding case in the existing records list.
      setCases((previousCases) =>
        previousCases.map((item) =>
          item.caseId === updatedCase.caseId ? updatedCase : item,
        ),
      );

      // Close the editing form after a successful update.
      setEditingCase(false);

      setSuccessMessage("Case updated successfully.");
    } catch (err) {
      // Display the error message returned by the backend, if available.
      setError(err.response?.data?.message || "Unable to update the case.");
    } finally {
      setUpdating(false);
    }
  };
  // Assigns an active user to the currently selected case.
  const handleAssignPersonnel = async (event) => {
    event.preventDefault();

    // Ensure a case is selected before attempting assignment.
    if (!selectedCase) {
      setError("Please select a case first.");
      return;
    }

    // Ensure that a User ID has been entered.
    if (!assignmentUserId.trim()) {
      setError("Please enter a valid User ID.");
      return;
    }

    setAssigning(true);
    setError("");
    setSuccessMessage("");

    try {
      // Send the selected case ID and personnel User ID to the backend.
      const response = await api.patch(
        `/cases/${encodeURIComponent(selectedCase.caseId)}/assign`,
        {
          userId: assignmentUserId.trim(),
        },
      );

      // Update the selected case with the latest backend response.
      const updatedCase = response.data.case;
      setSelectedCase(updatedCase);

      // Update the corresponding case in the records list.
      setCases((previousCases) =>
        previousCases.map((item) =>
          item.caseId === updatedCase.caseId ? updatedCase : item,
        ),
      );

      // Clear the input after successful assignment.
      setAssignmentUserId("");

      setSuccessMessage("Personnel assigned successfully.");
    } catch (err) {
      // Read the HTTP status code returned by the backend.
      const statusCode = err.response?.status;

      // Handle cases where the user or case does not exist.
      if (statusCode === 404) {
        setError(
          err.response?.data?.message ||
            "The specified User ID or Case ID was not found.",
        );
      }

      // Handle invalid or missing request data.
      else if (statusCode === 400) {
        setError(
          err.response?.data?.message ||
            "Invalid assignment request. Please check the entered User ID.",
        );
      }

      // Handle insufficient permissions.
      else if (statusCode === 403) {
        setError("You are not authorized to assign personnel to this case.");
      }

      // Handle expired or invalid authentication.
      else if (statusCode === 401) {
        setError("Your session has expired. Please log in again.");
      }

      // Handle server errors and network failures.
      else {
        setError(
          err.response?.data?.message ||
            "Unable to assign personnel. Please check your connection and try again.",
        );
      }
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="cases-page">
      <header className="cases-header">
        <div>
          <h1>Case Management</h1>
          <p>Search and view investigation case records.</p>
        </div>

        <span className="role-indicator">
          {user?.role?.replaceAll("_", " ")}
        </span>
        {user?.role === "investigation_officer" && (
          <button
            className="primary-button"
            onClick={() => setShowCreateForm(true)}
          >
            + Create New Case
          </button>
        )}
      </header>

      {error && <div className="error-message">{error}</div>}
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      {showCreateForm && (
        <section className="cases-panel">
          <h2>Create New Case</h2>

          <form className="case-form" onSubmit={handleCreateCase}>
            <label>
              Case Title
              <input
                type="text"
                value={newCase.title}
                onChange={(e) =>
                  setNewCase({
                    ...newCase,
                    title: e.target.value,
                  })
                }
                placeholder="Enter case title"
                required
              />
            </label>

            <label>
              Case Description
              <textarea
                value={newCase.description}
                onChange={(e) =>
                  setNewCase({
                    ...newCase,
                    description: e.target.value,
                  })
                }
                placeholder="Enter case description"
                rows="5"
                required
              />
            </label>

            <div className="filter-actions">
              <button
                type="submit"
                className="primary-button"
                disabled={creating}
              >
                {creating ? "Creating..." : "Create Case"}
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowCreateForm(false)}
                disabled={creating}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Search and filter section */}
      <section className="cases-panel">
        <h2>Search Cases</h2>

        <form className="case-filter-form" onSubmit={handleSearch}>
          <label>
            Case ID
            <input
              type="text"
              name="caseId"
              placeholder="Enter Case ID"
              value={filters.caseId}
              onChange={handleFilterChange}
            />
          </label>

          <label>
            Case Title
            <input
              type="text"
              name="title"
              placeholder="Enter case title"
              value={filters.title}
              onChange={handleFilterChange}
            />
          </label>

          <label>
            Status
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All statuses</option>
              <option value="Open">Open</option>
            </select>
          </label>

          <label>
            Start Date
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </label>

          <label>
            End Date
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </label>

          <div className="filter-actions">
            <button type="submit" className="primary-button" disabled={loading}>
              Search
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </button>
          </div>
        </form>
      </section>

      {/* Displays complete information about the selected case. */}
      {detailsLoading && (
        <section className="cases-panel">
          <p>Loading case details...</p>
        </section>
      )}

      {selectedCase && !detailsLoading && (
        <section className="cases-panel">
          <div className="panel-heading">
            <div>
              <h2>Case Details</h2>
              <p className="muted-text">
                Complete investigation case information
              </p>
            </div>

            <div className="case-action-buttons">
              {/* Only Investigation Officers can edit cases. */}
              {user?.role === "investigation_officer" && (
                <button className="primary-button" onClick={handleEditCase}>
                  Edit Case
                </button>
              )}

              <button
                className="secondary-button"
                onClick={() => {
                  setSelectedCase(null);
                  setEditingCase(false);
                }}
              >
                Close
              </button>
            </div>
          </div>

          {/* Case editing form appears when Edit Case is clicked. */}
          {editingCase && (
            <form className="case-form" onSubmit={handleUpdateCase}>
              <h3>Edit Case Information</h3>

              <label>
                Case Title
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      title: event.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Case Description
                <textarea
                  rows="5"
                  value={editForm.description}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      description: event.target.value,
                    })
                  }
                  required
                />
              </label>

              <div className="filter-actions">
                <button
                  type="submit"
                  className="primary-button"
                  disabled={updating}
                >
                  {updating ? "Updating..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setEditingCase(false)}
                  disabled={updating}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Displays the selected case's information. */}
          <div className="case-detail-grid">
            <div>
              <span>Case ID</span>
              <p className="case-id">{selectedCase.caseId}</p>
            </div>

            <div>
              <span>Case Title</span>
              <p>{selectedCase.title}</p>
            </div>

            <div>
              <span>Status</span>
              <p>
                <span className="status-label">{selectedCase.status}</span>
              </p>
            </div>

            <div>
              <span>Created By</span>
              <p>{selectedCase.createdBy}</p>
            </div>

            <div>
              <span>Created At</span>
              <p>
                {selectedCase.createdAt
                  ? new Date(selectedCase.createdAt).toLocaleString()
                  : "—"}
              </p>
            </div>

            <div>
              <span>Last Updated</span>
              <p>
                {selectedCase.updatedAt
                  ? new Date(selectedCase.updatedAt).toLocaleString()
                  : "—"}
              </p>
            </div>
          </div>

          <div className="case-description">
            <h3>Case Description</h3>
            <p>{selectedCase.description}</p>
          </div>

          {/* Displays and manages personnel assigned to the case. */}
          <div className="case-description">
            <h3>Assigned Personnel</h3>

            {/* Displays the User IDs currently assigned to this case. */}
            {selectedCase.assignedTo?.length > 0 ? (
              <ul>
                {selectedCase.assignedTo.map((userId) => (
                  <li key={userId}>{userId}</li>
                ))}
              </ul>
            ) : (
              <p>No personnel assigned to this case.</p>
            )}

            {/* Only Investigation Officers and Administrators can assign personnel. */}
            {(user?.role === "investigation_officer" ||
              user?.role === "administrator") && (
              <form className="case-form" onSubmit={handleAssignPersonnel}>
                <div className="form-group">
                  <label htmlFor="assignment-user-id">Personnel User ID</label>

                  <input
                    id="assignment-user-id"
                    type="text"
                    placeholder="Enter the personnel User ID"
                    value={assignmentUserId}
                    onChange={(event) =>
                      setAssignmentUserId(event.target.value)
                    }
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={assigning}
                >
                  {assigning ? "Assigning..." : "Assign Personnel"}
                </button>
              </form>
            )}
          </div>
        </section>
      )}

      {/* Case records section */}
      <section className="cases-panel">
        <div className="panel-heading">
          <div>
            <h2>Case Records</h2>
            <p className="muted-text">
              {searchMessage || "Case information retrieved from the system."}
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={() => loadCases(filters)}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p>Loading case records...</p>
        ) : cases.length === 0 ? (
          <p className="empty-state">No cases found matching your search.</p>
        ) : (
          <div className="table-wrapper">
            <table className="cases-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {cases.map((item) => (
                  <tr key={item.caseId}>
                    <td className="case-id">{item.caseId}</td>

                    <td>{item.title}</td>

                    <td>{item.description}</td>

                    <td>
                      <span className="status-label">{item.status}</span>
                    </td>

                    <td>
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    {/* Opens the complete details of the selected case. */}
                    <td>
                      <button
                        className="text-button"
                        onClick={() => handleViewCase(item.caseId)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
