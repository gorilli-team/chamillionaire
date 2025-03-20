import React from "react";
import { BaseLayout } from "../../components/layout/base-layout";
import { cn } from "../../lib/utils";

export default function DashboardPage() {
  return (
    <BaseLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground">
            Here's an overview of your trading activity
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Balance"
            value="$24,563.00"
            change="+2.5%"
            trend="up"
          />
          <StatCard
            title="24h Volume"
            value="$12,234.00"
            change="-0.8%"
            trend="down"
          />
          <StatCard title="Active Trades" value="8" change="+1" trend="up" />
          <StatCard
            title="Success Rate"
            value="92%"
            change="+2.3%"
            trend="up"
          />
        </div>
      </div>
    </BaseLayout>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
}

function StatCard({ title, value, change, trend }: StatCardProps) {
  return (
    <div className="rounded-xl bg-card p-6">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p
        className={cn(
          "mt-1 text-sm",
          trend === "up" ? "text-green-500" : "text-red-500"
        )}
      >
        {change}
      </p>
    </div>
  );
}
