// API functions for chat operations
import { useAuth } from "@clerk/react-router";

// Get the API URL from environment variables
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Custom hook for API operations
export function useApi() {
  const { getToken } = useAuth();

  // Helper function to get headers with auth token
  const getHeaders = async (): Promise<Record<string, string>> => {
    const token = await getToken();

    if (!token) {
      throw new Error("Authentication token not available");
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const getPeople = async (query: string) => {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/api/people?query=${query}`, {
      headers,
    });
    return response.json();
  };

  return {
    getHeaders,
    getPeople,
  };
}
