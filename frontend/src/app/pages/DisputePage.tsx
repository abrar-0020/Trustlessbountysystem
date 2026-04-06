import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import {
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Shield,
  Clock,
  ArrowLeft,
  User,
  FileText,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useWallet } from "../context/WalletContext";
import { resolveDisputeOnChain } from "../utils/algorand";
import { API_BASE_URL } from "../utils/config";

export function DisputePage() {
  const { id } = useParams();
  const { address, isConnected, connectWallet, peraWallet } = useWallet();
  const [bountyData, setBountyData] = useState<any>(null);
  const [voted, setVoted] = useState<"approve" | "reject" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
      fetch(`${API_BASE_URL}/bounties/${id}`)
        .then(res => res.json())
        .then(data => setBountyData(data))
        .catch(err => console.error(err));
  }, [id]);

  if (!bountyData) return <div className="p-8 text-center text-[#4B4B4B]">Loading dispute data...</div>;

  const votesFor = bountyData.votesFor || 0;
  const votesAgainst = bountyData.votesAgainst || 0;
  const total = votesFor + votesAgainst;
  const approvePercent = total === 0 ? 0 : Math.round((votesFor / total) * 100);
  const rejectPercent = total === 0 ? 0 : 100 - approvePercent;

  const isCreator = isConnected && address && bountyData.creator_address &&
    address.toLowerCase() === bountyData.creator_address.toLowerCase();

  const handleVote = async (type: "approve" | "reject") => {
    if (!isConnected || !address || !peraWallet) {
      toast.error("Connect your Pera Wallet to resolve this dispute");
      connectWallet();
      return;
    }
    if (voted) {
      toast.error("You have already voted on this dispute");
      return;
    }
    setSubmitting(true);
    toast.loading(`Open Pera Wallet to sign the ${type} resolution...`, { id: "vote" });
    try {
        const workerAddr = bountyData.worker || address;
        // 1. Sign + broadcast directly from the browser
        const txId = await resolveDisputeOnChain(peraWallet, address, workerAddr, bountyData.app_id, type);
        // 2. Tell backend to update metadata
        const response = await fetch(`${API_BASE_URL}/bounties/${id}/resolve_dispute`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resolution: type, tx_id: txId })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.detail || "Resolution failed");
        
        toast.success(
          type === "approve" ? "Dispute Resolved: Funds Released to Worker" : "Dispute Resolved: Funds Refunded to Creator",
          { id: "vote", description: `TXID: ${txId.substring(0, 10)}...` }
        );
        setVoted(type);
        setBountyData(data.bounty);
    } catch (err: unknown) {
        let msg = "An unexpected error occurred";
        if (err instanceof Error) msg = err.message;
        toast.error("Resolution Failed", { id: "vote", description: msg });
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Back */}
      <Link
        to="/app/bounties"
        className="inline-flex items-center gap-1.5 text-sm text-[#4B4B4B] hover:text-[#1F1F1F] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to listings
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <div className="flex items-start gap-3 mb-2">
          <div className="w-9 h-9 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-4.5 h-4.5 text-[#B45309]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-[#1F1F1F]">Dispute Resolution</h1>
              <Badge 
                 variant={
                    bountyData.status === 'completed' ? 'success' : 
                    bountyData.status === 'refunded' ? 'danger' : 
                    bountyData.status === 'failed' ? 'danger' : 
                    'warning'
                 } 
                 size="md"
              >
                  {
                    bountyData.status === 'completed' ? 'Resolved (Paid)' : 
                    bountyData.status === 'refunded' ? 'Resolved (Refunded)' : 
                    bountyData.status === 'failed' ? 'Resolved (Failed)' : 
                    'Under Review'
                  }
              </Badge>
            </div>
            <p className="text-sm text-[#4B4B4B]">{bountyData.status === 'disputed' ? "Community voting in progress" : "Dispute closed"}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Bounty Info */}
          <Card>
            <div className="flex items-start justify-between gap-4 mb-4">
              <h3 className="text-[#1F1F1F]">{bountyData.title}</h3>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="bg-[#F5F5F5] border border-[#E5E5E5] rounded-xl p-3">
                <p className="text-xs text-[#CFCFCF] mb-1">Reward</p>
                <p
                  className="text-[#1F1F1F]"
                  style={{ fontWeight: 600, fontSize: "18px", lineHeight: 1 }}
                >
                  {bountyData.reward}{" "}
                  <span className="text-[#CFCFCF] text-sm" style={{ fontWeight: 400 }}>
                    ALGO
                  </span>
                </p>
              </div>
              <div className="bg-[#F5F5F5] border border-[#E5E5E5] rounded-xl p-3">
                <p className="text-xs text-[#CFCFCF] mb-1">Creator</p>
                <p className="text-sm font-mono text-[#1F1F1F]">{bountyData.creator_address ? `${bountyData.creator_address.substring(0,6)}...${bountyData.creator_address.substring(bountyData.creator_address.length-4)}` : "Unknown"}</p>
              </div>
              <div className="bg-[#F5F5F5] border border-[#E5E5E5] rounded-xl p-3">
                <p className="text-xs text-[#CFCFCF] mb-1">Submitted by</p>
                <p className="text-sm font-mono text-[#1F1F1F]">{bountyData.worker ? `${bountyData.worker.substring(0,4)}...${bountyData.worker.substring(bountyData.worker.length-4)}` : "None"}</p>
              </div>
            </div>
          </Card>

          {/* Submitted Work */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-[#CFCFCF]" />
              <h3 className="text-[#1F1F1F]">Submitted Work</h3>
            </div>
            <div className="bg-[#F5F5F5] border border-[#E5E5E5] rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink className="w-3.5 h-3.5 text-[#CFCFCF]" />
                <span className="text-xs text-[#CFCFCF]">Proof of work</span>
              </div>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="text-sm text-[#2563EB] hover:underline break-all font-mono"
              >
                {bountyData.proof || "ipfs://MockProofHasH..."}
              </a>
            </div>
            <div>
              <p className="text-xs text-[#CFCFCF] mb-2">Submission note</p>
              <p className="text-sm text-[#4B4B4B] leading-relaxed">
                {bountyData.submissionNote || "Completed the required tasks per the specification provided with full integration."}
              </p>
            </div>
          </Card>

          {/* Dispute Reason */}
          <Card className="border-l-4 border-l-[#FCD34D] rounded-l-none">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-[#B45309]" />
              <h3 className="text-[#1F1F1F]">Dispute Reason</h3>
            </div>
            <p className="text-sm text-[#4B4B4B] leading-relaxed">
              {bountyData.disputeReason || "The submitted work does not meet the specified functionality requirements or fails edge cases mentioned in the bounty terms."}
            </p>
          </Card>

          {/* Voting Actions */}
          <Card>
            <h3 className="text-[#1F1F1F] mb-1">Cast Your Vote</h3>
            <p className="text-sm text-[#4B4B4B] mb-5">
              Review the submission and dispute reason carefully before voting.
            </p>

            {voted ? (
              <div className="flex items-center gap-3 p-4 bg-[#F5F5F5] border border-[#E5E5E5] rounded-xl">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    voted === "approve"
                      ? "bg-[#ECFDF5] border border-[#A7F3D0]"
                      : "bg-[#FEF2F2] border border-[#FECACA]"
                  }`}
                >
                  {voted === "approve" ? (
                    <ThumbsUp className="w-4 h-4 text-[#059669]" />
                  ) : (
                    <ThumbsDown className="w-4 h-4 text-[#DC2626]" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-[#1F1F1F]" style={{ fontWeight: 500 }}>
                    Vote cast: {voted === "approve" ? "Approve" : "Reject"}
                  </p>
                  <p className="text-xs text-[#CFCFCF]">
                    Recorded on-chain · Thank you for participating
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleVote("approve")}
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-sm text-[#059669] hover:bg-[#D1FAE5] transition-colors disabled:opacity-50"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Approve Work
                </button>
                <button
                  onClick={() => handleVote("reject")}
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-sm text-[#DC2626] hover:bg-[#FEE2E2] transition-colors disabled:opacity-50"
                >
                  <ThumbsDown className="w-4 h-4" />
                  Reject Work
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Voting Stats */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[#1F1F1F]">Community Votes</h4>
              <span className="text-sm text-[#4B4B4B]">{total} total</span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <ThumbsUp className="w-3.5 h-3.5 text-[#059669]" />
                    <span className="text-sm text-[#4B4B4B]">Approve</span>
                  </div>
                  <span className="text-sm text-[#1F1F1F]" style={{ fontWeight: 500 }}>
                    {votesFor} ({approvePercent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${approvePercent}%` }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="h-full bg-[#10B981] rounded-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <ThumbsDown className="w-3.5 h-3.5 text-[#DC2626]" />
                    <span className="text-sm text-[#4B4B4B]">Reject</span>
                  </div>
                  <span className="text-sm text-[#1F1F1F]" style={{ fontWeight: 500 }}>
                    {votesAgainst} ({rejectPercent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${rejectPercent}%` }}
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                    className="h-full bg-[#EF4444] rounded-full"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#E5E5E5] flex items-center gap-1.5 text-xs text-[#CFCFCF]">
              <Clock className="w-3.5 h-3.5" />
              {bountyData.timeRemaining || "48 hours"} remaining
            </div>
          </Card>

          {/* Dispute rules */}
          <Card className="bg-[#F5F5F5] border-[#E5E5E5]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-white border border-[#E5E5E5] rounded-lg flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-[#4B4B4B]" />
              </div>
              <h4 className="text-[#1F1F1F]">Dispute Rules</h4>
            </div>
            <p className="text-xs text-[#4B4B4B] mb-4 leading-relaxed">
              Disputes are resolved through community voting. Majority decision
              determines fund release.
            </p>
            <div className="space-y-2.5">
              {[
                `Voting period: 48 hours`,
                `Min. votes required: ${bountyData.minimumVotes || 10}`,
                `Decision threshold: ${bountyData.threshold || 60}%`,
                "All votes recorded on-chain",
              ].map((rule) => (
                <div key={rule} className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-[#CFCFCF] mt-1.5 flex-shrink-0" />
                  <span className="text-xs text-[#4B4B4B]">{rule}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Current outcome */}
          <Card className="border-[#E5E5E5]">
            <p className="text-xs text-[#CFCFCF] mb-2 uppercase tracking-widest">
              Current Outcome
            </p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl flex items-center justify-center">
                <ThumbsUp className="w-4 h-4 text-[#059669]" />
              </div>
              <div>
                <p className="text-sm text-[#1F1F1F]" style={{ fontWeight: 500 }}>
                  Leaning: Approve
                </p>
                <p className="text-xs text-[#CFCFCF]">
                  {approvePercent}% of votes approve
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
