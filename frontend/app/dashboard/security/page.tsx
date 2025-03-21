"use client";

import React from "react";
import { BaseLayout } from "../../../components/layout/base-layout";

export default function SecurityPage() {
  return (
    <BaseLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Security</h1>
          <p className="text-muted-foreground">
            Manage your account security settings.
          </p>
        </div>
      </div>
    </BaseLayout>
  );
}
