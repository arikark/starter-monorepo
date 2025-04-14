import { useState } from "react";
import { Button } from "@workspace/ui/components/button";

import { useApi } from "../lib/api";

export function GmailForm() {
  const [subject, setSubject] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();

  const handleFetchEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.getGmailMessages();
      setSubject(result);
    } catch (err) {
      console.error("Error fetching Gmail messages:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch Gmail messages",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-md bg-white">
      <h3 className="text-lg font-medium mb-2">Gmail Integration</h3>
      <p className="text-sm text-gray-600 mb-4">
        Fetch the subject of your most recent email
      </p>

      <Button onClick={handleFetchEmails} disabled={loading} className="mb-4">
        {loading ? "Loading..." : "Fetch Latest Email Subject"}
      </Button>

      {error && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md mb-4">
          <p className="font-medium">Error:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {subject && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="font-medium text-green-800">Latest Email Subject:</p>
          <p className="text-sm text-green-700">{subject}</p>
        </div>
      )}
    </div>
  );
}
