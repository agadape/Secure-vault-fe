import { API_BASE } from "./client";

export type DocumentRow = {
  id: number;
  owner_address: string;
  cid: string;
  filename: string;
  category: string | null;
  created_at: string;
};

export type ListDocumentsResult = {
  success: boolean;
  data?: DocumentRow[];
  error?: string;
};

export async function listDocuments(
  walletAddress: string
): Promise<ListDocumentsResult> {
  try {
    const res = await fetch(`${API_BASE}/api/documents/${walletAddress}`, {
      method: "GET",
      cache: "no-store",
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        error: json?.error || `Failed to load documents (${res.status})`,
      };
    }

    if (!json?.success || !Array.isArray(json.data)) {
      return {
        success: false,
        error: "Invalid response format from backend",
      };
    }

    return Array.isArray(json.data) ? json.data : [];
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}