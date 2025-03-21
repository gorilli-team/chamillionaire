"use client";

import React, { useState, useEffect } from "react";
import { BaseLayout } from "../../../components/layout/base-layout";
import { cn } from "../../../lib/utils";
import { usePrivy } from "@privy-io/react-auth";
import { ethers } from "ethers";

export default function TradingPage() {
  return (
    <BaseLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Trading</h1>
          <p className="text-muted-foreground">
            Trade your favorite tokens on Base.
          </p>
        </div>
      </div>
    </BaseLayout>
  );
}
