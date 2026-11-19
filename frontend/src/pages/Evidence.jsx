import { useEffect, useRef, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/useAuth";

// Stores the initial values of all evidence search filters.
const initialFilters = {
  evidenceId: "",
  caseId: "",
  fileName: "",
};

function Evidence() {
  const { user } = useAuth();

  // Stores evidence records retrieved from the backend.
  const [evidenceRecords, setEvidenceRecords] = useState([]);

  // Stores the cases available for evidence registration.
  const [cases, setCases] = useState([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [casesError, setCasesError] = useState("");

  // Stores the current search filter values.
  const [filters, setFilters] = useState(initialFilters);

  // Tracks whether evidence records are being retrieved.
  const [loading, setLoading] = useState(true);

  // Stores errors returned by the backend or network.
  const [error, setError] = useState("");

  // Displays information about the search results.
  const [searchMessage, setSearchMessage] = useState("");

  // Stores the values entered in the upload form.
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadDescription, setUploadDescription] = useState("");

  // Tracks upload progress and displays upload feedback.
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  // Allows the file input to be cleared after a successful upload.
  const fileInputRef = useRef(null);
  // Stores the complete details of the selected evidence record.
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  // Tracks whether evidence details are being retrieved.
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Retrieves errors associated with loading evidence details.
  const [detailsError, setDetailsError] = useState("");
  // Stores the result returned by the integrity verification endpoint.
  const [verificationResult, setVerificationResult] = useState(null);

  // Tracks whether integrity verification is in progress.
  const [verifying, setVerifying] = useState(false);

  // Stores errors encountered during integrity verification.
  const [verificationError, setVerificationError] = useState("");

  // Retrieves evidence records using the supplied search filters.
  const loadEvidence = async (searchFilters = {}) => {
    setLoading(true);
    setError("");
    setSearchMessage("");

    try {
      // Remove empty filter values before sending the API request.
      const params = {};

      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value.trim()) {
          params[key] = value.trim();
        }
      });

      // GET /api/evidence with optional query parameters.
      const response = await api.get("/evidence", { params });

      // Store the evidence records returned by the backend.
      const records = response.data.evidence || [];
      setEvidenceRecords(records);

      // Display the number of matching records.
      setSearchMessage(
        `${response.data.count ?? records.length} evidence record(s) found.`,
      );
    } catch (err) {
      const statusCode = err.response?.status;

      if (statusCode === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (statusCode === 403) {
        setError("You are not authorized to view evidence records.");
      } else {
        setError(
          err.response?.data?.message ||
            "Unable to retrieve evidence records. Please try again.",
        );
      }

      setEvidenceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Retrieve initial evidence records when the page opens.
  useEffect(() => {
    let ignore = false;

    const fetchInitialEvidence = async () => {
      try {
        const response = await api.get("/evidence");

        if (ignore) return;

        const records = response.data.evidence || [];

        setEvidenceRecords(records);
        setSearchMessage(
          `${response.data.count ?? records.length} evidence record(s) found.`,
        );
      } catch (err) {
        if (ignore) return;

        const statusCode = err.response?.status;

        if (statusCode === 401) {
          setError("Your session has expired. Please log in again.");
        } else if (statusCode === 403) {
          setError("You are not authorized to view evidence records.");
        } else {
          setError(
            err.response?.data?.message ||
              "Unable to retrieve evidence records. Please try again.",
          );
        }

        setEvidenceRecords([]);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchInitialEvidence();

    return () => {
      ignore = true;
    };
  }, []);

  // Retrieve existing cases to populate the upload dropdown.
  useEffect(() => {
    let ignore = false;

    const fetchCases = async () => {
      try {
        const response = await api.get("/cases");

        if (ignore) return;

        setCases(response.data.cases || []);
      } catch (err) {
        if (ignore) return;

        setCasesError(
          err.response?.data?.message ||
            "Unable to retrieve cases for evidence registration.",
        );
      } finally {
        if (!ignore) {
          setCasesLoading(false);
        }
      }
    };

    fetchCases();

    return () => {
      ignore = true;
    };
  }, []);

  // Updates a search filter whenever the user changes its value.
  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((previousFilters) => ({
      ...previousFilters,
      [name]: value,
    }));
  };

  // Submits the evidence search form.
  const handleSearch = (event) => {
    event.preventDefault();
    loadEvidence(filters);
  };

  // Clears all filters and retrieves the complete evidence list.
  const handleReset = () => {
    setFilters(initialFilters);
    loadEvidence();
  };

  // Uploads a file and associates it with the selected case.
  const handleUpload = async (event) => {
    event.preventDefault();

    setUploadError("");
    setUploadSuccess("");

    // Ensure a case has been selected.
    if (!selectedCaseId) {
      setUploadError("Please select a case.");
      return;
    }

    // Ensure a file has been selected.
    if (!selectedFile) {
      setUploadError("Please choose a file to upload.");
      return;
    }

    // Create multipart form data for the backend.
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("caseId", selectedCaseId);
    formData.append("description", uploadDescription.trim());

    setUploading(true);

    try {
      // POST /api/evidence using multipart/form-data.
      // The browser/Axios will supply the multipart boundary.
      const response = await api.post("/evidence", formData);

      setUploadSuccess(
        response.data.message || "Evidence uploaded successfully.",
      );

      // Clear the upload form after successful registration.
      setSelectedCaseId("");
      setSelectedFile(null);
      setUploadDescription("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Refresh the evidence records after uploading.
      await loadEvidence(filters);
    } catch (err) {
      const statusCode = err.response?.status;

      if (statusCode === 401) {
        setUploadError("Your session has expired. Please log in again.");
      } else if (statusCode === 403) {
        setUploadError("You are not authorized to upload evidence.");
      } else if (statusCode === 413) {
        setUploadError(
          err.response?.data?.message ||
            "The selected file exceeds the permitted size limit.",
        );
      } else {
        setUploadError(
          err.response?.data?.message ||
            "Unable to upload evidence. Please try again.",
        );
      }
    } finally {
      setUploading(false);
    }
  };
  // Retrieves complete information about a selected evidence record.
  const handleViewDetails = async (evidenceId) => {
    setSelectedEvidence(null);
    setDetailsError("");
    setDetailsLoading(true);

    try {
      // GET /api/evidence/:evidenceId
      const response = await api.get(
        `/evidence/${encodeURIComponent(evidenceId)}`,
      );

      // Store the complete evidence record returned by the backend.
      setSelectedEvidence(response.data.evidence);
    } catch (err) {
      const statusCode = err.response?.status;

      if (statusCode === 401) {
        setDetailsError("Your session has expired. Please log in again.");
      } else if (statusCode === 403) {
        setDetailsError("You are not authorized to view this evidence.");
      } else if (statusCode === 404) {
        setDetailsError("The requested evidence record was not found.");
      } else {
        setDetailsError(
          err.response?.data?.message || "Unable to retrieve evidence details.",
        );
      }
    } finally {
      setDetailsLoading(false);
    }
  };

  // Downloads the original evidence file from the backend.
  const handleDownload = async (evidenceId, originalFileName) => {
    setDetailsError("");

    try {
      // GET /api/evidence/:evidenceId/download
      // responseType "blob" handles the binary file response.
      const response = await api.get(
        `/evidence/${encodeURIComponent(evidenceId)}/download`,
        {
          responseType: "blob",
        },
      );

      // Create a temporary browser URL for the downloaded file.
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));

      // Create a temporary link to trigger the browser download.
      const downloadLink = document.createElement("a");
      downloadLink.href = blobUrl;
      downloadLink.download = originalFileName || "evidence-file";

      document.body.appendChild(downloadLink);
      downloadLink.click();

      // Remove the temporary link and release the object URL.
      document.body.removeChild(downloadLink);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Handle common download errors.
      const statusCode = err.response?.status;

      if (statusCode === 401) {
        setDetailsError("Your session has expired. Please log in again.");
      } else if (statusCode === 403) {
        setDetailsError("You are not authorized to download this evidence.");
      } else if (statusCode === 404) {
        setDetailsError("The requested evidence file was not found.");
      } else {
        setDetailsError(
          err.response?.data?.message ||
            "Unable to download the evidence file.",
        );
      }
    }
  };

  // Requests SHA-256 integrity verification from the backend.
  const handleVerifyIntegrity = async (evidenceId) => {
    setVerifying(true);
    setVerificationResult(null);
    setVerificationError("");

    try {
      // POST /api/evidence/:evidenceId/verify
      const response = await api.post(
        `/evidence/${encodeURIComponent(evidenceId)}/verify`,
      );

      // Store the verification result returned by the backend.
      setVerificationResult(response.data);
    } catch (err) {
      const statusCode = err.response?.status;

      if (statusCode === 401) {
        setVerificationError("Your session has expired. Please log in again.");
      } else if (statusCode === 403) {
        setVerificationError("You are not authorized to verify this evidence.");
      } else if (statusCode === 404) {
        setVerificationError(
          "The requested evidence record or file was not found.",
        );
      } else {
        setVerificationError(
          err.response?.data?.message ||
            "Unable to verify evidence integrity. Please try again.",
        );
      }
    } finally {
      setVerifying(false);
    }
  };

  // Converts file sizes from bytes into readable units.
  const formatFileSize = (bytes) => {
    if (bytes === undefined || bytes === null) return "—";

    if (bytes < 1024) return `${bytes} B`;

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Displays timestamps in the user's local date and time format.
  const formatDate = (date) => {
    return date ? new Date(date).toLocaleString() : "—";
  };

  return (
    <main className="cases-page">
      {/* Page heading and refresh action. */}
      <div className="page-heading">
        <div>
          <h1>Evidence Management</h1>
          <p>View and manage digital evidence records.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => loadEvidence(filters)}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh Evidence"}
        </button>
      </div>

      {/* Displays evidence retrieval errors. */}
      {error && <div className="error-message">{error}</div>}

      {/* Evidence upload section - Investigation Officer only. */}
      {user?.role === "investigation_officer" && (
        <section className="cases-panel">
          <div className="panel-heading">
            <div>
              <h2>Upload Evidence</h2>
              <p className="muted-text">
                Register a digital evidence file under an existing case.
              </p>
            </div>
          </div>

          {uploadError && <div className="error-message">{uploadError}</div>}

          {uploadSuccess && (
            <div className="success-message">{uploadSuccess}</div>
          )}

          {casesError && <div className="error-message">{casesError}</div>}

          <form className="case-form" onSubmit={handleUpload}>
            {/* Select the case associated with the uploaded evidence. */}
            <div className="form-group">
              <label htmlFor="upload-case">Select Case</label>

              <select
                id="upload-case"
                value={selectedCaseId}
                onChange={(event) => setSelectedCaseId(event.target.value)}
                required
                disabled={casesLoading || cases.length === 0 || uploading}
              >
                <option value="">
                  {casesLoading
                    ? "Loading cases..."
                    : cases.length === 0
                      ? "No cases available"
                      : "Select a case"}
                </option>

                {cases.map((item) => (
                  <option key={item.caseId} value={item.caseId}>
                    {item.title} ({item.caseId})
                  </option>
                ))}
              </select>
            </div>

            {/* Select the digital evidence file. */}
            <div className="form-group">
              <label htmlFor="evidence-file">Evidence File</label>

              <input
                ref={fileInputRef}
                id="evidence-file"
                type="file"
                onChange={(event) =>
                  setSelectedFile(event.target.files?.[0] || null)
                }
                required
                disabled={uploading}
              />

              <p className="muted-text">Maximum file size: 50 MB by default.</p>
            </div>

            {/* Enter an optional description for the evidence. */}
            <div className="form-group">
              <label htmlFor="upload-description">
                Evidence Description (Optional)
              </label>

              <textarea
                id="upload-description"
                rows="3"
                placeholder="Enter a description of the evidence"
                value={uploadDescription}
                onChange={(event) => setUploadDescription(event.target.value)}
                disabled={uploading}
              />
            </div>

            <div className="filter-actions">
              <button
                type="submit"
                className="primary-button"
                disabled={
                  uploading ||
                  casesLoading ||
                  cases.length === 0 ||
                  !selectedCaseId ||
                  !selectedFile
                }
              >
                {uploading ? "Uploading..." : "Upload Evidence"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Evidence search and filtering section. */}
      <section className="cases-panel">
        <div className="panel-heading">
          <div>
            <h2>Search Evidence</h2>
            <p className="muted-text">
              Search using Evidence ID, Case ID or original filename.
            </p>
          </div>
        </div>

        <form className="search-form" onSubmit={handleSearch}>
          <div className="filter-grid">
            <div className="form-group">
              <label htmlFor="evidenceId">Evidence ID</label>
              <input
                id="evidenceId"
                name="evidenceId"
                type="text"
                placeholder="Enter Evidence ID"
                value={filters.evidenceId}
                onChange={handleFilterChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="caseId">Case ID</label>
              <input
                id="caseId"
                name="caseId"
                type="text"
                placeholder="Enter Case ID"
                value={filters.caseId}
                onChange={handleFilterChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="fileName">File Name</label>
              <input
                id="fileName"
                name="fileName"
                type="text"
                placeholder="Enter file name"
                value={filters.fileName}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          <div className="filter-actions">
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? "Searching..." : "Search Evidence"}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={handleReset}
              disabled={loading}
            >
              Reset Filters
            </button>
          </div>
        </form>
      </section>
      {/* Displays complete information about the selected evidence. */}
      {detailsLoading && (
        <section className="cases-panel">
          <p>Loading evidence details...</p>
        </section>
      )}

      {detailsError && <div className="error-message">{detailsError}</div>}

      {selectedEvidence && !detailsLoading && (
        <section className="cases-panel">
          <div className="panel-heading">
            <div>
              <h2>Evidence Details</h2>
              <p className="muted-text">
                Complete information about the selected evidence record.
              </p>
            </div>

            <div className="case-action-buttons">
              {/* Downloads the original evidence file. */}
              <button
                className="primary-button"
                onClick={() =>
                  handleDownload(
                    selectedEvidence.evidenceId,
                    selectedEvidence.metadata?.originalFileName,
                  )
                }
              >
                Download Original File
              </button>

              <button
                className="primary-button"
                onClick={() =>
                  handleVerifyIntegrity(selectedEvidence.evidenceId)
                }
                disabled={verifying}
              >
                {verifying ? "Verifying..." : "Verify Integrity"}
              </button>

              {/* Closes the evidence details panel. */}
              <button
                className="secondary-button"
                onClick={() => {
                  setSelectedEvidence(null);
                  setDetailsError("");
                  setVerificationResult(null);
                  setVerificationError("");
                }}
              >
                Close Details
              </button>
            </div>
          </div>

          <div className="case-detail-grid">
            <div>
              <span>Evidence ID</span>
              <p className="case-id">{selectedEvidence.evidenceId}</p>
            </div>

            <div>
              <span>Associated Case ID</span>
              <p className="case-id">{selectedEvidence.caseId}</p>
            </div>

            <div>
              <span>Original File Name</span>
              <p>{selectedEvidence.metadata?.originalFileName || "—"}</p>
            </div>

            <div>
              <span>MIME Type</span>
              <p>{selectedEvidence.metadata?.mimeType || "—"}</p>
            </div>

            <div>
              <span>File Size</span>
              <p>{formatFileSize(selectedEvidence.metadata?.fileSize)}</p>
            </div>

            <div>
              <span>Uploaded By</span>
              <p>{selectedEvidence.uploadedBy || "—"}</p>
            </div>

            <div>
              <span>Created At</span>
              <p>{formatDate(selectedEvidence.createdAt)}</p>
            </div>

            <div>
              <span>Last Updated</span>
              <p>{formatDate(selectedEvidence.updatedAt)}</p>
            </div>
          </div>

          <div className="case-description">
            <h3>Description</h3>
            <p>
              {selectedEvidence.metadata?.description ||
                "No description provided."}
            </p>
          </div>

          <div className="case-description">
            <h3>SHA-256 Integrity Hash</h3>
            <p className="case-id">{selectedEvidence.sha256Hash || "—"}</p>
          </div>

          {/* Displays errors returned during integrity verification. */}
          {verificationError && (
            <div className="error-message">{verificationError}</div>
          )}

          {/* Displays the SHA-256 integrity verification result. */}
          {verificationResult && (
            <div className="case-description">
              <h3>Integrity Verification Result</h3>

              <div
                className={
                  verificationResult.integrityVerified
                    ? "success-message"
                    : "error-message"
                }
              >
                <strong>
                  {verificationResult.integrityVerified
                    ? "Integrity Verified"
                    : "Integrity Verification Failed"}
                </strong>

                <p>{verificationResult.message}</p>
              </div>

              <div className="case-detail-grid">
                <div>
                  <span>Original SHA-256 Hash</span>
                  <p className="case-id">
                    {verificationResult.originalHash || "—"}
                  </p>
                </div>

                <div>
                  <span>Current SHA-256 Hash</span>
                  <p className="case-id">
                    {verificationResult.currentHash || "—"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Evidence records section. */}
      <section className="cases-panel">
        <div className="panel-heading">
          <div>
            <h2>Evidence Records</h2>
            <p className="muted-text">
              Registered evidence files and their associated case IDs.
            </p>
          </div>

          <span className="record-count">{evidenceRecords.length} Records</span>
        </div>

        {searchMessage && !loading && (
          <p className="muted-text">{searchMessage}</p>
        )}

        {loading ? (
          <p>Loading evidence records...</p>
        ) : evidenceRecords.length === 0 ? (
          <p className="empty-message">No evidence records found.</p>
        ) : (
          <div className="table-container">
            <table className="cases-table">
              <thead>
                <tr>
                  <th>Evidence ID</th>
                  <th>File Name</th>
                  <th>Case ID</th>
                  <th>Description</th>
                  <th>File Size</th>
                  <th>Uploaded By</th>
                  <th>Uploaded At</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {evidenceRecords.map((item) => (
                  <tr key={item.evidenceId}>
                    <td className="case-id">{item.evidenceId}</td>
                    <td>{item.metadata?.originalFileName || "—"}</td>
                    <td className="case-id">{item.caseId}</td>
                    <td>{item.metadata?.description || "—"}</td>
                    <td>{formatFileSize(item.metadata?.fileSize)}</td>
                    <td>{item.uploadedBy || "—"}</td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>
                      <button
                        className="text-button"
                        onClick={() => handleViewDetails(item.evidenceId)}
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
    </main>
  );
}

export default Evidence;
