"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useSignMessage } from "wagmi";
import { listDocuments } from "@/lib/api/documents";
import { fetchPayloadFromCid } from "@/lib/ipfs/fetchPayload";
import { buildUnlockMessage } from "@/lib/crypto/message";
import { decryptToBytes } from "@/lib/crypto/decrypt";
import type { DocumentRow } from "@/lib/api/documents";
import type { EncryptedPayloadV1 } from "@/lib/crypto/encrypt";

function downloadBytes(bytes: Uint8Array, filename: string, mime: string) {
  // Buat copy yang aman
  const safeBytes = new Uint8Array(bytes);
  const blob = new Blob([safeBytes], {
    type: mime || "application/octet-stream",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "file";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function VaultPage() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [openingCid, setOpeningCid] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setRows([]);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const docs = await listDocuments(address);
        setRows(docs); // ✅ docs pasti array
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load documents");
        setRows([]); // ✅ fallback aman
      } finally {
        setLoading(false);
      }
    })();
  }, [address]);

  const canShow = useMemo(
    () => isConnected && !!address,
    [isConnected, address]
  );

  async function onOpen(cid: string) {
    try {
      setOpeningCid(cid);
      setErr(null);

      // 1) fetch payload JSON from IPFS
      const payload: EncryptedPayloadV1 = await fetchPayloadFromCid(cid);

      // 2) sign deterministic message again
      const message = buildUnlockMessage({ docHash: payload.docHash });
      const signatureHex = await signMessageAsync({ message });

      // 3) decrypt
      const bytes = await decryptToBytes({ payload, signatureHex });

      // 4) download original file
      downloadBytes(bytes, payload.filename || "document", payload.mime);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Open failed";
      setErr(msg);
    } finally {
      setOpeningCid(null);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4 p-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-gray-300">Vault</div>
        <div className="mt-1 font-mono text-xs text-gray-400">
          {canShow ? address : "Connect wallet dulu"}
        </div>
      </div>

      {err && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {err}
        </div>
      )}

      {!canShow ? (
        <div className="text-sm text-gray-400">
          Kamu belum connect. Balik ke home buat login/connect wallet.
        </div>
      ) : loading ? (
        <div className="text-sm text-gray-400">Loading documents…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-gray-400">Belum ada dokumen.</div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-white/10 bg-black/20 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm text-white">
                    {r.filename}
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    CID: <span className="font-mono">{r.cid}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {r.category || "Uncategorized"} •{" "}
                    {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>

                <button
                  className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-medium text-black disabled:opacity-40"
                  onClick={() => onOpen(r.cid)}
                  disabled={openingCid === r.cid}
                >
                  {openingCid === r.cid ? "Opening…" : "Open"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
