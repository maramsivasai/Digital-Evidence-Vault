import { useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/useAuth";

export default function Custody() {
  const { user } = useAuth();

  // Stores the selected search method: Evidence ID or Case ID.
  const [searchType, setSearchType] = useState("evidence");

  // Stores the Evidence ID or Case ID entered by the user.
  const [searchId, setSearchId] = useState("");

  // Stores the custody history returned by the backend.
  const [custodyRecords, setCustodyRecords] = useState([]);

  // Stores the evidence or case identifier returned by the backend.
  const [searchedId, setSearchedId] = useState("");

  // Tracks loading and error states.
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  // Stores the values entered in the custody event form.
  const [formData, setFormData] = useState({
    evidenceId: "",
    eventType: "",
    purpose: "",
    details: "",
    transferredTo: "",
  });

  // Tracks whether the form is currently submitting.
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Displays a success message after recording a custody event.
  const [successMessage, setSuccessMessage] = useState("");

  // Only these roles can access custody history.
  const canViewCustody =
    user?.role === "forensic_analyst" || user?.role === "authorized_reviewer";

  // Converts timestamps into the user's local date and time.
  const formatDate = (date) => {
    return date ? new Date(date).toLocaleString() : "—";
  };

  // Retrieves custody history using an Evidence ID or Case ID.
  const handleSearch = async (event) => {
    event.preventDefault();

    if (!canViewCustody) {
      setError("You are not authorized to view custody records.");
      return;
    }

    if (!searchId.trim()) {
      setError("Please enter an Evidence ID or Case ID.");
      return;
    }

    setLoading(true);
    setError("");
    setSearchMessage("");
    setCustodyRecords([]);
    setSearchedId("");

    try {
      // Select the correct backend endpoint based on search type.
      const endpoint =
        searchType === "evidence"
          ? `/custody/${encodeURIComponent(searchId.trim())}`
          : `/custody/case/${encodeURIComponent(searchId.trim())}`;

      // GET /api/custody/:evidenceId or /api/custody/case/:caseId
      const response = await api.get(endpoint);

      // Store the custody history returned by the backend.
      const records = response.data.custodyHistory || [];

      setCustodyRecords(records);

      // Store the identifier associated with the search.
      setSearchedId(
        searchType === "evidence"
          ? response.data.evidenceId
          : response.data.caseId,
      );

      // Display the number of matching custody events.
      setSearchMessage(
        `${response.data.count ?? records.length} custody record(s) found.`,
      );
    } catch (err) {
      const statusCode = err.response?.status;

      if (statusCode === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (statusCode === 403) {
        setError("You are not authorized to view custody history.");
      } else if (statusCode === 404) {
        setError(
          err.response?.data?.message ||
            "The requested evidence or case record was not found.",
        );
      } else {
        setError(
          err.response?.data?.message ||
            "Unable to retrieve custody history. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Updates the corresponding form field whenever the user types.
  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  // Sends a new custody event to the backend.
  // Sends a new custody event to the backend.
  const handleSubmit = async (event) => {
    event.preventDefault();

    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      // Prepare the data required by the backend.
      const payload = {
        evidenceId: formData.evidenceId.trim(),
        eventType: formData.eventType.trim(),
        purpose: formData.purpose.trim(),
        details: formData.details.trim(),
      };

      // Include the recipient only when recording a transfer.
      if (formData.eventType.trim().toUpperCase() === "TRANSFERRED") {
        payload.transferredTo = formData.transferredTo.trim();
      }

      // Send the custody event to POST /api/custody.
      const response = await api.post("/custody", payload);

      setSuccessMessage(
        response.data.message || "Custody event recorded successfully.",
      );

      // Clear the form after successful submission.
      setFormData({
        evidenceId: "",
        eventType: "",
        purpose: "",
        details: "",
        transferredTo: "",
      });

      // Refresh the currently displayed history if it matches this evidence.
      // Refresh the currently displayed history if it matches this evidence.
      if (searchType === "evidence" && searchId.trim() === payload.evidenceId) {
        try {
          const historyResponse = await api.get(
            `/custody/${encodeURIComponent(payload.evidenceId)}`,
          );

          const records = historyResponse.data.custodyHistory || [];

          setCustodyRecords(records);
          setSearchedId(historyResponse.data.evidenceId);
          setSearchMessage(
            `${historyResponse.data.count ?? records.length} custody record(s) found.`,
          );
        } catch {
          setSearchMessage(
            "Custody event recorded, but the history could not be refreshed. Search again to view it.",
          );
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to record custody event.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Restrict the page to the roles permitted by the backend.
  if (!canViewCustody) {
    return (
      <main className="cases-page">
        <section className="cases-panel">
          <h1>Chain of Custody</h1>
          <div className="error-message">
            You are not authorized to access custody records.
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
          <h1>Chain of Custody</h1>
          <p>Retrieve and review the custody history of digital evidence.</p>
        </div>
      </div>
      {/* Only Forensic Analysts can record custody events. */}
      {user?.role === "forensic_analyst" && (
        <section className="cases-panel">
          <div className="panel-heading">
            <div>
              <h2>Record Custody Event</h2>
              <p className="muted-text">
                Record a new event in the evidence chain of custody.
              </p>
            </div>
          </div>

          <form className="case-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="custody-evidence-id">Evidence ID</label>
              <input
                id="custody-evidence-id"
                name="evidenceId"
                value={formData.evidenceId}
                onChange={handleInputChange}
                placeholder="Enter the evidence ID"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="custody-event-type">Event Type</label>
              <input
                id="custody-event-type"
                name="eventType"
                value={formData.eventType}
                onChange={handleInputChange}
                placeholder="Enter event type (e.g. TRANSFERRED)"
                required
              />
            </div>

            {formData.eventType.trim().toUpperCase() === "TRANSFERRED" && (
              <div className="form-group">
                <label htmlFor="custody-transferred-to">
                  Transferred To (User ID)
                </label>
                <input
                  id="custody-transferred-to"
                  name="transferredTo"
                  value={formData.transferredTo}
                  onChange={handleInputChange}
                  placeholder="Enter recipient user ID"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="custody-purpose">Purpose</label>
              <textarea
                id="custody-purpose"
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                placeholder="Explain the purpose of this custody event"
                rows="3"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="custody-details">Event Details</label>
              <textarea
                id="custody-details"
                name="details"
                value={formData.details}
                onChange={handleInputChange}
                placeholder="Enter details about the custody event"
                rows="4"
                required
              />
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Recording..." : "Record Custody Event"}
            </button>
          </form>
        </section>
      )}
      {/* Displays errors returned by the backend. */}
      {error && <div className="error-message">{error}</div>}
      {/* Displays successful custody event submissions. */}
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      {/* Custody history search section. */}
      <section className="cases-panel">
        <div className="panel-heading">
          <div>
            <h2>Search Custody History</h2>
            <p className="muted-text">
              Search using an Evidence ID or an associated Case ID.
            </p>
          </div>
        </div>

        <form className="case-form" onSubmit={handleSearch}>
          {/* Select the search method. */}
          <div className="form-group">
            <label htmlFor="custody-search-type">Search By</label>

            <select
              id="custody-search-type"
              value={searchType}
              onChange={(event) => {
                setSearchType(event.target.value);
                setSearchId("");
                setCustodyRecords([]);
                setSearchedId("");
                setError("");
                setSearchMessage("");
              }}
              disabled={loading}
            >
              <option value="evidence">Evidence ID</option>
              <option value="case">Case ID</option>
            </select>
          </div>

          {/* Enter the identifier to retrieve custody history. */}
          <div className="form-group">
            <label htmlFor="custody-search-id">
              {searchType === "evidence" ? "Evidence ID" : "Case ID"}
            </label>

            <input
              id="custody-search-id"
              type="text"
              placeholder={
                searchType === "evidence"
                  ? "Enter Evidence ID"
                  : "Enter Case ID"
              }
              value={searchId}
              onChange={(event) => setSearchId(event.target.value)}
              disabled={loading}
              required
            />
          </div>

          {/* Submit the custody history search. */}
          <div className="filter-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={loading || !searchId.trim()}
            >
              {loading ? "Searching..." : "Search Custody History"}
            </button>

            <button
              type="button"
              className="secondary-button"
              disabled={loading}
              onClick={() => {
                setSearchId("");
                setCustodyRecords([]);
                setSearchedId("");
                setError("");
                setSearchMessage("");
              }}
            >
              Clear
            </button>
          </div>
        </form>
      </section>

      {/* Custody history records section. */}
      <section className="cases-panel">
        <div className="panel-heading">
          <div>
            <h2>Custody Records</h2>
            <p className="muted-text">
              {searchedId
                ? `History for ${searchType === "evidence" ? "Evidence" : "Case"} ID: ${searchedId}`
                : "Custody events will appear here after a search."}
            </p>
          </div>

          <span className="record-count">{custodyRecords.length} Records</span>
        </div>

        {searchMessage && !loading && (
          <p className="muted-text">{searchMessage}</p>
        )}

        {loading ? (
          <p>Loading custody history...</p>
        ) : custodyRecords.length === 0 ? (
          searchMessage ? (
            <p className="empty-state">
              No custody events have been recorded for this search.
            </p>
          ) : (
            <p className="empty-state">
              Search using an Evidence ID or Case ID to view custody history.
            </p>
          )
        ) : (
          <div className="custody-timeline">
            {custodyRecords.map((item, index) => (
              <article className="custody-event-card" key={item.custodyId}>
                {/* Event heading and chronological position. */}
                <div className="custody-event-header">
                  <div>
                    <span className="custody-event-number">
                      Event {index + 1}
                    </span>

                    <h3>{item.eventType}</h3>

                    <span
                      className={`custody-event-type ${
                        item.eventType?.toUpperCase() === "TRANSFERRED"
                          ? "transfer-event"
                          : "regular-event"
                      }`}
                    >
                      {item.eventType?.toUpperCase() === "TRANSFERRED"
                        ? "Evidence Transfer"
                        : "Custody Event"}
                    </span>
                  </div>

                  <div className="custody-event-date">
                    <span>Event Date & Time</span>
                    <strong>{formatDate(item.eventDate)}</strong>
                  </div>
                </div>

                {/* Main custody event information. */}
                <div className="case-detail-grid custody-event-grid">
                  <div>
                    <span>Custody ID</span>
                    <p className="case-id">{item.custodyId}</p>
                  </div>

                  <div>
                    <span>Evidence ID</span>
                    <p className="case-id">{item.evidenceId}</p>
                  </div>

                  <div>
                    <span>Case ID</span>
                    <p className="case-id">{item.caseId}</p>
                  </div>

                  <div>
                    <span>Responsible User</span>
                    <p>{item.responsibleUser || "—"}</p>
                  </div>

                  <div>
                    <span>Created At</span>
                    <p>{formatDate(item.createdAt)}</p>
                  </div>

                  <div>
                    <span>Last Updated</span>
                    <p>{formatDate(item.updatedAt)}</p>
                  </div>
                </div>

                {/* Display transfer information separately for transfer events. */}
                {item.eventType?.toUpperCase() === "TRANSFERRED" && (
                  <div className="custody-transfer-details">
                    <h4>Transfer Information</h4>

                    <div className="custody-transfer-flow">
                      <div>
                        <span>Transferred From</span>
                        <strong>{item.transferredFrom || "—"}</strong>
                      </div>

                      <span className="transfer-arrow">→</span>

                      <div>
                        <span>Transferred To</span>
                        <strong>{item.transferredTo || "—"}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Purpose and additional event information. */}
                <div className="custody-event-details">
                  <div>
                    <h4>Purpose</h4>
                    <p>{item.purpose || "—"}</p>
                  </div>

                  <div>
                    <h4>Event Details</h4>
                    <p>{item.details || "—"}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
