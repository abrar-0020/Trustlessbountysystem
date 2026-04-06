import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { ProcessTracker } from "../components/ProcessTracker";
import {
  Clock,
  CheckCircle,
  Upload,
  Link as LinkIcon,
  Calendar,
  User,
  Shield,
  ArrowLeft,
  ExternalLink,
  Copy,
  Check
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useWallet } from "../context/WalletContext";
import { submitProofOnChain, validateOnChain, disputeOnChain } from "../utils/algorand";
import { API_BASE_URL } from "../utils/config";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    // FastAPI often returns { detail: "..." } — handle if err is an object
    const obj = err as any;
    if (obj?.detail) return String(obj.detail);
    if (obj?.message) return String(obj.message);
    return JSON.stringify(err);
  } catch {
    return "An unexpected error occurred";
  }
}

export function BountyDetails() {
  const { id } = useParams();
  const { address, userAddress, isConnected, connectWallet, peraWallet } = useWallet();
  const [bountyDetails, setBountyDetails] = useState<any>(null);
  const [workLink, setWorkLink] = useState("");
  const [outputResult, setOutputResult] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/bounties/${id}`)
      .then(res => res.json())
      .then(data => {
        setBountyDetails(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address || !peraWallet) {
      toast.error("Connect your Pera Wallet to submit work");
      connectWallet();
      return;
    }
    if (!workLink.trim()) {
      toast.error("Please provide a proof URL or submission link");
      return;
    }
    const isAuto = bountyDetails.validation_type === 'auto';
    if (isAuto && !outputResult.trim()) {
        toast.error("Please provide the output result for auto-validation");
        return;
    }
    
    setSubmitting(true);
    toast.loading("Open Pera Wallet to sign...", { id: "submit-work" });
    try {
        // 1. Sign + broadcast directly from the browser
        const txId = await submitProofOnChain(peraWallet, address, bountyDetails.app_id, workLink.trim());

        // 2. Tell backend to update metadata (no signed bytes needed)
        const response = await fetch(`${API_BASE_URL}/bounties/${id}/submit_proof`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                work_link: workLink,
                output: isAuto ? outputResult.trim() : null,
                worker_address: address,
                tx_id: txId
            })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.detail || "Submission failed");
        
        toast.success("Work submitted on-chain!", {
          id: "submit-work",
          description: `TXID: ${txId.substring(0, 10)}...`,
        });
        setBountyDetails(data.bounty);
    } catch (err: unknown) {
        toast.error("Transaction Failed", { id: "submit-work", description: getErrorMessage(err) });
    } finally {
        setSubmitting(false);
        setWorkLink("");
        setOutputResult("");
    }
  };

  const handleValidate = async () => {
    if (!isConnected || !address || !peraWallet) {
      toast.error("Connect your Pera Wallet to approve work"); connectWallet(); return;
    }
    setValidating(true);
    toast.loading("Open Pera Wallet to sign fund release...", { id: "validate-work" });
    try {
        const workerAddr = bountyDetails.worker || address;
        // 1. Sign + broadcast directly from the browser
        const txId = await validateOnChain(peraWallet, address, workerAddr, bountyDetails.app_id);
        // 2. Tell backend
        const response = await fetch(`${API_BASE_URL}/bounties/${id}/validate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tx_id: txId, user_address: userAddress })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.detail || "Validation failed");
        toast.success("Bounty Validated!", {
          id: "validate-work",
          description: `Funds Released. TXID: ${txId.substring(0, 10)}...`,
        });
        setBountyDetails(data.bounty);
    } catch (err: unknown) {
        toast.error("Validation Failed", { id: "validate-work", description: getErrorMessage(err) });
    } finally {
        setValidating(false);
    }
  };

  const handleDispute = async () => {
    if (!isConnected || !address || !peraWallet) {
      toast.error("Connect your Pera Wallet to raise a dispute"); connectWallet(); return;
    }
    if (!window.confirm("Reject this work? This will raise an official dispute on-chain.")) return;
    
    setValidating(true);
    toast.loading("Open Pera Wallet to sign the dispute...", { id: "dispute-work" });
    try {
        // 1. Sign + broadcast directly from the browser
        const txId = await disputeOnChain(peraWallet, address, bountyDetails.app_id);
        // 2. Tell backend
        const response = await fetch(`${API_BASE_URL}/bounties/${id}/dispute`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tx_id: txId, user_address: userAddress })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.detail || "Dispute failed");
        toast.warning("Bounty Disputed!", {
          id: "dispute-work",
          description: `Status updated on-chain. TXID: ${txId.substring(0, 10)}...`,
        });
        setBountyDetails(data.bounty);
    } catch (err: unknown) {
        toast.error("Dispute Failed", { id: "dispute-work", description: getErrorMessage(err) });
    } finally {
        setValidating(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-[#4B4B4B]">Loading smart contract data...</div>;
  if (!bountyDetails) return <div className="p-8 text-center text-[#EF4444]">Bounty not found</div>;

  console.log("User:", userAddress);
  console.log("Creator:", bountyDetails?.creator_address);

  const isCreator = userAddress === bountyDetails.creator_address;
  const isWorker = isConnected && address && bountyDetails.worker &&
    address.toLowerCase() === bountyDetails.worker.toLowerCase();

  const activeStep = bountyDetails.status === "completed" ? 5 : (bountyDetails.status === "in_progress" || bountyDetails.status === "submitted" ? 3 : 2);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <Link
        to="/app/bounties"
        className="inline-flex items-center gap-1.5 text-sm text-[#4B4B4B] hover:text-[#1F1F1F] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to listings
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-[#1F1F1F] flex-1">{bountyDetails.title}</h1>
          <Badge 
            variant={
               bountyDetails.status === 'completed' ? 'success' : 
               bountyDetails.status === 'disputed' ? 'danger' : 
               'default'
            } 
            size="md"
          >
            {bountyDetails.status.toUpperCase()}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-[#CFCFCF]">
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            App ID:{" "}
            <span className="font-mono text-[#4B4B4B]">{bountyDetails.app_id}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Posted {bountyDetails.postedAgo}
          </span>
          {bountyDetails.worker && (
             <span className="flex items-center gap-1.5">
               <Upload className="w-3.5 h-3.5" />
               Worker active
             </span>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="mb-6"
      >
        <Card>
          <p className="text-xs text-[#CFCFCF] mb-5 tracking-widest uppercase">
            Escrow Flow
          </p>
          <ProcessTracker activeStep={activeStep} />
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-[#1F1F1F]">Validation Mode</h3>
               {bountyDetails.validation_type === 'auto' ? (
                   <Badge variant="success">Auto Validation Enabled</Badge>
               ) : (
                   <Badge variant="default">Manual Validation</Badge>
               )}
            </div>
            {bountyDetails.validation_type === 'auto' ? (
                 <p className="text-sm text-[#4B4B4B] leading-relaxed">This bounty uses zero-knowledge hash matching. The escrow will automatically run validation and release funds immediately if the submitted hash matches the creator's exact expected output.</p>
            ) : (
                 <p className="text-sm text-[#4B4B4B] leading-relaxed">This bounty requires manual review from the creator to release the escrow funds.</p>
            )}
          </Card>

          <Card>
            <h3 className="text-[#1F1F1F] mb-3">Description</h3>
            <p className="text-sm text-[#4B4B4B] leading-relaxed">
              {bountyDetails.description}
            </p>
          </Card>

          <Card>
            <h3 className="text-[#1F1F1F] mb-4">Requirements</h3>
            <div className="space-y-2.5">
              {(bountyDetails.requirements || []).map((reqString: string, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-[#E5E5E5] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5 text-[#CFCFCF]" />
                  </div>
                  <p className="text-sm text-[#4B4B4B]">{reqString}</p>
                </div>
              ))}
            </div>
          </Card>

          {bountyDetails.status !== 'completed' && !isCreator && (
            <Card>
                <h3 className="text-[#1F1F1F] mb-4">Submit Work</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label
                    htmlFor="workLink"
                    className="block text-sm text-[#1F1F1F] mb-2"
                    >
                    Submission Link (GitHub, IPFS, etc.){" "}
                    <span className="text-[#EF4444]">*</span>
                    </label>
                    <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#CFCFCF]" />
                    <input
                        id="workLink"
                        type="text"
                        value={workLink}
                        onChange={(e) => setWorkLink(e.target.value)}
                        placeholder="github.com/your-repo or ipfs://..."
                        className="w-full pl-11 pr-4 py-3 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#1F1F1F] placeholder:text-[#CFCFCF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
                    />
                    </div>
                </div>

                {bountyDetails.validation_type === 'auto' && (
                  <div>
                      <label htmlFor="outputResult" className="block text-sm text-[#1F1F1F] mb-2">
                        Enter Result Output <span className="text-[#EF4444]">*</span>
                      </label>
                      <input
                          id="outputResult"
                          type="text"
                          value={outputResult}
                          onChange={(e) => setOutputResult(e.target.value)}
                          placeholder="e.g. 9 or success message"
                          className="w-full px-4 py-3 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#1F1F1F] placeholder:text-[#CFCFCF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
                      />
                  </div>
                )}

                <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full"
                    loading={submitting}
                >
                    <Upload className="w-4 h-4" />
                    Submit Proof via Smart Contract
                </Button>
                </form>
            </Card>
          )}

          {bountyDetails.status === 'in_progress' && isCreator && (
            <Card>
                <div>
                    <h4 className="text-sm text-[#1F1F1F] font-medium mb-3">
                        {bountyDetails.validation_type === 'auto' ? 'Execute On-Chain Validation' : 'Creator Actions'}
                    </h4>
                    <div className="flex gap-3">
                        {bountyDetails.validation_type === 'auto' ? (
                            <Button 
                                variant="primary" 
                                size="md" 
                                className="w-full bg-[#10B981] hover:bg-[#059669]"
                                loading={validating}
                                onClick={handleValidate}
                            >
                                <Check className="w-4 h-4" /> Trigger Auto-Validation
                            </Button>
                        ) : (
                            <>
                                <Button 
                                    variant="primary" 
                                    size="md" 
                                    className="w-full bg-[#10B981] hover:bg-[#059669]"
                                    loading={validating}
                                    onClick={handleValidate}
                                >
                                    <Check className="w-4 h-4" /> Approve & Release Funds
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="md" 
                                    className="w-full hover:bg-red-50 text-red-600 border-red-200"
                                    onClick={handleDispute}
                                    loading={validating}
                                >
                                    Reject Work
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </Card>
          )}

          {bountyDetails.status === 'completed' && (
             <Card>
                 <div className="flex flex-col items-center justify-center py-6">
                     <CheckCircle className="w-12 h-12 text-[#10B981] mb-3" />
                     <h3 className="text-[#1F1F1F] mb-1">Bounty Completed</h3>
                     <p className="text-[#4B4B4B] text-sm text-center">Funds have been verified and released natively onto the blockchain.</p>
                 </div>
             </Card>
          )}

        </div>

        <div className="space-y-4">
          <Card>
            <p className="text-xs text-[#CFCFCF] mb-2 uppercase tracking-widest">
              Reward
            </p>
            <div className="flex items-baseline gap-1.5 mb-1">
              <span
                className="text-[#1F1F1F]"
                style={{ fontSize: "36px", fontWeight: 700, lineHeight: 1 }}
              >
                {bountyDetails.reward}
              </span>
              <span className="text-[#CFCFCF]">ALGO</span>
            </div>
            <p className="text-xs text-[#CFCFCF] mb-4">Locked in smart contract</p>
            <div className="flex items-center gap-1.5 text-xs text-[#10B981]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              Funds secured & verifiable
            </div>
          </Card>

          <Card>
            <p className="text-xs text-[#CFCFCF] mb-2 uppercase tracking-widest">
              Deadline
            </p>
            <p
              className="text-[#1F1F1F] mb-1"
              style={{ fontWeight: 500 }}
            >
              {bountyDetails.deadline}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-[#4B4B4B]">
              <Clock className="w-3.5 h-3.5 text-[#CFCFCF]" />
              Ending soon
            </div>
          </Card>

          <Card className="bg-[#F5F5F5] border-[#E5E5E5]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-white border border-[#E5E5E5] rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-[#4B4B4B]" />
              </div>
              <h4 className="text-[#1F1F1F]">Escrow Protection</h4>
            </div>
            <p className="text-xs text-[#4B4B4B] mb-4 leading-relaxed">
              Funds are locked in a smart contract. Payment releases automatically
              upon approval.
            </p>
            <div className="space-y-2">
              {[
                "Trustless escrow mechanism",
                "Community dispute resolution",
                "Instant on-chain payments",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[#CFCFCF] flex-shrink-0" />
                  <span className="text-xs text-[#4B4B4B]">{item}</span>
                </div>
              ))}
            </div>
          </Card>

          <button
            onClick={() =>
              toast.info("Opening Algorand explorer...", {
                description: `App ID: ${bountyDetails.app_id}`,
              })
            }
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#4B4B4B] hover:bg-[#F5F5F5] transition-colors group"
          >
            <span>View on explorer</span>
            <ExternalLink className="w-4 h-4 text-[#CFCFCF] group-hover:text-[#4B4B4B] transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
}
