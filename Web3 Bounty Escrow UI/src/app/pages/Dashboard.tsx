import { TrendingUp, DollarSign, Clock, CheckCircle2, ArrowRight, Plus } from "lucide-react";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { ProcessTracker } from "../components/ProcessTracker";
import { ReputationCard } from "../components/ReputationCard";
import { Link } from "react-router";
import { motion } from "motion/react";
import { toast } from "sonner";

import { useState, useEffect } from "react";

const statusConfig = {
  open: { variant: "default" as const, label: "Open" },
  in_progress: { variant: "warning" as const, label: "In Progress" },
  completed: { variant: "success" as const, label: "Completed" },
  disputed: { variant: "danger" as const, label: "Disputed" },
};

export function Dashboard() {
  const [walletContext, setWalletContext] = useState<any>({
      address: "Connecting...",
      shortAddress: "...",
      balance: "0.00"
  });
  const [activeBounty, setActiveBounty] = useState<any>(null);
  const [recentBounties, setRecentBounties] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([
      {
        label: "Total Bounties",
        value: "0",
        icon: TrendingUp,
        delta: "from API",
        positive: true,
        suffix: ""
      },
      {
        label: "Total Value",
        value: "0",
        icon: DollarSign,
        delta: "ALGO locked",
        positive: null,
        suffix: "ALGO",
      }
  ]);

  useEffect(() => {
     fetch("http://127.0.0.1:8000/wallet")
        .then(res => res.json())
        .then(data => {
            setWalletContext({
                address: data.address,
                shortAddress: `${data.address.substring(0,4)}...${data.address.substring(data.address.length - 4)}`,
                balance: data.balance.toFixed(2),
                completedBounties: data.completedBounties,
                successRate: data.successRate,
                totalEarned: data.totalEarned
            });
        }).catch(err => console.error("Wallet fetch error:", err));

     fetch("http://127.0.0.1:8000/bounties")
      .then(res => res.json())
      .then(data => {
         const list = data.bounties || data || [];
         setRecentBounties(list.slice(-4).reverse());
         
         const active = list.slice().reverse().find((b: any) => ["open", "in_progress", "disputed"].includes(b.status));
         setActiveBounty(active || null);

         const total = list.reduce((sum: number, b: any) => sum + parseFloat(b.reward || "0"), 0);
         setStats([
            {
                label: "Total Bounties",
                value: list.length.toString(),
                icon: TrendingUp,
                delta: "Live from Algorand",
                positive: true,
            },
            {
                label: "Total Escrow Value",
                value: total.toLocaleString(),
                icon: DollarSign,
                delta: "ALGO natively locked",
                positive: true,
                suffix: "ALGO",
            }
         ]);
      });
  }, []);
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8 flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-[#1F1F1F] mb-1">Dashboard</h1>
          <p className="text-sm text-[#4B4B4B]">Track your bounties and escrow activity</p>
        </div>
        <Link to="/app/create">
          <Button variant="primary" size="sm">
            <Plus className="w-4 h-4" />
            New Bounty
          </Button>
        </Link>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.35 }}
          >
            <Card className="relative overflow-hidden">
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm text-[#4B4B4B]">{stat.label}</p>
                <div className="w-8 h-8 bg-[#F5F5F5] border border-[#E5E5E5] rounded-xl flex items-center justify-center">
                  <stat.icon className="w-3.5 h-3.5 text-[#4B4B4B]" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5 mb-1.5">
                <span
                  className="text-[#1F1F1F]"
                  style={{ fontSize: "28px", fontWeight: 600, lineHeight: 1 }}
                >
                  {stat.value}
                </span>
                {stat.suffix && (
                  <span className="text-sm text-[#CFCFCF]">{stat.suffix}</span>
                )}
              </div>
              <p className="text-xs text-[#CFCFCF]">{stat.delta}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid xl:grid-cols-3 gap-6">
        {/* Left: Recent Bounties */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[#1F1F1F]">Recent Bounties</h2>
            <Link
              to="/app/bounties"
              className="flex items-center gap-1 text-sm text-[#2563EB] hover:underline"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentBounties.map((bounty, i) => (
              <motion.div
                key={bounty.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.07, duration: 0.3 }}
              >
                <Link to={`/app/bounties/${bounty.id}`}>
                  <Card
                    hover
                    className="group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <p
                            className="text-[#1F1F1F] truncate"
                            style={{ fontWeight: 500 }}
                          >
                            {bounty.title}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-[#CFCFCF]">
                          <span className="flex items-center gap-1">
                            <span className="text-[#4B4B4B]">Ⓐ</span>
                            <span className="text-[#4B4B4B]">{bounty.reward} ALGO</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {bounty.deadline}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={(statusConfig as any)[bounty.status]?.variant || "default"}>
                          {(statusConfig as any)[bounty.status]?.label || bounty.status}
                        </Badge>
                        <ArrowRight className="w-4 h-4 text-[#CFCFCF] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: Process Tracker + Reputation */}
        <div className="space-y-4">
          {/* Process tracker card */}
          <Card>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[#1F1F1F]">Active Bounty Flow</h3>
              <Badge variant="warning" size="sm">
                {activeBounty ? (statusConfig as any)[activeBounty.status]?.label : "None Active"}
              </Badge>
            </div>
            {activeBounty ? (
              <>
                <p className="text-xs text-[#4B4B4B] mb-1 truncate">{activeBounty.title}</p>
                <p className="text-xs text-[#CFCFCF] mb-5">{activeBounty.reward} ALGO · {activeBounty.deadline}</p>
                <ProcessTracker activeStep={activeBounty.status === 'completed' ? 5 : (activeBounty.status === 'in_progress' ? 3 : 2)} />
              </>
            ) : (
                <p className="text-xs text-[#CFCFCF] mb-5">Create a bounty to see flow tracking.</p>
            )}
          </Card>

          {/* Reputation card */}
          <ReputationCard
            address={walletContext.shortAddress}
            completedBounties={walletContext.completedBounties || 0}
            successRate={walletContext.successRate || 100}
            totalEarned={walletContext.totalEarned || 0}
          />

          {/* Quick action */}
          <Card className="bg-[#F5F5F5] border-[#E5E5E5]">
            <p className="text-sm text-[#1F1F1F] mb-1" style={{ fontWeight: 500 }}>
              ALGO Balance
            </p>
            <p
              className="text-[#1F1F1F] mb-1"
              style={{ fontSize: "28px", fontWeight: 600, lineHeight: 1.2 }}
            >
              {walletContext.balance}
            </p>
            <p className="text-xs text-[#CFCFCF] mb-4">Available ALGO</p>
            <button
              onClick={() =>
                toast.success("Transaction initiated", {
                  description: "Connecting to Pera Wallet...",
                })
              }
              className="w-full py-2.5 rounded-xl border border-[#E5E5E5] bg-white text-sm text-[#1F1F1F] hover:bg-[#F0F0F0] transition-colors"
            >
              Top up wallet
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
