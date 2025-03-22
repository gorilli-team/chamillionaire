"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-900 text-white">
      {/* Hero noise overlay */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 pointer-events-none"></div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <main className="flex flex-col items-center justify-center space-y-16 text-center">
          {/* Glow effect behind logo */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>

          <div className="space-y-6 relative">
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
              <span className="bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Chamillionaire AI 🦎
              </span>
            </h1>
            <p className="mx-auto max-w-[42rem] text-xl text-gray-300 sm:text-2xl font-light">
              Adaptive, Privacy-Preserving AI Trading Assistant
            </p>
          </div>

          <Link
            href="/dashboard"
            className="relative block w-64 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium px-8 py-6 rounded-md text-center cursor-pointer z-0"
          >
            Get Started
          </Link>

          {/* Feature cards section with glassmorphism */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
            <p className="mb-8 text-lg text-gray-200 max-w-3xl mx-auto">
              An AI-powered, privacy-first trading assistant that helps users
              analyze market trends, optimize their strategies, and execute
              trades autonomously—all while keeping their data secure with
              Nillion's SecretVault.
            </p>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                title="AI-Powered Insights"
                description="Uses AI models (SecretLLM) to analyze past trades and suggest optimal strategies"
                icon={<AnalyticsIcon />}
              />
              <FeatureCard
                title="Automated Trading"
                description="AgentKit executes trades based on predefined rules, working on Base"
                icon={<AutomationIcon />}
              />
              <FeatureCard
                title="Privacy-First"
                description="Nillion's SecretVault ensures that no third party can access or misuse your trade data"
                icon={<PrivacyIcon />}
              />
              <FeatureCard
                title="Secure Authentication"
                description="Users connect via Privy, ensuring seamless, non-custodial access"
                icon={<SecurityIcon />}
              />
              <FeatureCard
                title="Custom Strategies"
                description="Define risk parameters, stop-loss levels, and dollar-cost averaging strategies"
                icon={<StrategyIcon />}
              />
              <FeatureCard
                title="Enterprise Ready"
                description="Designed for both individual traders and institutional trading desks"
                icon={<EnterpriseIcon />}
              />
            </div>
          </div>

          {/* Tech stack section */}
          <div className="space-y-6 w-full">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
              Powered By Advanced Technology
            </h2>
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

      {/* Animated gradient border */}
      <div className="w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-300% animate-gradient mt-6"></div>

      <footer className="w-full py-6 text-center text-sm text-gray-400">
        Built with privacy and security in mind
      </footer>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 p-6 border border-white/10 shadow-lg backdrop-blur-sm transition-all hover:translate-y-[-4px] hover:shadow-xl group">
      <div className="mb-4 text-2xl text-indigo-400 group-hover:text-indigo-300 transition-colors">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-gray-300">{description}</p>
    </div>
  );
}

function TechBadge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-white/5 border border-white/10 backdrop-blur-sm px-5 py-2 text-sm font-medium text-gray-200 hover:bg-white/10 transition-colors">
      {text}
    </span>
  );
}

// Icon components for feature cards
function AnalyticsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18"></path>
      <path d="m19 9-5 5-4-4-3 3"></path>
    </svg>
  );
}

function AutomationIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10"></circle>
      <polygon points="10 8 16 12 10 16 10 8"></polygon>
    </svg>
  );
}

function PrivacyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );
}

function SecurityIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
  );
}

function StrategyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <line x1="10" y1="9" x2="8" y2="9"></line>
    </svg>
  );
}

function EnterpriseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
    </svg>
  );
}

// Add this to your global CSS for the animation
// .animate-gradient { animation: gradient 8s linear infinite; }
// .bg-300% { background-size: 300%; }
// @keyframes gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
