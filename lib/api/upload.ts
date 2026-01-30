import { API_BASE } from "./client";
import type { EncryptedPayloadV1 } from "@/lib/crypto/encrypt";

export type UploadEncryptedResponse = {
  success: boolean;
  cid?: string;
  error?: string;
};

export async function uploadEncrypted(params: {
  payload: EncryptedPayloadV1;
  walletAddress: string;
  category?: string;
  docHash: string;
}): Promise<UploadEncryptedResponse> {
  try {
    const json = JSON.stringify(params.payload);
    const blob = new Blob([json], { type: "application/json" });

    // Filename lebih descriptive & unique
    const filename = `vault_${params.docHash.slice(0, 12)}_${Date.now()}.json`;
    const file = new File([blob], filename, { type: "application/json" });

    const fd = new FormData();
    fd.append("document", file);
    fd.append("walletAddress", params.walletAddress);
    fd.append("category", params.category || "Encrypted");

    const res = await fetch(`${API_BASE}/api/upload`, {
      method: "POST",
      body: fd,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        error: data?.error || `Upload failed (${res.status})`,
      };
    }

    if (!data?.cid) {
      return {
        success: false,
        error: "Upload failed: missing CID",
      };
    }

    return {
      success: true,
      cid: data.cid,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}