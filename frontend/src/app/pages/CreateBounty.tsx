import { useState } from "react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import {
  Lock,
  Calendar,
  FileText,
  Plus,
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Info,
  Wallet,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useWallet } from "../context/WalletContext";
import { createAndFundBounty } from "../utils/algorand";
import { API_BASE_URL } from "../utils/config";

const STEPS = [
  { id: 1, label: "Details", description: "Title & description" },
  { id: 2, label: "Conditions", description: "Requirements & deadline" },
  { id: 3, label: "Deposit", description: "Lock funds in escrow" },
];

interface Requirement {
  id: number;
  text: string;
}

export function CreateBounty() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { address, isConnected, connectWallet, peraWallet } = useWallet();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [reward, setReward] = useState("");
  const [deadline, setDeadline] = useState("");
  const [expectedOutput, setExpectedOutput] = useState("");
  const [requirements, setRequirements] = useState<Requirement[]>([
    { id: 1, text: "Responsive design (mobile and desktop)" },
    { id: 2, text: "Clean code with TypeScript" },
    { id: 3, text: "Documentation included" },
  ]);

  const addRequirement = () => {
    setRequirements([...requirements, { id: Date.now(), text: "" }]);
  };

  const removeRequirement = (id: number) => {
    setRequirements(requirements.filter((r) => r.id !== id));
  };

  const updateRequirement = (id: number, text: string) => {
    setRequirements(requirements.map((r) => (r.id === id ? { ...r, text } : r)));
  };

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!isConnected || !address || !peraWallet) {
      toast.error("Please connect your Pera Wallet first");
      connectWallet();
      return;
    }

    const rewardAlgo = parseFloat(reward || "0");
    if (!title || !description || rewardAlgo <= 0 || !deadline) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    toast.loading("Step 1/2: Open Pera Wallet to deploy the contract...", { id: "create-bounty" });
    try {
      const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);

      // Sign + broadcast BOTH transactions (deploy + fund) directly from the browser
      const { deployTxId, fundTxId, appId } = await createAndFundBounty(
        peraWallet,
        address,
        rewardAlgo,
        deadlineTimestamp
      );

      // Tell backend to store metadata only (tx already confirmed on-chain)
      toast.loading("Saving bounty metadata...", { id: "create-bounty" });
      const response = await fetch(`${API_BASE_URL}/bounties/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "Untitled Bounty",
          description: description || "No description provided",
          reward_algo: rewardAlgo,
          deadline_timestamp: deadlineTimestamp,
          requirements: requirements.map(r => r.text).filter(Boolean),
          expected_output: expectedOutput || undefined,
          creator_address: address,
          app_id: appId,
          tx_id: deployTxId
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Failed to save bounty");
      
      toast.success("Bounty Created & Escrow Funded!", {
        id: "create-bounty",
        description: `App ID: ${appId} | Deploy TX: ${deployTxId.substring(0, 10)}...`,
      });
      setSubmitting(false);
      setSubmitted(true);
    } catch (err: any) {
      const msg = err?.message || "Transaction failed or was rejected";
      toast.error("Transaction Failed", {
        id: "create-bounty",
        description: msg,
      });
      setSubmitting(false);
    }
  };

  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  if (submitted) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto flex items-center justify-center min-h-[70vh]">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-[#ECFDF5] border border-[#A7F3D0] rounded-full flex items-center justify-center mx-auto mb-5">
            <Check className="w-7 h-7 text-[#059669]" strokeWidth={2.5} />
          </div>
          <h2 className="text-[#1F1F1F] mb-2">Bounty Created!</h2>
          <p className="text-sm text-[#4B4B4B] mb-6 max-w-xs mx-auto">
            {reward} ALGO has been locked in escrow. Your bounty is now live.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="primary" size="sm" onClick={() => window.location.href = "/app/bounties"}>
              View Bounties
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setSubmitted(false); setCurrentStep(1); }}>
              Create Another
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[#1F1F1F] mb-1">Create Bounty</h1>
        <p className="text-sm text-[#4B4B4B]">Set up a new bounty with funds locked in escrow</p>
      </div>

      {/* Step progress */}
      <div className="mb-8">
        {/* Progress bar */}
        <div className="relative mb-6">
          <div className="w-full h-1 bg-[#E5E5E5] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#2563EB] rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Step labels */}
        <div className="flex justify-between">
          {STEPS.map((step) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            return (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-200 ${
                      isCompleted
                        ? "bg-[#2563EB] text-white"
                        : isActive
                        ? "bg-[#EFF6FF] border-2 border-[#2563EB] text-[#2563EB]"
                        : "bg-[#F0F0F0] text-[#CFCFCF]"
                    }`}
                    style={{ fontWeight: 600 }}
                  >
                    {isCompleted ? <Check className="w-3 h-3" strokeWidth={2.5} /> : step.id}
                  </div>
                </div>
                <p
                  className={`text-xs transition-colors ${isActive ? "text-[#1F1F1F]" : isCompleted ? "text-[#2563EB]" : "text-[#CFCFCF]"}`}
                  style={{ fontWeight: isActive ? 500 : 400 }}
                >
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25 }}
        >
          {/* STEP 1: Details */}
          {currentStep === 1 && (
            <Card>
              <h3 className="text-[#1F1F1F] mb-6">Bounty Details</h3>
              <div className="space-y-5">
                <div>
                  <label htmlFor="title" className="block text-sm text-[#1F1F1F] mb-2">
                    Title <span className="text-[#EF4444]">*</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#CFCFCF]" />
                    <input
                      id="title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Build NFT Marketplace Frontend"
                      className="w-full pl-11 pr-4 py-3 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#1F1F1F] placeholder:text-[#CFCFCF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm text-[#1F1F1F] mb-2">
                    Category
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#1F1F1F] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all appearance-none"
                  >
                    <option value="">Select a category</option>
                    <option value="development">Development</option>
                    <option value="design">Design</option>
                    <option value="audit">Security Audit</option>
                    <option value="content">Content</option>
                    <option value="research">Research</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm text-[#1F1F1F] mb-2">
                    Description <span className="text-[#EF4444]">*</span>
                  </label>
                  <textarea
                    id="description"
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the work required, deliverables, and acceptance criteria..."
                    className="w-full px-4 py-3 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#1F1F1F] placeholder:text-[#CFCFCF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all resize-none"
                  />
                </div>

                <div>
                  <label htmlFor="expectedOutput" className="block text-sm text-[#1F1F1F] mb-2">
                    Expected Output <span className="text-[#CFCFCF] text-xs font-normal">(Optional, for Auto Validation)</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#CFCFCF]" />
                    <input
                      id="expectedOutput"
                      type="text"
                      value={expectedOutput}
                      onChange={(e) => setExpectedOutput(e.target.value)}
                      placeholder="Exact text or hash to match for auto validation"
                      className="w-full pl-11 pr-4 py-3 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#1F1F1F] placeholder:text-[#CFCFCF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* STEP 2: Conditions */}
          {currentStep === 2 && (
            <Card>
              <h3 className="text-[#1F1F1F] mb-6">Conditions & Timeline</h3>
              <div className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="reward" className="block text-sm text-[#1F1F1F] mb-2">
                      Reward Amount <span className="text-[#EF4444]">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#4B4B4B]">
                        Ⓐ
                      </span>
                      <input
                        id="reward"
                        type="number"
                        value={reward}
                        onChange={(e) => setReward(e.target.value)}
                        placeholder="500"
                        className="w-full pl-10 pr-14 py-3 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#1F1F1F] placeholder:text-[#CFCFCF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#CFCFCF]">
                        ALGO
                      </span>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="deadline" className="block text-sm text-[#1F1F1F] mb-2">
                      Deadline <span className="text-[#EF4444]">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#CFCFCF]" />
                      <input
                        id="deadline"
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#1F1F1F] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm text-[#1F1F1F]">
                      Requirements Checklist
                    </label>
                    <span className="text-xs text-[#CFCFCF]">{requirements.length} items</span>
                  </div>
                  <div className="space-y-2 mb-3">
                    {requirements.map((req, i) => (
                      <div
                        key={req.id}
                        className="flex items-center gap-3 p-3 bg-[#F5F5F5] border border-[#E5E5E5] rounded-xl group"
                      >
                        <div className="w-5 h-5 rounded-full border-2 border-[#E5E5E5] flex-shrink-0 flex items-center justify-center">
                          <span className="text-xs text-[#CFCFCF]">{i + 1}</span>
                        </div>
                        <input
                          type="text"
                          value={req.text}
                          onChange={(e) => updateRequirement(req.id, e.target.value)}
                          placeholder="Enter requirement..."
                          className="flex-1 bg-transparent text-sm text-[#1F1F1F] placeholder:text-[#CFCFCF] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeRequirement(req.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-[#E5E5E5]"
                        >
                          <X className="w-3.5 h-3.5 text-[#4B4B4B]" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addRequirement}
                    className="flex items-center gap-2 text-sm text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add requirement
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* STEP 3: Deposit */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <Card>
                <h3 className="text-[#1F1F1F] mb-5">Review & Lock Funds</h3>

                {/* Summary */}
                <div className="bg-[#F5F5F5] border border-[#E5E5E5] rounded-xl p-4 mb-5 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#4B4B4B]">Bounty title</span>
                    <span className="text-[#1F1F1F]" style={{ fontWeight: 500 }}>
                      {title || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#4B4B4B]">Deadline</span>
                    <span className="text-[#1F1F1F]">{deadline || "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#4B4B4B]">Requirements</span>
                    <span className="text-[#1F1F1F]">{requirements.length} items</span>
                  </div>
                  <div className="h-px bg-[#E5E5E5]" />
                  <div className="flex justify-between">
                    <span className="text-sm text-[#4B4B4B]">Reward to lock</span>
                    <span
                      className="text-[#1F1F1F]"
                      style={{ fontWeight: 600, fontSize: "18px" }}
                    >
                      {reward || "0"}{" "}
                      <span className="text-[#CFCFCF] text-sm" style={{ fontWeight: 400 }}>
                        ALGO
                      </span>
                    </span>
                  </div>
                </div>

                {/* Escrow info */}
                <div className="flex items-start gap-3 p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl mb-5">
                  <div className="w-8 h-8 bg-white border border-[#BFDBFE] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Lock className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#1d4ed8] mb-1" style={{ fontWeight: 500 }}>
                      Funds will be locked in escrow
                    </p>
                    <p className="text-xs text-[#3B82F6]">
                      Your ALGO will be held in a smart contract until work is
                      approved or disputed. Funds are always recoverable.
                    </p>
                  </div>
                </div>

                {/* Fee breakdown */}
                <div className="flex items-center gap-2 text-xs text-[#CFCFCF] mb-5">
                  <Info className="w-3.5 h-3.5" />
                  Algorand tx fee: ~0.002 ALGO · Powered by Pera Wallet signing
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleSubmit}
                  loading={submitting}
                >
                  <Lock className="w-4 h-4" />
                  {submitting ? "Processing..." : isConnected ? "Sign & Create Bounty" : "Connect Wallet to Continue"}
                </Button>
              </Card>

              {/* Wallet balance */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-[#CFCFCF]">Connected Wallet</span>
                {isConnected ? (
                  <span className="text-sm text-[#4B4B4B] font-mono">
                    {address?.substring(0,6)}...{address?.substring(address.length - 4)}
                  </span>
                ) : (
                  <button onClick={connectWallet} className="text-sm text-[#2563EB] flex items-center gap-1 hover:underline">
                    <Wallet className="w-3.5 h-3.5" />
                    Connect Pera Wallet
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>

        <span className="text-xs text-[#CFCFCF]">
          Step {currentStep} of {STEPS.length}
        </span>

        {currentStep < 3 ? (
          <Button variant="primary" size="sm" onClick={handleNext}>
            Continue
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
