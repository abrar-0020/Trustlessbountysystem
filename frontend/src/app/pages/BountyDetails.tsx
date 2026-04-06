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
  const [bountyDetails, setBountyDetails] = useState<any>(null);
  const [ipfsHash, setIpfsHash] = useState("");
  const [submissionNote, setSubmissionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/bounties/${id}`)
      .then(res => res.json())
      .then(data => {
        setBountyDetails(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      })
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipfsHash.trim()) {
      toast.error("Please provide a proof URL or IPFS hash");
      return;
    }
    setSubmitting(true);
    toast.loading("Submitting proof on-chain...", { id: "submit-work" });
    try {
        const response = await fetch(`http://127.0.0.1:8000/bounties/${id}/submit_proof`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ipfs_hash: ipfsHash,
                worker_address: null
            })
        });
        let data: any;
        try {
          data = await response.json();
        } catch {
          throw new Error(`Server error (${response.status}): ${response.statusText}`);
        }
        if (!response.ok) {
          const detail = data?.detail;
          throw new Error(
            typeof detail === "string" ? detail :
            detail != null ? JSON.stringify(detail) :
            "Submission failed"
          );
        }
        
        toast.success("Work submitted successfully!", {
          id: "submit-work",
          description: `TXID: ${(data.txid || data.tx_id || "").substring(0, 10)}...`,
        });
        setBountyDetails(data.bounty);
    } catch (err: unknown) {
        toast.error("Transaction Failed", { id: "submit-work", description: getErrorMessage(err) });
    } finally {
        setSubmitting(false);
        setIpfsHash("");
        setSubmissionNote("");
    }
  };

  const handleValidate = async () => {
    setValidating(true);
    toast.loading("Validating and Releasing Funds...", { id: "validate-work" });
    try {
        const response = await fetch(`http://127.0.0.1:8000/bounties/${id}/validate`, {
            method: "POST"
        });
        let data: any;
        try {
          data = await response.json();
        } catch {
          throw new Error(`Server error (${response.status}): ${response.statusText}`);
        }
        if (!response.ok) {
          const detail = data?.detail;
          throw new Error(
            typeof detail === "string" ? detail :
            detail != null ? JSON.stringify(detail) :
            "Validation failed"
          );
        }
        
        toast.success("Bounty Validated!", {
          id: "validate-work",
          description: `Funds Released. TXID: ${(data.txid || data.tx_id || "").substring(0, 10)}...`,
        });
        setBountyDetails(data.bounty);
    } catch (err: unknown) {
        toast.error("Validation Failed", { id: "validate-work", description: getErrorMessage(err) });
    } finally {
        setValidating(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-[#4B4B4B]">Loading smart contract data...</div>;
  if (!bountyDetails) return <div className="p-8 text-center text-[#EF4444]">Bounty not found</div>;

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
          <Badge variant={bountyDetails.status === 'completed' ? 'success' : 'default'} size="md">
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

          {bountyDetails.status !== 'completed' && (
            <Card>
                <h3 className="text-[#1F1F1F] mb-4">Submit Work</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label
                    htmlFor="ipfs"
                    className="block text-sm text-[#1F1F1F] mb-2"
                    >
                    Submission Link (GitHub, IPFS, etc.){" "}
                    <span className="text-[#EF4444]">*</span>
                    </label>
                    <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#CFCFCF]" />
                    <input
                        id="ipfs"
                        type="text"
                        value={ipfsHash}
                        onChange={(e) => setIpfsHash(e.target.value)}
                        placeholder="github.com/your-repo or ipfs://..."
                        className="w-full pl-11 pr-4 py-3 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#1F1F1F] placeholder:text-[#CFCFCF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
                    />
                    </div>
                </div>

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

                {bountyDetails.status === 'in_progress' && (
                    <div className="mt-6 pt-6 border-t border-[#E5E5E5]">
                        <h4 className="text-sm text-[#1F1F1F] font-medium mb-3">Creator Actions (Demo)</h4>
                        <Button 
                            variant="primary" 
                            size="md" 
                            className="w-full bg-[#10B981] hover:bg-[#059669]"
                            loading={validating}
                            onClick={handleValidate}
                        >
                            <Check className="w-4 h-4" /> Validate Proof & Release Escrow
                        </Button>
                    </div>
                )}
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
