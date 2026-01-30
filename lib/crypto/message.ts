export function buildUnlockMessage(params: { docHash: string }) {
  return (
    `Secure Onchain Vault\n` +
    `Action: Unlock Encryption Key\n` +
    `DocHash: ${params.docHash}\n`
  );
}
