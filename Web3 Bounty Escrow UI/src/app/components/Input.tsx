import { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  suffix?: string;
  error?: string;
}

export function Input({ label, icon, suffix, error, className = "", ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm text-[#1F1F1F] mb-2">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CFCFCF]">
            {icon}
          </div>
        )}
        <input
          className={`w-full ${icon ? "pl-11" : "pl-4"} ${suffix ? "pr-14" : "pr-4"} py-3 bg-white border ${
            error ? "border-[#EF4444]" : "border-[#E5E5E5]"
          } rounded-xl text-sm text-[#1F1F1F] placeholder:text-[#CFCFCF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all ${className}`}
          {...props}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#CFCFCF]">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-[#EF4444]">{error}</p>
      )}
    </div>
  );
}
