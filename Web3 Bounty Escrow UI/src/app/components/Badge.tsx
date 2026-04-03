import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "pending";
  size?: "sm" | "md";
}

export function Badge({ children, variant = "default", size = "sm" }: BadgeProps) {
  const variants = {
    default: "bg-[#F0F0F0] text-[#4B4B4B] border border-[#E5E5E5]",
    success: "bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]",
    warning: "bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]",
    danger: "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]",
    info: "bg-[#EFF6FF] text-[#1d4ed8] border border-[#BFDBFE]",
    pending: "bg-[#F8F8F8] text-[#6B7280] border border-[#E5E5E5]",
  };

  const sizes = {
    sm: "px-2.5 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${variants[variant]} ${sizes[size]}`}
    >
      {children}
    </span>
  );
}
