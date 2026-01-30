import type { EncryptedPayloadV1 } from "@/lib/crypto/encrypt";

export async function fetchPayloadFromCid(cid: string): Promise<EncryptedPayloadV1> {
  // kamu bisa ganti gateway kalau mau
  const url = `https://gateway.pinata.cloud/ipfs/${cid}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed fetch IPFS payload (${res.status})`);

  const json = (await res.json()) as EncryptedPayloadV1;

  if (json?.version !== 1 || json?.algo !== "AES-GCM") {
    throw new Error("Invalid payload format/version");
  }
  if (!json.docHash) {
    throw new Error("Payload missing docHash (update encrypt.ts + re-upload doc)");
  }

  return json;
}
