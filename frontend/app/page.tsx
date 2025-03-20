import React from "react";
import { Button } from "../components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <div className="container mx-auto px-4 py-16">
        <main className="flex flex-col items-center justify-center space-y-12 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                Chamillionaire AI
              </span>
            </h1>
            <p className="mx-auto max-w-[42rem] text-xl text-muted-foreground sm:text-2xl">
              Adaptive, Privacy-Preserving AI Trading Assistant
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/dashboard">Get Started</Link>
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>

          <div className="rounded-xl bg-card/50 p-8 backdrop-blur-sm">
            <p className="mb-6 text-lg text-card-foreground">
              An AI-powered, privacy-first trading assistant that helps users
              analyze market trends, optimize their strategies, and execute
              trades autonomously—all while keeping their data secure with
              Nillion's SecretVault.
            </p>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                title="AI-Powered Insights"
                description="Uses AI models (SecretLLM) to analyze past trades and suggest optimal strategies"
                emoji="🔹"
              />
              <FeatureCard
                title="Automated Trading"
                description="AgentKit executes trades based on predefined rules, working on Base"
                emoji="🔹"
              />
              <FeatureCard
                title="Privacy-First"
                description="Nillion's SecretVault ensures that no third party can access or misuse your trade data"
                emoji="🔹"
              />
              <FeatureCard
                title="Secure Authentication"
                description="Users connect via Privy, ensuring seamless, non-custodial access"
                emoji="🔹"
              />
              <FeatureCard
                title="Custom Strategies"
                description="Define risk parameters, stop-loss levels, and dollar-cost averaging strategies"
                emoji="🔹"
              />
              <FeatureCard
                title="Enterprise Ready"
                description="Designed for both individual traders and institutional trading desks"
                emoji="🔹"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Technology Stack</h2>
            <div className="flex flex-wrap justify-center gap-3">
              <TechBadge text="React + Next.js" />
              <TechBadge text="Node.js" />
              <TechBadge text="Nillion SecretVault" />
              <TechBadge text="SecretLLM" />
              <TechBadge text="AgentKit" />
              <TechBadge text="Privy" />
            </div>
          </div>
        </main>
      </div>
      <footer className="w-full py-6 text-center text-sm text-muted-foreground">
        Built with privacy and security in mind
      </footer>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  emoji,
}: {
  title: string;
  description: string;
  emoji: string;
}) {
  return (
    <div className="rounded-lg bg-card p-6 border border-black shadow-sm transition-colors hover:bg-card/80">
      <div className="mb-2 text-2xl">{emoji}</div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function TechBadge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-primary/10 border border-black px-4 py-1 text-sm font-medium text-primary">
      {text}
    </span>
  );
}
