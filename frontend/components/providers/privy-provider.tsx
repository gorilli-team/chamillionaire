"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { PropsWithChildren } from "react";

//Privy Provider
//https://docs.privy.io/react-auth/react-auth-provider.
//APPLIED FOR PRIVY BOUNTY

const baseChainId = 8453;

export function PrivyClientProvider({ children }: PropsWithChildren) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        loginMethods: ["wallet", "email"],
        appearance: {
          theme: "light",
          accentColor: "#000000",
          showWalletLoginFirst: true,
        },
        defaultChain: {
          id: baseChainId,
          name: "Base",
          nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18,
          },
          rpcUrls: {
            default: {
              http: ["https://mainnet.base.org"],
            },
            public: {
              http: ["https://mainnet.base.org"],
            },
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
