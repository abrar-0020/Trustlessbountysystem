import {
  Shield,
  Zap,
  Scale,
  ArrowRight,
  Check,
  Lock,
  Upload,
  ShieldCheck,
  Banknote,
  ChevronRight,
  Smartphone,
  ExternalLink,
  CheckCircle,
} from "lucide-react";
import { Link } from "react-router";
import { Button } from "../components/Button";
import { Navbar } from "../components/Navbar";
import { motion } from "motion/react";
import { Toaster } from "sonner";

const features = [
  {
    icon: Shield,
    title: "Escrow Security",
    description:
      "Funds locked in smart contracts until work is verified and approved by the bounty creator.",
  },
  {
    icon: Zap,
    title: "Smart Contract Automation",
    description:
      "Automatic payment release on approval. No manual intervention — fully trustless.",
  },
  {
    icon: Scale,
    title: "Dispute Resolution",
    description:
      "Fair, transparent dispute process with community voting and on-chain decision tracking.",
  },
];

const flowSteps = [
  { icon: Lock, label: "Funds Locked", sub: "Creator deposits ALGO" },
  { icon: Upload, label: "Work Submitted", sub: "Worker delivers proof" },
  { icon: ShieldCheck, label: "Validation", sub: "Creator approves" },
  { icon: Banknote, label: "Payment Released", sub: "ALGO sent instantly" },
];



const onboardingSteps = [
  {
    step: "01",
    title: "Connect Wallet",
    description: "Scan the QR code from the Pera Wallet mobile app to securely link your Algorand account.",
    icon: Smartphone,
  },
  {
    step: "02",
    title: "Launch & Browse",
    description: "Click 'Launch App' to enter the dashboard. Browse active bounties or start your own Web3 project.",
    icon: ExternalLink,
  },
  {
    step: "03",
    title: "Create & Lock Funds",
    description: "Example: Post 'Build a React Component'. The 15 ALGO reward is instantly locked in a smart contract.",
    icon: Lock,
  },
  {
    step: "04",
    title: "Approve & Payout",
    description: "A worker submits a GitHub PR. You approve it, and the smart contract instantly releases the funds.",
    icon: CheckCircle,
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Navbar />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#FFFFFF",
            border: "1px solid #E5E5E5",
            color: "#1F1F1F",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            borderRadius: "14px",
          },
        }}
      />

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-[#E5E5E5] rounded-full mb-8 text-sm text-[#4B4B4B] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            Built on Algorand
            <span className="text-[#CFCFCF]">·</span>
            <span className="text-[#2563EB]">Mainnet Live</span>
          </div>

          <h1
            className="text-[#1F1F1F] mb-5 tracking-tight"
            style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 600, lineHeight: 1.15 }}
          >
            Trustless Bounty Escrow
            <br />
            <span className="text-[#CFCFCF]">on Algorand</span>
          </h1>

          <p
            className="text-[#4B4B4B] mb-10 max-w-xl mx-auto"
            style={{ fontSize: "17px", lineHeight: 1.7 }}
          >
            Secure, automated payments for work — zero middlemen. Lock funds in
            escrow, deliver results, and get paid instantly on-chain.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/app/create">
              <Button variant="primary" size="lg">
                Create a Bounty
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/app/bounties">
              <Button variant="outline" size="lg">
                Browse Tasks
                <ChevronRight className="w-4 h-4 text-[#CFCFCF]" />
              </Button>
            </Link>
          </div>
        </motion.div>


      </section>

      {/* Process Flow */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-8 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <p className="text-sm text-[#CFCFCF] mb-6 text-center tracking-widest uppercase">
            How it works
          </p>

          <div className="relative flex items-start justify-between">
            {/* Connector */}
            <div className="absolute top-5 left-0 right-0 flex items-center px-[8%] pointer-events-none">
              <div className="w-full h-0.5 bg-[#E5E5E5] rounded-full" />
            </div>

            {flowSteps.map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="relative flex flex-col items-center flex-1 z-10"
              >
                <div className="w-10 h-10 rounded-full bg-[#F5F5F5] border-2 border-[#E5E5E5] flex items-center justify-center mb-3">
                  <step.icon className="w-4 h-4 text-[#4B4B4B]" />
                </div>
                <p className="text-xs text-[#1F1F1F] text-center" style={{ fontWeight: 500 }}>
                  {step.label}
                </p>
                <p className="text-xs text-[#CFCFCF] text-center mt-0.5 hidden sm:block">
                  {step.sub}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <p className="text-sm text-[#CFCFCF] mb-10 text-center tracking-widest uppercase">
          Why DEOXYS
        </p>
        <div className="grid md:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="bg-white border border-[#E5E5E5] rounded-2xl p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-10 h-10 bg-[#F5F5F5] border border-[#E5E5E5] rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-[#4B4B4B]" />
              </div>
              <h3 className="text-[#1F1F1F] mb-2">{feature.title}</h3>
              <p className="text-sm text-[#4B4B4B] leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Quick Start Walkthrough */}
      <section className="max-w-6xl mx-auto px-6 py-16 bg-white border-y border-[#E5E5E5] mt-8 mb-8">
        <p className="text-sm text-[#CFCFCF] mb-4 text-center tracking-widest uppercase">
          Quick Start Guide
        </p>
        <h2 className="text-[#1F1F1F] text-center mb-12" style={{ fontSize: "32px", fontWeight: 600 }}>
          From zero to automated payout
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          {onboardingSteps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="relative flex flex-col items-center text-center group"
            >
              <div className="w-16 h-16 bg-[#F5F5F5] border-2 border-[#E5E5E5] rounded-full flex items-center justify-center mb-6 group-hover:border-[#10B981] group-hover:text-[#10B981] transition-colors duration-300">
                <step.icon className="w-7 h-7 text-[#4B4B4B] group-hover:text-[#10B981] transition-colors" />
              </div>
              <div className="absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-[#E5E5E5] to-transparent hidden md:block -z-10" />
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#1F1F1F] text-white text-xs font-bold mb-4 shadow-md">
                {step.step}
              </div>
              <h3 className="text-[#1F1F1F] text-lg font-semibold mb-3">{step.title}</h3>
              <p className="text-[#4B4B4B] text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-[#1F1F1F] rounded-3xl p-10 md:p-14 text-center relative overflow-hidden">
          {/* Subtle texture */}
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_30%_50%,white_0%,transparent_60%)]" />
          <div className="relative z-10">
            <p className="text-sm text-white/40 mb-3 tracking-widest uppercase">Get started</p>
            <h2 className="text-white mb-4" style={{ fontSize: "28px", fontWeight: 600 }}>
              Ready to build on trustless rails?
            </h2>
            <p className="text-white/50 mb-8 max-w-md mx-auto" style={{ fontSize: "15px" }}>
              Create your first bounty in under 2 minutes. No setup fees, no intermediaries.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/app/create">
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#1F1F1F] rounded-xl text-sm hover:bg-white/90 transition-colors shadow-sm">
                  Launch App
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link to="/app/bounties">
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl text-sm hover:bg-white/15 transition-colors border border-white/10">
                  View Bounties
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E5E5E5] bg-white mt-4">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#1F1F1F] rounded-md flex items-center justify-center">
              <span className="text-white text-xs">D</span>
            </div>
            <span className="text-sm text-[#4B4B4B]">DEOXYS</span>
          </div>
          <p className="text-sm text-[#CFCFCF]">
            &copy; 2026 DEOXYS · Built on Algorand blockchain
          </p>
          <div className="flex items-center gap-4 text-sm text-[#CFCFCF]">
            <a href="#" className="hover:text-[#4B4B4B] transition-colors">
              Docs
            </a>
            <a href="#" className="hover:text-[#4B4B4B] transition-colors">
              GitHub
            </a>
            <a href="#" className="hover:text-[#4B4B4B] transition-colors">
              Discord
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
