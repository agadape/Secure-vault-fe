"use client";

import { PropsWithChildren } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { OnchainKitProvider } from "@coinbase/onchainkit";
import { wagmiConfig, chain } from "@/lib/wagmi";

const queryClient = new QueryClient();

export default function Providers({ children }: PropsWithChildren) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          chain={chain}
          // optional: customize app name for wallet UI
          config={{
            appearance: {
              // Keep default for now
            },
          }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
