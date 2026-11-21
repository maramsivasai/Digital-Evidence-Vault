import test from "node:test";
import assert from "node:assert/strict";

const BASE_URL = process.env.API_URL || "http://localhost:5000/api";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const USER_TOKEN = process.env.USER_TOKEN;

const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const testUser = {
  name: "Test Forensic User",
  email: `forensic-${uniqueId}@example.com`,
  password: "TestPassword123!",
  role: "forensic_analyst",
};

const secondUser = {
  name: "Test Investigation User",
  email: `investigator-${uniqueId}@example.com`,
  password: "TestPassword123!",
  role: "investigation_officer",
};

let createdUserId;
let secondUserId;

// Common API request helper
async function apiRequest(endpoint, method = "GET", body, token = ADMIN_TOKEN) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    // Response may have no JSON body.
  }

  return { status: response.status, data };
}

test("Digital Evidence Vault - User Management API Tests", async (t) => {
  assert.ok(ADMIN_TOKEN, "Set ADMIN_TOKEN before running tests");

  // 1. CREATE USER
  await t.test("Create a user successfully", async () => {
    const result = await apiRequest("/users", "POST", testUser);

    assert.equal(result.status, 201);
    assert.ok(result.data.user);
    assert.equal(result.data.user.email, testUser.email);
    assert.equal(result.data.user.role, testUser.role);

    createdUserId = result.data.user.userId;
    assert.ok(createdUserId);
  });

  await t.test("Reject user creation with missing fields", async () => {
    const result = await apiRequest("/users", "POST", {
      name: "Incomplete User",
    });

    assert.equal(result.status, 400);
  });

  await t.test("Reject duplicate email during creation", async () => {
    const result = await apiRequest("/users", "POST", testUser);

    assert.equal(result.status, 409);
  });

  // Create a second user for duplicate-email update testing.
  await t.test("Create a second test user", async () => {
    const result = await apiRequest("/users", "POST", secondUser);

    assert.equal(result.status, 201);
    secondUserId = result.data.user.userId;
    assert.ok(secondUserId);
  });

  // 2. LIST USERS
  await t.test("Retrieve all users", async () => {
    const result = await apiRequest("/users");

    assert.equal(result.status, 200);
    assert.ok(Array.isArray(result.data.users));

    const found = result.data.users.find(
      (user) => user.userId === createdUserId
    );

    assert.ok(found, "Created user should appear in the list");
    assert.equal("passwordHash" in found, false);
  });

  // 3. GET USER BY ID
  await t.test("Retrieve a user using a valid UUID", async () => {
    const result = await apiRequest(`/users/${createdUserId}`);

    assert.equal(result.status, 200);
    assert.equal(result.data.user.userId, createdUserId);
    assert.equal("passwordHash" in result.data.user, false);
  });

  await t.test("Return 404 for a non-existent user", async () => {
    const result = await apiRequest(
      "/users/00000000-0000-4000-8000-000000000000"
    );

    assert.equal(result.status, 404);
  });

  // 4. UPDATE USER
  await t.test("Update user details successfully", async () => {
    const result = await apiRequest(
      `/users/${createdUserId}`,
      "PUT",
      {
        name: "Updated Forensic User",
        email: `updated-${uniqueId}@example.com`,
        role: "forensic_analyst",
      }
    );

    assert.equal(result.status, 200);
    assert.equal(result.data.user.name, "Updated Forensic User");
  });

  await t.test("Reject an invalid email during update", async () => {
    const result = await apiRequest(
      `/users/${createdUserId}`,
      "PUT",
      {
        name: "Updated User",
        email: "invalid-email",
        role: "forensic_analyst",
      }
    );

    assert.equal(result.status, 400);
  });

  await t.test("Reject an email already used by another user", async () => {
    const result = await apiRequest(
      `/users/${createdUserId}`,
      "PUT",
      {
        name: "Duplicate Email Test",
        email: secondUser.email,
        role: "forensic_analyst",
      }
    );

    assert.equal(result.status, 409);
  });

  // 5. ACTIVATE / DEACTIVATE USER
  await t.test("Deactivate a user account", async () => {
    const result = await apiRequest(
      `/users/${createdUserId}/status`,
      "PATCH",
      { isActive: false }
    );

    assert.equal(result.status, 200);
    assert.equal(result.data.user.isActive, false);
  });

  await t.test("Activate a user account", async () => {
    const result = await apiRequest(
      `/users/${createdUserId}/status`,
      "PATCH",
      { isActive: true }
    );

    assert.equal(result.status, 200);
    assert.equal(result.data.user.isActive, true);
  });

  await t.test("Reject an invalid status value", async () => {
    const result = await apiRequest(
      `/users/${createdUserId}/status`,
      "PATCH",
      { isActive: "yes" }
    );

    assert.equal(result.status, 400);
  });

  // 6. AUTHORIZATION
  await t.test("Reject requests without an authentication token", async () => {
    const result = await apiRequest("/users", "GET", undefined, null);

    assert.equal(result.status, 401);
  });

  await t.test("Reject non-admin access", {
    skip: !USER_TOKEN,
  }, async () => {
    const result = await apiRequest("/users", "GET", undefined, USER_TOKEN);

    assert.equal(result.status, 403);
  });
});