import { Lock, Upload, ShieldCheck, Banknote, Check } from "lucide-react";
import { motion } from "motion/react";

const steps = [
  {
    id: 1,
    icon: Lock,
    label: "Funds Locked",
    description: "ALGO secured in smart contract",
  },
  {
    id: 2,
    icon: Upload,
    label: "Work Submitted",
    description: "Proof of work delivered",
  },
  {
    id: 3,
    icon: ShieldCheck,
    label: "Validation",
    description: "Creator reviews submission",
  },
  {
    id: 4,
    icon: Banknote,
    label: "Payment Released",
    description: "ALGO sent to worker",
  },
];

interface ProcessTrackerProps {
  activeStep?: number; // 1–4
  className?: string;
}

export function ProcessTracker({ activeStep = 1, className = "" }: ProcessTrackerProps) {
  return (
    <div className={`${className}`}>
      <div className="relative flex items-start justify-between">
        {/* Connector lines */}
        <div className="absolute top-5 left-0 right-0 flex items-center px-[10%]">
          <div className="w-full flex">
            {steps.slice(0, -1).map((step, i) => {
              const isCompleted = step.id < activeStep;
              return (
                <div key={i} className="flex-1 relative h-0.5 mx-1">
                  <div className="absolute inset-0 bg-[#E5E5E5] rounded-full" />
                  {isCompleted && (
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.5, delay: i * 0.15, ease: "easeOut" }}
                      className="absolute inset-0 bg-[#2563EB] rounded-full"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Steps */}
        {steps.map((step) => {
          const isActive = step.id === activeStep;
          const isCompleted = step.id < activeStep;
          const isPending = step.id > activeStep;

          return (
            <div key={step.id} className="relative flex flex-col items-center flex-1 z-10">
              {/* Circle */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ duration: 0.3 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted
                    ? "bg-[#2563EB] border-[#2563EB]"
                    : isActive
                    ? "bg-white border-[#2563EB] shadow-[0_0_0_4px_rgba(37,99,235,0.12)]"
                    : "bg-white border-[#E5E5E5]"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                ) : (
                  <step.icon
                    className={`w-4 h-4 ${
                      isActive ? "text-[#2563EB]" : "text-[#CFCFCF]"
                    }`}
                  />
                )}
              </motion.div>

              {/* Labels */}
              <div className="mt-3 text-center px-1">
                <p
                  className={`text-xs transition-colors duration-200 ${
                    isActive
                      ? "text-[#1F1F1F]"
                      : isCompleted
                      ? "text-[#2563EB]"
                      : "text-[#CFCFCF]"
                  }`}
                  style={{ fontWeight: isActive ? 600 : 400 }}
                >
                  {step.label}
                </p>
                <p
                  className={`text-xs mt-0.5 hidden sm:block transition-colors duration-200 ${
                    isActive
                      ? "text-[#4B4B4B]"
                      : isPending
                      ? "text-[#CFCFCF]"
                      : "text-[#4B4B4B]"
                  }`}
                >
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
