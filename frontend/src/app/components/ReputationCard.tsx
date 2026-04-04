import { Award, CheckCircle2, TrendingUp } from "lucide-react";

interface ReputationCardProps {
  address?: string;
  completedBounties?: number;
  successRate?: number;
  totalEarned?: string;
  className?: string;
}

export function ReputationCard({
  address = "7A4F...B2E1",
  completedBounties = 14,
  successRate = 93,
  totalEarned = "2,450",
  className = "",
}: ReputationCardProps) {
  return (
    <div
      className={`bg-white border border-[#E5E5E5] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] border border-[#E5E5E5] flex items-center justify-center">
          <Award className="w-5 h-5 text-[#4B4B4B]" />
        </div>
        <div>
          <p className="text-xs text-[#CFCFCF] mb-0.5">Wallet</p>
          <p className="text-sm font-mono text-[#1F1F1F]">{address}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
          </div>
          <p className="text-[#1F1F1F]" style={{ fontWeight: 600, fontSize: "18px", lineHeight: 1 }}>
            {completedBounties}
          </p>
          <p className="text-xs text-[#CFCFCF] mt-0.5">Completed</p>
        </div>

        <div className="text-center border-x border-[#E5E5E5]">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-[#2563EB]" />
          </div>
          <p className="text-[#1F1F1F]" style={{ fontWeight: 600, fontSize: "18px", lineHeight: 1 }}>
            {successRate}%
          </p>
          <p className="text-xs text-[#CFCFCF] mt-0.5">Success</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="text-xs text-[#4B4B4B]">Ⓐ</span>
          </div>
          <p className="text-[#1F1F1F]" style={{ fontWeight: 600, fontSize: "18px", lineHeight: 1 }}>
            {totalEarned}
          </p>
          <p className="text-xs text-[#CFCFCF] mt-0.5">ALGO earned</p>
        </div>
      </div>

      {/* Success rate bar */}
      <div className="mt-4">
        <div className="w-full h-1.5 bg-[#F0F0F0] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#2563EB] rounded-full transition-all duration-700"
            style={{ width: `${successRate}%` }}
          />
        </div>
      </div>
    </div>
  );
}
