"use client";

import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import ConnectWallet from "@/components/ConnectWallet";
import PaywallModal from "@/components/PaywallModal";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import LoadingLottie from "@/components/lottie/Loading";
import { useRouter } from "next/navigation";

// OPTIONAL: kalau kamu sudah pakai Privy button, uncomment:
import PrivyLoginButton from "@/src/components/PrivyLoginButton";
import { usePrivy } from "@privy-io/react-auth";

function formatExpiry(ts?: number) {
  if (!ts) return "-";
  return new Date(ts * 1000).toLocaleString();
}

function shortAddress(addr?: string) {
  if (!addr) return "-";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function AuthGate() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  // OPTIONAL: kalau kamu sudah pakai privy
  const { authenticated } = usePrivy();

  const [paywallDismissed, setPaywallDismissed] = useState(false);
  const { data, loading, error } = usePaymentStatus(address);

  const isInactive = isConnected && data?.status === "inactive";
  const isActive = isConnected && data?.status === "active";
  const paywallOpen = isInactive && !paywallDismissed;

  const shouldLock = useMemo(() => {
    if (!isConnected) return true;
    if (loading) return true;
    if (error) return true;
    if (!data) return true;
    return data.status !== "active";
  }, [isConnected, loading, error, data]);

  return (
    <div className="mt-5">
      {/* Card */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-gray-400">
              Account
            </div>

            <div className="mt-1">
              <div className="truncate font-mono text-sm text-white">
                {isConnected ? address : "Not connected"}
              </div>
              <div className="mt-1 text-xs text-gray-400">
                {isConnected
                  ? `Short: ${shortAddress(address)}${authenticated ? " • Privy" : ""}`
                  : "Login / connect untuk lanjut"}
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-200">
              {loading && (
                <div className="flex items-center gap-2">
                  <LoadingLottie />
                  <span className="text-gray-300">Checking status...</span>
                </div>
              )}

              {!loading && error && (
                <span className="text-red-400">Status error: {error}</span>
              )}

              {!loading && !error && isActive && (
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  Active until{" "}
                  <span className="font-mono">{formatExpiry(data.expiry)}</span>
                </span>
              )}

              {!loading && !error && isInactive && (
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  Inactive
                </span>
              )}
            </div>
          </div>

          {/* Actions right */}
          <div className="shrink-0 flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* OPTIONAL: enable kalau Privy sudah siap */}
            <PrivyLoginButton />
            <ConnectWallet />
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="sticky bottom-0 left-0 right-0 -mx-4 mt-6 border-t border-white/10 bg-black/80 px-4 py-3 backdrop-blur">
        <div className="flex gap-3">
          <button
            className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-medium text-black disabled:opacity-40"
            disabled={shouldLock}
            onClick={() => router.push("/scan")}
          >
            Scan / Upload
          </button>

          <button
            className="flex-1 rounded-xl border border-white/20 px-4 py-3 text-sm text-white disabled:opacity-40"
            disabled={shouldLock}
            onClick={() => router.push("/vault")}
          >
            Open Vault
          </button>
        </div>

        {isInactive && paywallDismissed && (
          <button
            className="mt-3 w-full rounded-xl bg-black px-4 py-3 text-sm text-white"
            onClick={() => setPaywallDismissed(false)}
          >
            Unlock
          </button>
        )}
      </div>

      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallDismissed(true)}
      />
    </div>
  );
}
