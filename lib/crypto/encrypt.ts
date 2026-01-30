import { bytesToBase64, randomBytes } from "./base64";
import { deriveAesKeyFromSignature } from "./kdf";

export type EncryptedPayloadV1 = {
  version: 1;
  algo: "AES-GCM";
  saltB64: string;
  ivB64: string;
  ciphertextB64: string;

  // ✅ make payload self-contained for later decrypt
  docHash: string;
  filename: string;

  mime: string;
  size: number;
  createdAt: number;
};

export async function encryptFileWithSignature(params: {
  file: File;
  signatureHex: string;
  docHash: string;
}): Promise<EncryptedPayloadV1> {
  const salt = randomBytes(16);
  const iv = new Uint8Array(randomBytes(12));// AES-GCM recommended 12 bytes

  const key = await deriveAesKeyFromSignature({
    signatureHex: params.signatureHex,
    salt,
  });

  const plaintext = await params.file.arrayBuffer();

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv : iv }, 
    key,
    plaintext);

  return {
    version: 1,
    algo: "AES-GCM",
    saltB64: bytesToBase64(salt),
    ivB64: bytesToBase64(iv),
    ciphertextB64: bytesToBase64(new Uint8Array(ciphertext)),

    docHash: params.docHash,
    filename: params.file.name,

    mime: params.file.type || "application/octet-stream",
    size: params.file.size,
    createdAt: Math.floor(Date.now() / 1000),
  };
}
