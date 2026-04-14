import { auth } from "../config/firebase";
import { API_BASE_URL } from "../config/api";

const parseErrorMessage = async (response) => {
  let details = "";

  try {
    const data = await response.json();
    details = data?.error || data?.message || "";
  } catch (error) {
    details = response.statusText || "";
  }

  const statusLabel = response.status ? `HTTP ${response.status}` : "Request failed";
  if (!details) {
    return statusLabel;
  }

  return `${statusLabel}: ${details}`;
};

export const apiRequest = async ({ path, method = "GET", body, requireAuth = true }) => {
  const headers = { "Content-Type": "application/json" };

  if (requireAuth) {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error("Missing auth token");
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};
